const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const BUCKET = 'accomplishment-photos'; // Uses your existing Supabase storage bucket

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// GET /api/wfh-reports/my-draft - Loads the faculty member's latest draft
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/wfh-reports - Creates a new draft or submission
router.post('/', authenticate, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.user.userId,
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

// PUT /api/wfh-reports/:id - Updates an existing WFH report
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('wfh_reports')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (existing.user_id !== req.user.userId) {
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

// POST /api/wfh-reports/photos - Uploads screenshot evidences to Supabase storage
router.post('/photos', authenticate, upload.any(), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files provided.' });
    }

    const uploaded = [];
    for (const file of files) {
      const ext = file.originalname.split('.').pop();
      const filePath = `wfh/${req.user.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
// GET /api/wfh-reports/mine - List all submitted/reviewed reports for the user
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wfh_reports')
      .select('*')
      .eq('user_id', req.user.userId)
      .neq('status', 'draft') // Only submitted, approved, or rejected
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
module.exports = router;