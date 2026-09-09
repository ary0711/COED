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
  Settings,
  KeyRound,
  User,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';
import { AcademicDocumentsViewer } from './AcademicDocumentsViewer';

import { AccomplishmentReport } from './dashboards/AccomplishmentReport';
import { ExtensionReport } from './dashboards/ExtensionReport';

import { supabase } from '../supabaseClient';


const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           id: 'dashboard' },
  { icon: Calendar,        label: 'Department Calendar', id: 'calendar' },
  { icon: Users,           label: 'Faculty Monitoring',  id: 'faculty' },
  { icon: FileCheck2,      label: 'Reports',             id: 'chairReports' },
  { icon: FileText,        label: 'Reports Monitoring',  id: 'reports' },
  { icon: ClipboardList,   label: 'Academic Records',    id: 'records' },
  { icon: Megaphone,       label: 'Announcements',       id: 'announcements' },
  { icon: UserCheck,       label: 'Account Approvals',   id: 'approvals' },
  { icon: Settings,        label: 'System Settings',     id: 'settings' },
];

interface DepartmentChairDashboardProps {
  onRoleChange?: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
}

export type StandardEventType = 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam';
export type CalendarAudience = 'all' | 'students' | 'faculty' | 'alumni';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  event_type: StandardEventType | string | null;
  audience: CalendarAudience | string | null;
  department_ids: string[] | null;
  organizer_id: string | null;
  department?: string | null;
  status: string | null;
  posted_by_role: string | null;
  created_at: string;
  updated_at: string;
}

type AccountRole = 'student' | 'faculty' | 'alumni';

interface AccountApplicant {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  program: string;
  detail: string;
  registeredAt: string;
  status: 'pending' | 'active' | 'rejected';
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function DepartmentChairDashboard({ 
  activeMenuItem, 
  setActiveMenuItem, 
  onLogout 
}: DepartmentChairDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleInternalLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
  };

  const token = localStorage.getItem('token');
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = decoded?.userId ?? '';
  const userName = decoded?.fullName || 'Department Chair';
  const departmentNames: string[] = decoded?.departmentNames ?? [];

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={chairMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Department Chair"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleInternalLogout}
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
              <DashboardHeader 
                userRole="Department Chair" 
                userName={userName} 
                departmentNames={departmentNames} 
                onLogout={handleInternalLogout}
              />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {activeMenuItem === 'dashboard'   && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'calendar'    && <DepartmentCalendar organizerId={userId} departmentNames={departmentNames} />}
          {activeMenuItem === 'faculty'     && <FacultyMonitoring />}
          {activeMenuItem === 'chairReports' && <ChairReportsView userId={userId} userName={userName} />}
          {activeMenuItem === 'reports'     && <ReportsMonitoring />}
          {activeMenuItem === 'records'     && <AcademicRecordsView />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
          {activeMenuItem === 'approvals'   && <AccountApprovalsView departmentNames={departmentNames} />}
          {activeMenuItem === 'settings'    && <ChairSystemSettings userName={userName} departmentNames={departmentNames} onLogout={handleInternalLogout} />}
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
              <div className="text-sm text-gray-600">3 pending approvals</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('calendar')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Add Department Event</div>
              <div className="text-sm text-gray-600">Schedule activities</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('settings')}
              className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">System Settings</div>
              <div className="text-sm text-gray-600">Manage account and preferences</div>
            </button>
          </div>
        </div>
      </div>

      <FacultyMonitoringTable />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Department Calendar
───────────────────────────────────────────── */

const PROGRAMS = ['BEEd', 'BTLEd', 'BSEd-Math', 'BSEd-English'];
const PROGRAM_OPTIONS = ['All Programs', ...PROGRAMS];

const COLOR_OPTIONS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#1E3A8A'];

const TYPE_TO_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};
const DEFAULT_EVENT_COLOR = '#1E3A8A';
const ROLE_DISPLAY_LABEL: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  department_chair: 'Dept. Chair',
};

