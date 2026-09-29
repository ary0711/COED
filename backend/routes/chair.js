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

module.exports = router;