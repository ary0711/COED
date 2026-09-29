// routes/wfhReports.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const BUCKET = 'accomplishment-photos';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function requireDean(req, res, next) {
  if (req.user?.role !== 'dean' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

// GET /api/wfh-reports/my-draft
// Returns all active drafts for this user across quarters
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized user.' });

    const { quarter, year } = req.query;

    let query = supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .eq('is_archived.is.null,is_archived.eq.false', false)
      .order('updated_at', { ascending: false });

    if (quarter) query = query.eq('quarter', quarter);
    if (year) query = query.eq('year', String(year));

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/wfh-reports/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { data, error } = await supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/wfh-reports - Dean-only
router.get('/', authenticate, requireDean, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('wfh_reports')
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

    const submitterIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];
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
      submitted_by: r.user_id,
      submitter: profileMap.get(r.user_id) ?? null,
    }));

    return res.json(merged);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wfh-reports
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { quarter, year, submitted_by, ...body } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required.' });
    }

    if (!quarter || !year) {
      return res.status(400).json({ error: 'Quarter and Year are required.' });
    }

    // 1. Enforce 1 Report Per User + Quarter + Year
    const { data: existing } = await supabase
      .from('wfh_reports')
      .select('id, status')
      .eq('user_id', userId)
      .eq('quarter', quarter)
      .eq('year', String(year))
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ 
        error: `A WFH report for ${quarter} Quarter ${year} already exists (Status: ${existing.status}).`,
        existingId: existing.id,
        status: existing.status
      });
    }

    // 2. Insert new record using exact table column user_id
    const { data, error } = await supabase
      .from('wfh_reports')
      .insert([{
        ...body,
        quarter,
        year: String(year),
        user_id: userId,
        status: req.body.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wfh-reports/photos
router.post('/photos', authenticate, upload.any(), async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files provided.' });
    }

    const uploaded = [];
    for (const file of files) {
      const ext = file.originalname.split('.').pop();
      const filePath = `wfh/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, { contentType: file.mimetype });

      if (uploadError) return res.status(500).json({ error: uploadError.message });

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      uploaded.push({
        path: filePath,
        url: urlData.publicUrl,
      });
    }

    return res.json(uploaded);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/wfh-reports/:id/status - Dean decision
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dean_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
    }

    const updatePayload = {
      status,
      dean_remarks: dean_remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('wfh_reports')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/wfh-reports/:id/archive
router.patch('/:id/archive', authenticate, async (req, res) => {
  const { id } = req.params;
  const { is_archived } = req.body;
  const userId = req.user?.userId || req.user?.id;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('wfh_reports')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to archive this report.' });
    }

    const { data, error } = await supabase
      .from('wfh_reports')
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

// PUT /api/wfh-reports/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;

    if (!id || id === 'mine' || id === 'my-draft') {
      return res.status(400).json({ error: 'Invalid report ID.' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('wfh_reports')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const payload = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // Clean primary keys and non-existent alias keys
    delete payload.id;
    delete payload.user_id;
    delete payload.submitted_by;

    const { data, error } = await supabase
      .from('wfh_reports')
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