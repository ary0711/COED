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

// Dean or Admin authorization guard
function requireDean(req, res, next) {
  if (req.user?.role !== 'dean' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

// 1. GET /api/wfh-reports/my-draft - Loads the faculty member's latest draft
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized user.' });

    const { data, error } = await supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/wfh-reports/mine - List all submitted/reviewed reports for the user
router.get('/mine', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized user.' });

    const { data, error } = await supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/wfh-reports - Dean-only: List college-wide submitted reports
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
    return res.json(reports || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/wfh-reports - Creates a new draft or submission
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized user.' });

    const payload = {
      ...req.body,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('wfh_reports')
      .insert(payload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/wfh-reports/photos - Uploads screenshot evidences to Supabase storage
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

      if (uploadError) {
        return res.status(500).json({ error: uploadError.message });
      }

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

// 6. PATCH /api/wfh-reports/:id/status - Dean-only: Approve or Reject a WFH report
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dean_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
    }

    const { data, error } = await supabase
      .from('wfh_reports')
      .update({
        status,
        dean_remarks: dean_remarks?.trim() || null,
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

// 7. PUT /api/wfh-reports/:id - Faculty updates their existing WFH report
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