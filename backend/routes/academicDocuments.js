// routes/academicDocuments.js

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
// Gi-luagan ang allowed types kay naa nay custom categories ang frontend
const ALLOWED_TARGET_ROLES = ['student', 'faculty', 'department_chair', 'staff', 'alumni'];

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

// Parses target_roles from JSON strings, comma-separated values, or arrays from form-data
function parseTargetRoles(input) {
  if (!input) return null;
  let roles = input;

  if (typeof input === 'string') {
    try {
      roles = JSON.parse(input);
    } catch {
      roles = input.split(',').map((r) => r.trim());
    }
  }

  if (!Array.isArray(roles)) return null;

  // Filter and sanitize
  const sanitized = [...new Set(roles.map((r) => String(r).trim().toLowerCase()))].filter(Boolean);
  return sanitized;
}

// ── POST /api/academic-records/documents — upload (Dean/Admin only) ──
router.post('/', authenticate, requireDeanOrAdmin, upload.single('file'), async (req, res) => {
  const { title, description, document_type, target_roles } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!document_type) {
    return res.status(400).json({ error: 'document_type is required.' });
  }

  // Parse and validate target audience roles
  const parsedRoles = parseTargetRoles(target_roles);
  if (!parsedRoles || parsedRoles.length === 0) {
    return res.status(400).json({ error: 'At least one target audience role must be selected.' });
  }

  const invalidRoles = parsedRoles.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    return res.status(400).json({
      error: `Invalid target role(s): ${invalidRoles.join(', ')}. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`,
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'A file is required.' });
  }

  const fileErr = validateFile(req.file);
  if (fileErr) {
    return res.status(400).json({ error: fileErr });
  }

  const ext = req.file.originalname.split('.').pop();
  const safeDocType = document_type.replace(/[^a-zA-Z0-9]/g, '_');
  const storagePath = `${safeDocType}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
      target_roles: parsedRoles,
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
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return res.status(500).json({ error: 'Failed to save document record: ' + insertError.message });
  }

  return res.status(201).json(data);
});

// ── GET /api/academic-records/documents — list documents ──
router.get('/', authenticate, async (req, res) => {
  const { document_type, status } = req.query;
  const userRole = req.user.role;
  const isPrivileged = userRole === 'dean' || userRole === 'admin';

  let query = supabase
    .from('academic_documents')
    .select('id, title, description, document_type, target_roles, file_name, file_type, file_size, uploaded_by, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (document_type) {
    query = query.eq('document_type', document_type);
  }

  if (isPrivileged) {
    if (status === 'archived') query = query.eq('status', 'archived');
    else if (status && status !== 'all') query = query.eq('status', status);
  } else {
    // Non-privileged users only see active documents targeted to their specific role
    query = query
      .eq('status', 'active')
      .contains('target_roles', [userRole]);
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
  const userRole = req.user.role;
  const isPrivileged = userRole === 'dean' || userRole === 'admin';

  const { data, error } = await supabase
    .from('academic_documents')
    .select('id, title, description, document_type, target_roles, file_name, file_type, file_size, uploaded_by, status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Access check: Non-privileged users cannot view archived docs or docs not targeted to them
  if (!isPrivileged) {
    if (data.status === 'archived' || !data.target_roles.includes(userRole)) {
      return res.status(404).json({ error: 'Document not found.' });
    }
  }

  return res.json(data);
});

// ── GET /api/academic-records/documents/:id/preview — signed URL for inline viewing ──
router.get('/:id/preview', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const isPrivileged = userRole === 'dean' || userRole === 'admin';

  const { data: doc, error: fetchError } = await supabase
    .from('academic_documents')
    .select('file_path, status, file_name, file_type, target_roles')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (!isPrivileged) {
    if (doc.status === 'archived' || !doc.target_roles.includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to preview this document.' });
    }
  }

  // download: false ensures Content-Disposition is set to inline for embedding
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 300, { download: false });

  if (signError) {
    return res.status(500).json({ error: 'Failed to generate preview link: ' + signError.message });
  }

  return res.json({ url: signed.signedUrl, file_type: doc.file_type, file_name: doc.file_name });
});

// ── GET /api/academic-records/documents/:id/download — signed URL for downloading ──
router.get('/:id/download', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const isPrivileged = userRole === 'dean' || userRole === 'admin';

  const { data: doc, error: fetchError } = await supabase
    .from('academic_documents')
    .select('file_path, status, target_roles')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  if (!isPrivileged) {
    if (doc.status === 'archived' || !doc.target_roles.includes(userRole)) {
      return res.status(403).json({ error: 'You do not have permission to download this document.' });
    }
  }

  // download: true sets Content-Disposition: attachment
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 300, { download: true });

  if (signError) {
    return res.status(500).json({ error: 'Failed to generate download link: ' + signError.message });
  }

  return res.json({ url: signed.signedUrl });
});

// ── PUT /api/academic-records/documents/:id — update metadata and/or replace file (Dean/Admin only) ──
router.put('/:id', authenticate, requireDeanOrAdmin, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { title, description, document_type, status, target_roles } = req.body;

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
    patch.document_type = document_type;
  }
  if (status !== undefined) {
    if (!['active', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "archived".' });
    }
    patch.status = status;
  }

  if (target_roles !== undefined) {
    const parsedRoles = parseTargetRoles(target_roles);
    if (!parsedRoles || parsedRoles.length === 0) {
      return res.status(400).json({ error: 'At least one target audience role must be selected.' });
    }
    const invalidRoles = parsedRoles.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        error: `Invalid target role(s): ${invalidRoles.join(', ')}. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`,
      });
    }
    patch.target_roles = parsedRoles;
  }

  let oldPathToDelete = null;

  if (req.file) {
    const fileErr = validateFile(req.file);
    if (fileErr) {
      return res.status(400).json({ error: fileErr });
    }

    const ext = req.file.originalname.split('.').pop();
    const safeDocType = (document_type || 'general').replace(/[^a-zA-Z0-9]/g, '_');
    const newPath = `${safeDocType}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
    await supabase.storage.from(BUCKET).remove([oldPathToDelete]);
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

  await supabase.storage.from(BUCKET).remove([existing.file_path]);

  return res.status(204).send();
});

module.exports = router;