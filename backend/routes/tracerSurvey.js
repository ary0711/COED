// routes/tracerSurvey.js
//
// All reads/writes for graduate_tracer_survey go through here,
// authenticated via JWT, using the service-role Supabase client.
//
// Your login route (routes/auth.js) already puts idNumber directly into
// the JWT payload (sourced from profiles.id_number), so authenticate
// middleware exposes it as req.user.idNumber on every request — no
// extra database lookup needed here.

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

function requireAlumniId(req, res) {
  // Prefers alumniId (sourced directly from users.alumni_id at login) —
  // falls back to idNumber (sourced from the profiles table) in case
  // an older token or a different login path only set that instead.
  const alumniId = req.user.alumniId || req.user.idNumber;
  if (!alumniId) {
    res.status(400).json({ error: 'No alumni ID on this account. Contact support to have your profile linked.' });
    return null;
  }
  return alumniId;
}

// GET /api/tracer-survey/mine
router.get('/mine', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .select('*')
    .eq('alumni_id', alumniId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? null);
});

// GET /api/tracer-survey/dashboard-stats
router.get('/dashboard-stats', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .select('employment_status, is_completed, updated_at')
    .eq('alumni_id', alumniId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({
    surveyStatus: data?.is_completed ? 'Completed' : 'Not Started',
    employmentStatus: data?.employment_status
      ? data.employment_status.charAt(0).toUpperCase() + data.employment_status.slice(1)
      : 'Not Set',
    lastUpdated: data?.updated_at || null,
    membershipStatus: 'Active',
  });
});

// POST /api/tracer-survey  (first-time save)
router.post('/', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { employment_status, job_title, employer, years_employed, monthly_salary, relevance } = req.body;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .insert({
      alumni_id: alumniId, // always server-derived from the JWT, never trusted from the body
      employment_status,
      job_title,
      employer,
      years_employed,
      monthly_salary,
      relevance,
      is_completed: true,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data);
});

// PUT /api/tracer-survey  (update existing survey)
router.put('/', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { employment_status, job_title, employer, years_employed, monthly_salary, relevance } = req.body;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .update({ employment_status, job_title, employer, years_employed, monthly_salary, relevance })
    .eq('alumni_id', alumniId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

module.exports = router;