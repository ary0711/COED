// routes/extensionReports.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

function requireDean(req, res, next) {
  if (req.user?.role !== 'dean' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

// GET /api/extension-reports/my-draft
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { data, error } = await supabase
      .from('extension_reports')
      .select('*')
      .eq('submitted_by', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/extension-reports/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { data, error } = await supabase
      .from('extension_reports')
      .select('*')
      .eq('submitted_by', userId)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/extension-reports - Dean-only
router.get('/', authenticate, requireDean, async (req, res) => {
  try {
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
    if (error) return res.status(500).json({ error: error.message });
    if (!reports || reports.length === 0) return res.json([]);

    const submitterIds = [...new Set(reports.map(r => r.submitted_by).filter(Boolean))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, department, program, role')
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/extension-reports/:id/status - Dean decision
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dean_remarks } = req.body;
    const reviewerId = req.user?.userId || req.user?.id;

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

    const { data, error } = await supabase
      .from('extension_reports')
      .update({
        status,
        dean_remarks: dean_remarks?.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/extension-reports/:id/archive
router.patch('/:id/archive', authenticate, async (req, res) => {
  const { id } = req.params;
  const { is_archived } = req.body;
  const userId = req.user?.userId || req.user?.id;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('extension_reports')
      .select('submitted_by')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (existing.submitted_by !== userId) {
      return res.status(403).json({ error: 'You do not have permission to archive this report.' });
    }

    const { data, error } = await supabase
      .from('extension_reports')
      .update({
        is_archived: Boolean(is_archived),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/extension-reports - Prevents duplicate quarter/year reports
router.post('/', authenticate, async (req, res) => {
  const { quarter, year } = req.body;
  const userId = req.user?.userId || req.user?.id;

  try {
    if (quarter && year) {
      const { data: existing } = await supabase
        .from('extension_reports')
        .select('*')
        .eq('submitted_by', userId)
        .eq('quarter', quarter)
        .eq('year', year)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: updateError } = await supabase
          .from('extension_reports')
          .update({
            ...req.body,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) return res.status(500).json({ error: updateError.message });
        return res.status(200).json(updated);
      }
    }

    const payload = {
      ...req.body,
      submitted_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('extension_reports')
      .insert(payload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/extension-reports/:id
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('extension_reports')
      .select('submitted_by')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (existing.submitted_by !== userId) {
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

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;