// routes/notifications.js
//
// Authenticated read/mark-read for the shared notifications table.
// Replaces DashboardHeader's previous direct-Supabase reads (which
// relied on supabase.auth.getUser() — broken, since this app uses
// custom JWT auth, not real Supabase Auth sessions).

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: 'Notification not found.' });
  if (existing.user_id !== req.user.userId) {
    return res.status(403).json({ error: 'You cannot modify another user\'s notification.' });
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

module.exports = router;