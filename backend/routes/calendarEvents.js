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
  // NEW — students are scoped to their own approved program's department.
  if (req.user.role === 'student') {
    const { data, error } = await supabase
      .from('student_profiles')
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
  const isScoped = ['department_chair', 'faculty', 'student'].includes(req.user.role);

  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  if (isScoped) {
  const departmentIds = await getDepartmentIdsForUser(req);
  if (departmentIds.length === 0) {
    return res.json([]);
  }
  // Match events scoped to (at least one of) the user's own department(s),
  // OR events with no department restriction at all (department_ids null
  // means "all departments" — e.g. a dean-wide announcement).
  query = query.or(
    `department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`
  );
}
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/calendar-events
// - department_chair: department_ids is ALWAYS derived server-side from
//   the creating chair's own department(s) — never trusted from the
//   request body, same as before.
// - dean/admin: MAY target a single specific department by id, or leave
//   it targeting all departments (department_ids = null, meaning "no
//   restriction" — matches how the GET route already treats an
//   unscoped/dean/admin request: no overlap filter applied at all).
router.post('/', authenticate, async (req, res) => {
  const isChair = req.user.role === 'department_chair';
  const isDeanOrAdmin = req.user.role === 'dean' || req.user.role === 'admin';

  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Only Department Chairs or the Dean can create calendar events.' });
  }

  const { title, description, event_date, event_type, status, target_department_id } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Event title is required.' });
  }
  if (!event_date) {
    return res.status(400).json({ error: 'Event date is required.' });
  }
  if (event_type !== null && event_type !== undefined && !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: 'Invalid event_type.' });
  }

  let department_ids;

  if (isChair) {
    // Unchanged from before: a chair can never choose — always their own.
    department_ids = await getDepartmentIdsForUser(req);
    if (department_ids.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
    }
  } else {
    // Dean/admin: either target one specific real department, or null
    // (visible to everyone, matching the GET route's unscoped case).
    if (target_department_id) {
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('id', target_department_id)
        .maybeSingle();

      if (deptError) {
        return res.status(500).json({ error: deptError.message });
      }
      if (!dept) {
        return res.status(400).json({ error: 'Invalid target_department_id.' });
      }
      department_ids = [target_department_id];
    } else {
      department_ids = null; // no restriction — everyone sees it
    }
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: String(title).trim(),
      description: description || null,
      event_date,
      department_ids,
      event_type: event_type || null,
      status: status || 'upcoming',
      posted_by_role: req.user.role,
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