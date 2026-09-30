const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { createWorker, PSM } = require('tesseract.js');

const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SECTION_RE = /BS[A-Z]{2,5}\s?\d\s?[A-Z0-9]/i;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const cx = (w) => (w.bbox.x0 + w.bbox.x1) / 2;
const cy = (w) => (w.bbox.y0 + w.bbox.y1) / 2;

const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

const cleanCode = (c) => {
  const m = c.toUpperCase().replace(/[^A-Z0-9-]/g, '').match(/^([A-Z]{1,4})-?(\d{2,4})$/);
  return m ? `${m[1]}-${m[2]}` : '';
};

const DIGIT_FIX = { 8: 'B', 4: 'A', 0: 'D', 6: 'G', 1: 'I' };
const cleanSection = (s) => {
  const m = s.toUpperCase().replace(/\s+/g, '').match(/^(BS[A-Z]{1,5}?)(\d)([A-Z0-9])$/);
  if (!m) return '';
  const tail = /\d/.test(m[3]) ? DIGIT_FIX[m[3]] || '' : m[3];
  return tail ? `${m[1]} ${m[2]}${tail}` : '';
};

const cleanRoom = (raw) => {
  const t = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let m = t.match(/^L{1,2}R([\dLI])$/);
  if (m) return `LLR${/[LI]/.test(m[1]) ? 1 : m[1]}`;
  m = t.match(/^C[LIU1]?([\dAIL])$/) || t.match(/^[A-Z]?[LU]([\dAIL])$/);
  if (m) return `CL${m[1] === 'A' ? 4 : /[IL]/.test(m[1]) ? 1 : m[1]}`;
  return '';
};

const fmt = (h) => `${h}:00`;
const hourTo24 = (h) => (h >= 7 && h <= 11 ? h : h === 12 ? 12 : h + 12);
const range = (startIdx, hours) => {
  const s = HOURS[startIdx];
  const e = HOURS[startIdx + hours - 1] + 1;
  const eh = e === 13 ? 1 : e;
  const sh24 = hourTo24(s);
  const eh24 = hourTo24(eh === 1 && s !== 12 ? 1 : eh);
  const ap = (h24) => (h24 >= 12 ? 'PM' : 'AM');
  const endAp = ap(sh24 + hours === 12 ? 12 : eh24 < sh24 ? eh24 + 12 : eh24);
  const startAp = ap(sh24);
  return startAp === endAp
    ? `${fmt(s)}-${fmt(eh)} ${startAp}`
    : `${fmt(s)} ${startAp}-${fmt(eh)} ${endAp}`;
};

const groupLines = (words, tol = 22) => {
  const sorted = [...words].sort((a, b) => cy(a) - cy(b));
  const lines = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - cy(w)) < tol) {
      last.words.push(w);
      last.y = (last.y * (last.words.length - 1) + cy(w)) / last.words.length;
    } else lines.push({ y: cy(w), words: [w] });
  }
  return lines.map((l) => ({
    y: l.y,
    text: l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0).map((w) => w.text).join(' '),
  }));
};

