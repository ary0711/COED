// All reads/writes for research_submissions go through here,
// authenticated via JWT, using the service-role Supabase client.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');

// Default export, matching your existing supabaseClient.js.
const supabase = require('../supabaseClient');

function requireDean(req, res, next) {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

const BUCKET = 'research-submissions';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the UI's stated limit
});

const ALLOWED_TYPES = ['research', 'extension'];

// GET /api/research-submissions/mine
router.get('/mine', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('research_submissions')
    .select('*')
    .eq('submitted_by', req.user.userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

// GET /api/research-submissions?status=pending
// Dean-only. Lists submissions college-wide, with submitter names attached.
router.get('/', authenticate, requireDean, async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from('research_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: submissions, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (!submissions || submissions.length === 0) return res.json([]);

  const submitterIds = [...new Set(submissions.map(s => s.submitted_by).filter(Boolean))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .in('id', submitterIds);

  if (profilesError) {
    return res.json(submissions.map(s => ({ ...s, submitter: null })));
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const merged = submissions.map(s => ({
    ...s,
    submitter: profileMap.get(s.submitted_by) ?? null,
  }));

  return res.json(merged);
});

// PATCH /api/research-submissions/:id/status
// Dean-only. body: { status: 'approved' | 'rejected', dean_remarks?: string }
router.patch('/:id/status', authenticate, requireDean, async (req, res) => {
  const { id } = req.params;
  const { status, dean_remarks } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('research_submissions')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  if (existing.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending submissions can be approved or rejected.' });
  }

  const { data, error } = await supabase
    .from('research_submissions')
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

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/research-submissions
// multipart/form-data: fields "title", "type", optional file field "file"
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  const { title, type } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid type.' });
  }

  let file_path = null;
  let file_url = null;
  let file_name = null;

  if (req.file) {
    const ext = req.file.originalname.split('.').pop();
    file_path = `${req.user.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(file_path, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
    file_url = urlData.publicUrl;
    file_name = req.file.originalname;
  }

  const { data, error } = await supabase
    .from('research_submissions')
    .insert({
      submitted_by: req.user.userId,
      title: String(title).trim(),
      type,
      file_path,
      file_url,
      file_name,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

module.exports = router;