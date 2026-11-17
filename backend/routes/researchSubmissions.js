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
const ALLOWED_RESEARCH_STATUSES = ['on-going', 'completed', 'published'];

// =====================================================
// PUBLIC: GET APPROVED RESEARCH FOR RESEARCH PAGE
// =====================================================
router.get('/public/approved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_submissions')
      .select(`
        id,
        title,
        type,
        category,
        description,
        publication_link,
        authors,
        created_at,
        updated_at,
        status
      `)
      .eq('status', 'approved')
      .eq('type', 'research')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Public approved research error:', error);

      return res.status(500).json({
        error: 'Failed to load approved research.',
        details: error.message,
      });
    }

    return res.json(data || []);
  } catch (error) {
    console.error('Public approved research server error:', error);

    return res.status(500).json({
      error: 'Server error while loading approved research.',
    });
  }
});

// Updated to exactly match the frontend dash format to prevent validation errors
const ALLOWED_SDGS = [
  'SDG 1 – No Poverty',
  'SDG 2 – Zero Hunger',
  'SDG 3 – Good Health and Well-Being',
  'SDG 4 – Quality Education',
  'SDG 5 – Gender Equality',
  'SDG 6 – Clean Water and Sanitation',
  'SDG 7 – Affordable and Clean Energy',
  'SDG 8 – Decent Work and Economic Growth',
  'SDG 9 – Industry, Innovation and Infrastructure',
  'SDG 10 – Reduced Inequalities',
  'SDG 11 – Sustainable Cities and Communities',
  'SDG 12 – Responsible Consumption and Production',
  'SDG 13 – Climate Action',
  'SDG 14 – Life Below Water',
  'SDG 15 – Life on Land',
  'SDG 16 – Peace, Justice and Strong Institutions',
  'SDG 17 – Partnerships for the Goals',
];

// GET /api/research-submissions/preview-url
// Generates a temporary signed URL from Supabase Storage for in-modal preview
router.get('/preview-url', authenticate, async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: 'File path parameter is required.' });
    }

    // Creates a signed link valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ url: data.signedUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate preview URL.' });
  }
});

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

  // Fetch profiles including direct department/program fields
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, program')
    .in('id', submitterIds);

  if (profilesError) {
    return res.json(submissions.map((s) => ({ ...s, submitter: null })));
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Fetch relational faculty department records
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
    
    // Fallback logic: 1. Relation DB -> 2. Text column (department) -> 3. Text column (program)
    const resolvedDepartment =
      (deptId ? departmentNameById.get(deptId) : null) ||
      profile?.department ||
      profile?.program ||
      null;

    return {
      ...s,
      submitter: profile
        ? { full_name: profile.full_name, department: resolvedDepartment }
        : null,
    };
  });

  return res.json(merged);
});

// PATCH /api/research-submissions/:id/status (Dean-only review)
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