function eventTypeForColor(color: string): CalendarEvent['event_type'] | null {
  const entry = Object.entries(TYPE_TO_COLOR).find(([, c]) => c === color);
  return entry ? (entry[0] as CalendarEvent['event_type']) : null;
}

function colorForEvent(ev: CalendarEvent): string {
  return (ev.event_type && TYPE_TO_COLOR[ev.event_type]) || DEFAULT_EVENT_COLOR;
}

const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

function dateOnly(isoLike: string): string {
  return isoLike.split('T')[0];
}

function toTimestamp(dateStr: string): string {
  return `${dateStr}T00:00:00`;
}

interface DepartmentCalendarProps {
  organizerId: string;
  departmentNames: string[];
}

function DepartmentCalendar({ organizerId, departmentNames }: DepartmentCalendarProps) {
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

  const emptyForm = {
    title: '',
    date: '',
    description: '',
    color: '#3B82F6',
    audience: 'all',
  };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(CALENDAR_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load events: ' + (err.error || res.statusText));
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents((data ?? []) as CalendarEvent[]);
    } catch (err) {
      setLoadError('Could not reach the server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
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
      event_type: eventTypeForColor(form.color),
      audience: form.audience,
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

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
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(dateOnly(ev.event_date))} · {departmentNames.join(', ') || 'Your department'} · Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}
                    {ev.audience && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-600">
                        Audience: {ev.audience}
                      </span>
                    )}
                  </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Posting to</label>
                <div className="w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {departmentNames.length > 0 ? departmentNames.join(', ') : 'No department assigned'}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Events are automatically scoped to your department on the server.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                <select
                  value={form.audience}
                  onChange={e => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] bg-white"
                >
                  <option value="all">Everyone in Department (General)</option>
                  <option value="students">Students Only (Exams, Deadlines, Class Activities)</option>
                  <option value="faculty">Faculty & Staff Only (Department Meetings)</option>
                  <option value="alumni">Alumni Only (Department Homecoming/Reunions)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Choosing "Students Only" or "Faculty Only" prevents this event from showing on the Alumni calendar.
                </p>
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
   Account Approvals
───────────────────────────────────────────── */

const ACCOUNTS_API_URL = 'http://localhost:5000/api/accounts';

const ROLE_TABS: { id: AccountRole; label: string }[] = [
  { id: 'student', label: 'Students' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'alumni',  label: 'Alumni' },
];

