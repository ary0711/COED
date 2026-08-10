import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  FileCheck2,
  ClipboardList,
  Megaphone,
  GraduationCap,
  CheckCircle,
  Clock,
  Plus,
  Download,
  ArrowLeft,
  Menu,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  Filter,
  Upload,
  FileSpreadsheet,
  Trash2,
  Bell,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';

// NOTE: These two components already exist in your Faculty dashboard folder.
// Update the import path below if your project structure places them elsewhere
// (e.g. '../faculty/AccomplishmentReport').
import { AccomplishmentReport } from './dashboards/AccomplishmentReport';
import { ExtensionReport } from './dashboards/ExtensionReport';

// NOTE: adjust this path to match where supabaseClient.ts actually lives
// relative to this file (per your project it's a named export `supabase`
// from src/supabaseClient.ts).
import { supabase } from '../supabaseClient';


const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           id: 'dashboard' },
  { icon: Calendar,        label: 'Department Calendar', id: 'calendar' },
  { icon: Users,           label: 'Faculty Monitoring',  id: 'faculty' },
  { icon: FileCheck2,      label: 'Reports',             id: 'chairReports' },
  { icon: FileText,        label: 'Reports Monitoring',  id: 'reports' },
  { icon: ClipboardList,   label: 'Academic Records',    id: 'records' },
  { icon: Megaphone,       label: 'Announcements',       id: 'announcements' },
  { icon: UserCheck,       label: 'Student Approvals',   id: 'approvals' },
];