// POST /api/research-submissions (Create New Submission by Faculty)
router.post('/', authenticate, upload.any(), async (req, res) => {
  const {
    title,
    type,
    research_status,
    category,
    date_received,
    publication_link,
    description,
    start_date,
    end_date,
    funding_source,
    authors,
    budget,
    partner_organization,
    beneficiaries,
    sdg_alignment,
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid type.' });
  }
  if (type === 'research' && research_status && !ALLOWED_RESEARCH_STATUSES.includes(research_status)) {
    return res.status(400).json({ error: 'Invalid research status.' });
  }

  const normalizedResearchStatus =
    type === 'research' ? (research_status || 'completed') : null;
  const resolvedEndDate =
    type === 'research' && normalizedResearchStatus === 'on-going'
      ? null
      : (end_date || null);
  const resolvedPublicationLink =
    type === 'research' && normalizedResearchStatus === 'published'
      ? (publication_link?.trim() || null)
      : null;

  if (start_date && isNaN(Date.parse(start_date))) {
    return res.status(400).json({ error: 'Invalid Start Date format.' });
  }
  if (resolvedEndDate && isNaN(Date.parse(resolvedEndDate))) {
    return res.status(400).json({ error: 'Invalid End Date format.' });
  }
  if (start_date && resolvedEndDate && new Date(resolvedEndDate) < new Date(start_date)) {
    return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
  }

  let parsedBudget = null;
  if (type === 'research' && budget !== undefined && budget !== null && budget !== '') {
    parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ error: 'Budget must be a non-negative number.' });
    }
  }

  let parsedBeneficiaries = null;
  let parsedSdgs = [];

  if (type === 'extension') {
    if (beneficiaries !== undefined && beneficiaries !== null && beneficiaries !== '') {
      parsedBeneficiaries = parseInt(beneficiaries, 10);
      if (isNaN(parsedBeneficiaries) || parsedBeneficiaries < 0) {
        return res.status(400).json({ error: 'Beneficiaries must be a non-negative whole number.' });
      }
    }

    if (sdg_alignment) {
      try {
        parsedSdgs = typeof sdg_alignment === 'string' ? JSON.parse(sdg_alignment) : sdg_alignment;
        if (!Array.isArray(parsedSdgs)) {
          return res.status(400).json({ error: 'SDG alignment must be an array.' });
        }
        const invalidSdg = parsedSdgs.find((sdg) => !ALLOWED_SDGS.includes(sdg));
        if (invalidSdg) {
          return res.status(400).json({ error: `Invalid SDG selection: "${invalidSdg}".` });
        }
      } catch {
        return res.status(400).json({ error: 'Malformed SDG data received.' });
      }
    }
  }

  const filesArray = [];
  const uploadedFiles = req.files ?? [];

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

  const firstFile = filesArray[0] || null;

  const insertPayload = {
    submitted_by: req.user.userId,
    title: String(title).trim(),
    type,
    research_status: normalizedResearchStatus,
    category: category || null,
    date_received: date_received || null,
    description: description?.trim() || null,
    start_date: start_date || null,
    end_date: resolvedEndDate,
    publication_link: resolvedPublicationLink,
    funding_source: type === 'research' ? (funding_source?.trim() || null) : null,
    authors: type === 'research' ? (authors?.trim() || null) : null,
    budget: type === 'research' ? parsedBudget : null,
    partner_organization: type === 'extension' ? (partner_organization?.trim() || null) : null,
    beneficiaries: type === 'extension' ? parsedBeneficiaries : null,
    sdg_alignment: type === 'extension' ? parsedSdgs : [],
    file_path: firstFile ? firstFile.path : null,
    file_url: firstFile ? firstFile.url : null,
    file_name: firstFile ? firstFile.name : null,
    files: filesArray,
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

// PUT /api/research-submissions/:id (Strictly UPDATE existing record on submitter edit)
router.put('/:id', authenticate, upload.any(), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // 1. Locate the existing record by primary key ID and submitter
  const { data: existing, error: fetchErr } = await supabase
    .from('research_submissions')
    .select('*')
    .eq('id', id)
    .eq('submitted_by', userId)
    .single();

  if (fetchErr || !existing) {
    return res.status(404).json({ error: 'Submission not found or access denied.' });
  }

  // Locked records cannot be edited
  if (existing.status === 'approved') {
    return res.status(400).json({ error: 'Approved submissions cannot be modified.' });
  }

  const {
    title,
    research_status,
    category,
    description,
    start_date,
    end_date,
    publication_link,
    funding_source,
    authors,
    budget,
    partner_organization,
    beneficiaries,
    sdg_alignment,
  } = req.body;

  if (existing.type === 'research' && research_status && !ALLOWED_RESEARCH_STATUSES.includes(research_status)) {
    return res.status(400).json({ error: 'Invalid research status.' });
  }

  const normalizedResearchStatus =
    existing.type === 'research'
      ? (research_status || existing.research_status || 'completed')
      : null;
  const resolvedEndDate =
    existing.type === 'research' && normalizedResearchStatus === 'on-going'
      ? null
      : (end_date || null);
  const resolvedPublicationLink =
    existing.type === 'research' && normalizedResearchStatus === 'published'
      ? (publication_link !== undefined ? (publication_link ? publication_link.trim() : null) : existing.publication_link)
      : null;

  if (start_date && resolvedEndDate && new Date(resolvedEndDate) < new Date(start_date)) {
    return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
  }

  // Preserve existing files without duplicate re-uploads
  let updatedFiles = Array.isArray(existing.files) ? [...existing.files] : [];
  const uploadedFiles = req.files ?? [];

  // Upload only newly attached files
  for (const file of uploadedFiles) {
    const ext = file.originalname.split('.').pop();
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      updatedFiles.push({
        name: file.originalname,
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.mimetype,
      });
    }
  }

  let parsedBudget = existing.budget;
  if (existing.type === 'research' && budget !== undefined && budget !== '') {
    parsedBudget = parseFloat(budget);
  }

  let parsedBeneficiaries = existing.beneficiaries;
  let parsedSdgs = existing.sdg_alignment;
  if (existing.type === 'extension') {
    if (beneficiaries !== undefined && beneficiaries !== '') {
      parsedBeneficiaries = parseInt(beneficiaries, 10);
    }
    if (sdg_alignment) {
      try {
        parsedSdgs = typeof sdg_alignment === 'string' ? JSON.parse(sdg_alignment) : sdg_alignment;
      } catch {}
    }
  }

  // Strict UPDATE: Re-enters 'pending' review under the exact same submission ID
  const updatePayload = {
    title: title ? String(title).trim() : existing.title,
    research_status: normalizedResearchStatus,
    category: category !== undefined ? category : existing.category,
    description: description !== undefined ? (description ? description.trim() : null) : existing.description,
    start_date: start_date || null,
    end_date: resolvedEndDate,
    publication_link: resolvedPublicationLink,
    funding_source: funding_source !== undefined ? (funding_source ? funding_source.trim() : null) : existing.funding_source,
    authors: authors !== undefined ? (authors ? authors.trim() : null) : existing.authors,
    budget: parsedBudget,
    partner_organization: partner_organization !== undefined ? (partner_organization ? partner_organization.trim() : null) : existing.partner_organization,
    beneficiaries: parsedBeneficiaries,
    sdg_alignment: parsedSdgs,
    files: updatedFiles,
    file_path: updatedFiles.length > 0 ? updatedFiles[0].path : existing.file_path,
    file_url: updatedFiles.length > 0 ? updatedFiles[0].url : existing.file_url,
    file_name: updatedFiles.length > 0 ? updatedFiles[0].name : existing.file_name,
    status: 'pending', // Re-routed for Dean evaluation
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('research_submissions')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

module.exports = router;