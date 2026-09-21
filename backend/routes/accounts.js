const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only department chairs (or dean/admin) can view/manage account approvals
function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin'];
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
// Chairs only see accounts in one of their assigned departments (from the
// JWT's `departmentIds` array — a chair can cover more than one department).
// Scoping is by department_id (a real foreign key on each role's profile
// table), not any free-text program column, since that drifts out of sync.
router.get('/:role', authenticate, requireChairRole, requireValidRole, async (req, res) => {
  const { role } = req.params;
  const { table, profilesRole } = ROLE_CONFIG[role];
  const isChairScoped = req.user.role === 'department_chair';

  if (isChairScoped && (!req.user.departmentIds || req.user.departmentIds.length === 0)) {
    return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
  }

  // !inner is required when filtering on the embedded relation's column —
  // without it, PostgREST filters the embedded array's *contents* but
  // still returns the parent profile row even when nothing matches,
  // which would leak accounts from other departments into the response.
  let query = supabase
    .from('profiles')
    .select(
      isChairScoped
        ? `id, full_name, email, status, created_at, ${table}!inner ( * )`
        : `id, full_name, email, status, created_at, ${table} ( * )`
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
// Chairs can only act on accounts in one of their assigned departments.
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

    // Query the role's own profile table directly by its FK to profiles,
    // rather than embedding it through `profiles`. None of these tables
    // have a UNIQUE constraint on that FK column (only alumni_profiles
    // does, coincidentally), so PostgREST can't reliably infer a
    // one-to-one relationship and may return the embed as an ARRAY.
    // Reading `.department_id` off an array silently returns undefined,
    // which would make every departmentIds.includes(undefined) check
    // fail — a 403 for every account, regardless of actual department.
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

  // Keep faculty_profiles.status in sync as a display convenience — the
  // real access gate is always profiles.status, this is just so the two
  // fields don't visibly contradict each other elsewhere in the app.
  if (role === 'faculty') {
    const facultyStatus = status === 'active' ? 'Active' : 'Rejected';
    await supabase.from('faculty_profiles').update({ status: facultyStatus }).eq('user_id', id);
  }

  res.json(data);
});

module.exports = router;