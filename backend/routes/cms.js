// routes/cms.js
// Handles CMS image uploads and saves on the server, using the Supabase
// service role key. The key lives ONLY in Render environment variables.

const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

console.log('ENV CHECK:', {
  url: !!process.env.SUPABASE_URL,
  key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwt: !!process.env.JWT_SECRET,
  similar: Object.keys(process.env).filter(k => k.toUpperCase().includes('SUPABASE')),
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Only these buckets / tables can be touched through this router.
const ALLOWED_BUCKETS = [
  'about-images',
  'landing-page-images',
  'homepage-images',
  'faculty_images',
];

const ALLOWED_TABLES = [
  'about_page_content', 'about_statistics', 'university_core_values',
  'faculty_members', 'departments', 'homepage_content', 'homepage_features',
  'homepage_stats', 'homepage_announcements', 'core_values', 'premier_values',
  'department_page_content', 'colleges', 'programs', 'program_faculty',
  'clubs_page_content', 'organizations', 'committees', 'clubs_statistics',
  'research_page_content', 'research_publications', 'research_awards',
  'featured_alumni', 'achievements_topnotchers', 'achievements_college',
  'achievements_statistics', 'achievements_banner_stats', 'achievements_banner',
  'achievements_page_content', 'accreditation_page_content',
  'accreditation_overview', 'accreditation_levels', 'accredited_programs',
  'accreditation_certifications', 'contact_page_content',
  'contact_office_hours', 'contact_social_links', 'footer_content',
  'footer_quick_links', 'footer_social_links',
];

const ALLOWED_ROLES = ['admin', 'dean'];
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// ---------------------------------------------------------------------------
// AUTH: replace this with your EXISTING login middleware if you have one.
// This version assumes your login route issues a JWT signed with JWT_SECRET
// that contains { id, role }.
// ---------------------------------------------------------------------------
function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not logged in' });

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.use(requireAdmin);

// POST /api/cms/upload   (multipart/form-data: file, bucket, folder?)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { bucket, folder = '' } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file provided' });
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: 'Bucket not allowed' });
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_/-]/g, '');
    const path = `${safeFolder ? safeFolder + '/' : ''}${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) return res.status(400).json({ error: error.message });

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return res.json({ path, publicUrl: data.publicUrl });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/cms/:table/upsert   body: { row: {...}, onConflict?: 'section_name' }
router.post('/:table/upsert', express.json(), async (req, res) => {
  try {
    const { table } = req.params;
    const { row, onConflict } = req.body;

    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Table not allowed' });
    }
    if (!row || typeof row !== 'object') {
      return res.status(400).json({ error: 'Missing row' });
    }

    const options = onConflict ? { onConflict } : {};
    const { data, error } = await supabase
      .from(table)
      .upsert(row, options)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    console.error('UPSERT ERROR:', err);
    return res.status(500).json({ error: 'Save failed' });
  }
});

// DELETE /api/cms/:table/:id
router.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Table not allowed' });
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;