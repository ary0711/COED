const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Resolves the department_id(s) the requester is scoped to
async function getDepartmentIdsForUser(req) {
  if (req.user.role === 'department_chair') {
    return req.user.departmentIds ?? [];
  }
  if (req.user.role === 'faculty') {
    const { data } = await supabase.from('faculty_profiles').select('department_id').eq('user_id', req.user.userId).single();
    return data?.department_id ? [data.department_id] : [];
  }
  if (req.user.role === 'student') {
    const { data } = await supabase.from('student_profiles').select('department_id').eq('user_id', req.user.userId).single();
    return data?.department_id ? [data.department_id] : [];
  }
  if (req.user.role === 'alumni') {
    const { data } = await supabase.from('alumni_profiles').select('department_id').eq('user_id', req.user.userId).single();
    return data?.department_id ? [data.department_id] : [];
  }
  return [];
}

// Looks up user_id lists for student/faculty/alumni within given department_ids
async function getRecipientUserIds(role, departmentIds) {
  const tableMap = {
    student: 'student_profiles',
    faculty: 'faculty_profiles',
    alumni: 'alumni_profiles',
  };
  const table = tableMap[role];
  if (!table) return [];

  let query = supabase.from(table).select('user_id');
  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(r => r.user_id);
}

const ROLE_DISPLAY_LABEL = {
  dean: 'Dean',
  admin: 'Admin',
  department_chair: 'Dept. Chair',
};

// GET /api/announcements
router.get('/', authenticate, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.userId;
  const isPrivileged = role === 'dean' || role === 'admin';

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (isPrivileged) return res.json(announcements ?? []);

  const myDepartmentIds = await getDepartmentIdsForUser(req);

  const eligible = (announcements ?? []).filter(a => {
    // 1. Author exemption: The author MUST ALWAYS see their own posted announcement!
    if (a.created_by && a.created_by === userId) return true;

    // 2. Role matching
    const roleOk = !a.target_role || !Array.isArray(a.target_role) || a.target_role.length === 0 || a.target_role.includes(role);
    if (!roleOk) return false;

    // 3. Department matching: null = College-Wide
    if (!a.target_department_id) return true;

    // Department-restricted: user's department must match
    return myDepartmentIds.includes(a.target_department_id);
  });

  return res.json(eligible);
});

// POST /api/announcements
router.post('/', authenticate, async (req, res) => {
  // 1. Extract from req.body FIRST before any validation
  const { title, content, expires_at, is_pinned, event_date, start_time, end_time } = req.body;
  let { target_role, target_department_id } = req.body;

  // 2. Validation checks
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required.' });
  if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required.' });
  if (!event_date) return res.status(400).json({ error: 'Announcement date is required.' });

  const todayStr = new Date().toISOString().split('T')[0];
  if (event_date < todayStr) {
    return res.status(400).json({ error: 'Announcement date cannot be in the past.' });
  }

  if (start_time && end_time && start_time > end_time) {
    return res.status(400).json({ error: 'End time cannot be earlier than start time.' });
  }

  const isChair = req.user.role === 'department_chair';
  const isDeanOrAdmin = req.user.role === 'dean' || req.user.role === 'admin';
  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Only the Dean/Admin or a Department Chair can post announcements.' });
  }

  // Chairs can ONLY broadcast to their assigned department (derived securely server-side)
  if (isChair) {
    const chairDeptIds = req.user.departmentIds ?? [];
    if (chairDeptIds.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned.' });
    }
    target_department_id = chairDeptIds[0];
    
    // Validate that the chair provided at least one recipient
    if (!Array.isArray(target_role) || target_role.length === 0) {
      return res.status(400).json({ error: 'Please select at least one recipient role.' });
    }
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title: String(title).trim(),
      content: String(content).trim(),
      event_date: event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      expires_at: expires_at || null,
      is_pinned: is_pinned ?? false,
      target_role: target_role || null,
      target_department_id: target_department_id || null,
      posted_by_role: req.user.role,
      created_by: req.user.userId,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // ── Fan out notifications server-side ──
  const rolesToNotify = (target_role && target_role.length > 0 ? target_role : ['student', 'faculty', 'alumni'])
    .filter(r => ['student', 'faculty', 'alumni'].includes(r));

  const departmentScope = isChair 
    ? (req.user.departmentIds ?? []) 
    : (target_department_id ? [target_department_id] : null);

  const posterLabel = ROLE_DISPLAY_LABEL[req.user.role] ?? req.user.role;

  const notifications = [];
  for (const role of rolesToNotify) {
    const userIds = await getRecipientUserIds(role, departmentScope);
    for (const userId of userIds) {
      notifications.push({
        user_id: userId,
        title: `${announcement.title} (from ${posterLabel})`,
        message: announcement.content,
        type: 'announcement',
        reference_id: announcement.id,
        reference_table: 'announcements',
        is_read: false,
      });
    }
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }

  return res.status(201).json(announcement);
});

// PUT /api/announcements/:id - Edit Announcement
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, content, expires_at, is_pinned, event_date, start_time, end_time } = req.body;
  let { target_role, target_department_id } = req.body;

  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required.' });
  if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required.' });
  if (!event_date) return res.status(400).json({ error: 'Announcement date is required.' });

  if (start_time && end_time && start_time > end_time) {
    return res.status(400).json({ error: 'End time cannot be earlier than start time.' });
  }

  // 1. Fetch current announcement record
  const { data: existing, error: fetchErr } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return res.status(404).json({ error: 'Announcement not found.' });
  }

  const isChair = req.user.role === 'department_chair';
  const isDeanOrAdmin = req.user.role === 'dean' || req.user.role === 'admin';

  // 2. Enforce authorization & ownership
  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Not authorized to edit announcements.' });
  }

  if (isChair) {
    const chairDeptIds = req.user.departmentIds ?? [];
    // Chair must own the announcement or it must belong to their controlled department
    const isOwner = existing.created_by === req.user.userId;
    const isDeptMatch = chairDeptIds.includes(existing.target_department_id);

    if (!isOwner && !isDeptMatch) {
      return res.status(403).json({ error: 'You do not have permission to edit this announcement.' });
    }

    // Lock the department scope to the Chair's assigned department
    target_department_id = existing.target_department_id || chairDeptIds[0];
  }

  // 3. Update announcement record
  const { data: updated, error: updateErr } = await supabase
    .from('announcements')
    .update({
      title: String(title).trim(),
      content: String(content).trim(),
      event_date: event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      expires_at: expires_at || null,
      is_pinned: is_pinned ?? existing.is_pinned,
      target_role: target_role || null,
      target_department_id: isDeanOrAdmin ? (target_department_id || null) : target_department_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.json(updated);
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const isChair = req.user.role === 'department_chair';
  const isDeanOrAdmin = req.user.role === 'dean' || req.user.role === 'admin';

  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Not authorized to delete announcements.' });
  }

  // Chairs can ONLY delete announcements they personally posted
  if (isChair) {
    const { data: existing } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existing || existing.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete announcements that you personally created.' });
    }
  }

  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

module.exports = router;