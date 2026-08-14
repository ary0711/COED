const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only department chairs (or dean/admin) can view/manage student approvals
function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

// GET all student profiles with their student_profiles info.
// Chairs only see students in one of their assigned departments (from
// the JWT's `departmentIds` array — a chair can cover more than one
// department, e.g. BSED-Math and BSED-English at once). Scoping is by
// department_id (a real foreign key), not the free-text `program`
// column, since that field has no validation and drifts out of sync
// (e.g. "BEEd" vs "BEED") — department_id is always reliable.
router.get('/', authenticate, requireChairRole, async (req, res) => {
  const isChairScoped = req.user.role === 'department_chair';

  if (isChairScoped && (!req.user.departmentIds || req.user.departmentIds.length === 0)) {
    return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
  }

  // !inner is required when filtering on the embedded relation's column —
  // without it, PostgREST filters the embedded array's *contents* but
  // still returns the parent profile row even when nothing matches,
  // which would leak students from other departments into the response.
  let query = supabase
    .from('profiles')
    .select(
      isChairScoped
        ? `id, full_name, email, status, created_at, student_profiles!inner ( student_no, program, department_id, year_level )`
        : `id, full_name, email, status, created_at, student_profiles ( student_no, program, department_id, year_level )`
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (isChairScoped) {
    query = query.in('student_profiles.department_id', req.user.departmentIds);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH a single student's status: 'active' | 'rejected'.
// Chairs can only act on students in one of their assigned departments.
router.patch('/:id/status', authenticate, requireChairRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  if (req.user.role === 'department_chair') {
    if (!req.user.departmentIds || req.user.departmentIds.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
    }

    // Query student_profiles directly by user_id instead of embedding
    // through profiles. student_profiles.user_id has no UNIQUE constraint
    // (only `id` [pkey] and `student_no` are unique), so PostgREST can't
    // infer a one-to-one relationship and would return student_profiles
    // as an ARRAY when embedded via `profiles.select('student_profiles(...)')`.
    // Reading `.department_id` off that array silently returns undefined,
    // which made every chair's departmentIds.includes(undefined) check
    // fail — a 403 for every student, regardless of actual department.
    const { data: studentProfile, error: fetchError } = await supabase
      .from('student_profiles')
      .select('department_id')
      .eq('user_id', id)
      .single();

    if (fetchError || !studentProfile) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const studentDepartmentId = studentProfile.department_id;
    if (!req.user.departmentIds.includes(studentDepartmentId)) {
      return res.status(403).json({ error: 'You can only manage students in your own department(s).' });
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;