// routes/tracerSurvey.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

function requireAlumniId(req, res) {
  const alumniId = req.user.alumniId || req.user.idNumber;
  if (!alumniId) {
    res.status(400).json({ error: 'No alumni ID on this account. Contact support to have your profile linked.' });
    return null;
  }
  return alumniId;
}

// GET /api/tracer-survey/mine (Alumni personal survey)
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

// GET /api/tracer-survey/dashboard-stats (Dual-mode: Alumni vs Dean/Admin)
router.get('/dashboard-stats', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();

  // ── DEAN / ADMIN AGGREGATE STATS ──
  if (userRole === 'dean' || userRole === 'admin' || userRole === 'college_dean') {
    const { data: surveys, error } = await supabase
      .from('graduate_tracer_survey')
      .select('employment_status, relevance, is_completed');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalResponses = surveys.length;
    const employed = surveys.filter(
      (s) => s.employment_status === 'employed' || s.employment_status === 'self-employed'
    ).length;
    const relevant = surveys.filter(
      (s) => s.relevance === 'very-relevant' || s.relevance === 'relevant'
    ).length;

    return res.json({
      totalResponses,
      employedCount: employed,
      employmentRate: totalResponses > 0 ? Math.round((employed / totalResponses) * 100) : 0,
      alignmentRate: totalResponses > 0 ? Math.round((relevant / totalResponses) * 100) : 0,
    });
  }

  // ── ALUMNI PERSONAL STATS ──
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

// GET /api/tracer-survey/all (Dean/Admin view all records)
router.get('/all', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();
  if (userRole !== 'dean' && userRole !== 'admin' && userRole !== 'college_dean') {
    return res.status(403).json({ error: 'Access denied: Dean privilege required.' });
  }

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data ?? []);
});

// POST /api/tracer-survey (First-time save)
router.post('/', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { employment_status, job_title, employer, years_employed, monthly_salary, relevance } = req.body;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .insert({
      alumni_id: alumniId,
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

// PUT /api/tracer-survey (Update existing survey)
router.put('/', authenticate, async (req, res) => {
  const alumniId = requireAlumniId(req, res);
  if (!alumniId) return;

  const { employment_status, job_title, employer, years_employed, monthly_salary, relevance } = req.body;

  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .update({ 
      employment_status, 
      job_title, 
      employer, 
      years_employed, 
      monthly_salary, 
      relevance,
      updated_at: new Date().toISOString() 
    })
    .eq('alumni_id', alumniId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

module.exports = router;