// routes/clubAdviserRoutes.js
//
// ADAPT THESE 2 IMPORTS to whatever your backend already uses:
//   - supabase: a supabase-js client using the SERVICE ROLE key
//   - authenticate: your JWT middleware that sets req.user (payload has userId)
const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const SEAT_ORDER = ['president', 'vice_president', 'secretary', 'treasurer', 'auditor', 'member'];

// Is this user an adviser of this club?
async function isAdviserOf(userId, clubId) {
  const { data, error } = await supabase
    .from('club_advisers')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ---------------------------------------------------------------
// GET /api/clubs/adviser/me?clubId=<optional>
// -> { clubs: [{id,name}], club: {...}, members: [...], events: [...] }
// 404 if the user advises no club.
// ---------------------------------------------------------------
router.get('/adviser/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1) All clubs this faculty advises
    const { data: links, error: linkErr } = await supabase
      .from('club_advisers')
      .select('club:clubs!club_advisers_club_id_fkey(id, name, description)')
      .eq('user_id', userId);

    if (linkErr) throw linkErr;

    const clubs = (links || [])
      .map((l) => l.club)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (clubs.length === 0) return res.status(404).json({ club: null, clubs: [] });

    // 2) Pick the requested club (must be one they advise), else the first
    const requested = req.query.clubId;
    const club = clubs.find((c) => c.id === requested) || clubs[0];

    // 3) All advisers of this club (shown as "adviser_name")
    const { data: advRows, error: advErr } = await supabase
      .from('club_advisers')
      .select('profile:profiles!club_advisers_user_id_fkey(full_name)')
      .eq('club_id', club.id);

    if (advErr) throw advErr;

    const adviserNames = (advRows || [])
      .map((r) => r.profile?.full_name)
      .filter(Boolean)
      .sort();

    // 4) Members (with roles)
    const { data: rows, error: memErr } = await supabase
      .from('club_members')
      .select(
        'user_id, role, profile:profiles!club_members_user_id_fkey(full_name, id_number, email, program, year_level)'
      )
      .eq('club_id', club.id);

    if (memErr) throw memErr;

    const members = (rows || [])
      .map((r) => {
        const p = r.profile || {};
        const yl = parseInt(p.year_level, 10);
        return {
          user_id: r.user_id,
          full_name: p.full_name || 'Unknown',
          email: p.email || '',
          student_no: p.id_number || '',
          program: p.program || '',
          year_level: Number.isNaN(yl) ? null : yl,
          role: r.role,
        };
      })
      .sort((a, b) => {
        const d = SEAT_ORDER.indexOf(a.role) - SEAT_ORDER.indexOf(b.role);
        return d !== 0 ? d : a.full_name.localeCompare(b.full_name);
      });

    // 5) Events
    const { data: events, error: evErr } = await supabase
      .from('calendar_events')
      .select('id, title, description, event_date, start_time, end_time, location')
      .eq('club_id', club.id)
      .order('event_date', { ascending: true });

    if (evErr) throw evErr;

    res.json({
      clubs: clubs.map((c) => ({ id: c.id, name: c.name })),
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        adviser_name: adviserNames.join(', ') || null,
      },
      members,
      events: events || [],
    });
  } catch (err) {
    console.error('GET /clubs/adviser/me failed:', err);
    res.status(500).json({ error: 'Failed to load your club.' });
  }
});

// ---------------------------------------------------------------
// PUT /api/clubs/:id/president   body: { student_no }
// Any adviser of the club can assign (or replace) the president
// ---------------------------------------------------------------
router.put('/:id/president', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const clubId = req.params.id;
    const studentNo = String(req.body?.student_no || '').trim();

    if (!studentNo) {
      return res.status(400).json({ error: 'Student ID is required.' });
    }

    // 1) Only an adviser of THIS club may assign
    if (!(await isAdviserOf(userId, clubId))) {
      return res.status(403).json({ error: 'Only an adviser of this club can assign the president.' });
    }

    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubId)
      .maybeSingle();

    if (clubErr) throw clubErr;
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    // 2) Find the student
    const { data: student, error: stuErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id_number', studentNo)
      .eq('role', 'student')
      .maybeSingle();

    if (stuErr) throw stuErr;
    if (!student) {
      return res.status(404).json({ error: 'No student found with that Student ID.' });
    }

    // 3) Demote the current president (if a different person)
    const { error: demoteErr } = await supabase
      .from('club_members')
      .update({ role: 'member' })
      .eq('club_id', clubId)
      .eq('role', 'president')
      .neq('user_id', student.id);

    if (demoteErr) throw demoteErr;

    // 4) Promote existing member, or add as new member with president role
    const { data: existing, error: exErr } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', student.id)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existing) {
      const { error } = await supabase
        .from('club_members')
        .update({ role: 'president' })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('club_members')
        .insert({ club_id: clubId, user_id: student.id, role: 'president' });
      if (error) throw error;
    }

    // 5) Notify the new president (best effort, never blocks the request)
    try {
      await supabase.from('notifications').insert({
        user_id: student.id,
        title: 'You are now a club president',
        message: `You were assigned as president of ${club.name}.`,
        type: 'club_role',
        reference_id: clubId,
        reference_table: 'clubs',
      });
    } catch (_) {
      /* ignore */
    }

    res.json({ success: true, president: { id: student.id, full_name: student.full_name } });
  } catch (err) {
    console.error('PUT /clubs/:id/president failed:', err);
    res.status(500).json({ error: 'Failed to assign president.' });
  }
});

module.exports = router;