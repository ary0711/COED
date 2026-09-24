// routes/calendarEvents.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const PROGRAM_TO_DEPARTMENT = {
  'BEEd': '41fffef4-b5fc-4bdf-8a30-1a53097113c7',
  'BTLEd': '428c2fc6-cca9-49ae-88c7-1c74232d2e30',
  'BSEd-Math': '46bb2177-22f3-43d1-9e01-de0964d539b3',
  'BSEd-English': '46bb2177-22f3-43d1-9e01-de0964d539b3',
};

// Robust department lookup for all user roles
async function getDepartmentIdsForUser(req) {
  const userId = req.user.userId || req.user.id;
  const userRole = (req.user.role || '').toLowerCase();

  if (userRole === 'department_chair') {
    if (Array.isArray(req.user.departmentIds) && req.user.departmentIds.length > 0) {
      return req.user.departmentIds;
    }

    if (req.user.department && PROGRAM_TO_DEPARTMENT[req.user.department]) {
      return [PROGRAM_TO_DEPARTMENT[req.user.department]];
    }

    if (Array.isArray(req.user.departmentNames) && req.user.departmentNames.length > 0) {
      const { data: deptRows } = await supabase
        .from('departments')
        .select('id')
        .in('name', req.user.departmentNames);
      if (deptRows && deptRows.length > 0) {
        return deptRows.map((d) => d.id);
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.department && PROGRAM_TO_DEPARTMENT[profile.department]) {
      return [PROGRAM_TO_DEPARTMENT[profile.department]];
    }

    return [];
  }

  if (userRole === 'faculty') {
    const { data } = await supabase
      .from('faculty_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  if (userRole === 'student') {
    const { data } = await supabase
      .from('student_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  if (userRole === 'alumni') {
    const { data } = await supabase
      .from('alumni_profiles')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.department_id ? [data.department_id] : [];
  }

  return [];
}

// Normalized audience lists (supporting case and plural variations)
const ALUMNI_AUDIENCES = ['alumni', 'Alumni', 'all', 'All', 'everyone', 'Everyone'];
const STUDENT_AUDIENCES = ['students', 'student', 'Students', 'Student', 'all', 'All', 'everyone', 'Everyone'];
const FACULTY_AUDIENCES = ['faculty', 'Faculty', 'all', 'All', 'everyone', 'Everyone'];

// GET /api/calendar-events
router.get('/', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();

  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  // 1. ALUMNI: STRICTLY Alumni & All/Everyone within their department or college-wide
  if (userRole === 'alumni') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', ['alumni', 'Alumni', 'all', 'All', 'everyone', 'Everyone']);

    if (departmentIds.length > 0) {
      query = query.or(`department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`);
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 2. STUDENTS: STRICTLY Student-targeted or All/Everyone events within their department or college-wide
  if (userRole === 'student') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', ['students', 'student', 'Students', 'Student', 'all', 'All', 'everyone', 'Everyone']);

    if (departmentIds.length > 0) {
      query = query.or(`department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`);
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 3. FACULTY: STRICTLY Faculty & All/Everyone within their department or college-wide
  // (Alumni-only and Student-only events are completely blocked from Faculty)
  if (userRole === 'faculty') {
    const departmentIds = await getDepartmentIdsForUser(req);
    query = query.in('audience', FACULTY_AUDIENCES);

    if (departmentIds.length > 0) {
      query = query.or(`department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`);
    } else {
      query = query.is('department_ids', null);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 4. DEPARTMENT CHAIR:
  // - Can see ANY event they created personally (organizer_id == chair's ID)
  // - Can see Dean/Admin events ONLY if intended for Faculty or All (NOT Student-only or Alumni-only)
  if (userRole === 'department_chair') {
    const departmentIds = await getDepartmentIdsForUser(req);
    const chairLookupId = req.user.profileId || req.user.userId || req.user.id;

    // Scope to Chair's department or college-wide events
    if (departmentIds.length > 0) {
      query = query.or(`department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`);
    } else {
      query = query.is('department_ids', null);
    }

    // Audience filter:
    // Either the Chair is the creator (organizer_id.eq.USER_ID),
    // OR the event audience allows faculty/everyone (audience.in.(faculty,all,everyone))
    const allowedChairAudiences = 'faculty,Faculty,all,All,everyone,Everyone';
    if (chairLookupId) {
      query = query.or(`organizer_id.eq.${chairLookupId},audience.in.(${allowedChairAudiences})`);
    } else {
      query = query.in('audience', ['faculty', 'Faculty', 'all', 'All', 'everyone', 'Everyone']);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // 5. DEAN / ADMIN: Full college visibility
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

  // Safe organizer_id lookup
  let validOrganizerId = null;
  const lookupId = req.user.profileId || req.user.userId || req.user.id;
  if (lookupId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', lookupId)
      .maybeSingle();
    if (prof) validOrganizerId = prof.id;
  }

  // Department assignment
  let department_ids = null;
  if (isChair) {
    department_ids = await getDepartmentIdsForUser(req);
    if (!department_ids || department_ids.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned. Contact administrator.' });
    }
  } else if (target_department_id) {
    department_ids = [target_department_id];
  }

  // Normalize audience value to lowercase string
  const normalizedAudience = (audience || 'all').trim().toLowerCase();

  const insertPayload = {
    title: String(title).trim(),
    description: description ? String(description).trim() : null,
    event_date,
    location: location ? String(location).trim() : null,
    event_type: event_type ? String(event_type).trim().toLowerCase() : 'activity',
    audience: normalizedAudience,
    status: status || 'upcoming',
    department_ids,
    organizer_id: validOrganizerId,
    posted_by_role: req.user.role,
  };

  const { data, error } = await supabase
    .from('calendar_events')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating calendar event:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
});

// PUT /api/calendar-events/:id
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user.role || '').toLowerCase();
  const isChair = userRole === 'department_chair';
  const isDeanOrAdmin = ['dean', 'admin', 'college_dean', 'college dean'].includes(userRole);

  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Only Department Chairs or the Dean can edit calendar events.' });
  }

  if (isChair) {
    const chairDeptIds = await getDepartmentIdsForUser(req);
    const userId = req.user.userId || req.user.id;
    const profileId = req.user.profileId;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('department_ids, posted_by_role, organizer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const isOwner = existing.organizer_id === userId || (profileId && existing.organizer_id === profileId);
    if (!isOwner) {
      return res.status(403).json({ error: 'You can only edit events that you posted.' });
    }

    const eventDepartmentIds = existing.department_ids ?? [];
    const hasOverlap = eventDepartmentIds.some((d) => chairDeptIds.includes(d));
    if (!hasOverlap) {
      return res.status(403).json({ error: 'You can only edit events for your own department(s).' });
    }
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

  let department_ids = null;
  if (isChair) {
    department_ids = await getDepartmentIdsForUser(req);
  } else if (target_department_id) {
    department_ids = [target_department_id];
  }

  const updatePayload = {
    title: String(title).trim(),
    description: description ? String(description).trim() : null,
    event_date,
    location: location ? String(location).trim() : null,
    event_type: event_type ? String(event_type).trim().toLowerCase() : 'activity',
    audience: (audience || 'all').trim().toLowerCase(),
    status: status || 'upcoming',
    department_ids,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating calendar event:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

// DELETE /api/calendar-events/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user.role || '').toLowerCase();
  const isChair = userRole === 'department_chair';

  if (isChair) {
    const chairDeptIds = await getDepartmentIdsForUser(req);
    const userId = req.user.userId || req.user.id;
    const profileId = req.user.profileId;

    const { data: existing, error: fetchError } = await supabase
      .from('calendar_events')
      .select('department_ids, posted_by_role, organizer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const isOwner = existing.organizer_id === userId || (profileId && existing.organizer_id === profileId);
    if (!isOwner) {
      return res.status(403).json({ error: 'You can only delete events that you posted.' });
    }

    const eventDepartmentIds = existing.department_ids ?? [];
    const hasOverlap = eventDepartmentIds.some((d) => chairDeptIds.includes(d));
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