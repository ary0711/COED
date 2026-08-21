// routes/announcements.js
//
// Writes AND reads both go through here now. Reads used to happen via
// the anon Supabase client directly from the frontend, which meant no
// server-side eligibility check was possible. Eligibility (role +
// department) is now computed here, from the verified JWT — never
// trusted from a query param — so a user can't retrieve another
// program's announcement by editing the request.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// GET /api/announcements
// Every authenticated role gets only the announcements they're
// eligible for. Dean/admin see everything (they manage announcements).
router.get('/', authenticate, async (req, res) => {
  const role = req.user.role;
  const isPrivileged = role === 'dean' || role === 'admin';

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (isPrivileged) {
    return res.json(announcements ?? []);
  }

  // Collect this user's department name(s), normalized. Chairs carry
  // departmentNames (array) from the JWT; everyone else carries a
  // single free-text `department` field from their profile.
  const userDeptNames = new Set();
  if (Array.isArray(req.user.departmentNames)) {
    req.user.departmentNames.forEach(n => userDeptNames.add(String(n).trim().toLowerCase()));
  }
  if (req.user.department) {
    userDeptNames.add(String(req.user.department).trim().toLowerCase());
  }

  // Resolve target_department_id -> department name for any announcements
  // that target a specific department, so we can compare names.
  const deptIds = [...new Set((announcements ?? [])
    .map(a => a.target_department_id)
    .filter(Boolean))];

  let deptNameById = new Map();
  if (deptIds.length > 0) {
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', deptIds);

    if (deptError) {
      return res.status(500).json({ error: deptError.message });
    }
    (depts ?? []).forEach(d => deptNameById.set(d.id, String(d.name).trim().toLowerCase()));
  }

  const eligible = (announcements ?? []).filter(a => {
    // Role check: null/empty target_role = everyone.
    const roleOk = !a.target_role || !Array.isArray(a.target_role) || a.target_role.length === 0
      || a.target_role.includes(role);
    if (!roleOk) return false;

    // Department check: null target_department_id = no department restriction.
    if (!a.target_department_id) return true;

    const targetDeptName = deptNameById.get(a.target_department_id);
    if (!targetDeptName) return false; // department missing/deleted — fail closed
    return userDeptNames.has(targetDeptName);
  });

  return res.json(eligible);
});

// POST /api/announcements
router.post('/', authenticate, async (req, res) => {
  const { title, content, expires_at, is_pinned, target_role, target_department_id } = req.body;

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
      target_department_id: target_department_id || null,
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