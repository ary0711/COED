import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Crown,
  CalendarDays,
  Search,
  Users,
  Loader2,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react';
import { CLUB_ROLE_LABEL } from './ClubDashboard';

const API = 'http://localhost:5000/api';
export const CLUB_ADVISER_ME_URL = `${API}/clubs/adviser/me`;

interface ClubMember {
  user_id: string;
  full_name: string;
  email: string;
  student_no: string;
  program: string;
  year_level: number | string | null;
  role: string;
}

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
}

interface AdviserOverview {
  clubs: { id: string; name: string }[];
  club: { id: string; name: string; adviser_name: string | null; description?: string | null };
  members: ClubMember[];
  events: ClubEvent[];
}

// Same officer seats + colors as the student Club Dashboard
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

const dateOnly = (s: string) => (s ? s.split('T')[0] : '');

function formatTime(t?: string | null): string | null {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  if (isNaN(hh) || m === undefined) return t;
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
}

function timeRange(a?: string | null, b?: string | null) {
  const s = formatTime(a);
  const e = formatTime(b);
  if (s && e) return `${s} – ${e}`;
  return s || 'Time not specified';
}

function formatDate(s: string) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FacultyClubSection() {
  const [data, setData] = useState<AdviserOverview | null>(null);
  const [notAdviser, setNotAdviser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [studentNo, setStudentNo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [clubId, setClubId] = useState<string | null>(null);

  const load = async (silent = false, id: string | null = clubId) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = id ? `${CLUB_ADVISER_ME_URL}?clubId=${encodeURIComponent(id)}` : CLUB_ADVISER_ME_URL;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (res.status === 404) {
        setNotAdviser(true);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load the club.');
        return;
      }
      setNotAdviser(false);
      setData(json);
      setClubId(json.club?.id ?? null);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const switchClub = (id: string) => {
    if (id === clubId) return;
    setSearch('');
    setStudentNo('');
    setAssignMsg(null);
    load(false, id);
  };

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
        (m.student_no || '').toLowerCase().includes(q) ||
        (m.program || '').toLowerCase().includes(q) ||
        (CLUB_ROLE_LABEL[m.role] || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const upcoming = useMemo(
    () =>
      (data?.events ?? [])
        .filter((e) => dateOnly(e.event_date) >= todayStr)
        .sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [data, todayStr]
  );

  const past = useMemo(
    () =>
      (data?.events ?? [])
        .filter((e) => dateOnly(e.event_date) < todayStr)
        .sort((a, b) => b.event_date.localeCompare(a.event_date)),
    [data, todayStr]
  );

  const assignPresident = async () => {
    if (!data) return;
    const no = studentNo.trim();
    if (!no) {
      setAssignMsg({ type: 'error', text: 'Enter the student ID of the new president.' });
      return;
    }
    const current = officerBySeat.get('president');
    if (current && !confirm(`Replace ${current.full_name} as president of ${data.club.name}?`)) return;

    setAssigning(true);
    setAssignMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/clubs/${data.club.id}/president`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_no: no }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to assign president.');

      setStudentNo('');
      setAssignMsg({ type: 'success', text: 'President assigned successfully.' });
      await load(true);
    } catch (err) {
      setAssignMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to assign president.',
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notAdviser) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-semibold text-gray-700">You are not assigned as a club adviser</p>
        <p className="text-xs text-gray-400 mt-1">Ask the Dean or Admin to assign you to a club.</p>
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

  const { club, members } = data;
  const president = officerBySeat.get('president');

  const EventCard = ({ ev, dim }: { ev: ClubEvent; dim?: boolean }) => (
    <div
      className={`p-4 rounded-xl border border-gray-100 border-l-4 ${dim ? 'bg-gray-50 opacity-80' : 'bg-gray-50'}`}
      style={{ borderLeftColor: dim ? '#9CA3AF' : '#10B981' }}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-bold text-gray-900">{ev.title}</h4>
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {formatDate(dateOnly(ev.event_date))}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeRange(ev.start_time, ev.end_time)}
        </span>
        {ev.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {ev.location}
          </span>
        )}
      </div>
      {ev.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ev.description}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Club Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Oversee {club.name}: assign the president and review events, officers, and members.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-colors"
          title="Refresh"
          aria-label="Refresh club"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Guild switcher (only when advising more than one) ── */}
      {data.clubs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">Your guilds:</span>
          {data.clubs.map((c) => (
            <button
              key={c.id}
              onClick={() => switchClub(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                c.id === club.id
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Summary cards: club / president / upcoming events ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Club</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{club.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4">
            <Crown className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Club president</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">
            {president ? president.full_name : 'Not assigned'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {president ? president.student_no || 'President of ' + club.name : 'Assign one below'}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-4">
            <CalendarDays className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Upcoming events</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{upcoming.length}</p>
          <p className="text-xs text-gray-500 mt-1">{past.length} past {past.length === 1 ? 'event' : 'events'}</p>
        </div>
      </div>

      {/* ── Assign president (adviser only) ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {president ? 'Replace club president' : 'Assign club president'}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          The president can then post activities for {club.name} from their own Club tab.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:max-w-xl">
          <input
            value={studentNo}
            onChange={(e) => {
              setStudentNo(e.target.value);
              setAssignMsg(null);
            }}
            placeholder="Student ID, e.g. 2023-00123"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={assignPresident}
            disabled={assigning}
            className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {assigning ? 'Saving...' : president ? 'Replace' : 'Assign'}
          </button>
        </div>
        {assignMsg && (
          <p
            className={`mt-3 text-xs p-2.5 rounded-lg border ${
              assignMsg.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}
          >
            {assignMsg.text}
          </p>
        )}
      </section>

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

      {/* ── Events ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Club events</h2>
            <p className="text-xs text-gray-500">Activities posted by {club.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500">Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {upcoming.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500">Past ({past.length})</h3>
            {past.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl">
                No past events.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {past.map((ev) => (
                  <EventCard key={ev.id} ev={ev} dim />
                ))}
              </div>
            )}
          </div>
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