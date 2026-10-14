const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');
const authenticate = require('../middleware/authenticate');
const crypto = require('crypto');
const supabase = require('../supabaseClient'); // MUST use the service_role key (backend only)


// ─────────────────────────────────────────────────────────────
// Excel parsing helpers (Student ID, Full Name, Course, GWA)
// ─────────────────────────────────────────────────────────────
// Valid GWA range (Philippine grading: 1.0 best ... 5.0 failing)
const GWA_MIN = 0.5;
const GWA_MAX = 5.5;

const normHeader = h => String(h ?? '').toLowerCase().replace(/[^a-z]/g, '');

// "POGOY, ERNESTO JR." and "Ernesto Pogoy Jr." become the same key.
// Single letters (middle initials) are ignored.
const normName = v =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
    .sort()
    .join(' ');

// Removes spaces/dashes/".0" and leading zeros so "0221112", "221112" and
// "022-1112" all compare equal.
const normId = v =>
  String(v ?? '')
    .replace(/\.0+$/, '')
    .replace(/[\s-]/g, '')
    .toUpperCase()
    .replace(/^0+/, '');

// Loose course comparison: "BSEd-Math" ~ "bsed math"
const normCourse = v => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const courseMatches = (a, b) => {
  const x = normCourse(a), y = normCourse(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

function findColumns(row) {
  const cols = { id: -1, name: -1, course: -1, gwa: -1 };
  (row || []).forEach((cell, i) => {
    const h = normHeader(cell);
    if (!h) return;
    if (cols.id < 0 && /^(studentid|studentno|studentnumber|idnumber|idno|id)$/.test(h)) cols.id = i;
    else if (cols.name < 0 && /^(fullname|studentname|nameofstudent|name|names|student)$/.test(h)) cols.name = i;
    else if (cols.course < 0 && /(course|program)/.test(h)) cols.course = i;
    else if (
      cols.gwa < 0 &&
      (h.includes('gwa') || h.includes('weightedaverage') || h === 'average' || h === 'gpa' || h === 'grade')
    ) cols.gwa = i;
  });
  return cols;
}

/**
 * Reads a flat list: one row per student with Student ID, Full Name, Course, GWA columns.
 * The header row can be anywhere in the first 30 rows (titles above it are ok).
 */
function parseGradesWorkbook(workbook) {
  const entries = [];
  let skipped = 0;
  const sheetsUsed = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true });

    let headerIdx = -1;
    let cols = null;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const c = findColumns(rows[i]);
      if (c.name >= 0 && c.gwa >= 0) { headerIdx = i; cols = c; break; }
    }
    if (headerIdx < 0) continue;
    sheetsUsed.push(sheetName);

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const name = String(row[cols.name] ?? '').trim();
      if (!name) continue;

      const raw = row[cols.gwa];
      const gwa = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(',', '.'));
      if (!isFinite(gwa) || gwa < GWA_MIN || gwa > GWA_MAX) { skipped++; continue; }

      const course = cols.course >= 0 ? String(row[cols.course] ?? '').trim() : '';
      const studentNo = cols.id >= 0 ? String(row[cols.id] ?? '').replace(/\.0+$/, '').trim() : '';
      entries.push({ studentNo, name, course, gwa: Math.round(gwa * 100) / 100 });
    }
  }

  return { entries, skipped, sheetsUsed };
}

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Header/footer images — copied here from the frontend's public/header-pics
// folder so the backend can embed them directly into the PDF. If you ever
// update the letterhead images, update BOTH copies (frontend + this one).
const HEADER_IMAGE_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-header.png');
const FOOTER_IMAGE_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-footer.png');

// Prefer an app-local generated dir, but fall back to the OS temp dir if the
// filesystem is read-only (common on Render/Vercel/Railway free tiers, etc.)
function resolveOutputDir() {
  const preferred = path.join(__dirname, '..', 'generated', 'deans-list');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch (err) {
    const fallback = path.join(os.tmpdir(), 'deans-list');
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(`[deans-list] "${preferred}" not writable (${err.code}), using fallback "${fallback}" instead.`);
    return fallback;
  }
}
const OUTPUT_DIR = resolveOutputDir();

// ── Qualification rule: adjust to your college's actual policy ──
// The Excel only has the GWA (no per-subject grades), so the rule is GWA-only.
const GWA_THRESHOLD = 1.75;

const isQualified = gwa => typeof gwa === 'number' && isFinite(gwa) && gwa <= GWA_THRESHOLD;

const TABLE = 'deans_list_entries';

