// routes/announcements.js
//
// Handles writes (insert/delete) to public.announcements.
// Reads stay on the frontend via the anon Supabase client — only
// writes are routed through here so they run under the service role
// (which bypasses RLS) after the chair/faculty JWT has been verified.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Your existing root-level supabaseClient.js is a default export
// (module.exports = supabase), not a named one.
const supabase = require('../supabaseClient');

// POST /api/announcements
router.post('/', authenticate, async (req, res) => {
  const { title, content, expires_at, is_pinned, target_role } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'Content is required.' });
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: String(title).trim(),
      content: String(content).trim(),
      expires_at: expires_at || null,
      is_pinned: is_pinned ?? false,
      target_role: target_role || null,
      // author_id intentionally omitted: it has a foreign key to
      // public.profiles(id), but chair/faculty accounts live in
      // public.users (custom JWT auth), not in profiles. Sending
      // req.user.userId here would throw a FK violation, same as
      // organizer_id did on calendar_events.
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(204).send();
});

module.exports = router;