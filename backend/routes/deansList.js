const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { verifyToken } = require('../middleware/auth'); // your existing JWT middleware

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const LOGO_PATH = path.join(__dirname, '..', 'public', 'assets', 'ctu-logo.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'deans-list');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Qualification rule: adjust to your college's actual policy ──
const GWA_THRESHOLD = 1.75;
const MAX_ALLOWED_GRADE = 2.0; // no individual subject grade above this counts as disqualifying
const MIN_UNITS_FOR_ROW = 1;
const MAX_UNITS_FOR_ROW = 6;   // sane bound for a single subject's units, used to tell a
const MIN_GRADE_FOR_ROW = 0.5; // subject row apart from a totals/summary row
const MAX_GRADE_FOR_ROW = 5.5;

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
    // naturally because they either have no subject-name text or their first
    // number is out of the sane units range.
    const subjectText = row.find(c => typeof c === 'string' && c.trim().length > 2 && !/^name|^course|^year|^student id/i.test(c.trim()));
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
router.post('/generate', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const semester = req.body.semester || 'Current Semester';

    // 1. Parse the uploaded workbook — one sheet per student, per the template.
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    const allStudents = workbook.SheetNames
      .map(sheetName => parseStudentSheet(workbook.Sheets[sheetName], sheetName))
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
      const logoId = outWorkbook.addImage({ filename: LOGO_PATH, extension: 'png' });
      ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 60, height: 60 } });
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
    await outWorkbook.xlsx.writeFile(filePath);

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
    console.error('Dean\'s List generation error:', err);
    return res.status(500).json({ message: 'Failed to process the uploaded file.' });
  }
});

module.exports = router;