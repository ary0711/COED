// routes/me.js
//
// GET /api/me — returns basic info about the currently authenticated
// user, including their department name(s). Chairs already carry
// departmentNames on their JWT (set at login), so that's used directly.
// Faculty/student/alumni JWTs don't carry department info, so it's
// looked up fresh from their own profile table + departments — this
// also avoids showing a stale department if it's ever reassigned after
// the token was issued.
//
// Students additionally get their approved program, department_id,
// and registration-time profile fields included in the response, so
// the frontend never has to query student_profiles directly (which
// previously happened via the anon Supabase client — the same
// RLS-dependency risk fixed elsewhere in this app).

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

  // Chairs: already on the JWT, no DB lookup needed. (Unchanged.)
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
    // dean/admin — not scoped to a department. (Unchanged.)
    return res.json({ userId, role, fullName, departmentNames: [] });
  }

  const { data: profile, error: profileError } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    return res.json({ userId, role, fullName, departmentNames: [] });
  }

  const departmentId = profile.department_id ?? null;
  let departmentNames = [];

  if (departmentId) {
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('name')
      .eq('id', departmentId)
      .single();

    if (!deptError && dept) {
      departmentNames = [dept.name];
    }
  }

 const response = { userId, role, fullName, departmentNames };

  // Student-specific extras — additive only, doesn't change the base
  // shape faculty/alumni/dean/admin already rely on.
  if (role === 'student') {
    const { data: userRow } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    response.program = profile.program ?? null;
    response.departmentId = departmentId;
    response.studentNo = profile.student_no ?? null;
    response.yearLevel = profile.year_level ?? null;
    response.academicStanding = profile.academic_standing ?? null;
    response.enrollmentStatus = profile.enrollment_status ?? null;
    response.gpa = profile.gpa ?? null;
    response.email = userRow?.email ?? null;
  }

  // Faculty-specific extras — additive only, same pattern as student.
  if (role === 'faculty') {
    const { data: userRow } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    response.facultyId = profile.faculty_id ?? null;
    response.departmentId = departmentId;
    response.position = profile.position ?? null;
    response.contactEmail = profile.contact_email ?? null;
    response.contactNo = profile.contact_no ?? null;
    response.specialization = profile.specialization ?? null;
    response.dateHired = profile.date_hired ?? null;
    response.status = profile.status ?? null;
    response.profilePhotoUrl = profile.profile_photo_url ?? null;
    response.email = userRow?.email ?? null;
  }

  return res.json(response);
});

router.patch('/', authenticate, async (req, res) => {
  const { role, userId } = req.user;

  if (role === 'student') {
    const { full_name, student_no } = req.body;
    const patch = {};
    if (full_name !== undefined) {
      if (!String(full_name).trim()) return res.status(400).json({ error: 'Full name cannot be empty.' });
      patch.full_name = String(full_name).trim();
    }
    if (student_no !== undefined) {
      if (!String(student_no).trim()) return res.status(400).json({ error: 'Student ID cannot be empty.' });
      patch.student_no = String(student_no).trim();
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No changes were provided.' });
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (role === 'faculty') {
    // Only self-editable contact info — position, department, status,
    // and date_hired remain Dean/Chair-controlled, same as students
    // can't edit their own approved program.
    const { full_name, contact_email, contact_no, specialization } = req.body;
    const patch = {};
    if (full_name !== undefined) {
      if (!String(full_name).trim()) return res.status(400).json({ error: 'Full name cannot be empty.' });
      patch.full_name = String(full_name).trim();
    }
    if (contact_email !== undefined) patch.contact_email = String(contact_email).trim() || null;
    if (contact_no !== undefined) patch.contact_no = String(contact_no).trim() || null;
    if (specialization !== undefined) patch.specialization = String(specialization).trim() || null;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No changes were provided.' });
    }

    const { data, error } = await supabase
      .from('faculty_profiles')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(403).json({ error: 'This endpoint currently only supports student and faculty profile updates.' });
});

module.exports = router;