function parseSummary(words, W, splitX) {
  const right = words.filter((w) => w.bbox.x0 > splitX - 10);
  const desc = right.find((w) => /^Descriptive/i.test(w.text));
  const stud = right.find((w) => /^Student/i.test(w.text));
  const total = right.find((w) => /^Total$/i.test(w.text));
  const descY = desc ? desc.bbox.y0 : 0;
  const totalY = total ? total.bbox.y0 : Infinity;
  const studX = stud ? stud.bbox.x0 : (desc ? desc.bbox.x0 : splitX + 240) + W * 0.27;

  const rows = [];
  for (const cw of right) {
    if (cw.bbox.y0 <= descY || cw.bbox.y0 >= totalY) continue;
    if (cw.bbox.x0 > studX - 15) continue;
    const code = cleanCode(cw.text);
    if (!code || !/\d{3}/.test(code)) continue;
    const rowWords = right.filter((w) => Math.abs(cy(w) - cy(cw)) < 16);
    const unitW = rowWords.find((w) => /^[1-9]$/.test(w.text) && w.bbox.x1 <= cw.bbox.x0);
    const title = rowWords
      .filter((w) => w.bbox.x0 >= cw.bbox.x1 - 5 && w.bbox.x0 < studX - 15)
      .sort((a, b) => a.bbox.x0 - b.bbox.x0)
      .map((w) => w.text)
      .join(' ')
      .replace(/[|\\[\]]+/g, '')
      .replace(/\s+/g, ' ')
      .replace(/(\s+[^A-Za-z)]{0,2}[a-z]{0,2})+$/, '')
      .trim();
    const rest = rowWords
      .filter((w) => w.bbox.x0 >= studX - 15)
      .sort((a, b) => a.bbox.x0 - b.bbox.x0)
      .map((w) => w.text)
      .join(' ');
    const secM = rest.match(SECTION_RE);
    if (title.length < 4) continue;
    rows.push({ y: cy(cw), units: unitW ? Number(unitW.text) : 0, code, name: title, section: secM ? cleanSection(secM[0]) : '' });
  }
  rows.sort((a, b) => a.y - b.y);
  return rows;
}

function parseGrid(words, W, splitX, knownCodes) {
  const gridRight = splitX - 5;
  const labels = words.filter((w) => w.bbox.x0 < 350 && /^\d{1,2}[:;.]\d{2}-?$|^\d{1,2}[:;.]?00-$/.test(w.text));
  const timeEnd = (labels.length ? median(labels.map((w) => w.bbox.x1)) : 230) + 25;
  const dayW = (gridRight - timeEnd) / 7;

  const clusters = [];
  [...labels].sort((a, b) => cy(a) - cy(b)).forEach((w) => {
    const last = clusters[clusters.length - 1];
    if (last && cy(w) - last.ys[last.ys.length - 1] < 75) {
      last.ys.push(cy(w));
      last.texts.push(w.text);
    } else clusters.push({ ys: [cy(w)], texts: [w.text] });
  });
  const pts = clusters
    .map((c) => {
      const h = parseInt(c.texts[0], 10);
      const idx = HOURS.indexOf(h);
      return idx >= 0 ? { idx, y: c.ys.reduce((a, b) => a + b, 0) / c.ys.length } : null;
    })
    .filter(Boolean);
  const ps = [];
  for (let i = 1; i < pts.length; i++) {
    const di = pts[i].idx - pts[i - 1].idx;
    if (di > 0) ps.push((pts[i].y - pts[i - 1].y) / di);
  }
  const pitch = ps.length ? median(ps) : 140;
  const origin = pts.length ? median(pts.map((p) => p.y - p.idx * pitch)) : 0;
  const rowCenters = pts.map((p) => p.y);

  const codeWords = [];
  for (const w of words) {
    if (cx(w) < timeEnd || cx(w) > gridRight) continue;
    const c = cleanCode(w.text.replace(/^[^A-Za-z0-9]+/, 'P'));
    let best = '';
    let bestD = 2;
    for (const k of knownCodes) {
      if (Math.abs(k.length - (c || w.text).length) > 1) continue;
      const d = lev(k, c || w.text.toUpperCase());
      if (d < bestD) { bestD = d; best = k; }
    }
    if (best && (c === best || bestD <= 1)) codeWords.push({ w, code: best });
  }

  const gaps = [];
  const partial = codeWords.map(({ w, code }) => {
    const col = Math.floor((cx(w) - timeEnd) / dayW);
    const below = words.filter(
      (o) => o !== w && Math.abs(cx(o) - cx(w)) < dayW * 0.5 && cy(o) > cy(w) + 10 && cy(o) < cy(w) + pitch * 2.6
    );
    const lines = groupLines(below);
    const secLine = lines.find((l) => SECTION_RE.test(l.text) && l.y - cy(w) < pitch * 1.3);
    const sec = secLine ? cleanSection(secLine.text.match(SECTION_RE)[0]) : '';
    const after = lines.filter((l) => secLine && l.y > secLine.y + 10);
    let room = '';
    let roomY = null;
    for (const l of after) {
      const r = cleanRoom(l.text);
      if (r) { room = r; roomY = l.y; break; }
    }
    if (!room && after.length) roomY = null;
    if (roomY) gaps.push(roomY - cy(w));
    return { code, col, sec, room, codeY: cy(w), roomY, secY: secLine ? secLine.y : null, cx: cx(w) };
  });

  return { partial, pitch, dayW, origin, rowCenters, timeEnd, gaps };
}