interface DepartmentChairDashboardProps {
  onRoleChange?: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Mirrors public.calendar_events exactly.
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;   // timestamptz, stored/read as "YYYY-MM-DDTHH:mm:ss"
  end_date: string | null;
  location: string | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam';
  organizer_id: string | null;
  department: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

// Mirrors public.profiles (role='student') joined with public.student_profiles.
// NOTE: profiles.status uses 'pending' / 'active' / 'rejected' in the DB.
// The UI labels 'active' as "Approved" for readability, but the value we
// read/write is always 'active', never 'approved'.
interface StudentApplicant {
  id: string;              // profiles.id (uuid)
  name: string;
  email: string;
  studentId: string;
  program: string;
  yearLevel: string;
  registeredAt: string;
  status: 'pending' | 'active' | 'rejected';
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DepartmentChairDashboard({ activeMenuItem, setActiveMenuItem }: DepartmentChairDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Kuhaon ang userId gikan sa JWT token, susama sa Faculty Dashboard,
  // para magamit sa Chair's own Reports (Accomplishment / Extension) tab
  // ug isip organizer_id sa calendar_events.
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : '';

  // The logged-in chair's own identity, pulled from their `profiles` row —
  // NOT hardcoded. `department` holds the program code this chair owns
  // ('BEEd' | 'BTLEd' | 'BSEd'), which is what scopes Student Approvals
  // to only the students registered under that same program.
  const [chairName, setChairName] = useState('Department Chair');
  const [chairDepartment, setChairDepartment] = useState<string | null>(null);
  const [chairLoading, setChairLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setChairLoading(false); return; }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, department')
        .eq('id', userId)
        .maybeSingle();

      if (!cancelled) {
        if (!error && data) {
          setChairName(data.full_name ?? 'Department Chair');
          setChairDepartment(data.department ?? null);
        }
        setChairLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={chairMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Department Chair"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="hidden lg:block w-64 shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader userRole="Department Chair" userName={chairName} />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {activeMenuItem === 'dashboard'   && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'calendar'    && <DepartmentCalendar organizerId={userId} />}
          {activeMenuItem === 'faculty'     && <FacultyMonitoring />}
          {activeMenuItem === 'chairReports' && <ChairReportsView userId={userId} userName={chairName} />}
          {activeMenuItem === 'reports'     && <ReportsMonitoring />}
          {activeMenuItem === 'records'     && <AcademicRecordsView />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
          {activeMenuItem === 'approvals'   && (
            chairLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading your department…</span>
              </div>
            ) : !chairDepartment ? (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Your account isn't linked to a program yet, so student approvals can't be scoped to your department.
                Please contact the registrar to have your <code>department</code> value set.
              </div>
            ) : (
              <StudentApprovalsView chairDepartment={chairDepartment} />
            )
          )}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard Overview
───────────────────────────────────────────── */
function ChairDashboardView({ setActiveMenuItem }: { setActiveMenuItem: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
        <p className="text-gray-600">Computer Science Department Overview</p>
      </div>

      <div className="mb-6">
        <div
          className="flex gap-3 overflow-x-auto pb-2 sm:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {[
            { title: 'Total Faculty',       value: '18', icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE', trend: '2', trendUp: true },
            { title: 'Submitted Reports',   value: '14', icon: CheckCircle,   iconColor: '#10B981', iconBgColor: '#D1FAE5' },
            { title: 'Pending Reports',     value: '4',  icon: Clock,         iconColor: '#F59E0B', iconBgColor: '#FEF3C7' },
            { title: 'Upcoming Activities', value: '6',  icon: Calendar,      iconColor: '#8B5CF6', iconBgColor: '#EDE9FE' },
          ].map((card) => (
            <div key={card.title} className="flex-shrink-0 w-44">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard title="Total Faculty"       value="18" icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="2" trendUp={true} />
          <SummaryCard title="Submitted Reports"   value="14" icon={CheckCircle}   iconColor="#10B981" iconBgColor="#D1FAE5" />
          <SummaryCard title="Pending Reports"     value="4"  icon={Clock}         iconColor="#F59E0B" iconBgColor="#FEF3C7" />
          <SummaryCard title="Upcoming Activities" value="6"  icon={Calendar}      iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <NotificationsPanel userType="chair" />

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveMenuItem('reports')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">View Faculty Reports</div>
              <div className="text-sm text-gray-600">Check submission status</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('approvals')}
              className="w-full p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Review Student Registrations</div>
              <div className="text-sm text-gray-600">Pending approvals for your program</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('calendar')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Add Department Event</div>
              <div className="text-sm text-gray-600">Schedule activities</div>
            </button>
          </div>
        </div>
      </div>

      <FacultyMonitoringTable />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Department Calendar (full interactive, backed by
   public.calendar_events via Supabase)
───────────────────────────────────────────── */

// BSEd-Math and BSEd-English were merged into a single BSEd program.
const PROGRAMS = ['BEEd', 'BTLEd', 'BSEd'];
const PROGRAM_OPTIONS = ['All Programs', ...PROGRAMS];

const COLOR_OPTIONS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#1E3A8A'];

// calendar_events.event_type is constrained to meeting/activity/deadline/holiday/exam
// (nullable). The modal's color swatches are kept exactly as-is, so each color is
// mapped to the closest matching type for storage; the one swatch with no natural
// match (#1E3A8A) is simply stored with a null event_type and falls back to that
// same color on redraw, so nothing is visually lost.
const TYPE_TO_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};
const DEFAULT_EVENT_COLOR = '#1E3A8A';

function eventTypeForColor(color: string): CalendarEvent['event_type'] | null {
  const entry = Object.entries(TYPE_TO_COLOR).find(([, c]) => c === color);
  return entry ? (entry[0] as CalendarEvent['event_type']) : null;
}

function colorForEvent(ev: CalendarEvent): string {
  return (ev.event_type && TYPE_TO_COLOR[ev.event_type]) || DEFAULT_EVENT_COLOR;
}

// Writes (insert/delete) go through the Express backend so the request is
// authenticated with the chair's JWT and the insert runs with the service
// role, bypassing RLS. Reads still go straight through Supabase since the
// calendar is open for anyone to view.
// Adjust this if your Express server runs on a different host/port.
const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

// event_date / end_date are stored as "YYYY-MM-DDTHH:mm:ss" (no timezone
// suffix), so Postgres interprets them using the column/session timezone
// instead of shifting the calendar date around the browser's local offset.
// We always pull the date portion back out the same way, via string slicing,
// so the day a user picks is always the day it lands on and shows up on.
function dateOnly(isoLike: string): string {
  return isoLike.split('T')[0];
}

function toTimestamp(dateStr: string): string {
  return `${dateStr}T00:00:00`;
}

interface DepartmentCalendarProps {
  organizerId: string;
}

function DepartmentCalendar({ organizerId }: DepartmentCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyForm = { title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const monthName    = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth  = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay     = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // ── Fetch events from Supabase ──
  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      setLoadError('Failed to load events: ' + error.message);
      setEvents([]);
    } else {
      setEvents((data ?? []) as CalendarEvent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => dateOnly(e.event_date) === dateStr);
  };

  const upcomingEvents = events
    .filter(e => dateOnly(e.event_date) >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const historyEvents = events
    .filter(e => dateOnly(e.event_date) < todayStr)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
  };

  const handleAddEvent = async () => {
    setFormError('');
    if (!form.title.trim()) { setFormError('Event title is required.'); return; }
    if (!form.date)          { setFormError('Please select a date.'); return; }

    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: toTimestamp(form.date),
      department: form.program,
      event_type: eventTypeForColor(form.color),
      status: 'upcoming',
    };

    const token = localStorage.getItem('token');
    let res: Response;
    try {
      res = await fetch(CALENDAR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      setSubmitting(false);
      setFormError('Could not reach the server. Please try again.');
      return;
    }

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setFormError('Failed to save event: ' + (err.error || res.statusText));
      return;
    }

    const data = await res.json();
    setEvents(prev => [...prev, data as CalendarEvent]);
    resetForm();
    setShowModal(false);
  };

  const deleteEvent = async (id: string) => {
    setDeletingId(id);
    const token = localStorage.getItem('token');
    let res: Response;
    try {
      res = await fetch(`${CALENDAR_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      setDeletingId(null);
      setLoadError('Could not reach the server. Please try again.');
      return;
    }
    setDeletingId(null);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLoadError('Failed to delete event: ' + (err.error || res.statusText));
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const DAYS       = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
          <p className="text-gray-500 text-sm mt-1">Manage events and track activity history</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr  = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday  = dateStr === todayStr;
              const isPast   = dateStr < todayStr;
              return (
                <div key={day} className={`min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-100 p-1 sm:p-1.5 ${isPast ? 'bg-gray-50/60' : 'bg-white'}`}>
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                    isToday ? 'bg-[#1E3A8A] text-white' : isPast ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 1).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded truncate text-white hidden sm:block"
                        style={{ backgroundColor: colorForEvent(ev) }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {/* Mobile: colored dots */}
                    {dayEvents.length > 0 && (
                      <div className="sm:hidden flex gap-0.5 flex-wrap px-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorForEvent(ev) }} />
                        ))}
                      </div>
                    )}
                    {dayEvents.length > 1 && (
                      <div className="text-[9px] text-gray-400 px-1 hidden sm:block">+{dayEvents.length - 1} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming / History Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['upcoming', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `History (${historyEvents.length})`}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-6">Loading…</p>
          ) : (activeTab === 'upcoming' ? upcomingEvents : historyEvents).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No events found.</p>
          ) : (
            (activeTab === 'upcoming' ? upcomingEvents : historyEvents).map(ev => (
              <div
                key={ev.id}
                className="flex items-start justify-between gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                style={{ borderLeftWidth: 4, borderLeftColor: colorForEvent(ev) }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{ev.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(dateOnly(ev.event_date))} · {ev.department}</div>
                  {ev.description && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</div>}
                </div>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  disabled={deletingId === ev.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 disabled:opacity-40"
                  title="Remove event"
                >
                  {deletingId === ev.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Event</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Faculty Meeting"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={form.program}
                  onChange={e => setForm({ ...form, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                >
                  {PROGRAM_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Saving…' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Student Approvals
   — Real data: fetched from GET /api/students (profiles + student_profiles)
   — Scoped to the logged-in chair's own program (chairDepartment)
   — Approve/Reject write via PATCH /api/students/:id/status
   — Batch approve via file is still UI-only (marked below)
───────────────────────────────────────────── */

const STUDENTS_API_URL = 'http://localhost:5000/api/students';

interface StudentApprovalsViewProps {
  // The logged-in chair's own program code ('BEEd' | 'BTLEd' | 'BSEd'),
  // taken from their profiles.department value. Only students whose
  // `program` matches this are shown or actionable here.
  chairDepartment: string;
}

function StudentApprovalsView({ chairDepartment }: StudentApprovalsViewProps) {
  const [students, setStudents] = useState<StudentApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Batch upload state ──
  const [showUploadModal, setShowUploadModal]   = useState(false);
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null);
  const [uploadDragOver, setUploadDragOver]     = useState(false);
  const [uploadError, setUploadError]           = useState('');
  const [uploadSuccess, setUploadSuccess]       = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const ACCEPTED_EXT = ['.pdf', '.xls', '.xlsx'];

  // ── Fetch real students from the backend, then scope to this chair's program ──
  // The /api/students endpoint currently returns every pending/active/rejected
  // student system-wide — it has no department awareness. Until that endpoint
  // is updated to accept a program filter server-side, we filter on the client
  // right after the fetch so a chair can never see (or approve/reject) a
  // student outside their own program, no matter what the backend returns.
  const fetchStudents = async () => {
    setLoading(true);
    setLoadError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(STUDENTS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load students: ' + (err.error || res.statusText));
        setStudents([]);
        return;
      }
      const data = await res.json();
      const mapped: StudentApplicant[] = (data ?? [])
        .map((p: any) => {
          const yl = p.student_profiles?.year_level ?? 1;
          const suffix = yl === 1 ? 'st' : yl === 2 ? 'nd' : yl === 3 ? 'rd' : 'th';
          return {
            id: p.id,
            name: p.full_name ?? '—',
            email: p.email ?? '—',
            studentId: p.student_profiles?.student_no ?? '—',
            program: p.student_profiles?.program ?? '—',
            yearLevel: `${yl}${suffix} Year`,
            registeredAt: new Date(p.created_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            }),
            status: p.status,
          };
        })
        .filter((s: StudentApplicant) => s.program === chairDepartment);
      setStudents(mapped);
    } catch (err) {
      setLoadError('Could not reach the server. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chairDepartment]);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.some(e => file.name.toLowerCase().endsWith(e))) {
      setUploadError('Only PDF and Excel files (.pdf, .xls, .xlsx) are accepted.');
      setUploadedFile(null);
      return false;
    }
    setUploadError('');
    setUploadedFile(file);
    return true;
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateFile(file);
  };

  // NOTE: still UI-only. Wiring this to real matching means parsing the
  // uploaded PDF/Excel on the backend, matching rows against `profiles`
  // (scoped to chairDepartment as well), and looping matched ids through
  // the same PATCH /api/students/:id/status route used below. Left as a
  // separate follow-up task.
  const handleBatchApprove = () => {
    setBatchConfirmOpen(false);
    setUploadedFile(null);
    setUploadSuccess(true);
    setShowUploadModal(false);
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  // ── Real approve/reject, backed by the PATCH endpoint ──
  const updateStatus = async (id: string, status: 'active' | 'rejected') => {
    setUpdatingId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${STUDENTS_API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to update status: ' + (err.error || res.statusText));
        return;
      }
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (err) {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const approve = (id: string) => updateStatus(id, 'active');
  const reject  = (id: string) => updateStatus(id, 'rejected');

  const handleConfirm = () => {
    if (!confirmModal) return;
    confirmModal.action === 'approve' ? approve(confirmModal.id) : reject(confirmModal.id);
    setConfirmModal(null);
  };

  const filtered = students.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.studentId.toLowerCase().includes(search.toLowerCase()) ||
                        s.program.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    pending:  students.filter(s => s.status === 'pending').length,
    approved: students.filter(s => s.status === 'active').length,
    rejected: students.filter(s => s.status === 'rejected').length,
  };

  const statusBadge = (status: StudentApplicant['status']) => ({
    pending:  'bg-amber-100 text-amber-700',
    active:   'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[status]);

  const statusLabel = (status: StudentApplicant['status']) =>
    status === 'active' ? 'approved' : status;

  const fileIcon = (file: File) =>
    file.name.toLowerCase().endsWith('.pdf')
      ? <FileText className="w-8 h-8 text-red-500" />
      : <FileSpreadsheet className="w-8 h-8 text-green-600" />;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Student Account Approvals</h1>
          <p className="text-gray-500 text-sm">
            Review and manage registration requests for <span className="font-semibold text-gray-700">{chairDepartment}</span> before students can access the portal.
          </p>
        </div>
        <button
          onClick={() => { setUploadedFile(null); setUploadError(''); setUploadSuccess(false); setShowUploadModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Upload className="w-4 h-4" />
          Batch Approve via File
        </button>
      </div>

      {uploadSuccess && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Batch approval processed successfully. All matched pending students have been approved.
        </div>
      )}

      {loadError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Pending',  value: counts.pending,  color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Approved', value: counts.approved, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Rejected', value: counts.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 sm:p-4 text-center ${color}`}>
            <div className="text-xl sm:text-2xl font-bold">{value}</div>
            <div className="text-xs sm:text-sm font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or program…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
          {(['all', 'pending', 'active', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === f ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'active' ? 'approved' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading students…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No students match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr key={student.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{student.name}</div>
                          <div className="text-xs text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-600 font-mono whitespace-nowrap">{student.studentId}</td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-sm text-gray-700 whitespace-nowrap">{student.program}</div>
                      <div className="text-xs text-gray-400">{student.yearLevel}</div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-500 whitespace-nowrap">{student.registeredAt}</td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(student.status)}`}>
                        {statusLabel(student.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {student.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setConfirmModal({ id: student.id, action: 'approve' })}
                            disabled={updatingId === student.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          >
                            {updatingId === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                          </button>
                          <button
                            onClick={() => setConfirmModal({ id: student.id, action: 'reject' })}
                            disabled={updatingId === student.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 italic">
                          {student.status === 'active' ? 'Access granted' : 'Access denied'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Batch Upload Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Batch Approve via File</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Upload a list of student IDs or names. Students on the list that are currently pending will be approved all at once. Accepted formats: <span className="font-medium text-gray-700">PDF, Excel (.xls, .xlsx)</span>.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setUploadDragOver(true); }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                uploadDragOver
                  ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
                  : uploadedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-[#1E3A8A]/50 hover:bg-[#1E3A8A]/5'
              }`}
              onClick={() => document.getElementById('batch-file-input')?.click()}
            >
              <input
                id="batch-file-input"
                type="file"
                accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileInput}
              />

              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  {fileIcon(uploadedFile)}
                  <p className="font-semibold text-gray-800 text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setUploadedFile(null); setUploadError(''); }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <Upload className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Drag & drop your file here</p>
                  <p className="text-xs text-gray-400">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PDF · XLS · XLSX</p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-4 h-4 flex-shrink-0" /> {uploadError}
              </p>
            )}

            {/* Info note */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              <span className="font-semibold">Note:</span> The file should contain a column with Student IDs or full names matching registered students. Unmatched entries will be skipped.
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadedFile && setBatchConfirmOpen(true)}
                disabled={!uploadedFile}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Process & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Confirm Modal ── */}
      {batchConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Batch Approval</h3>
            <p className="text-sm text-gray-500 mb-2">
              You are about to approve all pending students matched from:
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-1 break-all">{uploadedFile?.name}</p>
            <p className="text-xs text-gray-400 mb-6">This action will grant portal access to all matched students at once.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBatchConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleBatchApprove}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Yes, Approve All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Individual Confirm Modal ── */}
      {confirmModal && (() => {
        const student = students.find(s => s.id === confirmModal.id)!;
        const isApprove = confirmModal.action === 'approve';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-green-100' : 'bg-red-100'}`}>
                {isApprove ? <Check className="w-7 h-7 text-green-600" /> : <X className="w-7 h-7 text-red-600" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isApprove ? 'Approve Student?' : 'Reject Student?'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isApprove
                  ? <>You are about to grant <span className="font-semibold text-gray-800">{student.name}</span> access to the student portal.</>
                  : <>You are about to deny <span className="font-semibold text-gray-800">{student.name}</span>'s registration request.</>
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isApprove ? 'Yes, Approve' : 'Yes, Reject'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Faculty Monitoring
───────────────────────────────────────────── */
function FacultyMonitoring() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty Monitoring</h1>
      <FacultyMonitoringTable />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chair's own Reports (Accomplishment / Extension)
   — separate from "Reports Monitoring" below, which
   is for reviewing faculty submissions.
───────────────────────────────────────────── */
function ChairReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'accomplishment' | 'extension'>('accomplishment');

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">Submit and track your own Accomplishment and Extension reports as Department Chair.</p>
      </div>

      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('accomplishment')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Accomplishment Report
        </button>
        <button
          onClick={() => setTab('extension')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Extension Report
        </button>
      </div>

      {tab === 'accomplishment' && (
        <AccomplishmentReport userId={userId} userName={userName} />
      )}

      {tab === 'extension' && (
        <ExtensionReport userId={userId} userName={userName} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reports Monitoring
───────────────────────────────────────────── */
function ReportsMonitoring() {
  const [view, setView] = useState<'table' | 'details'>('table');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [reports] = useState([
    {
      id: 1,
      faculty: 'Dr. Sarah Johnson',
      report: 'Q4 2025 Performance Report',
      status: 'Submitted',
      dateSubmitted: 'Feb 10, 2026',
      content: 'Summary of student achievements and research progress for the semester. All course objectives met with 95% passing rate.',
    },
    {
      id: 2,
      faculty: 'Prof. Michael Chen',
      report: 'Q4 2025 Performance Report',
      status: 'Pending',
      dateSubmitted: '---',
      content: '',
    },
  ]);

  if (view === 'details' && selectedReport) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { setView('table'); setSelectedReport(null); }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Report Details</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedReport.report}</h2>
              <p className="text-blue-600 font-medium">Faculty: {selectedReport.faculty}</p>
            </div>
            <div className="sm:text-right">
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${selectedReport.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {selectedReport.status}
              </span>
              <p className="text-xs text-gray-500 mt-2 italic">Submission Date: {selectedReport.dateSubmitted}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <h3 className="text-lg font-semibold text-gray-800">Faculty Submission Content:</h3>
            <div className="p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed italic">
              "{selectedReport.content || 'No content provided for this report.'}"
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-medium hover:underline">
              <Download size={18} /> Download Full Attachment (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports Monitoring</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Faculty Name</th>
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Report Type</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Date Submitted</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-900 whitespace-nowrap">{report.faculty}</td>
                  <td className="py-4 px-4 sm:px-6 text-gray-600">{report.report}</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-gray-500 font-mono text-sm whitespace-nowrap">{report.dateSubmitted}</td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    {report.status === 'Submitted' ? (
                      <button
                        onClick={() => { setSelectedReport(report); setView('details'); }}
                        className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-sm font-medium whitespace-nowrap"
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Awaiting Submission</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Academic Records
───────────────────────────────────────────── */
function AcademicRecordsView() {
  const handleDownload = (doc: string) => alert(`Downloading: ${doc}`);
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="space-y-3">
          {['Curriculum 2025', 'Faculty Load Summary'].map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Announcements
───────────────────────────────────────────── */
// Mirrors public.announcements. "Scheduled Date" in the UI maps to
// expires_at — the schema has no separate "date this announcement is
// about" column, so expires_at (closest available fit) drives the
// Upcoming/Past badge instead.
interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  target_role: string[] | null;
  is_pinned: boolean | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const ANNOUNCEMENTS_API_URL = 'http://localhost:5000/api/announcements';

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showModal, setShowModal]         = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', scheduledDate: '' });
  const [formError, setFormError] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setLoadError('Failed to load announcements: ' + error.message);
      setAnnouncements([]);
    } else {
      setAnnouncements((data ?? []) as Announcement[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setFormError('');
    if (!form.title.trim())       { setFormError('Title is required.'); return; }
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    if (!form.scheduledDate)      { setFormError('Please select a scheduled date.'); return; }

    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      content: form.description.trim(),
      expires_at: toTimestamp(form.scheduledDate),
    };

    const token = localStorage.getItem('token');
    let res: Response;
    try {
      res = await fetch(ANNOUNCEMENTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      setSubmitting(false);
      setFormError('Could not reach the server. Please try again.');
      return;
    }

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setFormError('Failed to post announcement: ' + (err.error || res.statusText));
      return;
    }

    const data = await res.json();
    setAnnouncements(prev => [data as Announcement, ...prev]);
    setForm({ title: '', description: '', scheduledDate: '' });
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const token = localStorage.getItem('token');
    let res: Response;
    try {
      res = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      setDeletingId(null);
      setLoadError('Could not reach the server. Please try again.');
      return;
    }
    setDeletingId(null);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLoadError('Failed to delete announcement: ' + (err.error || res.statusText));
      return;
    }

    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isUpcoming = (expiresAt: string | null) => {
    if (!expiresAt) return true;
    const today = new Date().toISOString().split('T')[0];
    return dateOnly(expiresAt) >= today;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Announcements</h1>
          <p className="text-gray-500 text-sm">Post and manage announcements for faculty and students.</p>
        </div>
        <button
          onClick={() => { setForm({ title: '', description: '', scheduledDate: '' }); setFormError(''); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading announcements…</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card top row */}
              <div className="flex items-start gap-4 p-4 sm:p-5">
                {/* Blue accent bar */}
                <div className="w-1 self-stretch rounded-full bg-[#1E3A8A] flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isUpcoming(ann.expires_at)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isUpcoming(ann.expires_at) ? 'Upcoming' : 'Past'}
                    </span>
                    <span className="text-xs text-gray-400">Posted {formatDate(dateOnly(ann.created_at))}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug">{ann.title}</h3>
                  {ann.expires_at && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Scheduled: {formatDate(dateOnly(ann.expires_at))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                    className="p-2 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium"
                    title={expandedId === ann.id ? 'Collapse' : 'View details'}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === ann.id ? 'rotate-90' : ''}`} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(ann.id)}
                    disabled={deletingId === ann.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete announcement"
                  >
                    {deletingId === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable description */}
              {expandedId === ann.id && (
                <div className="px-5 pb-5 pt-0 ml-5 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">{ann.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Announcement Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Announcement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to post an announcement.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Faculty Meeting — July 2026"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
                <p className="text-xs text-gray-400 mt-1">This is the date the announcement is about, or the event date.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Write the full announcement message here…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Announcement?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <span className="font-semibold text-gray-800">"{announcements.find(a => a.id === deleteConfirm)?.title}"</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}