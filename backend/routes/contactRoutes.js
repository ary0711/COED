
const express = require('express');
const router = express.Router();

// Use your existing backend Supabase client.
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
// These routes must appear BEFORE router.use(authenticate)
// =====================================================

// GET CONTACT PAGE CONTENT
router.get('/public/page-content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_page_content')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return res.json({ data: data || null });
  } catch (error) {
    return handleError(
      res,
      'Failed to load contact page content.',
      error
    );
  }
});

// GET OFFICE HOURS
router.get('/public/office-hours', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_office_hours')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load contact office hours.',
      error
    );
  }
});

// GET SOCIAL LINKS
router.get('/public/social-links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_social_links')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load contact social links.',
      error
    );
  }
});

// =====================================================
// PROTECTED ADMIN ROUTES
// =====================================================

router.use(authenticate);

// IMPORTANT:
// Add your server-side admin role and account-status
// authorization middleware here before allowing writes.

// =====================================================
// SAVE CONTACT PAGE CONTENT
// =====================================================

router.post('/save/page-content', async (req, res) => {
  try {
    const content = req.body || {};
    const { id } = content;

    if (!id) {
      return res.status(400).json({
        error: 'Contact page content ID is required.',
      });
    }

    const allowedFields = [
      'page_title',
      'page_subtitle',
      'address_title',
      'address_content',
      'phone_title',
      'phone_content',
      'email_title',
      'email_content',
      'office_hours_title',
      'social_title',
      'form_title',
      'map_embed_url',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(content, field)) {
        updates[field] = content[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid contact page fields were provided.',
      });
    }

    const { data, error } = await supabase
      .from('contact_page_content')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Contact page content updated successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to update contact page content.',
      error
    );
  }
});

// =====================================================
// HELPER: UPDATE EXISTING RECORDS BY ID
// =====================================================

async function updateRecords(
  tableName,
  items,
  allowedFields
) {
  if (!Array.isArray(items)) {
    throw new Error('Expected an array of records.');
  }

  const results = await Promise.all(
    items.map(async (item) => {
      if (!item.id) {
        throw new Error(
          `A record ID is missing in ${tableName}.`
        );
      }

      const updates = {};

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(item, field)) {
          updates[field] = item[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return null;
      }

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', item.id)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    })
  );

  return results.filter(Boolean);
}

// =====================================================
// SAVE OFFICE HOURS
// =====================================================

router.post('/save/office-hours', async (req, res) => {
  try {
    const data = await updateRecords(
      'contact_office_hours',
      req.body,
      [
        'day_name',
        'hours',
        'sort_order',
      ]
    );

    return res.json({
      success: true,
      message: 'Office hours saved successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to save contact office hours.',
      error
    );
  }
});

// =====================================================
// SAVE SOCIAL LINKS
// =====================================================

router.post('/save/social-links', async (req, res) => {
  try {
    const data = await updateRecords(
      'contact_social_links',
      req.body,
      [
        'platform',
        'url',
        'sort_order',
      ]
    );

    return res.json({
      success: true,
      message: 'Social links saved successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to save contact social links.',
      error
    );
  }
});

module.exports = router;