// routes/accomplishmentReports.js
//
// All reads and writes for accomplishment_reports (and its photos) go
// through here, authenticated via JWT, using the service-role Supabase
// client — the browser never talks to Supabase directly for this data.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');

// Default export, matching your existing supabaseClient.js.
const supabase = require('../supabaseClient');

const PHOTOS_BUCKET = 'accomplishment-photos';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// GET /api/accomplishment-reports/my-draft
// Returns the signed-in chair's current draft, or null if none exists.
router.get('/my-draft', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('accomplishment_reports')
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

// POST /api/accomplishment-reports
// Creates a new report row. submitted_by is always set from the verified
// JWT, never trusted from the request body.
router.post('/', authenticate, async (req, res) => {
  const payload = {
    ...req.body,
    submitted_by: req.user.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('accomplishment_reports')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

// PUT /api/accomplishment-reports/:id
// Updates an existing report row, but only if it actually belongs to
// the signed-in user (prevents editing someone else's report by id).
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('accomplishment_reports')
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
  delete payload.submitted_by; // ownership can never be changed via the body

  const { data, error } = await supabase
    .from('accomplishment_reports')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

// POST /api/accomplishment-reports/photos
// multipart/form-data: field "files" (one or more images) + field "entryId"
router.post('/photos', authenticate, upload.array('files', 8), async (req, res) => {
  const { entryId } = req.body;
  if (!entryId) {
    return res.status(400).json({ error: 'entryId is required.' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const uploaded = [];
  for (const file of req.files) {
    if (!file.mimetype.startsWith('image/')) continue;

    const ext = file.originalname.split('.').pop();
    const path = `${req.user.userId}/${entryId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (uploadError) continue; // skip this file, keep processing the rest

    const { data: urlData } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
    uploaded.push({ path, url: urlData.publicUrl });
  }

  return res.status(201).json(uploaded);
});

// DELETE /api/accomplishment-reports/photos
// body: { paths: string[] }
router.delete('/photos', authenticate, async (req, res) => {
  const { paths } = req.body;
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'paths (array) is required.' });
  }

  // Every path is namespaced "<userId>/<entryId>/<filename>" at upload
  // time, so this blocks one chair from deleting another chair's photos.
  const notOwned = paths.filter(p => !p.startsWith(`${req.user.userId}/`));
  if (notOwned.length > 0) {
    return res.status(403).json({ error: 'You do not have permission to delete one or more of these files.' });
  }

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(204).send();
});

module.exports = router;