const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Header/footer images — copied here from the frontend's public/header-pics
// folder so the backend can embed them directly into the PDF. If you ever
// update the letterhead images, update BOTH copies (frontend + this one).
const HEADER_IMAGE_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-header.png');
const FOOTER_IMAGE_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-footer.png');

// Prefer an app-local generated dir, but fall back to the OS temp dir if the
// filesystem is read-only (common on Render/Vercel/Railway free tiers, etc.)
// so uploads don't fail 100% of the time just because ../generated isn't writable.
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
const GWA_THRESHOLD = 1.75;
const MAX_ALLOWED_GRADE = 2.0; // no individual subject grade above this counts as disqualifying
const MIN_UNITS_FOR_ROW = 1;
const MAX_UNITS_FOR_ROW = 6;   // sane bound for a single subject's units, used to tell a
const MIN_GRADE_FOR_ROW = 0.5; // subject row apart from a totals/summary row
const MAX_GRADE_FOR_ROW = 5.5;

// Words that flag a row as a totals/summary row rather than an actual subject,
// even if it happens to have two numbers that fall inside the "sane" range above.
const TOTALS_ROW_PATTERN = /^(total|totals|sub[\s-]?total|overall|gwa|general\s*weighted\s*average|summary)\b/i;

/**
 * The real workbook (see DEANS.xlsx) is NOT one flat row per student.
 * It's one sheet per student, each shaped like:
 *
 *   Name:            JUAN DELA CRUZ
 *   ...
 *   SUBJECT NAME     units   grade   =units*grade
 *   SUBJECT NAME     units   grade   =units*grade
 *   ...
 *   (totals row)     =SUM    =SUM    =SUM(...)/units
 *
 * This walks every sheet, finds the student's name + subject rows, and
 * recomputes GWA itself (units × grade, summed, ÷ total units) rather than
 * trusting any cached formula result — so it stays correct even if a
 * template's totals-row formula is off by a cell.
 */
function parseStudentSheet(sheet, sheetName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

  let name = null;
  let course = '';
  let yearLevel = '';
  let studentId = '';
  const subjects = [];

  for (const row of rows) {
    if (!row || row.every(c => c === null || c === '')) continue;

    // Look for label cells like "Name:", "Course:", "Year Level:", "Student ID:"
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (typeof cell !== 'string') continue;
      const label = cell.trim().toLowerCase().replace(/:$/, '');
      if (!label) continue;

      const nextVal = row.slice(i + 1).find(v => v !== null && v !== '');
      if (nextVal === undefined) continue;

      if (!name && label.startsWith('name')) name = String(nextVal).trim();
      else if (!course && (label.startsWith('course') || label.startsWith('program'))) course = String(nextVal).trim();
      else if (!yearLevel && label.startsWith('year')) yearLevel = String(nextVal).trim();
      else if (!studentId && (label.includes('student id') || label.includes('id no'))) studentId = String(nextVal).trim();
    }

    // Look for a subject row: text cell (subject name) + at least two plausible
    // numeric cells in order [units, grade]. Totals/header rows are skipped
    // naturally because they either have no subject-name text, their first
    // number is out of the sane units range, or the text cell matches a
    // totals-row keyword (TOTAL, GWA, SUMMARY, etc).
    const subjectText = row.find(c =>
      typeof c === 'string' &&
      c.trim().length > 2 &&
      !/^name|^course|^year|^student id/i.test(c.trim()) &&
      !TOTALS_ROW_PATTERN.test(c.trim())
    );
    const numbers = row.filter(c => typeof c === 'number');
    if (subjectText && numbers.length >= 2) {
      const [units, grade] = numbers;
      if (
        units >= MIN_UNITS_FOR_ROW && units <= MAX_UNITS_FOR_ROW &&
        grade >= MIN_GRADE_FOR_ROW && grade <= MAX_GRADE_FOR_ROW
      ) {
        subjects.push({ subject: subjectText.trim(), units, grade });
      }
    }
  }

  if (!name || subjects.length === 0) return null; // not a student sheet (e.g. the summary/list tab)

  const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);
  const totalWeighted = subjects.reduce((sum, s) => sum + s.units * s.grade, 0);
  const gwa = totalUnits > 0 ? totalWeighted / totalUnits : NaN;
  const maxGrade = Math.max(...subjects.map(s => s.grade));

  return {
    studentId: studentId || sheetName,
    name,
    course,
    yearLevel,
    gwa,
    maxGrade,
    units: totalUnits,
    subjects,
  };
}

