const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only department chairs (or dean/admin) can view/manage student approvals.
function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

// GET all student profiles with their student_profiles info.
// Chairs only see students in one of their assigned programs (from the
// JWT's `programs` array — a chair can cover more than one program,
// e.g. BSED-Math and BSED-English at once); dean/admin see everyone.
router.get('/', authenticate, requireChairRole, async (req, res) => {
  const isChairScoped = req.user.role === 'department_chair';

  if (isChairScoped && (!req.user.programs || req.user.programs.length === 0)) {
    return res.status(400).json({ error: 'Your chair account has no program assigned. Contact the dean/admin.' });
  }

  // !inner is required when filtering on the embedded relation's column —
  // without it, PostgREST filters the embedded array's *contents* but
  // still returns the parent profile row even when nothing matches,
  // which would leak students from other programs into the response.
  let query = supabase
    .from('profiles')
    .select(
      isChairScoped
        ? `id, full_name, email, status, created_at, student_profiles!inner ( student_no, program, year_level )`
        : `id, full_name, email, status, created_at, student_profiles ( student_no, program, year_level )`
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (isChairScoped) {
    query = query.in('student_profiles.program', req.user.programs);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH a single student's status: 'active' | 'rejected'.
// Chairs can only act on students in one of their assigned programs.
router.patch('/:id/status', authenticate, requireChairRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  if (req.user.role === 'department_chair') {
    if (!req.user.programs || req.user.programs.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no program assigned. Contact the dean/admin.' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('id, student_profiles ( program )')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const studentProgram = existing.student_profiles?.program;
    if (!req.user.programs.includes(studentProgram)) {
      return res.status(403).json({ error: 'You can only manage students in your own program(s).' });
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