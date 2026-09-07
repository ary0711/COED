// routes/calendarEvents.js
//
// Handles reads and writes to public.calendar_events, scoped by
// department and audience (alumni, students, faculty, all).
// Writes run under the service role client after the JWT has been verified.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Looks up the department_id(s) for a given user based on their role
async function getDepartmentIdsForUser(req) {
  const userId = req.user.userId || req.user.id;

  if (req.user.role === 'department_chair') {
    return req.user.departmentIds ?? [];
  }

  if (req.user.role === 'faculty') {
    const { data } = await supabase
      .from('faculty_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  if (req.user.role === 'student') {
    const { data } = await supabase
      .from('student_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  // Alumni department resolution from alumni_profiles
  if (req.user.role === 'alumni') {
    const { data } = await supabase
      .from('alumni_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  return [];
}

// GET /api/calendar-events
router.get('/', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();

  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  // 1. ALUMNI: Only see events intended for alumni (or all) within their department or college-wide
  if (userRole === 'alumni') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', ['alumni', 'all']);

    if (departmentIds.length > 0) {
      query = query.or(
        `department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`
      );
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 2. STUDENTS: Only see events intended for students (or all) within their department or college-wide
  if (userRole === 'student') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', ['students', 'all']);

    if (departmentIds.length > 0) {
      query = query.or(
        `department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`
      );
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 3. FACULTY / DEPARTMENT CHAIRS
  if (userRole === 'faculty' || userRole === 'department_chair') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', ['faculty', 'students', 'all', 'alumni']);

    if (departmentIds.length > 0) {
      query = query.or(
        `department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`
      );
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 4. DEAN / ADMIN: Full college visibility
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// POST /api/calendar-events
router.post('/', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();
  const isChair = userRole === 'department_chair';
  const isDeanOrAdmin = ['dean', 'admin', 'college_dean', 'college dean'].includes(userRole);

  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Only Department Chairs or the Dean can create calendar events.' });
  }

  const {
    title,
    description,
    event_date,
    location,
    event_type,
    audience,
    status,
    target_department_id,
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Event title is required.' });
  }
  if (!event_date) {
    return res.status(400).json({ error: 'Event date is required.' });
  }

  // 1. Resolve a valid profiles.id for organizer_id to prevent foreign key violations
  let validOrganizerId = null;
  const userLookupId = req.user.profileId || req.user.userId || req.user.id;
  const userLookupNumber = req.user.idNumber;

  if (userLookupId || userLookupNumber) {
    let profileQuery = supabase.from('profiles').select('id');
    if (userLookupId) {
      profileQuery = profileQuery.or(`id.eq.${userLookupId}`);
    } else if (userLookupNumber) {
      profileQuery = profileQuery.eq('id_number', userLookupNumber);
    }

    const { data: profileRecord } = await profileQuery.maybeSingle();
    if (profileRecord?.id) {
      validOrganizerId = profileRecord.id;
    }
  }

  // 2. Department scoping logic
  let department_ids = null;
  if (isChair) {
    department_ids = await getDepartmentIdsForUser(req);
    if (!department_ids || department_ids.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned.' });
    }
  } else if (target_department_id) {
    department_ids = [target_department_id];
  }

  // 3. Insert into calendar_events
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      event_date,
      location: location ? String(location).trim() : null,
      event_type: event_type ? String(event_type).trim().toLowerCase() : 'activity',
      audience: audience || 'all',
      status: status || 'upcoming',
      department_ids,
      organizer_id: validOrganizerId,
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
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user.role || '').toLowerCase();

  if (userRole === 'department_chair') {
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