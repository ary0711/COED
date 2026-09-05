const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const LOGO_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-logo.png');

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

    // 2. Build the output workbook with CTU letterhead
    const outWorkbook = new ExcelJS.Workbook();
    const ws = outWorkbook.addWorksheet("Dean's List");

    ws.mergeCells('A1:E1');
    ws.mergeCells('A2:E2');
    ws.mergeCells('A3:E3');

    if (fs.existsSync(LOGO_PATH)) {
      try {
        const logoId = outWorkbook.addImage({ filename: LOGO_PATH, extension: 'png' });
        ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 60, height: 60 } });
      } catch (logoErr) {
        // A bad/corrupt logo file shouldn't sink the whole generation.
        console.warn('[deans-list] Could not embed logo, continuing without it:', logoErr.message);
      }
    }

    ws.getCell('A1').value = 'Cebu Technological University';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.getCell('A2').value = "Dean's List";
    ws.getCell('A2').font = { bold: true, size: 12 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.getCell('A3').value = semester;
    ws.getCell('A3').font = { italic: true, size: 10 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]);
    const headerRow = ws.addRow(['Rank', 'Name', 'Course/Year', 'GWA']);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F7' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    students.forEach((s, i) => {
      ws.addRow([i + 1, s.name, [s.course, s.yearLevel].filter(Boolean).join(' '), s.gwa.toFixed(4)]);
    });

    ws.columns.forEach(col => { col.width = 24; });

    // 3. Save the file and expose a download URL
    const fileName = `deans-list-${Date.now()}.xlsx`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    try {
      await outWorkbook.xlsx.writeFile(filePath);
    } catch (writeErr) {
      console.error('[deans-list] Failed to write output file:', writeErr);
      return res.status(500).json({ message: 'Generated the list but failed to save the output file. Check server disk/permissions.' });
    }

    const fileUrl = `/generated/deans-list/${fileName}`;

    // 4. Response shape matches what DeansListGenerator.tsx expects
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