function finalizeGrid(g) {
  const { partial, pitch, origin, gaps } = g;
  const cells = [];
  const baseGap = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length * 0.25)] : 100;

  for (const p of partial) {
    const hours = p.roomY ? Math.max(1, 1 + Math.round((p.roomY - p.codeY - baseGap) / pitch)) : 1;
    const idx = Math.round((p.codeY + 35 - origin) / pitch);
    if (p.col < 0 || p.col > 6 || idx < 0 || idx > 10) continue;
    cells.push({ ...p, day: DAYS[p.col], idx, hours: Math.min(hours, 4) });
  }
  return { cells, pitch, baseGap };
}

async function readRooms(worker, base, g, meta) {
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    tessedit_char_whitelist: 'CLRAB0123456789 -',
  });
  g.gaps.length = 0;
  for (const p of g.partial) {
    if (p.secY == null) continue;
    const left = Math.max(0, Math.round(p.cx - g.dayW * 0.48));
    const width = Math.min(Math.round(g.dayW * 0.96), meta.width - left);
    const top = Math.max(0, Math.round(p.secY + 22));
    const height = Math.min(Math.round(g.pitch * 2.3), meta.height - top);
    if (height < 40 || width < 40) continue;
    const attempts = [
      (i) => i.resize({ width: width * 4, kernel: 'lanczos3' }).normalize(),
      (i) => i.resize({ width: width * 4, kernel: 'lanczos3' }).median(3).threshold(135),
      (i) => i.resize({ width: width * 3, kernel: 'lanczos3' }).threshold(110),
    ];
    for (const prepare of attempts) {
      const buf = await prepare(sharp(base).extract({ left, top, width, height })).png().toBuffer();
      const data = await ocr(worker, buf);
      for (const l of data.lines || []) {
        const txt = l.text.trim();
        if (/\d{3,}/.test(txt) || /BS/i.test(txt)) break;
        const r2 = cleanRoom(txt.split(/\s+/).pop() || '') || cleanRoom(txt.replace(/\s+/g, ''));
        if (r2) {
          p.room = r2;
          p.roomLineFrac = (l.bbox.y0 + l.bbox.y1) / 2;
          break;
        }
      }
      if (p.room) {
        const sc = (await sharp(buf).metadata()).width / width;
        p.roomY = top + p.roomLineFrac / sc;
        break;
      }
    }
    if (p.roomY) g.gaps.push(p.roomY - p.codeY);
  }
  await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: PSM.SPARSE_TEXT });
}

// tesseract.js v6+ no longer returns data.words / data.lines by default.
// Ask for "blocks" and flatten them into words and lines (works on v5 too).
async function ocr(worker, image) {
  const { data } = await worker.recognize(image, {}, { blocks: true });
  let words = data.words || [];
  let lines = data.lines || [];
  if (!words.length && data.blocks) {
    words = [];
    lines = [];
    for (const b of data.blocks)
      for (const p of b.paragraphs || [])
        for (const l of p.lines || []) {
          lines.push(l);
          for (const w of l.words || []) words.push(w);
        }
  }
  return { text: data.text || '', words, lines };
}

async function prep(buffer) {
  return sharp(buffer).rotate().grayscale().normalize().resize({ width: 3000 }).sharpen().png().toBuffer();
}

