// routes/researchSubmissions.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

function requireDean(req, res, next) {
  const role = (req.user.role || '').toLowerCase();
  if (role !== 'dean' && role !== 'admin' && role !== 'college_dean') {
    return res.status(403).json({ error: 'Only the Dean can access this resource.' });
  }
  next();
}

const BUCKET = 'research-submissions';

// Accept files up to 15MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const ALLOWED_TYPES = ['research', 'extension', 'achievement'];

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

// GET /api/research-submissions?status=pending (Dean-only)
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

  const submitterIds = [...new Set(submissions.map((s) => s.submitted_by).filter(Boolean))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', submitterIds);

  if (profilesError) {
    return res.json(submissions.map((s) => ({ ...s, submitter: null })));
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: facultyRows } = await supabase
    .from('faculty_profiles')
    .select('user_id, department_id')
    .in('user_id', submitterIds);

  const departmentIdByUser = new Map(
    (facultyRows ?? []).map((f) => [f.user_id, f.department_id])
  );

  const departmentIds = [...new Set([...departmentIdByUser.values()].filter(Boolean))];
  let departmentNameById = new Map();
  if (departmentIds.length > 0) {
    const { data: depts } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds);
    departmentNameById = new Map((depts ?? []).map((d) => [d.id, d.name]));
  }

  const merged = submissions.map((s) => {
    const profile = profileMap.get(s.submitted_by);
    const deptId = departmentIdByUser.get(s.submitted_by);
    const departmentName = deptId ? departmentNameById.get(deptId) ?? null : null;

    return {
      ...s,
      submitter: profile
        ? { full_name: profile.full_name, department: departmentName }
        : null,
    };
  });

  return res.json(merged);
});

// PATCH /api/research-submissions/:id/status (Dean-only)
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
// Changed from upload.single('file') to upload.any() to handle multiple files
router.post('/', authenticate, upload.any(), async (req, res) => {
  const { title, type, category, date_received } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid type.' });
  }

  const filesArray = [];
  const uploadedFiles = req.files ?? [];

  // Loop over every uploaded file and push to Supabase storage
  for (const file of uploadedFiles) {
    const ext = file.originalname.split('.').pop();
    const filePath = `${req.user.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res.status(500).json({ error: `Failed to upload ${file.originalname}: ${uploadError.message}` });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    filesArray.push({
      name: file.originalname,
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.mimetype,
    });
  }

  // Fallback to preserve legacy single-file fields
  const firstFile = filesArray[0] || null;

  const insertPayload = {
    submitted_by: req.user.userId,
    title: String(title).trim(),
    type,
    category: category || null,
    date_received: date_received || null,
    file_path: firstFile ? firstFile.path : null,
    file_url: firstFile ? firstFile.url : null,
    file_name: firstFile ? firstFile.name : null,
    files: filesArray, // Array of all uploaded files stored as JSONB
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('research_submissions')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

module.exports = router;