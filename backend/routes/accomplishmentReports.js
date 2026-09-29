// routes/accomplishmentReports.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// Only Dean (or admin) may list college-wide submissions or approve/reject them.
function requireDean(req, res, next) {
  if (req.user?.role !== 'dean' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

const PHOTOS_BUCKET = 'accomplishment-photos';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// GET /api/accomplishment-reports/my-draft
// Returns active unsubmitted drafts for this user across quarters
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { quarter, year } = req.query;

    let query = supabase
      .from('accomplishment_reports')
      .select('*')
      .eq('submitted_by', userId)
      .eq('status', 'draft')
      .eq('is_archived.is.null,is_archived.eq.false', false)
      .order('updated_at', { ascending: false });

    if (quarter) query = query.eq('quarter', quarter);
    if (year) query = query.eq('year', String(year));

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/accomplishment-reports/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { data, error } = await supabase
      .from('accomplishment_reports')
      .select('*')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/accomplishment-reports - Dean-only
router.get('/', authenticate, requireDean, async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('accomplishment_reports')
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

// PATCH /api/accomplishment-reports/:id/status - Dean decision
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dean_remarks } = req.body;
    const reviewerId = req.user?.userId || req.user?.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('accomplishment_reports')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const { data, error } = await supabase
      .from('accomplishment_reports')
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

// PATCH /api/accomplishment-reports/:id/archive
router.patch('/:id/archive', authenticate, async (req, res) => {
  const { id } = req.params;
  const { is_archived } = req.body;
  const userId = req.user?.userId || req.user?.id;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('accomplishment_reports')
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
      .from('accomplishment_reports')
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

// POST /api/accomplishment-reports
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { quarter, year, ...body } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required.' });
    }

    if (!quarter || !year) {
      return res.status(400).json({ error: 'Quarter and Year are required.' });
    }

    // 1. Enforce 1 Report Per User + Quarter + Year
    const { data: existing } = await supabase
      .from('accomplishment_reports')
      .select('id, status')
      .eq('submitted_by', userId)
      .eq('quarter', quarter)
      .eq('year', String(year))
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ 
        error: `An accomplishment report for ${quarter} Quarter ${year} already exists (Status: ${existing.status}).`,
        existingId: existing.id,
        status: existing.status
      });
    }

    // 2. Insert new record
    const { data, error } = await supabase
      .from('accomplishment_reports')
      .insert([{
        ...body,
        quarter,
        year: String(year),
        submitted_by: userId,
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

// PUT /api/accomplishment-reports/:id
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('accomplishment_reports')
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
    delete payload.id;

    const { data, error } = await supabase
      .from('accomplishment_reports')
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

// POST /api/accomplishment-reports/photos
router.post('/photos', authenticate, upload.array('files', 8), async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { entryId } = req.body;
    if (!entryId) return res.status(400).json({ error: 'entryId is required.' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded.' });

    const uploaded = [];
    for (const file of req.files) {
      if (!file.mimetype.startsWith('image/')) continue;
      const ext = file.originalname.split('.').pop();
      const path = `${userId}/${entryId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype });

      if (uploadError) continue;

      const { data: urlData } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
      uploaded.push({ path, url: urlData.publicUrl });
    }

    return res.status(201).json(uploaded);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accomplishment-reports/photos
router.delete('/photos', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { paths } = req.body;
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'paths (array) is required.' });
    }

    const notOwned = paths.filter(p => !p.startsWith(`${userId}/`));
    if (notOwned.length > 0) {
      return res.status(403).json({ error: 'Unauthorized file deletion.' });
    }

    const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;