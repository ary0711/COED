const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import your centralized backend Supabase client
const supabase = require('../supabaseClient');

// Use memory storage for multer to stream files to Supabase Storage securely
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per file
});

// --- FOLDER ROUTES ---

// Get all folders or subfolders
router.get('/folders', async (req, res) => {
  try {
    const { parent_id } = req.query;
    // Changed from select('*, created_by(email)') to select('*') to prevent join errors
    let query = supabase.from('coed_accreditation_folders').select('*').eq('is_archived', false);
    
    if (parent_id) {
      query = query.eq('parent_id', parent_id);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create folder
router.post('/folders', async (req, res) => {
  try {
    const { name, description, parent_id, user_id } = req.body;
    const { data, error } = await supabase
      .from('coed_accreditation_folders')
      .insert([{ name, description, parent_id: parent_id || null, created_by: user_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Archive folder
router.patch('/folders/:id/archive', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coed_accreditation_folders')
      .update({ is_archived: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- DOCUMENT & MULTI-UPLOAD ROUTES ---

// Get documents by folder ID
router.get('/folders/:folderId/documents', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { data, error } = await supabase
      .from('coed_accreditation_documents')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Multiple file upload endpoint
router.post('/folders/:folderId/upload', upload.array('files'), async (req, res) => {
  const { folderId } = req.params;
  const { userId } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  const results = { successful: [], failed: [] };

  for (const file of files) {
    try {
      const fileExt = file.originalname.split('.').pop();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${Date.now()}_${randomStr}.${fileExt}`;
      const filePath = `${folderId}/${fileName}`;

      // Upload to Supabase Storage bucket named 'coed-accreditation'
      const { error: storageError } = await supabase.storage
        .from('coed-accreditation')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) throw storageError;

      // Save metadata record
      const { data: docData, error: dbError } = await supabase
        .from('coed_accreditation_documents')
        .insert([{
          folder_id: folderId,
          file_name: fileName,
          original_name: file.originalname,
          file_path: filePath, // Stored as folderId/filename
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: userId || null,
          status: 'submitted'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      results.successful.push(docData);
    } catch (uploadErr) {
      results.failed.push({
        original_name: file.originalname,
        error: uploadErr.message
      });
    }
  }

  res.json({
    success: results.successful.length > 0,
    results
  });
});

module.exports = router;