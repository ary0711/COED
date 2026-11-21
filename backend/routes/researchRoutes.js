
const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

// All Research routes require your custom JWT.
router.use(authenticate);

// Restrict access to authorized management roles.
// Adjust these role names to match the roles in your application.
router.use((req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();

  const allowedRoles = [
    'admin',
    'dean',
    'chair',
    'department_chair',
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      error: 'You are not authorized to access Research management.',
      code: 'FORBIDDEN',
    });
  }

  next();
});

/* =========================================
   GET RESEARCH CONTENT
========================================= */

router.get('/content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_page_content')
      .select('*');

    if (error) throw error;

    const formatted = {};

    (data || []).forEach((item) => {
      formatted[item.section_name] = item;
    });

    return res.json({
      data: formatted,
    });
  } catch (error) {
    console.error('LOAD RESEARCH CONTENT ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to load Research content.',
      code: error.code || 'LOAD_RESEARCH_CONTENT_FAILED',
      details: error.details || null,
    });
  }
});

/* =========================================
   GET RESEARCH PUBLICATIONS
========================================= */

router.get('/publications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_publications')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({
      data: data || [],
    });
  } catch (error) {
    console.error('LOAD RESEARCH PUBLICATIONS ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to load publications.',
      code: error.code || 'LOAD_PUBLICATIONS_FAILED',
      details: error.details || null,
    });
  }
});

/* =========================================
   GET RESEARCH AWARDS
========================================= */

router.get('/awards', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('research_awards')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({
      data: data || [],
    });

  } catch (error) {
    console.error('LOAD RESEARCH AWARDS ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to load Research awards.',
      code: error.code || 'LOAD_AWARDS_FAILED',
    });
  }
});
/* =========================================
   GET FEATURED ALUMNI
========================================= */

router.get('/alumni', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('featured_alumni')
      .select('*')
      .order('display_order');

    if (error) throw error;

    return res.json({
      data: data || [],
    });
  } catch (error) {
    console.error('LOAD FEATURED ALUMNI ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to load featured alumni.',
      code: error.code || 'LOAD_ALUMNI_FAILED',
      details: error.details || null,
    });
  }
});

/* =========================================
   SAVE COMPLETE RESEARCH PAGE
========================================= */

router.post('/save', async (req, res) => {
  try {
    const {
      researchContent = {},
      publications = [],
      achievements = [],
      alumni = [],
    } = req.body || {};

    // Validate incoming data.
    if (
      typeof researchContent !== 'object' ||
      researchContent === null ||
      Array.isArray(researchContent) ||
      !Array.isArray(publications) ||
      !Array.isArray(achievements) ||
      !Array.isArray(alumni)
    ) {
      return res.status(400).json({
        error: 'Invalid Research page data.',
        code: 'INVALID_RESEARCH_PAYLOAD',
      });
    }

    // Convert Research content into database rows.
    const contentUpdates = Object.entries(researchContent).map(
      ([section_name, values]) => ({
        section_name,
        title: values?.title ?? '',
        description: values?.description ?? '',
        content: values?.content ?? '',
      })
    );

    // Save Research page content.
    if (contentUpdates.length > 0) {
      const { error } = await supabase
        .from('research_page_content')
        .upsert(contentUpdates, {
          onConflict: 'section_name',
        });

      if (error) throw error;
    }

    // Save publications.
    if (publications.length > 0) {
      const { error } = await supabase
        .from('research_publications')
        .upsert(publications);

      if (error) throw error;
    }

    // Save achievements / awards.
    if (achievements.length > 0) {
     const { error } = await supabase
  .from('research_awards')
  .upsert(achievements);
      if (error) throw error;
    }

    // Save featured alumni.
    if (alumni.length > 0) {
      const { error } = await supabase
        .from('featured_alumni')
        .upsert(alumni);

      if (error) throw error;
    }

    return res.json({
      success: true,
      message: 'Research page saved successfully.',
    });

  } catch (error) {
    console.error('========== SAVE RESEARCH PAGE ERROR ==========');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.error('===============================================');

    return res.status(500).json({
      error: error.message || 'Failed to save Research page.',
      code: error.code || 'SAVE_RESEARCH_FAILED',
      details: error.details || null,
    });
  }
});

module.exports = router;