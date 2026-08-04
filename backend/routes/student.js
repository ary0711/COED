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

// GET all student profiles with their student_profiles info
router.get('/', authenticate, requireChairRole, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, status, created_at,
      student_profiles ( student_no, program, year_level )
    `)
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH a single student's status: 'active' | 'rejected'
router.patch('/:id/status', authenticate, requireChairRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
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