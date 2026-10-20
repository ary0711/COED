import { useEffect, useMemo, useState } from 'react';
import { Shield, UserCheck, GraduationCap, Search, Users, Loader2, RefreshCw } from 'lucide-react';

const CLUB_OVERVIEW_URL = 'http://localhost:5000/api/clubs/me/overview';

export interface ClubAccess {
  isOfficer: boolean;
  clubId?: string;
  clubName?: string;
  role?: string;
}

interface ClubMember {
  user_id: string;
  full_name: string;
  email: string;
  student_no: string;
  program: string;
  year_level: number | null;
  role: string;
}

interface ClubOverview {
  club: { id: string; name: string; adviser_name: string | null };
  myRole: string;
  members: ClubMember[];
}

export const CLUB_ROLE_LABEL: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  auditor: 'Auditor',
  member: 'Member',
};

// The five officer seats shown in the officer strip
const OFFICER_SEATS = ['president', 'vice_president', 'secretary', 'treasurer', 'auditor'];

const ROLE_STYLE: Record<string, { ring: string; chip: string; avatar: string }> = {
  president:      { ring: 'border-blue-200',    chip: 'bg-blue-100 text-blue-800',       avatar: 'bg-[#1E3A8A] text-white' },
  vice_president: { ring: 'border-indigo-200',  chip: 'bg-indigo-100 text-indigo-800',   avatar: 'bg-indigo-500 text-white' },
  secretary:      { ring: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-800', avatar: 'bg-emerald-500 text-white' },
  treasurer:      { ring: 'border-amber-200',   chip: 'bg-amber-100 text-amber-800',     avatar: 'bg-amber-500 text-white' },
  auditor:        { ring: 'border-purple-200',  chip: 'bg-purple-100 text-purple-800',   avatar: 'bg-purple-500 text-white' },
  member:         { ring: 'border-gray-100',    chip: 'bg-gray-100 text-gray-700',       avatar: 'bg-gray-200 text-gray-600' },
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'U';

export function ClubDashboard() {
  const [data, setData] = useState<ClubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(CLUB_OVERVIEW_URL, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load the club.');
        return;
      }
      setData(json);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const officerBySeat = useMemo(() => {
    const map = new Map<string, ClubMember>();
    (data?.members ?? []).forEach((m) => {
      if (OFFICER_SEATS.includes(m.role) && !map.has(m.role)) map.set(m.role, m);
    });
    return map;
  }, [data]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.members ?? [];
    if (!q) return all;
    return all.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.student_no.toLowerCase().includes(q) ||
        m.program.toLowerCase().includes(q) ||
        (CLUB_ROLE_LABEL[m.role] || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
        {error || 'Club information is unavailable.'}
      </div>
    );
  }

  const { club, myRole, members } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Club Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your club and see who belongs to it.</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-colors"
          title="Refresh"
          aria-label="Refresh club"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Summary cards: club / your position / adviser ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Club</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{club.name}</p>
          <p className="text-xs text-gray-500 mt-1">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Your position</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">
            {CLUB_ROLE_LABEL[myRole] || myRole}
          </p>
          <p className="text-xs text-gray-500 mt-1">You can post activities for {club.name}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Club adviser</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">
            {club.adviser_name || 'Not assigned'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Faculty adviser of {club.name}</p>
        </div>
      </div>

      {/* ── Officers ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Club officers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {OFFICER_SEATS.map((seat) => {
            const person = officerBySeat.get(seat);
            const style = ROLE_STYLE[seat];
            return (
              <div
                key={seat}
                className={`rounded-xl border ${style.ring} p-4 flex flex-col items-center text-center ${
                  person ? 'bg-white' : 'bg-gray-50 border-dashed'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3 ${
                    person ? style.avatar : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {person ? initials(person.full_name) : '?'}
                </div>
                <p className={`text-sm font-semibold truncate max-w-full ${person ? 'text-gray-900' : 'text-gray-400'}`}>
                  {person ? person.full_name : 'Vacant'}
                </p>
                <span className={`mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${style.chip}`}>
                  {CLUB_ROLE_LABEL[seat]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Masterlist ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1E3A8A]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Masterlist</h2>
              <p className="text-xs text-gray-500">All members of {club.name}</p>
            </div>
            <span className="ml-1 px-2.5 py-0.5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-full">
              {members.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, or program"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 bg-gray-50/70">
                <th className="px-5 sm:px-6 py-3 w-12">#</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Student ID</th>
                <th className="px-3 py-3">Program</th>
                <th className="px-3 py-3">Year</th>
                <th className="px-5 sm:px-6 py-3">Position</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400">
                    {members.length === 0 ? 'No members yet.' : 'No members match your search.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, i) => (
                  <tr key={m.user_id} className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 sm:px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            (ROLE_STYLE[m.role] || ROLE_STYLE.member).avatar
                          }`}
                        >
                          {initials(m.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{m.full_name}</p>
                          {m.email && <p className="text-xs text-gray-500 truncate">{m.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{m.student_no || '—'}</td>
                    <td className="px-3 py-3 text-gray-700">{m.program || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{m.year_level ? `${m.year_level}` : '—'}</td>
                    <td className="px-5 sm:px-6 py-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          (ROLE_STYLE[m.role] || ROLE_STYLE.member).chip
                        }`}
                      >
                        {CLUB_ROLE_LABEL[m.role] || m.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}