// ── student_profiles.academic_standing labels ──
const STANDING_DEANS_LISTER = "Dean's Lister";
const STANDING_DEFAULT = 'Good Standing';

// Supabase returns max ~1000 rows per request, so read big tables in pages.
async function fetchAll(buildQuery) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/**
 * After publishing a batch, make student_profiles.academic_standing match it:
 *  - qualified students            -> "Dean's Lister"
 *  - anyone else still marked "Dean's Lister" (old list) -> "Good Standing"
 * Matching: Student ID first. If a row in the Excel has NO Student ID, falls
 * back to the name, but only when that name is unique in student_profiles.
 * Rows that match nobody are returned in `unmatched`.
 */
async function syncAcademicStanding(batchId) {
  const entries = await fetchAll(() =>
    supabase.from(TABLE).select('student_no, id_key, full_name, name_key, qualified').eq('batch_id', batchId)
  );
  const profiles = await fetchAll(() =>
    supabase.from('student_profiles').select('student_id, student_no, full_name, academic_standing')
  );

  const byId = new Map(profiles.map(p => [normId(p.student_no), p]));
  const nameCount = new Map();
  profiles.forEach(p => {
    const k = normName(p.full_name);
    nameCount.set(k, (nameCount.get(k) || 0) + 1);
  });
  const byName = new Map(profiles.map(p => [normName(p.full_name), p]));

  const qualifiedProfileIds = new Set();
  const unmatched = [];

  for (const e of entries) {
    let p = null;
    if (e.id_key) {
      p = byId.get(e.id_key) || null;
    } else if (e.name_key && nameCount.get(e.name_key) === 1) {
      p = byName.get(e.name_key);
    }

    if (!p) { unmatched.push(e.full_name); continue; }
    if (e.qualified) qualifiedProfileIds.add(p.student_id);
  }

  const toSet = profiles.filter(p => qualifiedProfileIds.has(p.student_id) && p.academic_standing !== STANDING_DEANS_LISTER);
  const toReset = profiles.filter(p => !qualifiedProfileIds.has(p.student_id) && p.academic_standing === STANDING_DEANS_LISTER);

  const updateInChunks = async (rows, standing) => {
    const ids = rows.map(p => p.student_id);
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase
        .from('student_profiles')
        .update({ academic_standing: standing })
        .in('student_id', ids.slice(i, i + 200));
      if (error) throw error;
    }
  };

  await updateInChunks(toSet, STANDING_DEANS_LISTER);
  await updateInChunks(toReset, STANDING_DEFAULT);

  return { updated: qualifiedProfileIds.size, reset: toReset.length, unmatched };
}

// ── PDF helpers ──

function imageToDataUri(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).replace('.', '') || 'png';
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${base64}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBodyHtml({ students, college, semester, generatedAt }) {
  const rows = students.map((s, i) => `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="name">${escapeHtml(s.name)}</td>
        <td class="course">${escapeHtml(s.course)}</td>
        <td class="gwa ${s.gwa <= 1.5 ? 'gwa-blue' : 'gwa-green'}">${s.gwa.toFixed(2)}</td>
      </tr>`).join('');

  const emptyState = students.length === 0
    ? `<p class="empty-state">No qualifiers found for this batch.</p>`
    : '';

  return `
    <div class="letterhead">
      <h2>Dean's List</h2>
      <p class="subtitle">${escapeHtml(college)} · ${escapeHtml(semester)}</p>
      <p class="generated">Generated ${escapeHtml(generatedAt)}</p>
    </div>

    <table class="qualifiers-table">
      <thead>
        <tr>
          <th class="rank">#</th>
          <th>Full Name</th>
          <th>Course</th>
          <th class="gwa">GWA</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${emptyState}
  `;
}

