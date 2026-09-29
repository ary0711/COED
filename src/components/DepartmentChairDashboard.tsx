import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Archive,
  MapPin,
  Tag,
  Building,
  Eye,
  CalendarDays,
  Pencil,
  ClipboardCheck,
  RefreshCw,
  TrendingUp,
  EyeOff,
  Award,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { AcademicDocumentsViewer } from './AcademicDocumentsViewer';
import AnnouncementsContent from './AnnouncementsContent';
import { WfhReport } from './WfhReport';
import { AccomplishmentReport } from './dashboards/AccomplishmentReport';
import { ExtensionReport } from './dashboards/ExtensionReport';
import { ResearchExtension } from './ResearchExtension';
import { FacultyAchievements } from './FacultyAchievements';
import { ReportsSection } from './ReportsSection';

import { supabase } from '../supabaseClient';


const dateOnly = (ts: string | null | undefined): string => {
  if (!ts) return '';
  return ts.split('T')[0];
};

// Converts a plain <input type="date"> value ("2026-07-01") into a full ISO timestamp.
const toTimestamp = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toISOString();
};

const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',            id: 'dashboard' },
  { icon: Calendar,        label: 'Department Calendar',  id: 'calendar' },
  { icon: FileCheck2,      label: 'Reports',              id: 'chairReports' },
  { icon: TrendingUp,     label: 'Research & Extension', id: 'researchExtension' },
  { icon: Award,           label: 'Achievements',         id: 'achievements' },
  { icon: FileText,        label: 'Reports Monitoring',   id: 'reports' },
  { icon: ClipboardList,   label: 'Academic Records',     id: 'records' },
  { icon: Megaphone,       label: 'Announcements',        id: 'announcements' },
  { icon: UserCheck,       label: 'Account Approvals',    id: 'approvals' },
  { icon: Settings,        label: 'System Settings',      id: 'settings' },
];

interface DepartmentChairDashboardProps { 
  onRoleChange?: () => void; 
  activeMenuItem: string; 
  setActiveMenuItem: (id: string) => void; 
  onLogout?: () => void;
  userName?: string;
  onProfileUpdate?: (updatedProfile: {
    fullName: string;
    email: string;
  }) => void;
}

export type StandardEventType = 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam';
export type CalendarAudience = 'all' | 'students' | 'faculty' | 'alumni';
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

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  id_number: string;
  department?: string | null;
  program?: string | null;
  status: string;
  created_at: string;
}

// ─── HELPER: SMART PROGRAM MATCHER (Fix for Elementary Ed vs BEEd) ─────────
const isProgramMatch = (userProg: string, chairDepts: string[]) => {
  const p = (userProg || '').trim().toLowerCase();
  if (!p) return false;

  return chairDepts.some((d) => {
    const dept = d.trim().toLowerCase();
    
    // Direct match
    if (p === dept || p.includes(dept) || dept.includes(p)) return true;

    // Aliases
    if ((p.includes('beed') || p.includes('elementary')) && (dept.includes('beed') || dept.includes('elementary'))) return true;
    if ((p.includes('btled') || p.includes('technology') || p.includes('livelihood')) && (dept.includes('btled') || dept.includes('technology') || dept.includes('livelihood'))) return true;
    if ((p.includes('math') || p.includes('mathematics')) && (dept.includes('math') || dept.includes('mathematics'))) return true;
    if (p.includes('english') && dept.includes('english')) return true;

    return false;
  });
};


