// routes/inquiries.js
//

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Resolves which "owner" column + id this request should use, based on
// the role embedded in the JWT at login time (see routes/auth.js).
function resolveOwner(req, res) {
  const role = req.user.role;

  if (role === 'student') {
    // Students are keyed by their auth/user id (matches student_profiles.user_id).
    const studentId = req.user.userId;
    if (!studentId) {
      res.status(400).json({ error: 'No user ID on this account.' });
      return null;
    }
    return { column: 'student_id', id: studentId };
  }

  if (role === 'alumni') {
    // Alumni are keyed by their alumni ID (same value used by tracerSurvey.js).
    const alumniId = req.user.alumniId || req.user.idNumber;
    if (!alumniId) {
      res.status(400).json({ error: 'No alumni ID on this account. Contact support to have your profile linked.' });
      return null;
    }
    return { column: 'alumni_id', id: alumniId };
  }

  res.status(403).json({ error: 'Only students and alumni can submit or view inquiries this way.' });
  return null;
}

// GET /api/inquiries/mine — the logged-in student's or alumnus's own inquiry history
router.get('/mine', authenticate, async (req, res) => {
  const owner = resolveOwner(req, res);
  if (!owner) return;

  const { data, error } = await supabase
    .from('inquiries')
    .select('id, subject, category, message, reply, status, created_at, replied_at')
    .eq(owner.column, owner.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

// POST /api/inquiries — submit a new inquiry
router.post('/', authenticate, async (req, res) => {
  const owner = resolveOwner(req, res);
  if (!owner) return;

  const { subject, category, message } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  const insertPayload = {
    [owner.column]: owner.id, // student_id or alumni_id, server-derived from the JWT
    sender_id: owner.id,
    sender_name: req.user.fullName || req.user.username,
    sender_role: req.user.role,
    subject: subject.trim(),
    category: category || null,
    message: message.trim(),
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('inquiries')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

// GET /api/inquiries — ALL inquiries, for the Dean's dashboard
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to view all inquiries.' });
  }

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

// PUT /api/inquiries/:id/reply — Dean replies to an inquiry
router.put('/:id/reply', authenticate, async (req, res) => {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to reply to inquiries.' });
  }

  const { id } = req.params;
  const { reply } = req.body;

  if (!reply?.trim()) {
    return res.status(400).json({ error: 'Reply message is required.' });
  }

  const { data, error } = await supabase
    .from('inquiries')
    .update({
      reply: reply.trim(),
      replied_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

module.exports = router;