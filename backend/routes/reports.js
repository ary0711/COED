const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const supabase = require('../supabaseClient');

const router = express.Router();

// ─── PDF EXPORT ───
router.get('/pdf', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('full_name, email, role, id_number, department, status')
      .order('full_name');

    if (error) return res.status(500).json({ error: error.message });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=faculty-report.pdf');
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(18).font('Helvetica-Bold')
       .text('College of Education', { align: 'center' });
    doc.fontSize(13).font('Helvetica')
       .text('CTU Argao Campus', { align: 'center' });
    doc.fontSize(11)
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Table Header ──
    doc.fontSize(10).font('Helvetica-Bold');
    const startX = 50;
    let y = doc.y;
    doc.rect(startX, y, 500, 20).fill('#1E3A8A');
    doc.fillColor('white')
       .text('Full Name',   startX + 5,  y + 5, { width: 140 })
       .text('ID Number',   startX + 145, y + 5, { width: 80 })
       .text('Role',        startX + 225, y + 5, { width: 80 })
       .text('Department',  startX + 305, y + 5, { width: 110 })
       .text('Status',      startX + 415, y + 5, { width: 70 });
    doc.fillColor('black');
    doc.moveDown(1.5);

    // ── Table Rows ──
    doc.font('Helvetica').fontSize(9);
    profiles.forEach((p, i) => {
      y = doc.y;
      if (y > 700) { doc.addPage(); y = doc.y; }

      if (i % 2 === 0) {
        doc.rect(startX, y - 3, 500, 18).fill('#F3F4F6');
        doc.fillColor('black');
      }

      doc.text(p.full_name   ?? '—', startX + 5,   y, { width: 140 })
         .text(p.id_number   ?? '—', startX + 145,  y, { width: 80 })
         .text(p.role        ?? '—', startX + 225,  y, { width: 80 })
         .text(p.department  ?? '—', startX + 305,  y, { width: 110 })
         .text(p.status      ?? '—', startX + 415,  y, { width: 70 });
      doc.moveDown(0.6);
    });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── EXCEL EXPORT ───
router.get('/excel', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('full_name, email, role, id_number, department, status')
      .order('full_name');

    if (error) return res.status(500).json({ error: error.message });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'COED System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Faculty Report');

    // ── Title Row ──
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'College of Education — Faculty Report';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value = `Generated: ${new Date().toLocaleDateString()}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getCell('A2').font = { italic: true, size: 10 };

    // ── Column Headers ──
    sheet.getRow(3).values = ['Full Name', 'Email', 'ID Number', 'Role', 'Department', 'Status'];
    sheet.getRow(3).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { horizontal: 'center' };
    });

    // ── Column Widths ──
    sheet.columns = [
      { key: 'full_name',  width: 30 },
      { key: 'email',      width: 30 },
      { key: 'id_number',  width: 15 },
      { key: 'role',       width: 15 },
      { key: 'department', width: 20 },
      { key: 'status',     width: 12 },
    ];

    // ── Data Rows ──
    profiles.forEach((p, i) => {
      const row = sheet.addRow([
        p.full_name  ?? '—',
        p.email      ?? '—',
        p.id_number  ?? '—',
        p.role       ?? '—',
        p.department ?? '—',
        p.status     ?? '—',
      ]);

      // Alternate row color
      if (i % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        });
      }

      // Color ang status
      const statusCell = row.getCell(6);
      if (p.status === 'active')   statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
      if (p.status === 'pending')  statusCell.font = { color: { argb: 'FF92400E' }, bold: true };
      if (p.status === 'inactive') statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=faculty-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Excel error:', err);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

module.exports = router;