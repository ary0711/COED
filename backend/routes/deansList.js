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
const MAX_ALLOWED_GRADE = 2.0; // no individual grade below this counts as disqualifying
const DISQUALIFYING_REMARKS = ['INC', 'DROPPED', 'FAILED', '5.0'];

function normalizeRow(row) {
  // Accepts a few common header spellings so faculty don't need an exact template.
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k);
      if (found) return row[found];
    }
    return undefined;
  };

  return {
    studentId: String(get('student id', 'id no.', 'idno', 'student no.') ?? '').trim(),
    name: String(get('name', 'full name', 'student name') ?? '').trim(),
    course: String(get('course', 'program') ?? '').trim(),
    yearLevel: String(get('year level', 'year') ?? '').trim(),
    gwa: parseFloat(get('gwa', 'general weighted average', 'average')),
    remarks: String(get('remarks', 'status') ?? '').toUpperCase(),
  };
}

function isQualified(student) {
  if (!student.studentId || !student.name) return false;
  if (isNaN(student.gwa)) return false;
  if (student.gwa > GWA_THRESHOLD) return false;
  if (DISQUALIFYING_REMARKS.some(r => student.remarks.includes(r))) return false;
  return true;
}

// POST /api/deans-list/generate
router.post('/generate', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const semester = req.body.semester || 'Current Semester';

    // 1. Parse the uploaded workbook
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    if (!rawRows.length) {
      return res.status(400).json({ message: 'The uploaded file has no readable rows.' });
    }

    const students = rawRows.map(normalizeRow).filter(isQualified);
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
    const headerRow = ws.addRow(['Student ID', 'Name', 'Course', 'Year Level', 'GWA']);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F7' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    students.forEach(s => {
      ws.addRow([s.studentId, s.name, s.course, s.yearLevel, s.gwa.toFixed(2)]);
    });

    ws.columns.forEach(col => { col.width = 22; });

    // 3. Save the file and expose a download URL
    const fileName = `deans-list-${Date.now()}.xlsx`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    await outWorkbook.xlsx.writeFile(filePath);

    // Assumes /generated is served statically, e.g.:
    //   app.use('/generated', express.static(path.join(__dirname, 'generated')));
    const fileUrl = `/generated/deans-list/${fileName}`;

    return res.json({ students, fileUrl });
  } catch (err) {
    console.error('Dean\'s List generation error:', err);
    return res.status(500).json({ message: 'Failed to process the uploaded file.' });
  }
});

module.exports = router;