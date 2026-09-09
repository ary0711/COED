// routes/extensionReports.js
//
// Used by BOTH the Faculty dashboard and the Department Chair dashboard —
// both render the same ExtensionReport.tsx component, just passing in
// their own userId/userName. Ownership here is scoped by submitted_by
// matching req.user.userId (from the JWT), so it works correctly for
// either role without any special-casing.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Only the Dean (or admin) may list all submissions or approve/reject them.
function requireDean(req, res, next) {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

// GET /api/extension-reports/my-draft
router.get('/my-draft', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('extension_reports')
    .select('*')
    .eq('submitted_by', req.user.userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? null);
});

// GET /api/extension-reports/mine
// Fixed: queries submitted_by to match the schema
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('extension_reports')
      .select('*')
      .eq('submitted_by', req.user.userId)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('extensionReports /mine error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.json(data || []);
  } catch (err) {
    console.error('extensionReports /mine catch:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/extension-reports?status=submitted
// Dean-only. Lists reports college-wide, optionally filtered by status.
router.get('/', authenticate, requireDean, async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from('extension_reports')
    .select('*')
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['submitted', 'approved', 'rejected']);
  }

  const { data: reports, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!reports || reports.length === 0) {
    return res.json([]);
  }

  const submitterIds = [...new Set(reports.map(r => r.submitted_by).filter(Boolean))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .in('id', submitterIds);

  if (profilesError) {
    return res.json(reports.map(r => ({ ...r, submitter: null })));
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const merged = reports.map(r => ({
    ...r,
    submitter: profileMap.get(r.submitted_by) ?? null,
  }));

  return res.json(merged);
});

// PATCH /api/extension-reports/:id/status
// Dean-only. body: { status: 'approved' | 'rejected', dean_remarks?: string }
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  const { id } = req.params;
  const { status, dean_remarks } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('extension_reports')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  if (existing.status !== 'submitted') {
    return res.status(400).json({ error: 'Only submitted reports can be approved or rejected.' });
  }

  const { data, error } = await supabase
    .from('extension_reports')
    .update({
      status,
      dean_remarks: dean_remarks?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.user.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

// POST /api/extension-reports
router.post('/', authenticate, async (req, res) => {
  const payload = {
    ...req.body,
    submitted_by: req.user.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('extension_reports')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

// PUT /api/extension-reports/:id
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('extension_reports')
    .select('submitted_by')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  if (existing.submitted_by !== req.user.userId) {
    return res.status(403).json({ error: 'You do not have permission to edit this report.' });
  }

  const payload = { ...req.body, updated_at: new Date().toISOString() };
  delete payload.submitted_by;

  const { data, error } = await supabase
    .from('extension_reports')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

module.exports = router;