// Converts page 1 of a PDF into a PNG buffer (pdf-to-img is ESM-only, so it is loaded dynamically)
async function pdfFirstPageToPng(buffer) {
  const { pdf } = await import('pdf-to-img');
  const doc = await pdf(buffer, { scale: 4 });
  return doc.getPage(1);
}

// Reads academic year, semester, hours/week and total units from raw text
function readMeta(text) {
  const ay = text.match(/(20\d{2})\s*[-–]\s*(20\d{2})/);
  const sem = text.match(/(1st|ist|lst|2nd|first|second)\s*sem/i);
  const hrs = text.match(/Hours\s*\/?\s*Week\D{0,3}(\d{1,2})/i);
  const tot = text.match(/(?:Total|No\.?\s*of)\s*Units\D{0,3}(\d{1,2})/i);
  const SEM = { '1': '1st', ist: '1st', lst: '1st', first: '1st', '2nd': '2nd', second: '2nd', '1st': '1st' };
  return {
    academic_year: ay ? `${ay[1]}-${ay[2]}` : '',
    semester: sem ? (SEM[sem[1].toLowerCase()] || '') + ' Semester' : '',
    hours_per_week: hrs ? Number(hrs[1]) : 0,
    total_units: tot ? Number(tot[1]) : 0,
  };
}

// ---- Digital PDFs (e.g. INS Form 5A): read the text layer directly, no OCR needed ----
async function pdfTextItems(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0 });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    return tc.items
      .filter((i) => i.str && i.str.trim())
      .map((i) => ({
        str: i.str.trim(),
        x0: i.transform[4],
        x1: i.transform[4] + i.width,
        cx: i.transform[4] + i.width / 2,
        y: vp.height - i.transform[5],
      }));
  } finally {
    try {
      if (typeof task.destroy === 'function') await task.destroy();
    } catch (_) {
      /* ignore cleanup errors */
    }
  }
}

