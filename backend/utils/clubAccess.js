// utils/clubAccess.js
const supabase = require('../supabaseClient');

// Only these roles can see the Club section and post club events
const OFFICER_ROLES = ['president', 'vice_president', 'secretary'];

function getUserId(req) {
  return req.user.profileId || req.user.userId || req.user.id;
}

// Returns { club_id, role, club: {id, name, adviser_name} } or null
async function getOfficerMembership(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id, role, clubs ( id, name, adviser_name )')
    .eq('user_id', userId)
    .in('role', OFFICER_ROLES)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { club_id: row.club_id, role: row.role, club: row.clubs };
}

// Every club the user belongs to (any role) -> used to show club events
async function getMemberClubIds(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);
  return (data || []).map((r) => r.club_id);
}

module.exports = { OFFICER_ROLES, getUserId, getOfficerMembership, getMemberClubIds };