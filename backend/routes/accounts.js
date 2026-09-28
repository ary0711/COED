const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only department chairs (or dean/admin) can view/manage account approvals
function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin', 'college_dean'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

// Maps the UI/URL role param to:
//  - the profile table that holds department_id for that role
//  - the profiles.role value stored on the parent `profiles` row
//  - which foreign key column on that table points back to profiles.id
const ROLE_CONFIG = {
  student: { table: 'student_profiles', profilesRole: 'student', fk: 'user_id' },
  faculty: { table: 'faculty_profiles', profilesRole: 'faculty', fk: 'user_id' },
  alumni:  { table: 'alumni_profiles',  profilesRole: 'alumni',  fk: 'user_id' },
};

function requireValidRole(req, res, next) {
  const { role } = req.params;
  if (!ROLE_CONFIG[role]) {
    return res.status(400).json({ error: 'Invalid role. Must be student, faculty, or alumni.' });
  }
  next();
}

// GET /api/accounts/:role — all pending/active/rejected profiles for that role.
router.get('/:role', authenticate, requireChairRole, requireValidRole, async (req, res) => {
  const { role } = req.params;
  const { table, profilesRole } = ROLE_CONFIG[role];
  const isChairScoped = req.user.role === 'department_chair';

  if (isChairScoped && (!req.user.departmentIds || req.user.departmentIds.length === 0)) {
    return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
  }

  // Explicitly select id_number, department, and program on profiles
  let query = supabase
    .from('profiles')
    .select(
      isChairScoped
        ? `id, full_name, email, id_number, department, program, status, created_at, ${table}!inner ( * )`
        : `id, full_name, email, id_number, department, program, status, created_at, ${table} ( * )`
    )
    .eq('role', profilesRole)
    .order('created_at', { ascending: false });

  if (isChairScoped) {
    query = query.in(`${table}.department_id`, req.user.departmentIds);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/accounts/:role/:id/status — set 'active' | 'rejected'.
router.patch('/:role/:id/status', authenticate, requireChairRole, requireValidRole, async (req, res) => {
  const { role, id } = req.params;
  const { status } = req.body;
  const { table, fk } = ROLE_CONFIG[role];

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  if (req.user.role === 'department_chair') {
    if (!req.user.departmentIds || req.user.departmentIds.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
    }

    const { data: roleProfile, error: fetchError } = await supabase
      .from(table)
      .select('department_id')
      .eq(fk, id)
      .single();

    if (fetchError || !roleProfile) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const accountDepartmentId = roleProfile.department_id;
    if (!req.user.departmentIds.includes(accountDepartmentId)) {
      return res.status(403).json({ error: 'You can only manage accounts in your own department(s).' });
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (role === 'faculty') {
    const facultyStatus = status === 'active' ? 'Active' : 'Rejected';
    await supabase.from('faculty_profiles').update({ status: facultyStatus }).eq('user_id', id);
  }

  res.json(data);
});

module.exports = router;