function buildFullHtml(bodyHtml) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI",
                       Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #111827;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .letterhead { text-align: center; padding: 0 0 22px; }
        .letterhead h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
        .letterhead .subtitle { font-size: 14px; color: #4b5563; margin: 10px 0 0; }
        .letterhead .generated { font-size: 10px; color: #6b7280; margin: 10px 0 0; }

        table.qualifiers-table {
          width: 100%; border-collapse: collapse; text-align: left;
          border-top: 1px solid #e5e7eb;
        }
        table.qualifiers-table th {
          padding: 18px 24px; font-size: 14px; font-weight: 600; color: #111827;
          border-bottom: 1px solid #e5e7eb;
        }
        table.qualifiers-table td {
          padding: 20px 24px; font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        table.qualifiers-table tbody tr { page-break-inside: avoid; break-inside: avoid; }
        table.qualifiers-table thead { display: table-header-group; }

        .rank { width: 48px; color: #6b7280; font-size: 12px; }
        th.rank { font-size: 14px; color: #111827; }
        .name { font-weight: 500; color: #111827; }
        .course { color: #374151; }
        .gwa { text-align: center; width: 90px; }
        td.gwa { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .gwa-blue { color: #1d4ed8; }
        .gwa-green { color: #15803d; }

        .empty-state { text-align: center; color: #9ca3af; font-size: 14px; padding: 48px 0; }
      </style>
    </head>
    <body>${bodyHtml}</body>
  </html>`;
}

// Reads the PNG's real width/height from its header bytes (no extra package needed).
function getPngSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

async function generateDeansListPdf({ filePath, students, college, semester, generatedAt }) {
  const headerImg = imageToDataUri(HEADER_IMAGE_PATH);
  const footerImg = imageToDataUri(FOOTER_IMAGE_PATH);

  // A4 = ~794px wide at 96dpi. Side margins are 40px each -> 714px content width.
  const SIDE_MARGIN = 40;
  const CONTENT_W = 794 - SIDE_MARGIN * 2;

  const fitHeight = (imgPath, fallback) => {
    const size = getPngSize(imgPath);
    return size ? Math.ceil((CONTENT_W * size.h) / size.w) : fallback;
  };

  const headerH = headerImg ? fitHeight(HEADER_IMAGE_PATH, 150) : 0;
  const footerH = footerImg ? fitHeight(FOOTER_IMAGE_PATH, 90) : 0;

  const headerTemplate = headerImg
    ? `<div style="width:100%; padding:0 ${SIDE_MARGIN}px; box-sizing:border-box; -webkit-print-color-adjust:exact;">
         <img src="${headerImg}" style="width:${CONTENT_W}px; height:${headerH}px; display:block;" />
       </div>`
    : `<div></div>`;

  const footerTemplate = footerImg
    ? `<div style="width:100%; padding:0 ${SIDE_MARGIN}px; box-sizing:border-box; -webkit-print-color-adjust:exact;">
         <img src="${footerImg}" style="width:${CONTENT_W}px; height:${footerH}px; display:block;" />
       </div>`
    : `<div></div>`;

  const bodyHtml = buildBodyHtml({ students, college, semester, generatedAt });
  const fullHtml = buildFullHtml(bodyHtml);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        // image height + a small gap so the title block never sits under the image
        top: headerImg ? `${headerH + 24}px` : '40px',
        bottom: footerImg ? `${footerH + 24}px` : '40px',
        left: `${SIDE_MARGIN}px`,
        right: `${SIDE_MARGIN}px`,
      },
    });
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/deans-list/generate
// Reads the flat Excel (Full Name, Course, GWA), saves the batch as a DRAFT
// in deans_list_entries, and builds the PDF. Students do not see anything
// until the faculty clicks "Publish".
// ─────────────────────────────────────────────────────────────
router.post('/generate', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[deans-list] Multer error:', err.code, err.message);
      return res.status(400).json({ message: `Upload error: ${err.message} (${err.code})` });
    } else if (err) {
      console.error('[deans-list] Upload error:', err);
      return res.status(400).json({ message: 'Upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const semester = req.body.semester || 'Current Semester';
    const college = req.body.college || '';

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (parseErr) {
      console.error('[deans-list] XLSX.read failed:', parseErr);
      return res.status(400).json({ message: 'The uploaded file is not a valid Excel workbook.' });
    }

    const { entries, skipped } = parseGradesWorkbook(workbook);

    if (!entries.length) {
      return res.status(400).json({
        message: 'No students found. The file needs a header row with "Student ID", "Full Name", "Course" and "GWA" columns, followed by one row per student.',
      });
    }

    const batchId = crypto.randomUUID();
    const rows = entries.map(e => ({
      batch_id: batchId,
      semester_label: semester,
      college,
      student_no: e.studentNo || null,
      id_key: normId(e.studentNo) || null,
      full_name: e.name,
      name_key: normName(e.name),
      course: e.course,
      gwa: e.gwa,
      qualified: isQualified(e.gwa),
      is_published: false,
      created_by: req.user?.id || req.user?.userId || req.user?.sub || null,
    }));

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from(TABLE).insert(rows.slice(i, i + 500));
      if (error) {
        console.error('[deans-list] Failed to save batch:', error);
        return res.status(500).json({ message: 'Failed to save the list. Did you create the deans_list_entries table?' });
      }
    }

    const qualifiers = entries
      .filter(e => isQualified(e.gwa))
      .sort((a, b) => a.gwa - b.gwa);

    const fileName = `deans-list-${Date.now()}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    try {
      await generateDeansListPdf({
        filePath,
        students: qualifiers,
        college,
        semester,
        generatedAt,
      });
    } catch (pdfErr) {
      console.error('[deans-list] Failed to generate PDF:', pdfErr);
      return res.status(500).json({ message: 'Generated the list but failed to create the PDF file. Check server disk/permissions.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/generated/deans-list/${fileName}`;

    return res.json({
      students: qualifiers.map(s => ({
        name: s.name,
        course: s.course,
        gwa: s.gwa,
        units: 0,
      })),
      totalRowsRead: entries.length,
      skippedRows: skipped,
      totalQualified: qualifiers.length,
      batchId,
      fileUrl,
    });
  } catch (err) {
    console.error("Dean's List generation error:", err);
    return res.status(500).json({
      message: 'Failed to process the uploaded file.',
      ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {}),
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/deans-list/publish   body: { batchId }
// Makes this batch the ACTIVE list. Students see it on their dashboard.
// (Replaces the previously published batch of the same college.)
// ─────────────────────────────────────────────────────────────
router.post('/publish', authenticate, express.json(), async (req, res) => {
  const batchId = req.body?.batchId;
  if (!batchId) return res.status(400).json({ message: 'Missing batchId.' });

  try {
    const { data: batchRows, error: findErr } = await supabase
      .from(TABLE)
      .select('college, qualified')
      .eq('batch_id', batchId);
    if (findErr) throw findErr;
    if (!batchRows || batchRows.length === 0) {
      return res.status(404).json({ message: 'Batch not found. Please Generate the list again.' });
    }

    const college = batchRows[0].college || '';

    // Un-publish the older list(s) of this college
    const { error: offErr } = await supabase
      .from(TABLE)
      .update({ is_published: false })
      .eq('is_published', true)
      .eq('college', college);
    if (offErr) throw offErr;

    const { error: onErr } = await supabase
      .from(TABLE)
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('batch_id', batchId);
    if (onErr) throw onErr;

    // Reflect the result in each student's Academic Standing (Student Dashboard)
    const standing = await syncAcademicStanding(batchId);

    return res.json({
      published: batchRows.length,
      qualified: batchRows.filter(r => r.qualified).length,
      standing,
    });
  } catch (err) {
    console.error('[deans-list] publish failed:', err);
    return res.status(500).json({
      message: 'Failed to publish the Dean\'s List.',
      ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {}),
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/deans-list/my-status
// Used by the Student Dashboard. Finds the logged-in student's Student ID, then
// checks it against the currently published Dean's List.
// ─────────────────────────────────────────────────────────────
router.get('/my-status', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.sub || null;
    const idNumber = req.user?.idNumber || req.user?.studentNo || req.user?.student_no || null;

    let profileQuery = supabase.from('student_profiles').select('student_no, full_name, program');
    if (userId) profileQuery = profileQuery.eq('user_id', userId);
    else if (idNumber) profileQuery = profileQuery.eq('student_no', String(idNumber));
    else return res.status(401).json({ message: 'Cannot identify the logged-in student.' });

    const { data: profile, error: pErr } = await profileQuery.maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return res.status(404).json({ message: 'Student profile not found.' });

    // Is there any published list at all?
    const { data: latest, error: lErr } = await supabase
      .from(TABLE)
      .select('semester_label, college, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1);
    if (lErr) throw lErr;

    if (!latest || latest.length === 0) {
      return res.json({ published: false });
    }

    // 1) Match by Student ID
    let entry = null;
    const idKey = normId(profile.student_no);
    if (idKey) {
      const { data: byId, error: iErr } = await supabase
        .from(TABLE)
        .select('full_name, course, gwa, qualified, semester_label')
        .eq('is_published', true)
        .eq('id_key', idKey)
        .limit(1);
      if (iErr) throw iErr;
      entry = byId?.[0] || null;
    }

    // 2) Fallback: rows in the Excel that had NO Student ID -> match by name
    if (!entry) {
      const { data: byName, error: nErr } = await supabase
        .from(TABLE)
        .select('full_name, course, gwa, qualified, semester_label')
        .eq('is_published', true)
        .is('id_key', null)
        .eq('name_key', normName(profile.full_name));
      if (nErr) throw nErr;
      if (byName && byName.length > 0) {
        entry = byName.length === 1
          ? byName[0]
          : (byName.find(m => courseMatches(m.course, profile.program)) || byName[0]);
      }
    }

    return res.json({
      published: true,
      semester: entry?.semester_label || latest[0].semester_label,
      listed: !!entry,
      qualified: !!entry?.qualified,
      gwa: entry ? Number(entry.gwa) : null,
    });
  } catch (err) {
    console.error('[deans-list] my-status failed:', err);
    return res.status(500).json({ message: 'Failed to load your Dean\'s List status.' });
  }
});

// ─────────────────────────────────────────────────────────────
// History (saved in the database, survives refresh / logout / restart)
// ─────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Builds a fresh PDF from stored rows and returns its public URL.
async function createPdfUrl(req, { students, college, semester }) {
  const fileName = `deans-list-${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  await generateDeansListPdf({ filePath, students, college, semester, generatedAt });
  return `${req.protocol}://${req.get('host')}/generated/deans-list/${fileName}`;
}

// GET /api/deans-list/history  ->  newest batches first
router.get('/history', authenticate, async (req, res) => {
  try {
    const rows = await fetchAll(() =>
      supabase
        .from(TABLE)
        .select('batch_id, semester_label, college, qualified, is_published, published_at, created_at')
        .order('created_at', { ascending: false })
        .order('id')
    );

    const map = new Map();
    for (const r of rows) {
      let b = map.get(r.batch_id);
      if (!b) {
        b = {
          batchId: r.batch_id,
          semesterLabel: r.semester_label,
          college: r.college || '',
          totalStudents: 0,
          totalQualifiers: 0,
          isPublished: false,
          publishedAt: null,
          generatedAt: r.created_at,
        };
        map.set(r.batch_id, b);
      }
      b.totalStudents += 1;
      if (r.qualified) b.totalQualifiers += 1;
      if (r.is_published) { b.isPublished = true; b.publishedAt = r.published_at; }
    }

    return res.json({ batches: [...map.values()].slice(0, 50) });
  } catch (err) {
    console.error('[deans-list] history failed:', err);
    return res.status(500).json({ message: 'Failed to load the history.' });
  }
});

// GET /api/deans-list/history/:batchId  ->  the qualifiers of one saved batch
router.get('/history/:batchId', authenticate, async (req, res) => {
  const { batchId } = req.params;
  if (!UUID_RE.test(batchId)) return res.status(400).json({ message: 'Invalid batch id.' });

  try {
    const rows = await fetchAll(() =>
      supabase
        .from(TABLE)
        .select('full_name, course, gwa, qualified, semester_label, college, is_published, published_at, created_at')
        .eq('batch_id', batchId)
        .order('gwa', { ascending: true })
        .order('id')
    );
    if (!rows.length) return res.status(404).json({ message: 'Batch not found.' });

    const qualifiers = rows.filter(r => r.qualified);
    return res.json({
      batch: {
        batchId,
        semesterLabel: rows[0].semester_label,
        college: rows[0].college || '',
        generatedAt: rows[0].created_at,
        isPublished: rows.some(r => r.is_published),
      },
      students: qualifiers.map(r => ({
        name: r.full_name,
        course: r.course || '',
        gwa: Number(r.gwa),
        units: 0,
      })),
    });
  } catch (err) {
    console.error('[deans-list] history item failed:', err);
    return res.status(500).json({ message: 'Failed to load this batch.' });
  }
});

// POST /api/deans-list/history/:batchId/pdf  ->  { fileUrl } (re-creates the CTU letterhead PDF)
router.post('/history/:batchId/pdf', authenticate, async (req, res) => {
  const { batchId } = req.params;
  if (!UUID_RE.test(batchId)) return res.status(400).json({ message: 'Invalid batch id.' });

  try {
    const rows = await fetchAll(() =>
      supabase
        .from(TABLE)
        .select('full_name, course, gwa, semester_label, college')
        .eq('batch_id', batchId)
        .eq('qualified', true)
        .order('gwa', { ascending: true })
        .order('id')
    );

    // Need semester/college even if nobody qualified
    let semester = rows[0]?.semester_label;
    let college = rows[0]?.college;
    if (semester === undefined) {
      const { data: any1, error } = await supabase
        .from(TABLE).select('semester_label, college').eq('batch_id', batchId).limit(1);
      if (error) throw error;
      if (!any1 || !any1.length) return res.status(404).json({ message: 'Batch not found.' });
      semester = any1[0].semester_label;
      college = any1[0].college;
    }

    const students = rows.map(r => ({
      name: r.full_name,
      course: r.course || '',
      gwa: Number(r.gwa),
    }));

    const fileUrl = await createPdfUrl(req, { students, college: college || '', semester });
    return res.json({ fileUrl });
  } catch (err) {
    console.error('[deans-list] history pdf failed:', err);
    return res.status(500).json({ message: 'Failed to create the PDF for this batch.' });
  }
});

module.exports = router;