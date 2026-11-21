
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
// Keep these BEFORE router.use(authenticate)
// =====================================================

// GET FOOTER CONTENT
router.get('/public/content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('footer_content')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return res.json({ data: data || null });
  } catch (error) {
    return handleError(
      res,
      'Failed to load footer content.',
      error
    );
  }
});

// GET FOOTER QUICK LINKS
router.get('/public/quick-links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('footer_quick_links')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load footer quick links.',
      error
    );
  }
});

// GET FOOTER SOCIAL LINKS
router.get('/public/social-links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('footer_social_links')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (error) {
    return handleError(
      res,
      'Failed to load footer social links.',
      error
    );
  }
});

// =====================================================
// PROTECTED ADMIN ROUTES
// =====================================================

router.use(authenticate);

// IMPORTANT:
// Add your server-side administrator role and account-status
// authorization middleware here before permitting writes.

// =====================================================
// SAVE FOOTER CONTENT
// =====================================================

router.post('/save/content', async (req, res) => {
  try {
    const content = req.body || {};

    if (!content.id) {
      return res.status(400).json({
        error: 'Footer content ID is required.',
      });
    }

    const allowedFields = [
      'about_title',
      'about_description',
      'contact_title',
      'address',
      'phone',
      'email',
      'social_title',
      'copyright_text',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(content, field)) {
        updates[field] = content[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid footer content fields were provided.',
      });
    }

    const { data, error } = await supabase
      .from('footer_content')
      .update(updates)
      .eq('id', content.id)
      .select('*')
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Footer content updated successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to update footer content.',
      error
    );
  }
});

// =====================================================
// HELPER: UPDATE EXISTING RECORDS BY ID
// =====================================================

async function updateFooterRecords(
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
// SAVE QUICK LINKS
// =====================================================

router.post('/save/quick-links', async (req, res) => {
  try {
    const data = await updateFooterRecords(
      'footer_quick_links',
      req.body,
      [
        'label',
        'url',
        'sort_order',
      ]
    );

    return res.json({
      success: true,
      message: 'Footer quick links saved successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to save footer quick links.',
      error
    );
  }
});

// =====================================================
// SAVE SOCIAL LINKS
// =====================================================

router.post('/save/social-links', async (req, res) => {
  try {
    const data = await updateFooterRecords(
      'footer_social_links',
      req.body,
      [
        'platform',
        'url',
        'sort_order',
      ]
    );

    return res.json({
      success: true,
      message: 'Footer social links saved successfully.',
      data,
    });
  } catch (error) {
    return handleError(
      res,
      'Failed to save footer social links.',
      error
    );
  }
});

module.exports = router;