// ─── Main Component ────────────────────────────────────────────────────────────
export function DepartmentChairDashboard({
  activeMenuItem,
  setActiveMenuItem,
  onLogout,
  userName: appUserName,
  onProfileUpdate,
}: DepartmentChairDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleInternalLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
  };

  const token = localStorage.getItem('token');
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = decoded?.userId ?? '';
  const userName = appUserName || decoded?.fullName || 'Department Chair';
  const departmentNames: string[] = decoded?.departmentNames ?? [];

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar menuItems={chairMenuItems} activeItem={activeMenuItem} onItemClick={setActiveMenuItem} userRole="Department Chair" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleInternalLogout} />
      <div className="hidden lg:block w-64 shrink-0" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader userRole="Department Chair" userName={userName} departmentNames={departmentNames} onLogout={handleInternalLogout} />
            </div>
          </div>
        </div>
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {activeMenuItem === 'dashboard'          && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} departmentNames={departmentNames} />}
          {activeMenuItem === 'calendar'           && <DepartmentCalendar organizerId={userId} departmentNames={departmentNames} />}
          {activeMenuItem === 'researchExtension'  && <ResearchExtension userId={userId} />}
          {activeMenuItem === 'achievements'       && <FacultyAchievements />}
          {activeMenuItem === 'chairReports' && (<ReportsSection userId={userId} userName={userName} />)}
          {activeMenuItem === 'reports'            && <ReportsMonitoring departmentNames={departmentNames} />}
          {activeMenuItem === 'records'            && <AcademicRecordsView />}
          {activeMenuItem === 'announcements'      && <AnnouncementsContent userRole="department_chair" />}
          {activeMenuItem === 'approvals'          && <AccountApprovalsView departmentNames={departmentNames} />}
         {activeMenuItem === 'settings' && (
  <ChairSystemSettings
    userName={userName}
    departmentNames={departmentNames}
    onLogout={handleInternalLogout}
    onProfileUpdate={onProfileUpdate}
  />
)}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard Overview ────────────────────────────────────────────────────────
function ChairDashboardView({ setActiveMenuItem, departmentNames }: { setActiveMenuItem: (id: string) => void, departmentNames: string[] }) {
  const [facultyCount, setFacultyCount] = useState(0);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  
  // Dashboard states for Account Approvals
  const [accountsData, setAccountsData] = useState<any[]>([]);
  const [dashboardApprovalTab, setDashboardApprovalTab] = useState<'pending' | 'active' | 'rejected'>('pending');

  const [reportStats, setReportStats] = useState({ submitted: 0, pending: 0 });
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Faculty, reports, ug account approvals (backend)
      const res = await fetch('http://localhost:5000/api/chair/dashboard-stats', { headers });
      if (res.ok) {
        const stats = await res.json();
        setFacultyCount(stats.facultyCount);
        setFacultyList(
          stats.facultyList.map((f: any) => ({
            ...f,
            lastUpdated: f.lastUpdated ? new Date(f.lastUpdated).toLocaleDateString() : 'No data',
          }))
        );
        setReportStats(stats.reportStats);
        setAccountsData(stats.accounts);
      } else {
        console.error('dashboard-stats failed:', await res.json().catch(() => ({})));
      }

      // Upcoming activities (parehas sa Calendar page)
      const calRes = await fetch(CALENDAR_API_URL, { headers });
      if (calRes.ok) {
        const events = await calRes.json();
        const today = new Date().toISOString().split('T')[0];
        setUpcomingCount(
          (events ?? []).filter((e: any) => e.event_date && e.event_date.split('T')[0] >= today).length
        );
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };
  fetchDashboardData();
}, [departmentNames]);

  // Derived state for the account approvals tabs
  const pendingAccounts = accountsData.filter(a => a.status === 'pending');
  const approvedAccounts = accountsData.filter(a => a.status === 'active');
  const rejectedAccounts = accountsData.filter(a => a.status === 'rejected');

  const displayedAccounts = dashboardApprovalTab === 'pending' ? pendingAccounts
                          : dashboardApprovalTab === 'active' ? approvedAccounts
                          : rejectedAccounts;

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-140px)]">
      <div className="mb-6 flex-shrink-0">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="transition-transform"><SummaryCard title="Total Faculty" value={loading ? '...' : facultyCount.toString()} icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" /></div>
          <div onClick={() => setActiveMenuItem('reports')} className="cursor-pointer transition-transform hover:scale-[1.02]"><SummaryCard title="Submitted Reports" value={loading ? '...' : reportStats.submitted.toString()} icon={CheckCircle} iconColor="#10B981" iconBgColor="#D1FAE5" /></div>
          <div onClick={() => setActiveMenuItem('reports')} className="cursor-pointer transition-transform hover:scale-[1.02]"><SummaryCard title="Pending Reports" value={loading ? '...' : reportStats.pending.toString()} icon={Clock} iconColor="#F59E0B" iconBgColor="#FEF3C7" /></div>
          <div onClick={() => setActiveMenuItem('calendar')} className="cursor-pointer transition-transform hover:scale-[1.02]"><SummaryCard title="Upcoming Activities" value={loading ? '...' : upcomingCount.toString()} icon={Calendar} iconColor="#8B5CF6" iconBgColor="#EDE9FE" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0 pb-4">
        
        {/* FACULTY MONITORING (Left Side) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[400px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /><h2 className="text-sm font-bold text-gray-900">Faculty Monitoring</h2></div>
            <span className="text-[11px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{facultyList.length} updates</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? <div className="flex justify-center items-center h-full text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : facultyList.length === 0 ? <div className="flex justify-center items-center h-full text-sm text-gray-400">No faculty records found.</div> : facultyList.slice(0, 5).map((faculty) => (
              <div key={faculty.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-gray-900 truncate">{faculty.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{faculty.email}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                    faculty.reportStatus === 'Submitted' ? 'bg-amber-100 text-amber-700' : 
                    faculty.reportStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    faculty.reportStatus === 'Draft' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {faculty.reportStatus || 'Pending'}
                  </span>
                  <span className="text-[10px] text-gray-400">{faculty.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
            <button onClick={() => setActiveMenuItem('reports')} className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors text-xs font-semibold flex items-center justify-center gap-1.5">Manage Reports <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>


        {/* ACCOUNT APPROVALS (Right Side) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900">Account Approvals</h2>
              </div>
              {pendingAccounts.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingAccounts.length} Pending
                </span>
              )}
            </div>

            {/* DASHBOARD CARD TABS */}
            <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
              <button 
                onClick={() => setDashboardApprovalTab('pending')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${dashboardApprovalTab === 'pending' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Pending ({pendingAccounts.length})
              </button>
              <button 
                onClick={() => setDashboardApprovalTab('active')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${dashboardApprovalTab === 'active' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Approved ({approvedAccounts.length})
              </button>
              <button 
                onClick={() => setDashboardApprovalTab('rejected')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${dashboardApprovalTab === 'rejected' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Rejected ({rejectedAccounts.length})
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              <div className="flex justify-center items-center h-full text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : displayedAccounts.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-sm text-gray-400 opacity-60">
                <ClipboardCheck className="w-8 h-8 mb-2" />
                No {dashboardApprovalTab === 'active' ? 'approved' : dashboardApprovalTab} accounts found.
              </div>
            ) : (
              displayedAccounts.slice(0, 5).map((account) => {
                const isApproved = account.status === 'active';
                const isPending = account.status === 'pending';
                
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-gray-900 truncate">{account.full_name}</p>
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5 capitalize">Role: {account.role}</p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isApproved ? 'bg-green-100 text-green-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <button 
              onClick={() => setActiveMenuItem('approvals')} 
              className="w-full py-2.5 bg-[#1E3A8A]/5 text-[#1E3A8A] hover:bg-[#1E3A8A]/10 rounded-xl transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              Open Account Approvals <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Department Calendar
───────────────────────────────────────────── */

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  event_type: string | null;
  audience?: string | null;
  status: string | null;
  posted_by_role: string | null;
  organizer_id?: string | null;
  department_ids?: string[] | null;
  color?: string | null;
}

interface DepartmentCalendarProps {
  organizerId: string;
  departmentNames: string[];
}

const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

const PREDEFINED_TYPE_COLORS: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};

const PREDEFINED_TYPES = [
  { id: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { id: 'activity', label: 'Activity', color: '#10B981' },
  { id: 'holiday', label: 'Holiday', color: '#8B5CF6' },
  { id: 'deadline', label: 'Deadline', color: '#F59E0B' },
  { id: 'exam', label: 'Exam', color: '#EF4444' },
];

const DEFAULT_EVENT_COLOR = '#1E3A8A';

const ROLE_DISPLAY_LABEL: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  college_dean: 'Dean',
  department_chair: 'Dept. Chair',
  faculty: 'Faculty',
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Everyone in Department',
  students: 'Students Only',
  faculty: 'Faculty & Staff Only',
  alumni: 'Alumni Only',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatSingleTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hoursNum = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hoursNum)) return timeStr;
  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const hours12 = hoursNum % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

function formatEventTimeRange(start?: string | null, end?: string | null): string {
  const s = formatSingleTime(start);
  const e = formatSingleTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return 'Time not specified';
}

function sortEventsChronologically(a: CalendarEvent, b: CalendarEvent): number {
  const dateComp = a.event_date.localeCompare(b.event_date);
  if (dateComp !== 0) return dateComp;
  const timeA = a.start_time;
  const timeB = b.start_time;
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;
  if (!timeA && !timeB) return a.title.localeCompare(b.title);
  return (timeA ?? '').localeCompare(timeB ?? '');
}

function colorForEvent(ev: CalendarEvent): string {
  if (ev.color) return ev.color;
  if (!ev.event_type) return DEFAULT_EVENT_COLOR;
  if (ev.event_type.includes('::')) {
    const parts = ev.event_type.split('::');
    if (parts[1] && parts[1].startsWith('#')) {
      return parts[1];
    }
  }
  const normalized = ev.event_type.trim().toLowerCase();
  return PREDEFINED_TYPE_COLORS[normalized] || DEFAULT_EVENT_COLOR;
}

function displayEventType(ev: CalendarEvent): string {
  if (!ev.event_type) return 'Activity';
  if (ev.event_type.includes('::')) {
    return ev.event_type.split('::')[0];
  }
  return ev.event_type;
}

function toCalendarTimestamp(dateStr: string): string {
  return `${dateStr}T08:00:00.000Z`;
}

function isChairOwnedEvent(ev: CalendarEvent, currentChairId: string): boolean {
  if (!ev.organizer_id || !currentChairId) return false;
  return ev.organizer_id === currentChairId;
}

export function DepartmentCalendar({ organizerId, departmentNames }: DepartmentCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'archive'>('calendar');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [inspectingEvent, setInspectingEvent] = useState<CalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyForm = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    type: 'meeting',
    customType: '',
    customColor: '#3B82F6',
    audience: 'all',
  };
  const [form, setForm] = useState(emptyForm);
  const [isCustomType, setIsCustomType] = useState(false);
  const [formError, setFormError] = useState('');

  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYear, setArchiveYear] = useState<string>('all');
  const [archiveMonth, setArchiveMonth] = useState<string>('all');
  const [archiveType, setArchiveType] = useState<string>('all');

  const getToken = () => localStorage.getItem('token');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const jumpToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(CALENDAR_API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load events: ' + (err.error || res.statusText));
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents((data ?? []) as CalendarEvent[]);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...events].sort(sortEventsChronologically);
    sorted.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (!d) return;
      const current = map.get(d) || [];
      current.push(ev);
      map.set(d, current);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate.get(dateStr) || [];
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => dateOnly(e.event_date) >= todayStr)
      .sort(sortEventsChronologically);
  }, [events, todayStr]);

  const pastEvents = useMemo(() => {
    return events
      .filter((e) => dateOnly(e.event_date) < todayStr)
      .sort((a, b) => sortEventsChronologically(b, a));
  }, [events, todayStr]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    pastEvents.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (d) years.add(d.split('-')[0]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [pastEvents]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pastEvents.forEach((ev) => {
      const name = displayEventType(ev).toLowerCase();
      if (name) types.add(name);
    });
    return Array.from(types).sort();
  }, [pastEvents]);

  const filteredArchiveEvents = useMemo(() => {
    const query = archiveSearch.toLowerCase().trim();
    return pastEvents.filter((ev) => {
      const date = dateOnly(ev.event_date);
      const [year, month] = date.split('-');
      const typeName = displayEventType(ev).toLowerCase();

      if (archiveYear !== 'all' && year !== archiveYear) return false;
      if (archiveMonth !== 'all' && parseInt(month, 10) !== parseInt(archiveMonth, 10)) return false;
      if (archiveType !== 'all' && typeName !== archiveType) return false;

      if (!query) return true;

      const titleMatch = ev.title?.toLowerCase().includes(query);
      const descMatch = ev.description?.toLowerCase().includes(query);
      const locMatch = ev.location?.toLowerCase().includes(query);
      const typeMatch = typeName.includes(query);
      return titleMatch || descMatch || locMatch || typeMatch;
    });
  }, [pastEvents, archiveSearch, archiveYear, archiveMonth, archiveType]);

  const groupedArchiveEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    filteredArchiveEvents.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (!d) return;
      const dateObj = new Date(d + 'T00:00:00');
      const key = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [filteredArchiveEvents]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
    setIsCustomType(false);
    setEditingEventId(null);
  };

  const handleStartEdit = (ev: CalendarEvent) => {
    if (!isChairOwnedEvent(ev, organizerId)) return;

    let rawType = ev.event_type || '';
    let extractedColor = '#3B82F6';
    if (rawType.includes('::')) {
      const parts = rawType.split('::');
      rawType = parts[0];
      extractedColor = parts[1] || '#3B82F6';
    }

    const isPredefined = PREDEFINED_TYPES.some((pt) => pt.id === rawType.toLowerCase());

    setForm({
      title: ev.title || '',
      date: dateOnly(ev.event_date) || '',
      start_time: ev.start_time ? ev.start_time.slice(0, 5) : '',
      end_time: ev.end_time ? ev.end_time.slice(0, 5) : '',
      location: ev.location || '',
      description: ev.description || '',
      type: isPredefined ? rawType.toLowerCase() : 'meeting',
      customType: isPredefined ? '' : rawType,
      customColor: extractedColor,
      audience: ev.audience || 'all',
    });
    setIsCustomType(!isPredefined && Boolean(rawType));
    setEditingEventId(ev.id);
    setFormError('');
    setShowModal(true);
    if (inspectingEvent?.id === ev.id) {
      setInspectingEvent(null);
    }
  };

  const handleSaveEvent = async () => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Event title is required.');
      return;
    }
    if (!form.date) {
      setFormError('Event date is required.');
      return;
    }

    // Prevent selecting a past date
    if (form.date < todayStr) {
      setFormError('You cannot schedule an event on a past date.');
      return;
    }

    if (isCustomType && !form.customType.trim()) {
      setFormError('Custom activity type is required.');
      return;
    }
    if (!isCustomType && !form.type) {
      setFormError('Type of activity is required.');
      return;
    }

    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setFormError('End time must be later than start time.');
      return;
    }

    setSubmitting(true);
    const isEditing = Boolean(editingEventId);
    const url = isEditing ? `${CALENDAR_API_URL}/${editingEventId}` : CALENDAR_API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const finalEventType = isCustomType
      ? `${form.customType.trim()}::${form.customColor}`
      : form.type;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: toCalendarTimestamp(form.date),
      start_time: form.start_time ? form.start_time : null,
      end_time: form.end_time ? form.end_time : null,
      location: form.location.trim() || null,
      event_type: finalEventType,
      audience: form.audience,
      status: 'upcoming',
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || `Failed to ${isEditing ? 'update' : 'save'} event (${res.statusText})`);
        return;
      }

      await fetchEvents();
      resetForm();
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${CALENDAR_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to delete event: ' + (err.error || res.statusText));
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (inspectingEvent?.id === id) {
        setInspectingEvent(null);
      }
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {/* Top Bar & View switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Department Calendar & Activities
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage academic schedules, track department milestones, and review archived activities for{' '}
            <span className="font-semibold text-gray-700">
              {departmentNames.join(', ') || 'your department'}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'archive'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Event History</span>
              {pastEvents.length > 0 && (
                <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full">
                  {pastEvents.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-all font-medium text-sm shadow-sm active:scale-[0.99] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Calendar View Mode */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
            <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/40 gap-3">
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select month"
                  value={currentMonth.getMonth()}
                  onChange={(e) =>
                    setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value, 10), 1))
                  }
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Select year"
                  value={currentMonth.getFullYear()}
                  onChange={(e) =>
                    setCurrentMonth(new Date(parseInt(e.target.value, 10), currentMonth.getMonth(), 1))
                  }
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {Array.from({ length: 9 }, (_, i) => today.getFullYear() - 4 + i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <button
                  onClick={jumpToToday}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  aria-label="Previous month"
                  className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/20">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{DAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A]" />
                <span className="text-sm font-medium">Loading events…</span>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-50 bg-gray-50/30"
                  />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayIndexInWeek = (firstDay + day - 1) % 7;
                  const isRightmostCol = dayIndexInWeek >= 5;
                  const dateStr = `${currentMonth.getFullYear()}-${String(
                    currentMonth.getMonth() + 1
                  ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isTodayDate = dateStr === todayStr;
                  const isPast = dateStr < todayStr;
                  const isSelected = selectedCalendarDate === dateStr;
                  const isHovered = hoveredDate === dateStr;
                  const showPopover = (isHovered || isSelected) && hasEvents;

                  return (
                    <div
                      key={day}
                      tabIndex={hasEvents ? 0 : -1}
                      aria-label={`${formatDate(dateStr)}${hasEvents ? `, ${dayEvents.length} events` : ''}`}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => {
                        setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
                      }}
                      className={`relative min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-100 p-1.5 sm:p-2 cursor-pointer transition-colors outline-none focus:bg-blue-50/30 ${
                        isSelected
                          ? 'bg-blue-50/50 ring-2 ring-[#1E3A8A] ring-inset z-20'
                          : isPast
                          ? 'bg-gray-50/40 hover:bg-gray-100/50'
                          : 'bg-white hover:bg-blue-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-transform ${
                            isTodayDate
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
                              : isPast
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>

                        {hasEvents && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-[#1E3A8A]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Desktop Event Pills */}
                      <div className="hidden sm:flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingEvent(ev);
                            }}
                            className="text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs hover:brightness-110 transition-all"
                            style={{ backgroundColor: colorForEvent(ev) }}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] font-semibold text-gray-400 px-1">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>

                      {/* Mobile Event Dots */}
                      {hasEvents && (
                        <div className="sm:hidden flex gap-1 flex-wrap px-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colorForEvent(ev) }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                      )}

                      {/* Popover Preview */}
                      {showPopover && (
                        <div
                          role="tooltip"
                          className={`absolute bottom-full mb-2 z-50 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 text-left transition-all animate-in fade-in zoom-in-95 ${
                            isRightmostCol ? 'right-0' : 'left-0'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-900">
                              {formatLongDate(dateStr)}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                            {dayEvents.map((ev) => {
                              const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                              const evColor = colorForEvent(ev);
                              const evTypeName = displayEventType(ev);

                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => setInspectingEvent(ev)}
                                  className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50/40 border-l-[3px] space-y-1 cursor-pointer transition-colors"
                                  style={{ borderLeftColor: evColor }}
                                >
                                  <div className="text-xs font-semibold text-gray-900 leading-snug">
                                    {ev.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                    <span className="flex items-center gap-1 font-medium text-gray-700">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      {timeRangeStr}
                                    </span>
                                    <span
                                      className="flex items-center gap-1 uppercase text-[9px] font-bold px-1.5 py-0.2 rounded text-white"
                                      style={{ backgroundColor: evColor }}
                                    >
                                      <Tag className="w-2.5 h-2.5 text-white/80" />
                                      {evTypeName}
                                    </span>
                                  </div>
                                  {ev.location && (
                                    <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{ev.location}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Agenda Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1E3A8A]" />
                <h2 className="text-sm font-bold text-gray-900">Upcoming Agenda</h2>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-full">
                {upcomingEvents.length}
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No upcoming department events</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {upcomingEvents.map((ev) => {
                  const evDate = dateOnly(ev.event_date);
                  const isDueToday = evDate === todayStr;
                  const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                  const evColor = colorForEvent(ev);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setInspectingEvent(ev)}
                      className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50/60 transition-all cursor-pointer group space-y-1.5"
                      style={{ borderLeftWidth: 3, borderLeftColor: evColor }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">
                          {ev.title}
                        </span>
                        {isDueToday ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
                            Today
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                            {formatDate(evDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {timeRangeStr}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: evColor }}
                        />
                        <span className="truncate capitalize font-medium">{displayEventType(ev)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive View Mode */}
      {viewMode === 'archive' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Search past department events by title, description, or type..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/40"
                />
                {archiveSearch && (
                  <button
                    onClick={() => setArchiveSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(archiveSearch || archiveYear !== 'all' || archiveMonth !== 'all' || archiveType !== 'all') && (
                <button
                  onClick={() => {
                    setArchiveSearch('');
                    setArchiveYear('all');
                    setArchiveMonth('all');
                    setArchiveType('all');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap self-end sm:self-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              <select
                aria-label="Filter by year"
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by month"
                value={archiveMonth}
                onChange={(e) => setArchiveMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={String(idx + 1).padStart(2, '0')}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by type"
                value={archiveType}
                onChange={(e) => setArchiveType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="all">All Types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredArchiveEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No past events match your criteria</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or reset the active filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedArchiveEvents).map((groupMonth) => (
                <div key={groupMonth} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {groupMonth}
                    </h3>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[11px] font-semibold text-gray-400">
                      {groupedArchiveEvents[groupMonth].length} events
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedArchiveEvents[groupMonth].map((ev) => {
                      const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                      const isOwner = isChairOwnedEvent(ev, organizerId);
                      const eventColor = colorForEvent(ev);
                      const eventTypeName = displayEventType(ev);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setInspectingEvent(ev)}
                          className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/40 hover:bg-white transition-all cursor-pointer group shadow-2xs space-y-3"
                          style={{ borderLeftWidth: 4, borderLeftColor: eventColor }}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                                {ev.title}
                              </h4>
                              {ev.event_type && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white flex-shrink-0"
                                  style={{ backgroundColor: eventColor }}
                                >
                                  {eventTypeName}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">
                                {formatDate(dateOnly(ev.event_date))}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {timeRangeStr}
                              </span>
                              <span>·</span>
                              <span className="truncate">
                                {departmentNames.join(', ') || 'Your department'}
                              </span>
                            </div>

                            {ev.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-gray-400">
                            <span>Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Chair'}</span>
                            <div className="flex items-center gap-2">
                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(ev);
                                  }}
                                  className="text-gray-600 hover:text-[#1E3A8A] font-semibold flex items-center gap-1 p-1 hover:bg-gray-100 rounded"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                              )}
                              <span className="text-[#1E3A8A] font-semibold flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> View
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {inspectingEvent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setInspectingEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 z-[10000] max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span
                  className="inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold text-white mb-1 shadow-2xs"
                  style={{ backgroundColor: colorForEvent(inspectingEvent) }}
                >
                  {displayEventType(inspectingEvent)}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                  {inspectingEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingEvent(null)}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-xs sm:text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Date:</span>
                <span>{formatLongDate(dateOnly(inspectingEvent.event_date))}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Time:</span>
                <span>{formatEventTimeRange(inspectingEvent.start_time, inspectingEvent.end_time)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Scope:</span>
                <span>{departmentNames.join(', ') || 'Your department'}</span>
              </div>

              {inspectingEvent.audience && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">Audience:</span>
                  <span>{AUDIENCE_LABELS[inspectingEvent.audience] || inspectingEvent.audience}</span>
                </div>
              )}
            </div>

            {inspectingEvent.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-100">
                  {inspectingEvent.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>Posted by: {ROLE_DISPLAY_LABEL[inspectingEvent.posted_by_role ?? ''] ?? 'Chair'}</span>
              <div className="flex items-center gap-2">
                {isChairOwnedEvent(inspectingEvent, organizerId) ? (
                  <>
                    <button
                      onClick={() => handleStartEdit(inspectingEvent)}
                      className="px-3 py-1.5 text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors font-semibold flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteEvent(inspectingEvent.id)}
                      disabled={deletingId === inspectingEvent.id}
                      className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {deletingId === inspectingEvent.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">View Only</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Event Modal with strict rectangle shaping & error handling */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingEventId ? 'Edit Department Event' : 'Add New Department Event'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Faculty Meeting"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  min={todayStr}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] bg-white"
                >
                  <option value="all">Everyone in Department</option>
                  <option value="students">Students Only</option>
                  <option value="faculty">Faculty & Staff Only</option>
                  <option value="alumni">Alumni Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description or agenda..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Activity *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PREDEFINED_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => {
                        setIsCustomType(false);
                        setForm({ ...form, type: pt.id });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        !isCustomType && form.type === pt.id
                          ? 'border-gray-400 bg-gray-50 shadow-sm ring-1 ring-gray-300'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pt.color }} />
                      <span className="text-gray-700">{pt.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomType(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      isCustomType
                        ? 'border-gray-400 bg-gray-50 shadow-sm ring-1 ring-gray-300'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-700">Custom</span>
                  </button>
                </div>

                {isCustomType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Enter custom activity (e.g. Sports)..."
                        value={form.customType}
                        onChange={(e) => setForm({ ...form, customType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-600">Color:</span>
                      <input
                        type="color"
                        value={form.customColor}
                        onChange={(e) => setForm({ ...form, customColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        title="Pick activity color"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                disabled={submitting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Saving…' : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingEventId ? 'Save Changes' : 'Add Event'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Account Approvals View
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
    const rp = Array.isArray(p.student_profiles) ? p.student_profiles[0] : p.student_profiles;
    const yl = rp?.year_level ?? 1;
    const suffix = yl === 1 ? 'st' : yl === 2 ? 'nd' : yl === 3 ? 'rd' : 'th';
    return {
      id: p.id,
      name: p.full_name ?? '—',
      email: p.email ?? '—',
      // Checks rp.student_no, fallback to profiles.id_number
      idNumber: rp?.student_no || p.id_number || '—',
      program: rp?.program || p.program || p.department || '—',
      detail: `${yl}${suffix} Year`,
      registeredAt: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: p.status,
    };
  }
  if (roleTab === 'faculty') {
    const rp = Array.isArray(p.faculty_profiles) ? p.faculty_profiles[0] : p.faculty_profiles;
    const resolvedId = rp?.faculty_id || p.id_number;
    return {
      id: p.id,
      name: p.full_name ?? '—',
      email: p.email ?? '—',
      idNumber: resolvedId ? String(resolvedId).slice(0, 8) : '—',
      program: '—',
      detail: rp?.position || 'Faculty',
      registeredAt: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: p.status,
    };
  }
  const rp = Array.isArray(p.alumni_profiles) ? p.alumni_profiles[0] : p.alumni_profiles;
  const resolvedAlumniId = rp?.alumni_id || p.id_number;
  return {
    id: p.id,
    name: p.full_name ?? '—',
    email: p.email ?? '—',
    idNumber: resolvedAlumniId ? String(resolvedAlumniId).slice(0, 8) : '—',
    program: rp?.program || p.program || p.department || '—',
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

/* ─────────────────────────────────────────────
   Reports Monitoring
───────────────────────────────────────────── */
const ACCOMPLISHMENT_API_URL = 'http://localhost:5000/api/accomplishment-reports';
const EXTENSION_API_URL = 'http://localhost:5000/api/extension-reports';
const WFH_API_URL = 'http://localhost:5000/api/wfh-reports';

interface AccomplishmentReportRow {
  id: string; submitted_by: string; quarter: string; year: string; status: string; progress: number; dean_remarks: string | null; created_at: string; updated_at: string;
  pi1_data?: any[]; mfo3_pi3_data?: any[]; other_accomplishments?: string | null;
}
interface ExtensionReportRow {
  id: string; submitted_by: string; quarter: string; year: string; status: string; progress: number; dean_remarks: string | null; created_at: string; updated_at: string; rows?: any[];
}
interface WfhReportRow {
  id: string; user_id: string; name?: string; reporting_period?: string; position_rank?: string; college_office?: string; program_unit?: string; working_hours?: string; daily_accomplishments?: any[]; supporting_docs?: Record<string, boolean>; other_docs_specify?: string; photos?: any[]; status: string; dean_remarks: string | null; created_at: string; updated_at: string;
}
interface ConsolidatedReportRow {
  profile: any; departmentName: string; accomplishmentReport: AccomplishmentReportRow | null; extensionReport: ExtensionReportRow | null; wfhReport: WfhReportRow | null; effectiveStatus: string; effectiveProgress: number; lastUpdated: string | null;
}

export function ReportsMonitoring({ departmentNames }: { departmentNames: string[] }) {
  const [rows, setRows] = useState<ConsolidatedReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterSelect, setQuarterSelect] = useState<string>(() => {
    const now = new Date();
    return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'submitted' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<{ type: string; report: any; profile: any; } | null>(null);
  const [rejectFor, setRejectFor] = useState<{ type: string; report: any } | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showInfo = (title: string, message: string) => { setModalTitle(title); setModalMessage(message); setShowInfoModal(true); };
  const getToken = () => localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [q, y] = quarterSelect.split(' ');
    const quarterMap: Record<string, string> = { Q1: '1st', Q2: '2nd', Q3: '3rd', Q4: '4th' };
    const quarter = quarterMap[q] || '1st';
    const year = y || String(new Date().getFullYear());

    try {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'faculty');
      let personnelList = profiles || [];

      // EXCEPTION LOGIC: Strictly filter based on chairman's program using Smart Matcher
      if (departmentNames && departmentNames.length > 0) {
        personnelList = personnelList.filter((u: any) => {
          const userProg = (u.program || u.department || '').trim();
          return isProgramMatch(userProg, departmentNames);
        });
      } else {
        personnelList = []; 
      }

      // Fetch Reports directly from Supabase for resilience
      const [ { data: accData }, { data: extData }, { data: wfhData } ] = await Promise.all([
        supabase.from('accomplishment_reports').select('*').eq('quarter', quarter).eq('year', year),
        supabase.from('extension_reports').select('*').eq('quarter', quarter).eq('year', year),
        supabase.from('wfh_reports').select('*').neq('status', 'draft')
      ]);

      const accMap = new Map((accData || []).filter(r => r.status !== 'draft').map(r => [r.submitted_by, r]));
      const extMap = new Map((extData || []).filter(r => r.status !== 'draft').map(r => [r.submitted_by, r]));
      const wfhMap = new Map((wfhData || []).filter(r => r.status !== 'draft').map(r => [r.user_id, r]));

      const consolidated = personnelList.map((p: any) => {
        const departmentName = p.department || p.program || 'General';
        const acc = accMap.get(p.id) ?? null;
        const ext = extMap.get(p.id) ?? null;
        const wfh = wfhMap.get(p.id) ?? null;

        let effectiveStatus = 'not_started';
        let progress = 0;

        if (acc || ext || wfh) {
          const statuses = [acc?.status, ext?.status, wfh?.status].filter(Boolean);
          if (statuses.includes('submitted')) effectiveStatus = 'submitted';
          else if (statuses.includes('rejected')) effectiveStatus = 'rejected';
          else if (statuses.includes('approved')) effectiveStatus = 'approved';

          const validProgress: number[] = [];
          if (typeof acc?.progress === 'number') validProgress.push(acc.progress);
          if (typeof ext?.progress === 'number') validProgress.push(ext.progress);
          if (wfh) validProgress.push(wfh.status === 'approved' ? 100 : 75);
          progress = validProgress.length > 0 ? Math.round(validProgress.reduce((a, b) => a + b, 0) / validProgress.length) : 0;
        }

        return { profile: p, departmentName, accomplishmentReport: acc, extensionReport: ext, wfhReport: wfh, effectiveStatus, effectiveProgress: progress, lastUpdated: acc?.updated_at || null };
      });

      setRows(consolidated);
    } catch (err: any) {
      showInfo('Error', err?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [quarterSelect, departmentNames]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const decideReport = async (type: string, id: string, status: 'approved' | 'rejected', remarks?: string) => {
    setActionId(id);
    const table = type === 'accomplishment' ? 'accomplishment_reports' : type === 'extension' ? 'extension_reports' : 'wfh_reports';
    try {
      const { error } = await supabase.from(table).update({ status, dean_remarks: remarks }).eq('id', id);
      if (error) {
        showInfo('Error', error.message);
        return;
      }
      showInfo('Success', `Report successfully marked as ${status}.`);
      setSelectedReport(null);
      setRejectFor(null);
      await fetchData();
    } catch {
      showInfo('Error', 'Could not reach the server.');
    } finally {
      setActionId(null);
    }
  };

  const sendIndividualReminder = async (row: ConsolidatedReportRow) => {
    setRemindingId(row.profile.id);
    try {
      await supabase.from('notifications').insert({
        user_id: row.profile.id,
        title: `Reminder: ${quarterSelect} Quarterly Report`,
        message: `Hi ${row.profile.full_name}, please complete and submit your ${quarterSelect} quarterly report to the Chairman.`,
        type: 'announcement',
        is_read: false,
      });
      showInfo('Reminder Sent', `Sent a reminder to ${row.profile.full_name}.`);
    } catch (err: any) {
      showInfo('Error', err.message || 'Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    if (statusFilter !== 'all' && row.effectiveStatus !== statusFilter) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchName = (row.profile.full_name || '').toLowerCase().includes(query);
      if (!matchName) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return { label: 'Approved', bg: '#D1FAE5', color: '#065F46' };
      case 'submitted': return { label: 'Pending Review', bg: '#FEF3C7', color: '#92400E' };
      case 'rejected': return { label: 'Rejected', bg: '#FEE2E2', color: '#B91C1C' };
      default: return { label: 'Not Started', bg: '#FEE2E2', color: '#991B1B' };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Reports Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consolidated submission monitoring and approval for Faculty under <span className="font-semibold text-gray-800">{departmentNames.join(', ')}</span>.
          </p>
        </div>
        <select value={quarterSelect} onChange={(e) => setQuarterSelect(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026'].map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty name..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50" />
          </div>

          <div className="flex gap-2 items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50">
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={fetchData} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-400">
            <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
            <p>No reports found for this program.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase">Faculty Name</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase">Submissions</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                  <th className="text-center py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map((row) => {
                  const cfg = getStatusBadge(row.effectiveStatus);
                  return (
                    <tr key={row.profile.id} className="hover:bg-blue-50/30">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 text-sm">{row.profile.full_name}</div>
                        <div className="text-xs text-gray-400">{row.departmentName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.accomplishmentReport && <button onClick={() => setSelectedReport({ type: 'accomplishment', report: row.accomplishmentReport!, profile: row.profile })} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"><FileText className="w-3 h-3 inline mr-1" />Accomplishment</button>}
                          {row.extensionReport && <button onClick={() => setSelectedReport({ type: 'extension', report: row.extensionReport!, profile: row.profile })} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"><FileText className="w-3 h-3 inline mr-1" />Extension</button>}
                          {row.wfhReport && <button onClick={() => setSelectedReport({ type: 'wfh', report: row.wfhReport!, profile: row.profile })} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100"><FileText className="w-3 h-3 inline mr-1" />WFH</button>}
                          {!row.accomplishmentReport && !row.extensionReport && !row.wfhReport && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div className="h-full rounded-full transition-all" style={{ width: `${row.effectiveProgress}%`, backgroundColor: row.effectiveStatus === 'approved' ? '#10B981' : row.effectiveProgress > 0 ? '#F59E0B' : '#D1D5DB' }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{row.effectiveProgress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          {row.accomplishmentReport || row.extensionReport || row.wfhReport ? (
                            <button onClick={() => setSelectedReport({ type: 'accomplishment', report: row.accomplishmentReport || row.extensionReport || row.wfhReport, profile: row.profile })} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          ) : (
                            <button onClick={() => sendIndividualReminder(row)} disabled={remindingId === row.profile.id} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg">
                              {remindingId === row.profile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />} Remind
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 p-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900 capitalize">{selectedReport.type} Report — {selectedReport.profile.full_name}</h3>
                <p className="text-xs text-gray-500 uppercase">Status: <span className="font-semibold">{selectedReport.report.status}</span></p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              {selectedReport.type === 'accomplishment' && (
                <div className="space-y-4">
                  {[
                    { title: 'PI 1: Licensure Exam', rows: (selectedReport.report as AccomplishmentReportRow).pi1_data, cols: [['date_exam','Date'],['no_passers','Passers']] },
                    { title: 'Research & Pubs', rows: (selectedReport.report as AccomplishmentReportRow).mfo3_pi3_data, cols: [['title_research','Title'],['name_publication','Publication']] },
                  ].filter(s => s.rows && s.rows.length > 0).map(section => (
                    <div key={section.title}>
                      <p className="font-semibold text-sm text-gray-800 mb-1">{section.title}</p>
                      <GenericJsonTable rows={section.rows!} columns={section.cols.map(([key, label]) => ({ key, label }))} />
                    </div>
                  ))}
                  {(selectedReport.report as AccomplishmentReportRow).other_accomplishments && (
                    <div className="text-sm bg-gray-50 p-3 rounded-xl border">{(selectedReport.report as AccomplishmentReportRow).other_accomplishments}</div>
                  )}
                </div>
              )}
              {selectedReport.type === 'extension' && (
                <GenericJsonTable rows={(selectedReport.report as ExtensionReportRow).rows ?? []} columns={[{ key: 'extension_project', label: 'Project' }, { key: 'partner_linkage', label: 'Partner' }]} />
              )}
              {selectedReport.type === 'wfh' && (
                <GenericJsonTable rows={(selectedReport.report as WfhReportRow).daily_accomplishments ?? []} columns={[{ key: 'date', label: 'Date' }, { key: 'activities', label: 'Activities' }]} />
              )}

              {selectedReport.report.status === 'submitted' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => decideReport(selectedReport.type, selectedReport.report.id, 'approved')} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">Approve</button>
                  <button onClick={() => setRejectFor({ type: selectedReport.type, report: selectedReport.report })} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Remarks Modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Reject Report?</h3>
            <textarea value={remarksInput} onChange={(e) => setRemarksInput(e.target.value)} rows={3} placeholder="Reasons for rejection..." className="w-full p-2 border rounded-xl text-sm mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectFor(null)} className="flex-1 py-2 border rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => decideReport(rejectFor.type, rejectFor.report.id, 'rejected', remarksInput)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center">
            <h3 className="font-bold text-lg mb-2">{modalTitle}</h3>
            <p className="text-gray-600 text-sm mb-4">{modalMessage}</p>
            <button onClick={() => setShowInfoModal(false)} className="w-full py-2 bg-[#1E3A8A] text-white font-semibold rounded-xl text-sm">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Generic Table for Reports ──────────────────────────────────────────
function GenericJsonTable({ rows, columns }: { rows: any[]; columns: { key: string; label: string }[] }) {
  if (!rows || rows.length === 0) return <p className="text-xs text-gray-400 italic py-1">No entries recorded.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((c) => <th key={c.key} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {columns.map((c) => <td key={c.key} className="border border-gray-200 px-3 py-2 align-top text-gray-800">{row[c.key] || '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Academic Records Viewer
───────────────────────────────────────────── */
function AcademicRecordsView() {
  return <AcademicDocumentsViewer />;
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
  onProfileUpdate,
}: {
  userName: string;
  departmentNames: string[];
  onLogout?: () => void;
  onProfileUpdate?: (updatedProfile: { fullName: string; email: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<ChairSettingsTabId>('profile');

  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState('');
  const [positionRole] = useState('Department Chair');
  const [department] = useState(departmentNames.join(', '));
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Profile Updated Successfully');
  const [successText, setSuccessText] = useState('Your personal information has been updated successfully.');

  const [securityMessage, setSecurityMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Load the Chair's actual profile from the same backend used by the Dean settings.
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setProfileLoading(false);
        setProfileMessage({
          type: 'error',
          text: 'Your session has expired. Please log in again.',
        });
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile information.');
        }

        if (data.profile) {
          const loadedName = data.profile.full_name || userName || '';
          const loadedEmail = data.profile.email || '';

          setFullName(loadedName);
          setEmail(loadedEmail);

          localStorage.setItem('userFullName', loadedName);
          localStorage.setItem('userEmail', loadedEmail);
        }
      } catch (error) {
        console.error('Failed to load Chair profile:', error);
        setProfileMessage({
          type: 'error',
          text: error instanceof Error
            ? error.message
            : 'Unable to load your profile information.',
        });
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [userName]);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setProfileMessage({
        type: 'error',
        text: 'Your session has expired. Please log in again.',
      });
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setProfileMessage({
        type: 'error',
        text: 'Full name is required.',
      });
      return;
    }

    if (!trimmedEmail) {
      setProfileMessage({
        type: 'error',
        text: 'Email address is required.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setProfileMessage({
        type: 'error',
        text: 'Please enter a valid email address.',
      });
      return;
    }

    setSaving(true);
    setProfileMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: trimmedName,
          email: trimmedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update your profile.');
      }

      const updatedName = data.profile?.full_name || trimmedName;
      const updatedEmail = data.profile?.email || trimmedEmail;

      setFullName(updatedName);
      setEmail(updatedEmail);

      localStorage.setItem('userFullName', updatedName);
      localStorage.setItem('userEmail', updatedEmail);

      onProfileUpdate?.({
        fullName: updatedName,
        email: updatedEmail,
      });

      setProfileMessage(null);
      setSuccessTitle('Profile Updated Successfully');
      setSuccessText('Your personal information has been updated successfully.');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Chair profile update failed:', error);
      setProfileMessage({
        type: 'error',
        text: error instanceof Error
          ? error.message
          : 'Failed to update your personal information.',
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setSecurityMessage({
        type: 'error',
        text: 'Your session has expired. Please log in again.',
      });
      return;
    }

    if (!currentPassword) {
      setSecurityMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (!newPassword) {
      setSecurityMessage({ type: 'error', text: 'New password is required.' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setSecurityMessage({
        type: 'error',
        text: 'Your new password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.',
      });
      return;
    }

    if (newPassword === currentPassword) {
      setSecurityMessage({
        type: 'error',
        text: 'Your new password must be different from your current password.',
      });
      return;
    }

    if (!confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Please confirm your new password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({
        type: 'error',
        text: 'New password and confirm password do not match.',
      });
      return;
    }

    setSaving(true);
    setSecurityMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change your password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage(null);
      setSuccessTitle('Password Changed Successfully');
      setSuccessText('Your password has been updated successfully.');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('Chair password change failed:', error);
      setSecurityMessage({
        type: 'error',
        text: error instanceof Error
          ? error.message
          : 'Failed to change your password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (activeTab === 'profile') {
      await saveProfile();
      return;
    }

    if (activeTab === 'security') {
      await changePassword();
      return;
    }

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
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 sm:px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                {successTitle}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {successText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSuccessMessage(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs sm:text-sm font-semibold px-2"
          >
            Dismiss
          </button>
        </div>
      )}

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
                    value={profileLoading ? 'Loading...' : fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={profileLoading}
                    className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      profileLoading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileLoading ? 'Loading...' : email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={profileLoading}
                    className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      profileLoading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Position/Role</label>
                  <input
                    type="text"
                    value={positionRole}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department/Program</label>
                  <input
                    type="text"
                    value={department}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {profileMessage?.type === 'error' && (
                  <div className="px-3.5 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
                    {profileMessage.text}
                  </div>
                )}
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
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Minimum 8 characters: uppercase, lowercase, number, and special character.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {securityMessage && securityMessage.type === 'error' && (
                  <div className="px-3.5 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
                    {securityMessage.text}
                  </div>
                )}

              </div>

              <div className="border-t border-gray-100 pt-5">
                <ChairToggleRow
                  label="Two-Factor Authentication"
                  checked={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(v => !v)}
                />
              </div>

              <div className="border-t border-gray-100 pt-5 mt-1">
                <button type="button" className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
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

        </div>
      </div>
    </div>
  );
}