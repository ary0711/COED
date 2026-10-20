// routes/clubs.js   ->  app.use('/api/clubs', require('./routes/clubs'));
const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');
const { getUserId, getOfficerMembership } = require('../utils/clubAccess');

const router = express.Router();

const ROLE_ORDER = ['president', 'vice_president', 'secretary', 'treasurer', 'auditor', 'member'];

// GET /api/clubs/me  -> lightweight check used by the sidebar
router.get('/me', authenticate, async (req, res) => {
  try {
    if ((req.user.role || '').toLowerCase() !== 'student') {
      return res.json({ isOfficer: false });
    }
    const m = await getOfficerMembership(getUserId(req));
    if (!m) return res.json({ isOfficer: false });

    res.json({
      isOfficer: true,
      clubId: m.club_id,
      clubName: m.club?.name || '',
      role: m.role,
    });
  } catch (err) {
    console.error('GET /api/clubs/me ERROR:', err);
    res.status(500).json({ error: 'Could not load club access.' });
  }
});

// GET /api/clubs/me/overview -> everything the Club dashboard needs
router.get('/me/overview', authenticate, async (req, res) => {
  try {
    const m = await getOfficerMembership(getUserId(req));
    if (!m) return res.status(403).json({ error: 'Only club officers can open the club dashboard.' });

    const { data: rows, error } = await supabase
      .from('club_members')
      .select('user_id, role, created_at')
      .eq('club_id', m.club_id);
    if (error) return res.status(500).json({ error: error.message });

    const ids = (rows || []).map((r) => r.user_id);

    const [{ data: profiles }, { data: studentRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, id_number').in('id', ids),
      supabase.from('student_profiles').select('user_id, student_no, program, year_level').in('user_id', ids),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const studentMap = new Map((studentRows || []).map((s) => [s.user_id, s]));

    const members = (rows || [])
      .map((r) => {
        const p = profileMap.get(r.user_id) || {};
        const s = studentMap.get(r.user_id) || {};
        return {
          user_id: r.user_id,
          full_name: p.full_name || 'Unnamed member',
          email: p.email || '',
          student_no: s.student_no || p.id_number || '',
          program: s.program || '',
          year_level: s.year_level || null,
          role: r.role,
        };
      })
      .sort((a, b) => {
        const d = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
        return d !== 0 ? d : a.full_name.localeCompare(b.full_name);
      });

    res.json({
      club: m.club,
      myRole: m.role,
      members,
    });
  } catch (err) {
    console.error('GET /api/clubs/me/overview ERROR:', err);
    res.status(500).json({ error: 'Server error while loading the club.' });
  }
});

module.exports = router;