function parsePdfSchedule(items) {
  const text = items.map((i) => i.str).join(' ');
  const meta = readMeta(text);

  const dayHeads = DAYS.map((d) => items.find((i) => i.str === d));
  if (dayHeads.some((h) => !h)) return null;
  const headY = median(dayHeads.map((h) => h.y));
  const colX = dayHeads.map((h) => h.cx);
  const colW = median(colX.slice(1).map((x, i) => x - colX[i]));
  const timeCut = colX[0] - colW / 2;

  const codeHead = items.find((i) => /^Course\s*code$/i.test(i.str));
  const titleHead = items.find((i) => /^Descriptive\s*Title$/i.test(i.str));
  if (!codeHead || !titleHead) return null;
  const endItem = items.find((i) => /^No\.?\s*of\s*Prep/i.test(i.str) && i.y > codeHead.y);
  const endY = endItem ? endItem.y : Infinity;

  // Summary of courses (below the grid)
  const summary = [];
  for (const it of items) {
    if (it.y <= codeHead.y + 3 || it.y >= endY - 3) continue;
    if (it.x0 >= titleHead.x0 - 5) continue;
    const name = items
      .filter((o) => Math.abs(o.y - it.y) < 3 && o.x0 >= titleHead.x0 - 5)
      .sort((a, b) => a.x0 - b.x0)
      .map((o) => o.str)
      .join(' ');
    if (!name) continue;
    const unitW = items.find((o) => /^[1-9]$/.test(o.str) && Math.abs(o.y - it.y) < 3 && o.x1 <= it.x0);
    summary.push({ code: it.str, name, units: unitW ? Number(unitW.str) : 0 });
  }
  if (!summary.length) return null;

  // Row anchors from the time column (7:00, 8:00, ... 4:00)
  const anchors = items
    .filter((i) => i.cx < timeCut && i.y > headY + 3 && i.y < codeHead.y - 10 && /^\d{1,2}:\d{2}/.test(i.str))
    .map((i) => ({ y: i.y + 3, idx: HOURS.indexOf(parseInt(i.str, 10)) }))
    .filter((a) => a.idx >= 0);
  if (!anchors.length) return null;

  // Grid cells: code line, then section line, then room line
  const codeSet = new Set(summary.map((s) => s.code));
  const cells = [];
  for (const it of items) {
    if (!codeSet.has(it.str)) continue;
    if (it.y <= headY || it.y >= codeHead.y - 10 || it.cx < timeCut) continue;

    let col = -1;
    let bd = Infinity;
    colX.forEach((x, i) => { const d = Math.abs(x - it.cx); if (d < bd) { bd = d; col = i; } });
    if (bd > colW / 2) continue;

    let row = null;
    let rd = Infinity;
    anchors.forEach((a) => { const d = Math.abs(a.y - (it.y + 6)); if (d < rd) { rd = d; row = a; } });
    if (!row || rd > 14) continue;

    const below = items
      .filter((o) => o !== it && Math.abs(o.cx - it.cx) < colW / 2 && o.y > it.y + 2 && o.y < it.y + 22)
      .sort((a, b) => a.y - b.y);
    const secItem = below.find((o) => /^BS[A-Z]{2,5}[-\s]?\d[A-Z]$/i.test(o.str));
    const secM = secItem && secItem.str.toUpperCase().match(/^(BS[A-Z]{2,5})[-\s]?(\d[A-Z])$/);
    const roomItem = secItem ? below.find((o) => o.y > secItem.y + 2) : null;
    cells.push({
      code: it.str,
      sec: secM ? `${secM[1]} ${secM[2]}` : '',
      room: roomItem ? roomItem.str : '',
      col,
      idx: row.idx,
    });
  }

  // Merge back-to-back hours of the same class into one block
  const mergeBlocks = (list) => {
    const sorted = [...list].sort((a, b) => a.col - b.col || a.idx - b.idx);
    const blocks = [];
    for (const c of sorted) {
      const last = blocks[blocks.length - 1];
      if (last && last.col === c.col && last.room === c.room && last.idx + last.hours === c.idx) last.hours += 1;
      else if (last && last.col === c.col && last.idx === c.idx) continue;
      else blocks.push({ col: c.col, idx: c.idx, hours: 1, room: c.room });
    }
    return blocks;
  };

  const subjects = [];
  for (const s of summary) {
    const mine = cells.filter((c) => c.code === s.code);
    const secs = [...new Set(mine.map((c) => c.sec))];
    if (!secs.length) {
      subjects.push({ code: s.code, name: s.name, units: s.units, courseAndYear: '', schedule: '', room: '' });
      continue;
    }
    for (const sec of secs) {
      const blocks = mergeBlocks(mine.filter((c) => c.sec === sec));
      subjects.push({
        code: s.code,
        name: s.name,
        units: s.units,
        courseAndYear: sec,
        schedule: blocks.map((b) => `${DAYS[b.col]} ${range(b.idx, Math.min(b.hours, 4))}`).join('; '),
        room: [...new Set(blocks.map((b) => b.room).filter(Boolean))].join(', '),
      });
    }
  }
  return { ...meta, subjects };
}

async function scanPdfText(buffer) {
  const items = await pdfTextItems(buffer);
  if (!items.length) return null; // scanned PDF without a text layer
  return parsePdfSchedule(items);
}

