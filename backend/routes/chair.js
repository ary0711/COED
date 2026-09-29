const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

function requireChair(req, res, next) {
  if (req.user.role !== 'department_chair') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

// GET /api/chair/dashboard-stats
router.get('/dashboard-stats', authenticate, requireChair, async (req, res) => {
  const departmentIds = req.user.departmentIds || [];
  if (departmentIds.length === 0) {
    return res.status(400).json({ error: 'Your chair account has no department assigned.' });
  }

  // Current quarter and year (same format as Reports Monitoring)
  const now = new Date();
  const quarter = ['1st', '2nd', '3rd', '4th'][Math.floor(now.getMonth() / 3)];
  const year = String(now.getFullYear());

  // 1. Faculty under this chair's department(s)
  const { data: faculty, error: fErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, faculty_profiles!inner ( department_id )')
    .eq('role', 'faculty')
    .eq('status', 'active')
    .in('faculty_profiles.department_id', departmentIds);

  if (fErr) return res.status(400).json({ error: fErr.message });

  const facultyIds = (faculty || []).map((f) => f.id);

  // 2. Reports of those faculty only (current quarter, no drafts)
  let acc = [], ext = [], wfh = [];
  if (facultyIds.length > 0) {
    const [a, e, w] = await Promise.all([
      supabase.from('accomplishment_reports').select('submitted_by, status, updated_at')
        .in('submitted_by', facultyIds).eq('quarter', quarter).eq('year', year).neq('status', 'draft'),
      supabase.from('extension_reports').select('submitted_by, status, updated_at')
        .in('submitted_by', facultyIds).eq('quarter', quarter).eq('year', year).neq('status', 'draft'),
      supabase.from('wfh_reports').select('user_id, status, updated_at')
        .in('user_id', facultyIds).neq('status', 'draft'),
    ]);
    acc = a.data || [];
    ext = e.data || [];
    wfh = (w.data || []).map((r) => ({ ...r, submitted_by: r.user_id }));
  }

  const allReports = [...acc, ...ext, ...wfh];

  // 3. Status per faculty
  const facultyList = (faculty || []).map((f) => {
    const mine = allReports.filter((r) => r.submitted_by === f.id);
    const statuses = mine.map((r) => r.status);
    let reportStatus = 'Pending';
    if (statuses.includes('submitted')) reportStatus = 'Submitted';
    else if (statuses.includes('rejected')) reportStatus = 'Rejected';
    else if (statuses.includes('approved')) reportStatus = 'Approved';

    const lastUpdated = mine.map((r) => r.updated_at).sort().pop() || null;
    return { id: f.id, name: f.full_name, email: f.email, reportStatus, lastUpdated };
  });

  const submitted = facultyList.filter(
    (f) => f.reportStatus === 'Submitted' || f.reportStatus === 'Approved'
  ).length;

  // 4. Account approvals (students, faculty, alumni under this chair's department)
  const roleTables = [
    { role: 'student', table: 'student_profiles' },
    { role: 'faculty', table: 'faculty_profiles' },
    { role: 'alumni', table: 'alumni_profiles' },
  ];

  const accountResults = await Promise.all(
    roleTables.map(({ role, table }) =>
      supabase
        .from('profiles')
        .select(`id, full_name, role, status, created_at, ${table}!inner ( department_id )`)
        .eq('role', role)
        .in(`${table}.department_id`, departmentIds)
    )
  );

  const accounts = accountResults
    .flatMap((r) =>
      (r.data || []).map(({ id, full_name, role, status, created_at }) => ({
        id, full_name, role, status, created_at,
      }))
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    facultyCount: facultyList.length,
    facultyList,
    reportStats: { submitted, pending: facultyList.length - submitted },
    accounts,
  });
});

// ─── Helpers ───────────────────────────────────────────────
async function getChairFaculty(departmentIds) {
  return supabase
    .from('profiles')
    .select('id, full_name, email, department, program, faculty_profiles!inner ( department_id )')
    .eq('role', 'faculty')
    .eq('status', 'active')
    .in('faculty_profiles.department_id', departmentIds);
}

async function facultyBelongsToChair(facultyId, departmentIds) {
  const { data } = await supabase
    .from('faculty_profiles')
    .select('department_id')
    .eq('user_id', facultyId)
    .maybeSingle();
  return Boolean(data && departmentIds.includes(data.department_id));
}

const REPORT_TABLES = {
  accomplishment: { table: 'accomplishment_reports', owner: 'submitted_by' },
  extension:      { table: 'extension_reports',      owner: 'submitted_by' },
  wfh:            { table: 'wfh_reports',            owner: 'user_id' },
};

// Kuhaon ang pinakabag-o nga report kada faculty
function newestByOwner(list, ownerKey) {
  const map = new Map();
  [...list]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .forEach((r) => { if (!map.has(r[ownerKey])) map.set(r[ownerKey], r); });
  return map;
}

// GET /api/chair/reports?quarter=3rd&year=2026
router.get('/reports', authenticate, requireChair, async (req, res) => {
  const departmentIds = req.user.departmentIds || [];
  if (departmentIds.length === 0) {
    return res.status(400).json({ error: 'Your chair account has no department assigned.' });
  }

  const { quarter, year } = req.query;
  if (!quarter || !year) {
    return res.status(400).json({ error: 'quarter and year are required.' });
  }

  const { data: faculty, error: fErr } = await getChairFaculty(departmentIds);
  if (fErr) return res.status(400).json({ error: fErr.message });
  if (!faculty || faculty.length === 0) return res.json([]);

  const ids = faculty.map((f) => f.id);

  const [a, e, w] = await Promise.all([
    supabase.from('accomplishment_reports').select('*')
      .in('submitted_by', ids).eq('quarter', quarter).eq('year', year).neq('status', 'draft'),
    supabase.from('extension_reports').select('*')
      .in('submitted_by', ids).eq('quarter', quarter).eq('year', year).neq('status', 'draft'),
    supabase.from('wfh_reports').select('*')
      .in('user_id', ids).neq('status', 'draft'),
  ]);

  const firstError = a.error || e.error || w.error;
  if (firstError) return res.status(400).json({ error: firstError.message });

  const accMap = newestByOwner(a.data || [], 'submitted_by');
  const extMap = newestByOwner(e.data || [], 'submitted_by');
  const wfhMap = newestByOwner(w.data || [], 'user_id');

  const rows = faculty.map(({ faculty_profiles, ...profile }) => {
    const acc = accMap.get(profile.id) ?? null;
    const ext = extMap.get(profile.id) ?? null;
    const wfh = wfhMap.get(profile.id) ?? null;

    let effectiveStatus = 'not_started';
    let effectiveProgress = 0;

    if (acc || ext || wfh) {
      const statuses = [acc?.status, ext?.status, wfh?.status].filter(Boolean);
      if (statuses.includes('submitted')) effectiveStatus = 'submitted';
      else if (statuses.includes('rejected')) effectiveStatus = 'rejected';
      else if (statuses.includes('approved')) effectiveStatus = 'approved';

      const progress = [];
      if (typeof acc?.progress === 'number') progress.push(acc.progress);
      if (typeof ext?.progress === 'number') progress.push(ext.progress);
      if (wfh) progress.push(wfh.status === 'approved' ? 100 : 75);
      effectiveProgress = progress.length
        ? Math.round(progress.reduce((s, n) => s + n, 0) / progress.length)
        : 0;
    }

    const lastUpdated = [acc, ext, wfh].filter(Boolean).map((r) => r.updated_at).sort().pop() || null;

    return {
      profile,
      departmentName: profile.department || profile.program || 'General',
      accomplishmentReport: acc,
      extensionReport: ext,
      wfhReport: wfh,
      effectiveStatus,
      effectiveProgress,
      lastUpdated,
    };
  });

  res.json(rows);
});

// PATCH /api/chair/reports/:type/:id/decision  (approve / reject)
router.patch('/reports/:type/:id/decision', authenticate, requireChair, async (req, res) => {
  const departmentIds = req.user.departmentIds || [];
  const { type, id } = req.params;
  const { status, remarks } = req.body;

  const cfg = REPORT_TABLES[type];
  if (!cfg) return res.status(400).json({ error: 'Invalid report type.' });
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const { data: report, error: rErr } = await supabase
    .from(cfg.table)
    .select(`id, ${cfg.owner}`)
    .eq('id', id)
    .single();
  if (rErr || !report) return res.status(404).json({ error: 'Report not found.' });

  const allowed = await facultyBelongsToChair(report[cfg.owner], departmentIds);
  if (!allowed) {
    return res.status(403).json({ error: 'You can only review reports from your own department.' });
  }

  const { data, error } = await supabase
    .from(cfg.table)
    .update({ status, dean_remarks: remarks || null })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /api/chair/reminders
router.post('/reminders', authenticate, requireChair, async (req, res) => {
  const departmentIds = req.user.departmentIds || [];
  const { facultyId, title, message } = req.body;

  if (!facultyId || !title || !message) {
    return res.status(400).json({ error: 'facultyId, title and message are required.' });
  }

  const allowed = await facultyBelongsToChair(facultyId, departmentIds);
  if (!allowed) {
    return res.status(403).json({ error: 'You can only send reminders to your own faculty.' });
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: facultyId,
    title,
    message,
    type: 'announcement',
    is_read: false,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;