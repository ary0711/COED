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

  // ── DEAN / ADMIN AGGREGATE STATS (Aligned with QPRO Standard) ──
  if (userRole === 'dean' || userRole === 'admin' || userRole === 'college_dean') {
    try {
      // 1. Fetch total registered alumni count as official denominator
      const { count: totalAlumniCount, error: countErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumni');

      if (countErr) throw countErr;

      // 2. Fetch all survey answers
      const { data: surveys, error: surveyErr } = await supabase
        .from('graduate_tracer_survey')
        .select('employment_status, relevance, is_completed');

      if (surveyErr) throw surveyErr;

      const totalResponses = surveys ? surveys.length : 0;
      const totalGraduates = totalAlumniCount || totalResponses;

      const employed = (surveys || []).filter(
        (s) => (s.employment_status || '').toLowerCase() === 'employed' || 
               (s.employment_status || '').toLowerCase() === 'self-employed'
      ).length;

      const relevant = (surveys || []).filter(
        (s) => s.relevance === 'very-relevant' || s.relevance === 'relevant'
      ).length;

      return res.json({
        totalGraduates,
        totalResponses,
        employedCount: employed,
        // QPRO Outcome Indicator 2 Formula: Employed / Total Graduates
        employmentRate: totalGraduates > 0 ? Math.round((employed / totalGraduates) * 100) : 0,
        alignmentRate: totalResponses > 0 ? Math.round((relevant / totalResponses) * 100) : 0,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
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

// GET /api/tracer-survey/all (Dean/Admin view all records merged with alumni profiles)
router.get('/all', authenticate, async (req, res) => {
  const userRole = (req.user.role || '').toLowerCase();
  if (userRole !== 'dean' && userRole !== 'admin' && userRole !== 'college_dean') {
    return res.status(403).json({ error: 'Access denied: Dean privilege required.' });
  }

  try {
    // 1. Fetch all registered alumni profiles (Name, Program, ID)
    const { data: alumniProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, id_number, full_name, program, department, created_at')
      .eq('role', 'alumni')
      .order('full_name', { ascending: true });

    if (profileError) throw profileError;

    // 2. Fetch all tracer survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from('graduate_tracer_survey')
      .select('*');

    if (surveyError) throw surveyError;

    // Map survey entries by both id_number and user_id/alumni_id
    const surveyMap = new Map();
    (surveyData || []).forEach((s) => {
      if (s.alumni_id) surveyMap.set(String(s.alumni_id).trim(), s);
      if (s.user_id) surveyMap.set(String(s.user_id).trim(), s);
    });

    // 3. Merge every graduate with their survey response (or mark as Not Tracked)
    const mergedRecords = (alumniProfiles || []).map((prof) => {
      const survey = surveyMap.get(String(prof.id_number).trim()) || 
                     surveyMap.get(String(prof.id).trim());

      // Cleanly split full_name into Last Name and First Name
      const cleanFullName = (prof.full_name || '').trim();
      const parts = cleanFullName.split(' ');
      let lastName = '—';
      let firstName = cleanFullName || '—';
      if (parts.length > 1) {
        lastName = parts.pop();
        firstName = parts.join(' ');
      } else if (cleanFullName) {
        lastName = cleanFullName;
      }

      // Map raw employment status to QPRO standards
      let normalizedStatus = 'Not Tracked';
      if (survey?.employment_status) {
        const st = survey.employment_status.toLowerCase();
        if (st === 'employed' || st === 'self-employed') {
          normalizedStatus = 'Employed';
        } else if (st === 'unemployed') {
          normalizedStatus = 'Unemployed';
        }
      }

      const programName = prof.program || prof.department || 'BACHELOR OF ELEMENTARY EDUCATION';

      return {
        id: prof.id,
        alumni_id: prof.id_number || prof.id,
        program: programName,
        last_name: lastName.toUpperCase(),
        first_name: firstName.toUpperCase(),
        employment_status: normalizedStatus,
        employer: survey?.employer || survey?.company_name || null,
        job_title: survey?.job_title || null,
        relevance: survey?.relevance || null,
        supporting_docs: `${programName} Batch 2024`,
        post_graduate_degree: survey?.post_graduate_degree || (survey?.employment_status === 'further-study' ? 'Post-Graduate Studies' : '—'),
        updated_at: survey?.updated_at || prof.created_at,
      };
    });

    return res.json(mergedRecords);
  } catch (error) {
    console.error('Error fetching QPRO tracer masterlist:', error);
    return res.status(500).json({ error: error.message });
  }
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