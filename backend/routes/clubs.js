// routes/clubs.js -> app.use('/api/clubs', require('./routes/clubs'));
const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');
const { getUserId, getOfficerMembership } = require('../utils/clubAccess');

const router = express.Router();

const ROLE_ORDER = ['president', 'vice_president', 'secretary', 'treasurer', 'auditor', 'member'];

// ─── STUDENT ROUTES ───────────────────────────────────────────────────────────

// GET /api/clubs/me -> lightweight check used by student sidebar
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

// GET /api/clubs/me/overview -> everything the student Club dashboard needs
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
      ids.length
        ? supabase.from('profiles').select('id, full_name, email, id_number').in('id', ids)
        : { data: [] },
      ids.length
        ? supabase.from('student_profiles').select('user_id, student_no, program, year_level').in('user_id', ids)
        : { data: [] },
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

// ─── DEAN / ADMIN CLUB MANAGEMENT ─────────────────────────────────────────────

// GET /api/clubs -> list all clubs with their appointed adviser
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name, description, adviser_id, adviser_name, created_at')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const adviserIds = [...new Set((clubs || []).map((c) => c.adviser_id).filter(Boolean))];
    let profileMap = new Map();

    if (adviserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, id_number')
        .in('id', adviserIds);
      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    }

    const enriched = (clubs || []).map((c) => {
      const adv = c.adviser_id ? profileMap.get(c.adviser_id) : null;
      return {
        ...c,
        adviser_name: adv?.full_name || c.adviser_name || null,
        adviser_email: adv?.email || null,
        adviser_id_number: adv?.id_number || null,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('GET /api/clubs ERROR:', err);
    res.status(500).json({ error: 'Failed to load clubs.' });
  }
});

// PUT /api/clubs/:id/adviser -> Dean appoints or removes a faculty adviser for a club
router.put('/:id/adviser', authenticate, async (req, res) => {
  try {
    const callerRole = (req.user.role || '').toLowerCase();
    if (!['dean', 'college_dean', 'admin'].includes(callerRole)) {
      return res.status(403).json({ error: 'Only the Dean or Admin can appoint club advisers.' });
    }

    const { id } = req.params;
    const { adviser_id } = req.body; // pass null or '' to unassign

    if (!adviser_id) {
      const { data, error } = await supabase
        .from('clubs')
        .update({ adviser_id: null, adviser_name: null })
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ club: data });
    }

    // Match by profiles.id OR profiles.user_id
    let { data: faculty } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', adviser_id)
      .maybeSingle();

    if (!faculty) {
      const { data: byUserId } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('user_id', adviser_id)
        .maybeSingle();
      faculty = byUserId;
    }

    if (!faculty) {
      return res.status(404).json({ error: 'Selected faculty member not found.' });
    }

    if (!['faculty', 'department_chair'].includes((faculty.role || '').toLowerCase())) {
      return res.status(400).json({ error: 'Only Faculty or Department Chair accounts can be appointed as club adviser.' });
    }

    const { data, error } = await supabase
      .from('clubs')
      .update({
        adviser_id: faculty.id,
        adviser_name: faculty.full_name,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ club: data });
  } catch (err) {
    console.error('PUT /api/clubs/:id/adviser ERROR:', err);
    res.status(500).json({ error: 'Failed to update club adviser.' });
  }
});

// ─── FACULTY ADVISER ROUTES ───────────────────────────────────────────────────