function AccountApprovalsView({ departmentNames }: { departmentNames: string[] }) {
  const [roleTab, setRoleTab] = useState<AccountRole>('student');

  const [accounts, setAccounts] = useState<AccountApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const fetchAccounts = async () => {
    setLoading(true);
    setLoadError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${ACCOUNTS_API_URL}/${roleTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(`Failed to load ${roleTab}: ` + (err.error || res.statusText));
        setAccounts([]);
        return;
      }
      const data = await res.json();
      const mapped: AccountApplicant[] = (data ?? []).map((p: any) => {
        if (roleTab === 'student') {
          const rp = p.student_profiles;
          const yl = rp?.year_level ?? 1;
          const suffix = yl === 1 ? 'st' : yl === 2 ? 'nd' : yl === 3 ? 'rd' : 'th';
          return {
            id: p.id,
            name: p.full_name ?? '—',
            email: p.email ?? '—',
            idNumber: rp?.student_no ?? '—',
            program: rp?.program ?? '—',
            detail: `${yl}${suffix} Year`,
            registeredAt: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: p.status,
          };
        }
        if (roleTab === 'faculty') {
          const rp = p.faculty_profiles;
          return {
            id: p.id,
            name: p.full_name ?? '—',
            email: p.email ?? '—',
            idNumber: rp?.faculty_id ? String(rp.faculty_id).slice(0, 8) : '—',
            program: '—',
            detail: rp?.position ?? 'Faculty',
            registeredAt: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            status: p.status,
          };
        }
        const rp = p.alumni_profiles;
        return {
          id: p.id,
          name: p.full_name ?? '—',
          email: p.email ?? '—',
          idNumber: rp?.alumni_id ? String(rp.alumni_id).slice(0, 8) : '—',
          program: rp?.program ?? '—',
          detail: rp?.graduation_year ? `Class of ${rp.graduation_year}` : '—',
          registeredAt: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          status: p.status,
        };
      });
      setAccounts(mapped);
    } catch (err) {
      setLoadError('Could not reach the server. Please try again.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    setFilterStatus('pending');
    setSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleTab]);

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

  const handleBatchApprove = () => {
    setBatchConfirmOpen(false);
    setUploadedFile(null);
    setUploadSuccess(true);
    setShowUploadModal(false);
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  const updateStatus = async (id: string, status: 'active' | 'rejected') => {
    setUpdatingId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${ACCOUNTS_API_URL}/${roleTab}/${id}/status`, {
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
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
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

  const filtered = accounts.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.idNumber.toLowerCase().includes(search.toLowerCase()) ||
                        a.program.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    pending:  accounts.filter(a => a.status === 'pending').length,
    approved: accounts.filter(a => a.status === 'active').length,
    rejected: accounts.filter(a => a.status === 'rejected').length,
  };

  const statusBadge = (status: AccountApplicant['status']) => ({
    pending:  'bg-amber-100 text-amber-700',
    active:   'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[status]);

  const statusLabel = (status: AccountApplicant['status']) =>
    status === 'active' ? 'approved' : status;

  const fileIcon = (file: File) =>
    file.name.toLowerCase().endsWith('.pdf')
      ? <FileText className="w-8 h-8 text-red-500" />
      : <FileSpreadsheet className="w-8 h-8 text-green-600" />;

  const idColumnLabel = roleTab === 'student' ? 'Student ID' : roleTab === 'faculty' ? 'Faculty ID' : 'Alumni ID';
  const roleSingular = roleTab === 'student' ? 'student' : roleTab === 'faculty' ? 'faculty member' : 'alumnus/alumna';
  const roleNounCap = roleTab === 'student' ? 'Student' : roleTab === 'faculty' ? 'Faculty' : 'Alumni';

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Account Approvals</h1>
          <p className="text-gray-500 text-sm">Review and manage registration requests before accounts can access the portal.</p>
          {departmentNames.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Managing: {departmentNames.join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={() => { setUploadedFile(null); setUploadError(''); setUploadSuccess(false); setShowUploadModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Upload className="w-4 h-4" />
          Batch Approve via File
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {ROLE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setRoleTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              roleTab === t.id ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {uploadSuccess && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Batch approval processed successfully. All matched pending {roleTab} have been approved.
        </div>
      )}

      {loadError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search by name, ID, or program…`}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading {roleTab}…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {roleTab} match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">{roleNounCap}</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">{idColumnLabel}</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">{roleTab === 'faculty' ? 'Position' : 'Program'}</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account, idx) => (
                  <tr key={account.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {account.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{account.name}</div>
                          <div className="text-xs text-gray-400">{account.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-600 font-mono whitespace-nowrap">{account.idNumber}</td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-sm text-gray-700 whitespace-nowrap">{roleTab === 'faculty' ? account.detail : account.program}</div>
                      {roleTab !== 'faculty' && <div className="text-xs text-gray-400">{account.detail}</div>}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-500 whitespace-nowrap">{account.registeredAt}</td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(account.status)}`}>
                        {statusLabel(account.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {account.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setConfirmModal({ id: account.id, action: 'approve' })}
                            disabled={updatingId === account.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          >
                            {updatingId === account.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                          </button>
                          <button
                            onClick={() => setConfirmModal({ id: account.id, action: 'reject' })}
                            disabled={updatingId === account.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 italic">
                          {account.status === 'active' ? 'Access granted' : 'Access denied'}
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

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Batch Approve via File ({ROLE_TABS.find(t => t.id === roleTab)?.label})</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Upload a list of IDs or names. Accounts on the list that are currently pending will be approved all at once. Accepted formats: <span className="font-medium text-gray-700">PDF, Excel (.xls, .xlsx)</span>.
            </p>

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

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              <span className="font-semibold">Note:</span> The file should contain a column with IDs or full names matching registered {roleTab}. Unmatched entries will be skipped.
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

      {batchConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Batch Approval</h3>
            <p className="text-sm text-gray-500 mb-2">
              You are about to approve all pending {roleTab} matched from:
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-1 break-all">{uploadedFile?.name}</p>
            <p className="text-xs text-gray-400 mb-6">This action will grant portal access to all matched accounts at once.</p>
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

      {confirmModal && (() => {
        const account = accounts.find(a => a.id === confirmModal.id)!;
        const isApprove = confirmModal.action === 'approve';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-green-100' : 'bg-red-100'}`}>
                {isApprove ? <Check className="w-7 h-7 text-green-600" /> : <X className="w-7 h-7 text-red-600" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isApprove ? 'Approve Account?' : 'Reject Account?'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isApprove
                  ? <>You are about to grant <span className="font-semibold text-gray-800">{account.name}</span> access to the portal as {roleTab === 'faculty' ? 'a' : 'an'} {roleSingular}.</>
                  : <>You are about to deny <span className="font-semibold text-gray-800">{account.name}</span>'s registration request.</>
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


/*Faculty Monitoring */
function FacultyMonitoring() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty Monitoring</h1>
      <FacultyMonitoringTable />
    </div>
  );
}

// ─── My Drafts ────────────────────────────────────────────
interface DraftSummary {
  id: string;
  quarter: string;
  year: string;
  progress: number;
  updated_at: string;
  created_at: string;
}

const ACCOMPLISHMENT_DRAFTS_URL = 'http://localhost:5000/api/accomplishment-reports';
const EXTENSION_DRAFTS_URL = 'http://localhost:5000/api/extension-reports';

function getDraftsToken() {
  return localStorage.getItem('token');
}

function MyDraftsPanel({ onEdit }: { onEdit: (type: 'accomplishment' | 'extension') => void }) {
  const [accDraft, setAccDraft] = useState<DraftSummary | null>(null);
  const [extDraft, setExtDraft] = useState<DraftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchDrafts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = getDraftsToken();
      const [accRes, extRes] = await Promise.all([
        fetch(`${ACCOMPLISHMENT_DRAFTS_URL}/my-draft`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${EXTENSION_DRAFTS_URL}/my-draft`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      let hadError = false;
      if (accRes.ok) setAccDraft(await accRes.json());
      else hadError = true;
      if (extRes.ok) setExtDraft(await extRes.json());
      else hadError = true;
      if (hadError) setLoadError('Failed to load one or more drafts.');
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const cards = [
    accDraft ? { type: 'accomplishment' as const, label: 'Accomplishment Report', draft: accDraft } : null,
    extDraft ? { type: 'extension' as const, label: 'Extension Report', draft: extDraft } : null,
  ].filter(Boolean) as { type: 'accomplishment' | 'extension'; label: string; draft: DraftSummary }[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">My Drafts</h2>
      <p className="text-xs text-gray-400 mb-4">Reports you've started but haven't submitted yet.</p>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading drafts...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <p className="text-sm text-gray-400">No drafts yet — start a report and click "Save Draft" to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(({ type, label, draft }) => (
            <div key={type} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{draft.quarter} Quarter, {draft.year} · {draft.progress ?? 0}% complete</div>
                <div className="text-xs text-gray-400 mt-0.5">Last saved {formatDate(draft.updated_at)}</div>
              </div>
              <button
                onClick={() => onEdit(type)}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors flex-shrink-0"
              >
                Continue Editing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Chair's own Reports */
function ChairReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'drafts' | 'accomplishment' | 'extension'>('drafts');

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">Submit and track your own Accomplishment and Extension reports as Department Chair.</p>
      </div>

      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('drafts')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'drafts' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
        >
          My Drafts
        </button>
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

      {tab === 'drafts' && (
        <MyDraftsPanel onEdit={(type) => setTab(type)} />
      )}

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
  return <AcademicDocumentsViewer />;
}

/* ─────────────────────────────────────────────
   Announcements
───────────────────────────────────────────── */
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
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(ANNOUNCEMENTS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load announcements: ' + (err.error || res.statusText));
        setAnnouncements([]);
        return;
      }
      const data = await res.json();
      setAnnouncements((data ?? []) as Announcement[]);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setAnnouncements([]);
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
              <div className="flex items-start gap-4 p-4 sm:p-5">
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

              {expandedId === ann.id && (
                <div className="px-5 pb-5 pt-0 ml-5 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">{ann.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

/* ─────────────────────────────────────────────
   System Settings (Department Chair)
───────────────────────────────────────────── */
const CHAIR_NOTIF_DEFAULTS = {
  facultyReports: true,
  pendingReports: true,
  studentApprovals: true,
  departmentActivities: true,
  announcements: true,
  systemNotifs: true,
};

const CHAIR_SETTINGS_TABS = [
  { id: 'profile',       label: 'Profile Information', icon: User },
  { id: 'security',      label: 'Password & Security',  icon: KeyRound },
  { id: 'notifications', label: 'Notifications',        icon: Bell },
  { id: 'department',    label: 'Department Settings',  icon: Users },
  { id: 'account',       label: 'Account Actions',       icon: ArrowLeft },
] as const;

type ChairSettingsTabId = typeof CHAIR_SETTINGS_TABS[number]['id'];

function ChairToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#1E3A8A]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function ChairSystemSettings({
  userName,
  departmentNames,
  onLogout,
}: {
  userName: string;
  departmentNames: string[];
  onLogout?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ChairSettingsTabId>('profile');

  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState('');
  const [positionRole] = useState('Department Chair');
  const [department, setDepartment] = useState(departmentNames.join(', '));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [notifs, setNotifs] = useState(CHAIR_NOTIF_DEFAULTS);
  const toggleNotif = (key: keyof typeof CHAIR_NOTIF_DEFAULTS) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  const [departmentName, setDepartmentName] = useState(departmentNames[0] ?? '');
  const [program, setProgram] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('Second Semester');

  const [saving, setSaving] = useState(false);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await new Promise(res => setTimeout(res, 600));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {};

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account and system preferences.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 sm:px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 sm:px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:h-[560px] overflow-y-auto">
          {CHAIR_SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#1E3A8A] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 min-w-0 md:h-[560px] overflow-y-auto">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-6">Update your personal details.</p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Position/Role</label>
                  <input
                    type="text"
                    value={positionRole}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department/Program</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Password & Security</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-6">Manage your password and account access.</p>

              <div className="space-y-4 max-w-md mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors">
                  Change Password
                </button>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <ChairToggleRow
                  label="Two-Factor Authentication"
                  checked={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(v => !v)}
                />
              </div>

              <div className="border-t border-gray-100 pt-5 mt-1">
                <button className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                  Log Out of All Devices
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-2">Choose which alerts you receive.</p>

              <div>
                <ChairToggleRow label="Faculty Report Submissions" checked={notifs.facultyReports} onChange={() => toggleNotif('facultyReports')} />
                <ChairToggleRow label="Pending Reports" checked={notifs.pendingReports} onChange={() => toggleNotif('pendingReports')} />
                <ChairToggleRow label="Student Registration/Approval" checked={notifs.studentApprovals} onChange={() => toggleNotif('studentApprovals')} />
                <ChairToggleRow label="Department Activities" checked={notifs.departmentActivities} onChange={() => toggleNotif('departmentActivities')} />
                <ChairToggleRow label="Announcements" checked={notifs.announcements} onChange={() => toggleNotif('announcements')} />
                <ChairToggleRow label="System Notifications" checked={notifs.systemNotifs} onChange={() => toggleNotif('systemNotifs')} />
              </div>
            </div>
          )}

          {activeTab === 'department' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Department Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-6">Configure your department's current details.</p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department Name</label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Program</label>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. BEEd, BSEd-Math"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option>First Semester</option>
                    <option>Second Semester</option>
                    <option>Summer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Account Actions</h2>
              <p className="text-sm text-gray-500 mt-0.5 mb-6">Manage your session.</p>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}