
const express = require('express');
const router = express.Router();

const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');


// Protect every route with your custom JWT authentication.
router.use(authenticate);

// Only allow authorized staff to manage Clubs page content.
// Adjust these roles if your project uses different role names.
router.use((req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();

  const allowedRoles = [
    'dean',
    'admin',
    'chair',
    'department_chair',
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      error: 'You are not authorized to manage Clubs page content.',
      code: 'FORBIDDEN',
    });
  }

  next();
});

// Standard Supabase error response.
function handleDatabaseError(res, error, action) {
  console.error(`${action} failed:`, error);

  return res.status(400).json({
    error: error.message || `${action} failed.`,
    code: error.code || 'DATABASE_ERROR',
    details: error.details || null,
    hint: error.hint || null,
  });
}

/* =====================================
   LOAD CLUBS PAGE CONTENT
===================================== */

router.get('/content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clubs_page_content')
      .select('*');

    if (error) {
      return handleDatabaseError(res, error, 'Loading clubs content');
    }

    return res.json({ data });
  } catch (error) {
    return handleDatabaseError(res, error, 'Loading clubs content');
  }
});

/* =====================================
   LOAD CLUB STATISTICS
===================================== */

router.get('/statistics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clubs_statistics')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return handleDatabaseError(res, error, 'Loading club statistics');
    }

    return res.json({ data });
  } catch (error) {
    return handleDatabaseError(res, error, 'Loading club statistics');
  }
});

/* =====================================
   LOAD ORGANIZATIONS
===================================== */

router.get('/organizations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return handleDatabaseError(res, error, 'Loading organizations');
    }

    return res.json({ data });
  } catch (error) {
    return handleDatabaseError(res, error, 'Loading organizations');
  }
});

/* =====================================
   LOAD COMMITTEES
===================================== */

router.get('/committees', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('committees')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return handleDatabaseError(res, error, 'Loading committees');
    }

    return res.json({ data });
  } catch (error) {
    return handleDatabaseError(res, error, 'Loading committees');
  }
});

/* =====================================
   SAVE CLUBS PAGE CONTENT
===================================== */

router.post('/content', async (req, res) => {
  try {
    const clubsContent = req.body;

    if (
      !clubsContent ||
      typeof clubsContent !== 'object' ||
      Array.isArray(clubsContent)
    ) {
      return res.status(400).json({
        error: 'Invalid clubs content.',
      });
    }

    const updates = Object.entries(clubsContent).map(
      ([section_name, values]) => ({
        section_name,
        title: values?.title ?? null,
        description: values?.description ?? null,
        content: values?.content ?? null,
      })
    );

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No clubs content was provided.',
      });
    }

    const { data, error } = await supabase
      .from('clubs_page_content')
      .upsert(updates, {
        onConflict: 'section_name',
      })
      .select();

    if (error) {
      return handleDatabaseError(res, error, 'Saving clubs content');
    }

    return res.json({
      message: 'Clubs content saved successfully.',
      data,
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Saving clubs content');
  }
});

/* =====================================
   SAVE CLUB STATISTICS
===================================== */

router.post('/statistics', async (req, res) => {
  try {
    const statistics = req.body;

    if (!Array.isArray(statistics)) {
      return res.status(400).json({
        error: 'Statistics must be an array.',
      });
    }

    if (statistics.length === 0) {
      return res.json({
        message: 'No statistics to save.',
        data: [],
      });
    }

    const { data, error } = await supabase
      .from('clubs_statistics')
      .upsert(statistics)
      .select();

    if (error) {
      return handleDatabaseError(res, error, 'Saving club statistics');
    }

    return res.json({
      message: 'Club statistics saved successfully.',
      data,
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Saving club statistics');
  }
});

/* =====================================
   SAVE ORGANIZATIONS
===================================== */

router.post('/organizations', async (req, res) => {
  try {
    const organizations = req.body;

    if (!Array.isArray(organizations)) {
      return res.status(400).json({
        error: 'Organizations must be an array.',
      });
    }

    if (organizations.length === 0) {
      return res.json({
        message: 'No organizations to save.',
        data: [],
      });
    }

    const { data, error } = await supabase
      .from('organizations')
      .upsert(organizations)
      .select();

    if (error) {
      return handleDatabaseError(res, error, 'Saving organizations');
    }

    return res.json({
      message: 'Organizations saved successfully.',
      data,
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Saving organizations');
  }
});

/* =====================================
   SAVE COMMITTEES
===================================== */

router.post('/committees', async (req, res) => {
  try {
    const committees = req.body;

    if (!Array.isArray(committees)) {
      return res.status(400).json({
        error: 'Committees must be an array.',
      });
    }

    const validCommittees = committees
      .filter(
        (committee) =>
          committee.committee_code?.trim() &&
          committee.full_name?.trim()
      )
      .map((committee, index) => ({
        id: committee.id,
        committee_code: committee.committee_code.trim(),
        full_name: committee.full_name.trim(),
        description: committee.description?.trim() || null,
        focus: committee.focus?.trim() || null,
        logo_url: committee.logo_url || null,
        president_name: committee.president_name?.trim() || null,
        adviser_name: committee.adviser_name?.trim() || null,
        display_order: committee.display_order ?? index + 1,
      }));

    const existing = validCommittees.filter(
      (committee) =>
        committee.id &&
        !String(committee.id).startsWith('new-')
    );

    const newRecords = validCommittees
      .filter(
        (committee) =>
          !committee.id ||
          String(committee.id).startsWith('new-')
      )
      .map(({ id, ...record }) => record);

    const savedRecords = [];

    // Update existing committees.
    for (let i = 0; i < existing.length; i += 3) {
      const batch = existing.slice(i, i + 3);

      const { data, error } = await supabase
        .from('committees')
        .upsert(batch, { onConflict: 'id' })
        .select();

      if (error) {
        return handleDatabaseError(
          res,
          error,
          'Updating committees'
        );
      }

      savedRecords.push(...(data || []));
    }

    // Insert new committees.
    for (let i = 0; i < newRecords.length; i += 3) {
      const batch = newRecords.slice(i, i + 3);

      const { data, error } = await supabase
        .from('committees')
        .insert(batch)
        .select();

      if (error) {
        return handleDatabaseError(
          res,
          error,
          'Inserting committees'
        );
      }

      savedRecords.push(...(data || []));
    }

    return res.json({
      message: 'Committees saved successfully.',
      data: savedRecords,
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Saving committees');
  }
});

module.exports = router;
