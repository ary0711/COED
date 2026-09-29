// routes/notifications.js
//
// Authenticated read / mark-read for the shared notifications table,
// plus Dean/Admin targeted sending.
// (This app uses custom JWT auth, not real Supabase Auth sessions, so all
//  notification writes for OTHER users must go through this backend.)

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// ── helpers ──────────────────────────────────────────────────
const PREF_COLUMN = {
  announcement: 'announcements',
  inquiry: 'inquiries',
  report: 'reports',
  staff_update: 'staff_updates',
  system: 'system_notifs',
};
const SENDABLE_ROLES = ['student', 'alumni', 'faculty', 'department_chair', 'chair', 'staff'];

const chunk = (arr, n = 100) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const asArray = (v) => (Array.isArray(v) ? v : []);

const isDeanOrAdmin = (req) => ['dean', 'admin'].includes(req.user.role);

// Some accounts (e.g. the Dean) have a different id in `users` than in `profiles`.
// Notifications are keyed by profiles.id, so always match on BOTH ids.
async function ownIds(req) {
  const ids = new Set([req.user.userId]);
  if (req.user.profileId) {
    ids.add(req.user.profileId);
  } else if (req.user.email) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', String(req.user.email).toLowerCase())
      .maybeSingle();
    if (data?.id) ids.add(data.id);
  }
  return [...ids].filter(Boolean);
}

// Resolve the audience (roles + optional program/department + specific accounts)
async function resolveRecipients({ roles, departments, user_ids }, senderIds) {
  const validRoles = asArray(roles).filter((r) => SENDABLE_ROLES.includes(r));
  const wanted = new Set(asArray(departments).map((d) => String(d).toLowerCase()));
  const recipients = new Set();

  if (validRoles.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, department, program')
      .in('role', validRoles)
      .eq('status', 'active');
    if (error) return { error };

    (data ?? []).forEach((p) => {
      const match =
        wanted.size === 0 ||
        wanted.has(String(p.program || '').toLowerCase()) ||
        wanted.has(String(p.department || '').toLowerCase());
      if (match) recipients.add(p.id);
    });
  }

  for (const ids of chunk(asArray(user_ids))) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .in('id', ids)
      .eq('status', 'active');
    if (error) return { error };
    (data ?? []).forEach((p) => recipients.add(p.id));
  }

  asArray(senderIds).forEach((id) => recipients.delete(id));
  return { ids: [...recipients], hasTargets: validRoles.length > 0 || asArray(user_ids).length > 0 };
}

// Split recipients into allowed / muted using notification_preferences
async function applyPreferences(ids, prefColumn) {
  const muted = new Set();
  for (const part of chunk(ids)) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select(`user_id, allow_all, ${prefColumn}`)
      .in('user_id', part);
    if (error) return { error };
    (data ?? []).forEach((p) => {
      if (p.allow_all === false || p[prefColumn] === false) muted.add(p.user_id);
    });
  }
  return { allowed: ids.filter((id) => !muted.has(id)), muted: muted.size };
}

// ── GET /api/notifications ───────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const ids = await ownIds(req);
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .in('user_id', ids)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// ── PATCH /api/notifications/read-all ────────────────────────
router.patch('/read-all', authenticate, async (req, res) => {
  const ids = await ownIds(req);
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('user_id', ids)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── PATCH /api/notifications/:id/read ────────────────────────
router.patch('/:id/read', authenticate, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: 'Notification not found.' });
  const ids = await ownIds(req);
  if (!ids.includes(existing.user_id)) {
    return res.status(403).json({ error: "You cannot modify another user's notification." });
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ── POST /api/notifications/preview  (Dean / Admin only) ─────
// Returns how many people would receive the notification, without sending.
router.post('/preview', authenticate, async (req, res) => {
  if (!isDeanOrAdmin(req)) {
    return res.status(403).json({ error: 'Only the Dean or Admin can send notifications.' });
  }

  const { type = 'announcement' } = req.body;
  const prefColumn = PREF_COLUMN[type];
  if (!prefColumn) return res.status(400).json({ error: 'Invalid notification type.' });

  const resolved = await resolveRecipients(req.body, await ownIds(req));
  if (resolved.error) return res.status(500).json({ error: resolved.error.message });

  const prefs = await applyPreferences(resolved.ids, prefColumn);
  if (prefs.error) return res.status(500).json({ error: prefs.error.message });

  return res.json({ total: resolved.ids.length, willReceive: prefs.allowed.length, muted: prefs.muted });
});

// ── POST /api/notifications/send  (Dean / Admin only) ────────
router.post('/send', authenticate, async (req, res) => {
  if (!isDeanOrAdmin(req)) {
    return res.status(403).json({ error: 'Only the Dean or Admin can send notifications.' });
  }

  const { title, message, type = 'announcement' } = req.body;
  const prefColumn = PREF_COLUMN[type];

  if (!String(title || '').trim() || !String(message || '').trim()) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }
  if (!prefColumn) return res.status(400).json({ error: 'Invalid notification type.' });

  const resolved = await resolveRecipients(req.body, await ownIds(req));
  if (resolved.error) return res.status(500).json({ error: resolved.error.message });
  if (!resolved.hasTargets) {
    return res.status(400).json({ error: 'Choose at least one recipient group or account.' });
  }
  if (resolved.ids.length === 0) return res.json({ success: true, sent: 0, muted: 0 });

  const prefs = await applyPreferences(resolved.ids, prefColumn);
  if (prefs.error) return res.status(500).json({ error: prefs.error.message });

  const rows = prefs.allowed.map((id) => ({
    user_id: id,
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    is_read: false,
  }));

  for (const part of chunk(rows, 500)) {
    const { error } = await supabase.from('notifications').insert(part);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true, sent: rows.length, muted: prefs.muted });
});

module.exports = router;