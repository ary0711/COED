// routes/me.js
//
// GET /api/me — returns basic info about the currently authenticated
// user, including their department name(s). Chairs already carry
// departmentNames on their JWT (set at login), so that's used directly.
// Faculty/student/alumni JWTs don't carry department info, so it's
// looked up fresh from their own profile table + departments — this
// also avoids showing a stale department if it's ever reassigned after
// the token was issued.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const ROLE_TO_TABLE = {
  faculty: 'faculty_profiles',
  student: 'student_profiles',
  alumni: 'alumni_profiles',
};

router.get('/', authenticate, async (req, res) => {
  const { role, userId, fullName } = req.user;

  // Chairs: already on the JWT, no DB lookup needed.
  if (role === 'department_chair') {
    return res.json({
      userId,
      role,
      fullName,
      departmentNames: req.user.departmentNames ?? [],
    });
  }

  const table = ROLE_TO_TABLE[role];
  if (!table) {
    // dean/admin — not scoped to a department
    return res.json({ userId, role, fullName, departmentNames: [] });
  }

  const { data: profile, error: profileError } = await supabase
    .from(table)
    .select('department_id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile?.department_id) {
    return res.json({ userId, role, fullName, departmentNames: [] });
  }

  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('name')
    .eq('id', profile.department_id)
    .single();

  if (deptError || !dept) {
    return res.json({ userId, role, fullName, departmentNames: [] });
  }

  return res.json({ userId, role, fullName, departmentNames: [dept.name] });
});

module.exports = router;