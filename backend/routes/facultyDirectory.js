// routes/facultyDirectory.js
//
// GET /api/faculty/by-department/:departmentId
// Returns only faculty assigned to the given department — used by the
// Student dashboard's "Faculty & Departments" page, scoped to the
// student's own approved program's department (resolved via /api/me).

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

router.get('/by-department/:departmentId', authenticate, async (req, res) => {
  const { departmentId } = req.params;
  if (!departmentId) {
    return res.status(400).json({ error: 'departmentId is required.' });
  }

  const { data: facultyRows, error: facultyError } = await supabase
    .from('faculty_profiles')
    .select('user_id, position, department_id')
    .eq('department_id', departmentId);

  if (facultyError) {
    return res.status(500).json({ error: facultyError.message });
  }
  if (!facultyRows || facultyRows.length === 0) {
    return res.json([]);
  }

  const userIds = facultyRows.map(f => f.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (profilesError) {
    return res.status(500).json({ error: profilesError.message });
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const merged = facultyRows.map(f => ({
    id: f.user_id,
    full_name: profileMap.get(f.user_id)?.full_name ?? 'Unknown',
    email: profileMap.get(f.user_id)?.email ?? null,
    position: f.position ?? null,
  }));

  return res.json(merged);
});

module.exports = router;