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