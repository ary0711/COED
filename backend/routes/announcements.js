const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Resolves the department_id(s) the requester is scoped to, mirroring
// calendarEvents.js's getDepartmentIdsForUser exactly, so eligibility
// is judged the same way everywhere in the app — no separate,
// possibly-inconsistent scoping logic per feature.
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
  return [];
}

// Looks up user_id lists for student/faculty within given department_ids
// (or all, if departmentIds is null), used to fan out notifications.
async function getRecipientUserIds(role, departmentIds) {
  const table = role === 'student' ? 'student_profiles' : role === 'faculty' ? 'faculty_profiles' : null;
  if (!table) return [];

  let query = supabase.from(table).select('user_id');
  if (departmentIds && departmentIds.length > 0) {
    query = query.in('department_id', departmentIds);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(r => r.user_id);
}

// GET /api/announcements
router.get('/', authenticate, async (req, res) => {
  const role = req.user.role;
  const isPrivileged = role === 'dean' || role === 'admin';

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  if (isPrivileged) return res.json(announcements ?? []);

  const myDepartmentIds = await getDepartmentIdsForUser(req);

  const eligible = (announcements ?? []).filter(a => {
    const roleOk = !a.target_role || !Array.isArray(a.target_role) || a.target_role.length === 0 || a.target_role.includes(role);
    if (!roleOk) return false;
    if (!a.target_department_id) return true; // no department restriction
    return myDepartmentIds.includes(a.target_department_id);
  });

  return res.json(eligible);
});

// POST /api/announcements
router.post('/', authenticate, async (req, res) => {
  const { title, content, expires_at, is_pinned } = req.body;
  let { target_role, target_department_id } = req.body;

  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required.' });
  if (!content || !String(content).trim()) return res.status(400).json({ error: 'Content is required.' });

  const isChair = req.user.role === 'department_chair';
  const isDeanOrAdmin = req.user.role === 'dean' || req.user.role === 'admin';
  if (!isChair && !isDeanOrAdmin) {
    return res.status(403).json({ error: 'Only the Dean/Admin or a Department Chair can post announcements.' });
  }

  // Chairs can ONLY post to faculty in their own department — never
  // trusted from the request body, always derived server-side.
  if (isChair) {
    const chairDeptIds = req.user.departmentIds ?? [];
    if (chairDeptIds.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned.' });
    }
    target_role = ['faculty', 'student'];
    target_department_id = chairDeptIds[0]; // primary department; notifications below use the full list
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title: String(title).trim(),
      content: String(content).trim(),
      expires_at: expires_at || null,
      is_pinned: is_pinned ?? false,
      target_role: target_role || null,
      target_department_id: target_department_id || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // ── Fan out notifications server-side (never client-side) ──
  const rolesToNotify = (target_role && target_role.length > 0 ? target_role : ['student', 'faculty'])
    .filter(r => r === 'student' || r === 'faculty');

  const departmentScope = isChair ? (req.user.departmentIds ?? []) : (target_department_id ? [target_department_id] : null);

  const notifications = [];
  for (const role of rolesToNotify) {
    const userIds = await getRecipientUserIds(role, departmentScope);
    for (const userId of userIds) {
      notifications.push({
        user_id: userId,
        title: announcement.title,
        message: announcement.content,
        type: 'announcement',
        reference_id: announcement.id,
        reference_table: 'announcements',
        is_read: false,
      });
    }
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications); // best-effort; announcement itself already saved
  }

  return res.status(201).json(announcement);
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

module.exports = router;