function isQualified(student) {
  if (!student || !student.name) return false;
  if (isNaN(student.gwa)) return false;
  if (student.gwa > GWA_THRESHOLD) return false;
  if (student.maxGrade > MAX_ALLOWED_GRADE) return false;
  return true;
}

// Reads an image file from disk and returns it as a base64 data: URI, so it
// can be inlined directly into the HTML passed to Puppeteer (avoids any
// file:// path / relative-path headaches inside header/footer templates).
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

/**
 * Builds the HTML for the main body content of the PDF — the letterhead
 * title block + qualifiers table. Deliberately mirrors the classes/colors
 * used in the React preview (#dl-print-area) so the PDF matches what the
 * faculty member already saw on screen: same blue (#1E3A8A) header text,
 * same gray table header, same blue/green rounded GWA badges.
 */
function buildBodyHtml({ students, college, semester, generatedAt }) {
  const rows = students.map((s, i) => {
    const badgeBg = s.gwa <= 1.5 ? '#dbeafe' : '#dcfce7';
    const badgeColor = s.gwa <= 1.5 ? '#1d4ed8' : '#15803d';
    return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="name">${escapeHtml(s.name)}</td>
        <td class="course">${escapeHtml([s.course, s.yearLevel].filter(Boolean).join(' '))}</td>
        <td class="gwa-cell">
          <span class="badge" style="background:${badgeBg}; color:${badgeColor};">${s.gwa.toFixed(2)}</span>
        </td>
      </tr>`;
  }).join('');

  const emptyState = students.length === 0
    ? `<p class="empty-state">No qualifiers found for this batch.</p>`
    : '';

  return `
    <div class="letterhead">
      <p class="eyebrow">Cebu Technological University</p>
      <h1>Dean's List</h1>
      <p class="subtitle">${escapeHtml(college)} · ${escapeHtml(semester)}</p>
    </div>

    <table class="qualifiers-table">
      <thead>
        <tr>
          <th class="rank">#</th>
          <th>Full Name</th>
          <th>Course</th>
          <th class="gwa-cell">GWA</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${emptyState}
    <p class="generated-at">Generated ${escapeHtml(generatedAt)}</p>
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
          font-family: Helvetica, Arial, sans-serif;
          color: #1f2937;
          margin: 0;
          padding: 0;
        }
        .letterhead {
          text-align: center;
          padding-bottom: 14px;
          margin-bottom: 14px;
          border-bottom: 1px solid #f3f4f6;
        }
        .letterhead .eyebrow {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0;
        }
        .letterhead h1 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 4px 0 0;
        }
        .letterhead .subtitle {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0;
        }
        table.qualifiers-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        table.qualifiers-table thead th {
          background: #f9fafb;
          text-align: left;
          font-weight: 600;
          color: #374151;
          padding: 10px 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        table.qualifiers-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        table.qualifiers-table .rank {
          width: 36px;
          color: #9ca3af;
          font-size: 10px;
        }
        table.qualifiers-table .name {
          font-weight: 500;
          color: #111827;
        }
        table.qualifiers-table .course {
          color: #374151;
        }
        table.qualifiers-table .gwa-cell {
          text-align: center;
          width: 70px;
        }
        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 10px;
        }
        .empty-state {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          padding: 24px 0;
        }
        .generated-at {
          text-align: right;
          font-size: 9px;
          color: #9ca3af;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
  </html>`;
}

/**
 * Renders the Dean's List PDF via headless Chrome so it visually matches
 * the on-screen React preview. The CTU header/footer images are passed as
 * Puppeteer's own repeating headerTemplate/footerTemplate — Chrome redraws
 * these on every page automatically, so we don't need any of the
 * position:fixed print-CSS tricks the frontend preview needs.
 */
async function generateDeansListPdf({ filePath, students, college, semester, generatedAt }) {
  const headerImg = imageToDataUri(HEADER_IMAGE_PATH);
  const footerImg = imageToDataUri(FOOTER_IMAGE_PATH);

  const headerTemplate = headerImg
    ? `<div style="width:100%; margin:0 40px; -webkit-print-color-adjust:exact;">
         <img src="${headerImg}" style="width:100%; display:block;" />
       </div>`
    : `<div></div>`; // Puppeteer requires *some* template even if empty

  const footerTemplate = footerImg
    ? `<div style="width:100%; margin:0 40px; -webkit-print-color-adjust:exact;">
         <img src="${footerImg}" style="width:100%; display:block;" />
       </div>`
    : `<div></div>`;

  const bodyHtml = buildBodyHtml({ students, college, semester, generatedAt });
  const fullHtml = buildFullHtml(bodyHtml);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // needed on most Linux hosts (Render/Railway/etc.)
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
      // Reserve generous top/bottom space so body content never collides
      // with the header/footer images. Adjust these if your header/footer
      // images have a very different aspect ratio than assumed here.
      margin: {
        top: headerImg ? '130px' : '40px',
        bottom: footerImg ? '110px' : '40px',
        left: '40px',
        right: '40px',
      },
    });
  } finally {
    await browser.close();
  }
}

// POST /api/deans-list/generate
router.post('/generate', authenticate, (req, res, next) => {
  // Wrap multer so file-too-large / bad-field-name errors come back as JSON
  // instead of falling through to Express's default (HTML) error handler.
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

    // 1. Parse the uploaded workbook — one sheet per student, per the template.
    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (parseErr) {
      console.error('[deans-list] XLSX.read failed:', parseErr);
      return res.status(400).json({ message: 'The uploaded file is not a valid Excel workbook.' });
    }

    const allStudents = workbook.SheetNames
      .map(sheetName => {
        try {
          return parseStudentSheet(workbook.Sheets[sheetName], sheetName);
        } catch (sheetErr) {
          console.error(`[deans-list] Failed to parse sheet "${sheetName}":`, sheetErr);
          return null; // skip a broken sheet instead of failing the whole request
        }
      })
      .filter(Boolean); // drops the summary/list sheet and any sheet with no name/subjects

    if (!allStudents.length) {
      return res.status(400).json({
        message: 'No student sheets could be read. Expected one sheet per student with a "Name:" cell and subject/units/grade rows, matching the Dean\'s List template.',
      });
    }

    const students = allStudents.filter(isQualified);
    students.sort((a, b) => a.gwa - b.gwa);

    // 2. Build the official, letterhead-style output as a real PDF that
    //    visually matches the on-screen preview.
    const fileName = `deans-list-${Date.now()}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const generatedAt = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    try {
      await generateDeansListPdf({ filePath, students, college, semester, generatedAt });
    } catch (pdfErr) {
      console.error('[deans-list] Failed to generate PDF:', pdfErr);
      return res.status(500).json({ message: 'Generated the list but failed to create the PDF file. Check server disk/permissions.' });
    }

    // Absolute URL (not just a relative path) so this resolves correctly
    // even when the frontend is served from a different origin/port than
    // this backend (e.g. Vite dev server on :5173 vs. Express on :5000).
    const fileUrl = `${req.protocol}://${req.get('host')}/generated/deans-list/${fileName}`;

    // 3. Response shape matches what DeansListGenerator.tsx expects
    //    (studentId, name, course, yearLevel, gwa, units)
    return res.json({
      students: students.map(s => ({
        studentId: s.studentId,
        name: s.name,
        course: s.course,
        yearLevel: s.yearLevel,
        gwa: s.gwa,
        units: s.units,
      })),
      totalSheetsRead: allStudents.length,
      totalQualified: students.length,
      fileUrl,
    });
  } catch (err) {
    console.error("Dean's List generation error:", err); // full stack, not just the message
    return res.status(500).json({
      message: 'Failed to process the uploaded file.',
      ...(process.env.NODE_ENV !== 'production' ? { detail: err.message } : {}),
    });
  }
});

module.exports = router;