// GET /api/clubs/adviser/me?clubId=... -> used by FacultyDashboard sidebar & FacultyClubSection
router.get('/adviser/me', authenticate, async (req, res) => {
  try {
    const tokenUserId = getUserId(req) || req.user?.userId || req.user?.id;
    const tokenEmail = req.user?.email || null;

    // Resolve the faculty member's profiles row using id, user_id, or email
    let profile = null;
    if (tokenUserId) {
      const { data: p1 } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', tokenUserId)
        .maybeSingle();
      profile = p1;

      if (!profile) {
        const { data: p2 } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('user_id', tokenUserId)
          .maybeSingle();
        profile = p2;
      }
    }

    if (!profile && tokenEmail) {
      const { data: p3 } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', tokenEmail)
        .maybeSingle();
      profile = p3;
    }

    const candidateIds = [...new Set([tokenUserId, profile?.id].filter(Boolean))];

    let advisedClubs = [];
    if (candidateIds.length > 0) {
      const { data: byId, error: clubErr } = await supabase
        .from('clubs')
        .select('id, name, adviser_id, adviser_name, description')
        .in('adviser_id', candidateIds)
        .order('name', { ascending: true });

      if (clubErr) return res.status(500).json({ error: clubErr.message });
      advisedClubs = byId || [];
    }

    // Fallback by adviser_name if adviser_id wasn't matched
    if (advisedClubs.length === 0 && profile?.full_name) {
      const { data: byName } = await supabase
        .from('clubs')
        .select('id, name, adviser_id, adviser_name, description')
        .ilike('adviser_name', profile.full_name.trim())
        .order('name', { ascending: true });
      advisedClubs = byName || [];
    }

    if (advisedClubs.length === 0) {
      return res.status(404).json({
        error: 'You are not assigned as a club adviser.',
        debug: { tokenUserId, tokenEmail, resolvedProfileId: profile?.id || null },
      });
    }

    const requestedClubId = req.query.clubId ? String(req.query.clubId) : null;
    const activeClub =
      (requestedClubId && advisedClubs.find((c) => c.id === requestedClubId)) ||
      advisedClubs[0];

    // Fetch members
    const { data: rows, error: memErr } = await supabase
      .from('club_members')
      .select('user_id, role, created_at')
      .eq('club_id', activeClub.id);

    if (memErr) return res.status(500).json({ error: memErr.message });

    // Fetch club events (safely ignore if club_events table does not exist yet)
    let events = [];
    const { data: clubEvents, error: evErr } = await supabase
      .from('club_events')
      .select('id, title, description, event_date, start_time, end_time, location')
      .eq('club_id', activeClub.id)
      .order('event_date', { ascending: true });

    if (!evErr && clubEvents) {
      events = clubEvents;
    }

    const ids = (rows || []).map((r) => r.user_id);

    const [{ data: profiles }, { data: studentRows }] = await Promise.all([
      ids.length
        ? supabase.from('profiles').select('id, full_name, email, id_number').in('id', ids)
        : { data: [] },
      ids.length
        ? supabase.from('student_profiles').select('user_id, student_no, program, year_level').in('user_id', ids)
        : { data: [] },
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
      clubs: advisedClubs.map((c) => ({ id: c.id, name: c.name })),
      club: activeClub,
      members,
      events,
    });
  } catch (err) {
    console.error('GET /api/clubs/adviser/me ERROR:', err);
    res.status(500).json({ error: 'Server error while loading advised club.' });
  }
});

// PUT /api/clubs/:id/president -> Adviser assigns/replaces club president by student_no
router.put('/:id/president', authenticate, async (req, res) => {
  try {
    const tokenUserId = getUserId(req) || req.user?.userId || req.user?.id;
    const { id } = req.params;
    const studentNo = String(req.body.student_no || '').trim();

    if (!studentNo) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }

    // Verify caller is the adviser of this club
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, adviser_id, adviser_name')
      .eq('id', id)
      .single();

    if (clubErr || !club) return res.status(404).json({ error: 'Club not found.' });

    let isClubAdviser = club.adviser_id === tokenUserId;
    if (!isClubAdviser && tokenUserId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or(`id.eq.${tokenUserId},user_id.eq.${tokenUserId}`)
        .maybeSingle();

      if (prof) {
        isClubAdviser =
          club.adviser_id === prof.id ||
          (club.adviser_name && prof.full_name?.toLowerCase() === club.adviser_name.toLowerCase());
      }
    }

    if (!isClubAdviser) {
      return res.status(403).json({ error: 'Only the appointed adviser of this club can assign its president.' });
    }

    // Find student by student_no or profiles.id_number
    let targetUserId = null;

    const { data: sp } = await supabase
      .from('student_profiles')
      .select('user_id')
      .eq('student_no', studentNo)
      .maybeSingle();

    if (sp?.user_id) {
      targetUserId = sp.user_id;
    } else {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id_number', studentNo)
        .eq('role', 'student')
        .maybeSingle();
      if (prof?.id) targetUserId = prof.id;
    }

    if (!targetUserId) {
      return res.status(404).json({ error: `No student found with ID "${studentNo}".` });
    }

    // Demote existing president(s) of this club to regular member
    await supabase
      .from('club_members')
      .update({ role: 'member' })
      .eq('club_id', id)
      .eq('role', 'president');

    // Upsert new president
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', id)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingMember) {
      const { error: upErr } = await supabase
        .from('club_members')
        .update({ role: 'president' })
        .eq('club_id', id)
        .eq('user_id', targetUserId);
      if (upErr) return res.status(500).json({ error: upErr.message });
    } else {
      const { error: insErr } = await supabase
        .from('club_members')
        .insert({ club_id: id, user_id: targetUserId, role: 'president' });
      if (insErr) return res.status(500).json({ error: insErr.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/clubs/:id/president ERROR:', err);
    res.status(500).json({ error: 'Failed to assign club president.' });
  }
});

module.exports = router;