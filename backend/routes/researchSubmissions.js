// routes/researchSubmissions.js
//
// All reads/writes for research_submissions go through here,
// authenticated via JWT, using the service-role Supabase client.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');

// Default export, matching your existing supabaseClient.js.
const supabase = require('../supabaseClient');

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