// routes/academicDocuments.js
//
// Academic Records document management. All reads/writes go through
// here — the frontend never talks to Supabase Storage or the
// academic_documents table directly. Downloads are served via
// short-lived signed URLs generated server-side; the bucket itself
// is private and the service-role key never reaches the browser.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

const BUCKET = 'academic-records';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_DOCUMENT_TYPES = ['handbook', 'policy', 'form', 'memorandum'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

function requireDeanOrAdmin(req, res, next) {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean or an Admin can perform this action.' });
  }
  next();
}

function validateFile(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return 'File type not allowed. Accepted: PDF, Word (.doc/.docx), Excel (.xls/.xlsx).';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File exceeds the 20MB size limit.';
  }
  return null;
}

// ── POST /api/academic-records/documents — upload (Dean/Admin only) ──
router.post('/', authenticate, requireDeanOrAdmin, upload.single('file'), async (req, res) => {
  const { title, description, document_type } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!document_type || !ALLOWED_DOCUMENT_TYPES.includes(document_type)) {
    return res.status(400).json({ error: 'document_type must be one of: ' + ALLOWED_DOCUMENT_TYPES.join(', ') });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A file is required.' });
  }

  const fileErr = validateFile(req.file);
  if (fileErr) {
    return res.status(400).json({ error: fileErr });
  }

  const ext = req.file.originalname.split('.').pop();
  const storagePath = `${document_type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

  if (uploadError) {
    return res.status(500).json({ error: 'Failed to upload file: ' + uploadError.message });
  }

  const { data, error: insertError } = await supabase
    .from('academic_documents')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      document_type,
      file_name: req.file.originalname,
      file_path: storagePath,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user.userId,
      status: 'active',
    })
    .select()
    .single();

  if (insertError) {
    // Roll back the uploaded file if the DB insert failed.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save document record: ' + insertError.message });
  }

  return res.status(201).json(data);
});

// ── GET /api/academic-records/documents — list (any authenticated role) ──
// Non-dean/admin only ever see status='active'. Dean/admin can pass
// ?status=archived or ?status=all to see everything.
router.get('/', authenticate, async (req, res) => {
  const { document_type, status } = req.query;
  const isPrivileged = req.user.role === 'dean' || req.user.role === 'admin';

  let query = supabase
    .from('academic_documents')
    .select('id, title, description, document_type, file_name, file_type, file_size, uploaded_by, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (document_type) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document_type filter.' });
    }
    query = query.eq('document_type', document_type);
  }

  if (isPrivileged) {
    if (status === 'archived') query = query.eq('status', 'archived');
    else if (status && status !== 'all') query = query.eq('status', status);
    // status=all or omitted -> no status filter for privileged users
  } else {
    query = query.eq('status', 'active'); // non-privileged users never see archived docs
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

// ── GET /api/academic-records/documents/:id — single document metadata ──
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const isPrivileged = req.user.role === 'dean' || req.user.role === 'admin';

  const { data, error } = await supabase
    .from('academic_documents')
    .select('id, title, description, document_type, file_name, file_type, file_size, uploaded_by, status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  if (data.status === 'archived' && !isPrivileged) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  return res.json(data);
});

// ── GET /api/academic-records/documents/:id/download — signed URL ──
router.get('/:id/download', authenticate, async (req, res) => {
  const { id } = req.params;
  const isPrivileged = req.user.role === 'dean' || req.user.role === 'admin';

  const { data: doc, error: fetchError } = await supabase
    .from('academic_documents')
    .select('file_path, status, file_name')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  if (doc.status === 'archived' && !isPrivileged) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 60); // 60-second link

  if (signError) {
    return res.status(500).json({ error: 'Failed to generate download link: ' + signError.message });
  }

  return res.json({ url: signed.signedUrl, file_name: doc.file_name });
});

// ── PUT /api/academic-records/documents/:id — update metadata and/or replace file (Dean/Admin only) ──
router.put('/:id', authenticate, requireDeanOrAdmin, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { title, description, document_type, status } = req.body;

  const { data: existing, error: fetchError } = await supabase
    .from('academic_documents')
    .select('file_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!existing) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const patch = { updated_at: new Date().toISOString() };
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
    patch.title = title.trim();
  }
  if (description !== undefined) patch.description = description?.trim() || null;
  if (document_type !== undefined) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(document_type)) {
      return res.status(400).json({ error: 'Invalid document_type.' });
    }
    patch.document_type = document_type;
  }
  if (status !== undefined) {
    if (!['active', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "archived".' });
    }
    patch.status = status;
  }

  let oldPathToDelete = null;

  if (req.file) {
    const fileErr = validateFile(req.file);
    if (fileErr) {
      return res.status(400).json({ error: fileErr });
    }

    const ext = req.file.originalname.split('.').pop();
    const newPath = `${document_type || 'general'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) {
      return res.status(500).json({ error: 'Failed to upload replacement file: ' + uploadError.message });
    }

    patch.file_path = newPath;
    patch.file_name = req.file.originalname;
    patch.file_type = req.file.mimetype;
    patch.file_size = req.file.size;
    oldPathToDelete = existing.file_path;
  }

  const { data, error } = await supabase
    .from('academic_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (oldPathToDelete) {
    await supabase.storage.from(BUCKET).remove([oldPathToDelete]); // best-effort cleanup
  }

  return res.json(data);
});

// ── DELETE /api/academic-records/documents/:id — hard delete (Dean/Admin only) ──
router.delete('/:id', authenticate, requireDeanOrAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('academic_documents')
    .select('file_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!existing) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const { error: deleteError } = await supabase
    .from('academic_documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  await supabase.storage.from(BUCKET).remove([existing.file_path]); // best-effort cleanup

  return res.status(204).send();
});

module.exports = router;