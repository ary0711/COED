// routes/calendarEvents.js
//
// Handles reads AND writes to public.calendar_events, both scoped by
// department. Writes run under the service role (bypassing RLS) after
// the chair/faculty JWT has been verified. Reads now also go through
// here (rather than a direct, unfiltered client-side Supabase call),
// since department scoping has to be enforced server-side — the client
// can't be trusted to only ask for its own department's events.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Reusing your existing root-level supabaseClient.js (the service-role
// client your .env's SUPABASE_SERVICE_KEY sets up) instead of creating
// a second Supabase client here.
const supabase = require('../supabaseClient');

const ALLOWED_EVENT_TYPES = ['meeting', 'activity', 'deadline', 'holiday', 'exam'];

// Looks up the department_id(s) a given user is scoped to, regardless
// of role:
//  - department_chair: departmentIds already live on the JWT (req.user),
//    set at login — a chair can be assigned more than one department row.
//  - faculty: not on the JWT: looked up fresh from faculty_profiles,
//    since that's the source of truth and avoids stale JWT data if a
//    faculty member's department is ever reassigned after their token
//    was issued.
//  - dean/admin: no scoping — they see everything (handled by caller).
async function getDepartmentIdsForUser(req) {
  if (req.user.role === 'department_chair') {
    return req.user.departmentIds ?? [];
  }

  if (req.user.role === 'faculty') {
    const { data, error } = await supabase
      .from('faculty_profiles')
      .select('department_id')
      .eq('user_id', req.user.userId)
      .single();

    if (error || !data?.department_id) return [];
    return [data.department_id];
  }

  return [];
}

// GET /api/calendar-events
// - dean/admin: all events
// - department_chair / faculty: only events whose department_ids overlaps
//   the requester's own department(s)
router.get('/', authenticate, async (req, res) => {
  const isScoped = ['department_chair', 'faculty'].includes(req.user.role);

  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  if (isScoped) {
    const departmentIds = await getDepartmentIdsForUser(req);
    if (departmentIds.length === 0) {
      // No department on record — return nothing rather than leaking
      // every department's events by accident.
      return res.json([]);
    }
    // overlaps: true if calendar_events.department_ids shares at least
    // one id with the requester's department_ids.
    query = query.overlaps('department_ids', departmentIds);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/calendar-events
// department_ids is ALWAYS derived server-side from the creating chair's
// own department(s) — never trusted from the request body. Letting the
// client specify which department(s) an event posts to would let a
// chair (or a modified request) post into a department they don't own.
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'department_chair') {
    return res.status(403).json({ error: 'Only Department Chairs can create calendar events.' });
  }

  const { title, description, event_date, event_type, status } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Event title is required.' });
  }
  if (!event_date) {
    return res.status(400).json({ error: 'Event date is required.' });
  }
  if (event_type !== null && event_type !== undefined && !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: 'Invalid event_type.' });
  }

  const departmentIds = await getDepartmentIdsForUser(req);
  if (departmentIds.length === 0) {
    return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: String(title).trim(),
      description: description || null,
      event_date,
      department_ids: departmentIds,
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
// A chair may only delete events that were posted to (all of) their own
// department(s) — same overlap check as the GET route, just applied
// before allowing the delete.
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'department_chair') {
    const departmentIds = await getDepartmentIdsForUser(req);

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('department_ids')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const eventDepartmentIds = existing.department_ids ?? [];
    const hasOverlap = eventDepartmentIds.some((d) => departmentIds.includes(d));
    if (!hasOverlap) {
      return res.status(403).json({ error: 'You can only manage events for your own department(s).' });
    }
  }

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