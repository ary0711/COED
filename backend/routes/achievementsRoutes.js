
const express = require('express');
const router = express.Router();

// IMPORTANT:
// Change this import to the actual location of your
// existing backend Supabase client.
const supabase = require('../supabaseClient');

const authenticate = require('../middleware/authenticate');

// =====================================================
// HELPER: SEND DATABASE ERRORS
// =====================================================

function handleError(res, message, error) {
  console.error(message, error);

  return res.status(500).json({
    error: message,
    details: error?.message || 'Unknown database error',
  });
}

// =====================================================
// PUBLIC GET ROUTES
// These must be BEFORE router.use(authenticate)
// =====================================================

// GET TOPNOTCHERS
router.get('/public/topnotchers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_topnotchers')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load topnotchers.',
      error
    );
  }
});

// GET COLLEGE ACHIEVEMENTS
router.get('/public/college-achievements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_college')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load college achievements.',
      error
    );
  }
});

// GET STATISTICS
router.get('/public/statistics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_statistics')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load achievements statistics.',
      error
    );
  }
});

// GET BANNER STATISTICS
router.get('/public/banner-stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_banner_stats')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load banner statistics.',
      error
    );
  }
});

// GET BANNER
router.get('/public/banner', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_banner')
      .select('*')
      .single();

    if (error) throw error;

    return res.json({ data });
  } catch (error) {
    return handleError(
      res,
      'Failed to load achievements banner.',
      error
    );
  }
});

// GET PAGE CONTENT
router.get('/public/page-content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements_page_content')
      .select('*')
      .single();

    if (error) throw error;

    return res.json({ data });
  } catch (error) {
    return handleError(
      res,
      'Failed to load achievements page content.',
      error
    );
  }
});

// =====================================================
// PROTECTED ADMIN ROUTES
// All routes below this point require authentication
// =====================================================

router.use(authenticate);

// Add your existing admin/dean/chair role authorization
// middleware here if your project has one.
// Authentication alone does not establish admin permission.

// HELPER: UPSERT DATA
async function saveTable(res, tableName, data, isArray) {
  try {
    if (isArray && !Array.isArray(data)) {
      return res.status(400).json({
        error: 'Expected an array of records.',
      });
    }

    if (
      !isArray &&
      (!data || typeof data !== 'object' || Array.isArray(data))
    ) {
      return res.status(400).json({
        error: 'Expected an object.',
      });
    }

    const records = isArray ? data : [data];

    if (records.length === 0) {
      return res.json({
        success: true,
        message: 'No records to save.',
      });
    }

    const { data: savedData, error } = await supabase
      .from(tableName)
      .upsert(records)
      .select('*');

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Achievements data saved successfully.',
      data: savedData || [],
    });
  } catch (error) {
    return handleError(
      res,
      `Failed to save ${tableName}.`,
      error
    );
  }
}

// SAVE PAGE CONTENT
router.post('/save/page-content', async (req, res) => {
  return saveTable(
    res,
    'achievements_page_content',
    req.body,
    false
  );
});

// SAVE BANNER
router.post('/save/banner', async (req, res) => {
  return saveTable(
    res,
    'achievements_banner',
    req.body,
    false
  );
});

// SAVE BANNER STATISTICS
router.post('/save/banner-stats', async (req, res) => {
  return saveTable(
    res,
    'achievements_banner_stats',
    req.body,
    true
  );
});

// SAVE STATISTICS
router.post('/save/statistics', async (req, res) => {
  return saveTable(
    res,
    'achievements_statistics',
    req.body,
    true
  );
});

// SAVE TOPNOTCHERS
router.post('/save/topnotchers', async (req, res) => {
  return saveTable(
    res,
    'achievements_topnotchers',
    req.body,
    true
  );
});

// SAVE COLLEGE ACHIEVEMENTS
router.post('/save/college-achievements', async (req, res) => {
  return saveTable(
    res,
    'achievements_college',
    req.body,
    true
  );
});

module.exports = router;