async function scanFacultyLoad(buffer) {
  const base = await prep(buffer);
  const meta = await sharp(base).metadata();
  const worker = await createWorker('eng');
  try {
    const full = await ocr(worker, base);
    const words = full.words.filter((w) => w.text && w.text.trim());
    const text = full.text || '';

    const unitsW = words.find((w) => /^Units$/i.test(w.text));
    const splitX = unitsW ? unitsW.bbox.x0 - 8 : Math.round(meta.width * 0.487);

    const meta2 = readMeta(text);

    const rows = parseSummary(words, meta.width, splitX);

    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const gridBuf = await sharp(base).extract({ left: 0, top: 0, width: splitX - 5, height: meta.height }).png().toBuffer();
    const gridWords = (await ocr(worker, gridBuf)).words.filter((w) => w.text && w.text.trim());
    const known = new Set(rows.map((r) => r.code));
    const g = parseGrid(gridWords, meta.width, splitX, known);
    await readRooms(worker, base, g, meta);
    const grid = finalizeGrid(g);

    const secByCode = {};
    grid.cells.forEach((c) => {
      if (!c.sec) return;
      secByCode[c.code] = secByCode[c.code] || new Set();
      secByCode[c.code].add(c.sec);
    });
    const used = {};
    rows.forEach((r) => { if (r.section) (used[r.code] = used[r.code] || new Set()).add(r.section); });
    rows.forEach((r) => {
      if (r.section) return;
      const pool = [...(secByCode[r.code] || [])].filter((s) => !(used[r.code] || new Set()).has(s));
      if (pool.length) {
        r.section = pool.sort()[0];
        (used[r.code] = used[r.code] || new Set()).add(r.section);
      }
    });

    const subjects = rows.map((r) => {
      const mine = grid.cells.filter((c) => c.code === r.code && c.sec === r.section);
      const parts = mine
        .sort((a, b) => a.col - b.col || a.idx - b.idx)
        .map((c) => `${c.day} ${range(c.idx, c.hours)}`);
      const rooms = [...new Set(mine.map((c) => c.room).filter(Boolean))];
      return { code: r.code, name: r.name, units: r.units, courseAndYear: r.section, schedule: parts.join('; '), room: rooms.join(', ') };
    });

    return { ...meta2, subjects };
  } finally {
    await worker.terminate();
  }
}

router.get('/teaching-load', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { data, error } = await supabase
      .from('teaching_loads')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    res.json(data || { subjects: [] });
  } catch (err) {
    console.error('Get teaching load error:', err);
    res.status(500).json({ error: 'Failed to load teaching load.' });
  }
});

router.put('/teaching-load', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { subjects, academic_year, semester, hours_per_week, total_units } = req.body;
    const { error } = await supabase.from('teaching_loads').upsert(
      {
        user_id: userId,
        academic_year,
        semester,
        hours_per_week,
        total_units,
        subjects: subjects || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Save teaching load error:', err);
    res.status(500).json({ error: 'Failed to save teaching load.' });
  }
});

router.post('/teaching-load/scan', authenticate, upload.single('file'), async (req, res) => {
  let stage = 'start';
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Please upload a PNG, JPG, or PDF of your faculty load.' });
    }

    let result = null;
    let input = req.file.buffer;

    if (req.file.mimetype === 'application/pdf') {
      stage = 'pdf-text';
      try {
        result = await scanPdfText(req.file.buffer);
      } catch (e) {
        console.warn('PDF text read failed, falling back to OCR:', e.message);
      }
      if (!result || !result.subjects.length) {
        stage = 'pdf-convert';
        input = await pdfFirstPageToPng(req.file.buffer);
        result = null;
      }
    }

    if (!result) {
      stage = 'ocr-scan';
      result = await scanFacultyLoad(input);
    }

    if (result.subjects.length === 0) {
      return res
        .status(422)
        .json({ error: 'No subjects could be read. Try a clearer, straighter, higher-resolution file.' });
    }

    stage = 'database-save';
    const userId = req.user.userId || req.user.id;
    const { error } = await supabase.from('teaching_loads').upsert(
      {
        user_id: userId,
        academic_year: result.academic_year,
        semester: result.semester,
        hours_per_week: result.hours_per_week,
        total_units: result.total_units,
        subjects: result.subjects || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    res.json(result);
  } catch (err) {
    console.error(`Teaching load scan error [${stage}]:`, err);
    res.status(500).json({
      error: 'Failed to scan and save the uploaded file.',
      stage,
      detail: err.message || err.details || String(err),
    });
  }
});

module.exports = router;