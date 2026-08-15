// routes/calendarEvents.js
//
// Handles writes (insert/delete) to public.calendar_events.
// Reads stay on the frontend via the anon Supabase client — only
// writes are routed through here so they run under the service role
// (which bypasses RLS) after the chair/faculty JWT has been verified.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Reusing your existing root-level supabaseClient.js (the service-role
// client your .env's SUPABASE_SERVICE_KEY sets up) instead of creating
// a second Supabase client here.
const supabase = require('../supabaseClient');

const ALLOWED_EVENT_TYPES = ['meeting', 'activity', 'deadline', 'holiday', 'exam'];

// POST /api/calendar-events
router.post('/', authenticate, async (req, res) => {
  const { title, description, event_date, department, event_type, status } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Event title is required.' });
  }
  if (!event_date) {
    return res.status(400).json({ error: 'Event date is required.' });
  }
  if (event_type !== null && event_type !== undefined && !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: 'Invalid event_type.' });
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: String(title).trim(),
      description: description || null,
      event_date,
      department: department || null,
      event_type: event_type || null,
      // organizer_id intentionally omitted: it has a foreign key to
      // public.profiles(id), but chair/faculty accounts live in
      // public.users (custom JWT auth), not in profiles. Sending
      // req.user.userId here throws a FK violation. See the note
      // below for how to properly attribute events once the schema
      // question is resolved.
      status: status || 'upcoming',
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
});

// DELETE /api/calendar-events/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(204).send();
});

module.exports = router;