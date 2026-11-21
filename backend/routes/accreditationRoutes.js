
const express = require('express');
const router = express.Router();

// IMPORTANT:
// Change this path if your existing Supabase client
// is located somewhere else.
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

// =====================================================
// ERROR HANDLER
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
// Keep these BEFORE router.use(authenticate)
// =====================================================

// GET PAGE CONTENT
router.get('/public/page-content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accreditation_page_content')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return res.json({ data: data || null });

  } catch (error) {
    return handleError(
      res,
      'Failed to load accreditation page content.',
      error
    );
  }
});
// GET OVERVIEW
router.get('/public/overview', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accreditation_overview')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load accreditation overview.',
      error
    );
  }
});

// GET ACCREDITATION LEVELS
router.get('/public/levels', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accreditation_levels')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load accreditation levels.',
      error
    );
  }
});

// GET ACCREDITED PROGRAMS
router.get('/public/programs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accredited_programs')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load accredited programs.',
      error
    );
  }
});

// GET CERTIFICATIONS
router.get('/public/certifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accreditation_certifications')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load accreditation certifications.',
      error
    );
  }
});

// =====================================================
// PROTECTED ADMIN ROUTES
// Everything below requires authentication
// =====================================================

router.use(authenticate);

// Add your existing server-side role and account-status
// authorization middleware here before permitting saves.

// =====================================================
// SAVE HELPER FOR ARRAY TABLES
// =====================================================

async function saveArrayTable(res, tableName, items) {
  try {
    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Expected an array of records.',
      });
    }

    if (items.length === 0) {
      return res.json({
        success: true,
        message: 'No records to save.',
        data: [],
      });
    }

    const { data, error } = await supabase
      .from(tableName)
      .upsert(items)
      .select('*');

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Accreditation data saved successfully.',
      data: data || [],
    });
  } catch (error) {
    return handleError(
      res,
      `Failed to save ${tableName}.`,
      error
    );
  }
}

// =====================================================
// SAVE PAGE CONTENT
// Original behavior: UPDATE WHERE id = data.id
// =====================================================

router.post('/save/page-content', async (req, res) => {
  try {
    const { id, ...updates } = req.body || {};

    if (!id) {
      return res.status(400).json({
        error: 'Page content ID is required.',
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No page content fields were provided.',
      });
    }

    const { data, error } = await supabase
      .from('accreditation_page_content')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Accreditation page content updated successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to update accreditation page content.',
      error
    );
  }
});

// =====================================================
// SAVE OVERVIEW
// =====================================================

router.post('/save/overview', async (req, res) => {
  return saveArrayTable(
    res,
    'accreditation_overview',
    req.body
  );
});

// =====================================================
// SAVE LEVELS
// =====================================================

router.post('/save/levels', async (req, res) => {
  return saveArrayTable(
    res,
    'accreditation_levels',
    req.body
  );
});

// =====================================================
// SAVE PROGRAMS
// =====================================================

router.post('/save/programs', async (req, res) => {
  return saveArrayTable(
    res,
    'accredited_programs',
    req.body
  );
});

// =====================================================
// SAVE CERTIFICATIONS
// =====================================================

router.post('/save/certifications', async (req, res) => {
  return saveArrayTable(
    res,
    'accreditation_certifications',
    req.body
  );
});

module.exports = router;
