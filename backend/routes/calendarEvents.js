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

const FACULTY_AUDIENCES = ['faculty', 'Faculty', 'all', 'All', 'everyone', 'Everyone'];
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
const chunk = (arr, size = 100) => {
  const result = [];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
};

async function notifyFacultyAboutEvent(event, senderIds = []) {
  try {
    const audience = String(event.audience || '').toLowerCase();

    // Only send faculty notifications for these audiences
    const shouldNotifyFaculty = [
      'faculty',
      'all',
      'everyone',
    ].includes(audience);

    if (!shouldNotifyFaculty) {
      return {
        sent: 0,
        muted: 0,
      };
    }

    // Get active faculty accounts
    let facultyQuery = supabase
      .from('profiles')
      .select('id')
      .eq('role', 'faculty')
      .eq('status', 'active');

    const { data: facultyProfiles, error: facultyError } = await facultyQuery;

    if (facultyError) {
      console.error('Error loading faculty for event notification:', facultyError);
      return {
        sent: 0,
        muted: 0,
      };
    }

    const facultyIds = new Set(
      (facultyProfiles || [])
        .map((faculty) => faculty.id)
        .filter(Boolean)
    );

    // If the event is department-specific, find faculty
    // belonging to those departments.
    if (
      Array.isArray(event.department_ids) &&
      event.department_ids.length > 0
    ) {
      const { data: departmentFaculty, error: departmentFacultyError } =
        await supabase
          .from('faculty_profiles')
          .select('user_id, department_id')
          .in('department_id', event.department_ids);

      if (departmentFacultyError) {
        console.error(
          'Error loading department faculty:',
          departmentFacultyError
        );

        return {
          sent: 0,
          muted: 0,
        };
      }

      const departmentFacultyIds = new Set(
        (departmentFaculty || [])
          .map((faculty) => faculty.user_id)
          .filter(Boolean)
      );

      // Keep only faculty from the selected departments
      for (const id of [...facultyIds]) {
        if (!departmentFacultyIds.has(id)) {
          facultyIds.delete(id);
        }
      }
    }

    // Don't notify the event creator
    for (const senderId of senderIds) {
      facultyIds.delete(senderId);
    }

    const ids = [...facultyIds];

    if (ids.length === 0) {
      return {
        sent: 0,
        muted: 0,
      };
    }

    // Check notification preferences
    const mutedIds = new Set();

    for (const idsChunk of chunk(ids)) {
      const { data: preferences, error: preferenceError } =
        await supabase
          .from('notification_preferences')
          .select('user_id, allow_all, calendar')
          .in('user_id', idsChunk);

      if (preferenceError) {
        console.error(
          'Error loading faculty notification preferences:',
          preferenceError
        );

        continue;
      }

      for (const pref of preferences || []) {
        if (
          pref.allow_all === false ||
          pref.calendar === false
        ) {
          mutedIds.add(pref.user_id);
        }
      }
    }

    const allowedIds = ids.filter((id) => !mutedIds.has(id));

    if (allowedIds.length === 0) {
      return {
        sent: 0,
        muted: mutedIds.size,
      };
    }

    const timeText =
      event.start_time
        ? ` at ${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`
        : '';

    const locationText = event.location
      ? ` • ${event.location}`
      : '';

    const notificationRows = allowedIds.map((facultyId) => ({
      user_id: facultyId,
      title: `New Calendar Event: ${event.title}`,
      message: `${event.title} is scheduled on ${event.event_date}${timeText}${locationText}.`,
      type: 'calendar',
      reference_id: event.id,
      reference_table: 'calendar_events',
      is_read: false,
    }));

    for (const rows of chunk(notificationRows)) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(rows);

      if (notificationError) {
        console.error(
          'Error creating faculty event notifications:',
          notificationError
        );
      }
    }

    return {
      sent: allowedIds.length,
      muted: mutedIds.size,
    };
  } catch (error) {
    console.error(
      'Unexpected error sending faculty event notifications:',
      error
    );

    return {
      sent: 0,
      muted: 0,
    };
  }
}
// GET /api/calendar-events
router.get('/', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();

  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false });

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

  if (userRole === 'department_chair') {
    const departmentIds = await getDepartmentIdsForUser(req);
    const chairLookupId = req.user.profileId || req.user.userId || req.user.id;
    if (departmentIds.length > 0) {
      query = query.or(`department_ids.is.null,department_ids.ov.{${departmentIds.join(',')}}`);
    } else {
      query = query.is('department_ids', null);
    }
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
    start_time,
    end_time,
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

  let validatedStartTime = null;
  if (start_time !== undefined && start_time !== null && String(start_time).trim() !== '') {
    const trimmed = String(start_time).trim();
    if (!TIME_REGEX.test(trimmed)) {
      return res.status(400).json({ error: 'Invalid start time format. Use HH:MM.' });
    }
    validatedStartTime = trimmed;
  }

  let validatedEndTime = null;
  if (end_time !== undefined && end_time !== null && String(end_time).trim() !== '') {
    const trimmed = String(end_time).trim();
    if (!TIME_REGEX.test(trimmed)) {
      return res.status(400).json({ error: 'Invalid end time format. Use HH:MM.' });
    }
    validatedEndTime = trimmed;
  }

  if (validatedStartTime && validatedEndTime && validatedEndTime <= validatedStartTime) {
    return res.status(400).json({ error: 'End time must be later than start time.' });
  }

  let validOrganizerId = null;
  const lookupId = req.user.profileId || req.user.userId || req.user.id;
  if (lookupId) {
    const { data: prof } = await supabase.from('profiles').select('id').eq('id', lookupId).maybeSingle();
    if (prof) validOrganizerId = prof.id;
  }

  let department_ids = null;
  if (isChair) {
    department_ids = await getDepartmentIdsForUser(req);
    if (!department_ids || department_ids.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned.' });
    }
  } else if (target_department_id) {
    department_ids = [target_department_id];
  }

  const insertPayload = {
    title: String(title).trim(),
    description: description ? String(description).trim() : null,
    event_date,
    start_time: validatedStartTime,
    end_time: validatedEndTime,
    location: location ? String(location).trim() : null,
    event_type: event_type ? String(event_type).trim().toLowerCase() : 'activity',
    audience: (audience || 'all').trim().toLowerCase(),
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

// Get the creator's possible profile IDs so the creator
// does not receive their own notification.
const senderIds = [
  req.user.profileId,
  req.user.userId,
  req.user.id,
].filter(Boolean);

// Send calendar notification to applicable faculty
const notificationResult = await notifyFacultyAboutEvent(
  data,
  senderIds
);

console.log('Faculty event notification result:', notificationResult);

return res.status(201).json({
  ...data,
  notification: notificationResult,
});
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
    start_time,
    end_time,
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

  let validatedStartTime = null;
  if (start_time !== undefined && start_time !== null && String(start_time).trim() !== '') {
    const trimmed = String(start_time).trim();
    if (!TIME_REGEX.test(trimmed)) {
      return res.status(400).json({ error: 'Invalid start time format. Use HH:MM.' });
    }
    validatedStartTime = trimmed;
  }

  let validatedEndTime = null;
  if (end_time !== undefined && end_time !== null && String(end_time).trim() !== '') {
    const trimmed = String(end_time).trim();
    if (!TIME_REGEX.test(trimmed)) {
      return res.status(400).json({ error: 'Invalid end time format. Use HH:MM.' });
    }
    validatedEndTime = trimmed;
  }

  if (validatedStartTime && validatedEndTime && validatedEndTime <= validatedStartTime) {
    return res.status(400).json({ error: 'End time must be later than start time.' });
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
    start_time: validatedStartTime,
    end_time: validatedEndTime,
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