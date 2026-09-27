import { 
  User, 
  BookOpen, 
  Award, 
  FileText, 
  MessageSquare, 
  Bell, 
  Calendar,
  Users,
  Building2,
  Menu,
  ChevronLeft,
  ChevronRight,
  History,
  Trash2,
  X,
  Settings,
  Lock,
  LogOut,
  GraduationCap,
  RefreshCw,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { createPortal } from 'react-dom';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { AcademicDocumentsViewer } from '../AcademicDocumentsViewer';

const studentMenuItems = [
  { icon: Bell,         label: 'Dashboard',               id: 'dashboard'    },
  { icon: User,         label: 'Faculty & Departments',   id: 'faculty'      },
  { icon: BookOpen,     label: 'Academic Resources',      id: 'resources'    },
  { icon: Award,        label: 'Calendar Activities',     id: 'achievements' },
  { icon: MessageSquare,label: 'Inquiry / Contact',       id: 'inquiry'      },
  { icon: Settings,     label: 'Settings',                id: 'settings'     },
];

const ME_API_URL = 'http://localhost:5000/api/me';
// Available academic programs (BSIT intentionally excluded)
const PROGRAM_OPTIONS = [
  'Bachelor of Science in Secondary Education - Mathematics',
  'Bachelor of Science in Secondary Education - English',
  'Bachelor of Science in Secondary Education - Science',
  'Bachelor of Science in Elementary Education',
];

// Categories available when a student files an inquiry/concern.
// Kept in sync with the dean-side dashboard so category badges match.
const INQUIRY_CATEGORIES = [
  'Academic',
  'Enrollment',
  'Documents',
  'Faculty',
  'System',
  'Account',
  'Suggestion',
  'Other',
];

interface StudentProfile {
  student_id: string;
  full_name: string;
  student_no: string;
  year_level: number;
  program: string;
  gpa: number | null;
  academic_standing: string;
  enrollment_status: string;
  department_id: string | null;
  department_name: string | null;
}

// Shape of a row from the shared `inquiries` table, scoped to this student
interface StudentInquiry {
  id: string;
  subject: string;
  category: string | null;
  message: string;
  reply: string | null;
  status: 'pending' | 'answered';
  created_at: string;
  replied_at: string | null;
}

// Shape of a row from the shared `notifications` table
interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string | null;
  reference_id: string | null;
  reference_table: string | null;
  is_read: boolean;
  created_at: string;
}

// ====================== SHARED CALENDAR TYPES & HELPERS ======================
interface RealCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;   
  department_ids: string[] | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | string | null;
  audience?: string | null;
  status: string | null;
  posted_by_role: string | null;
}

const CALENDAR_API_URL_STUDENT = 'http://localhost:5000/api/calendar-events';

const EVENT_TYPE_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};
const DEFAULT_STUDENT_EVENT_COLOR = '#1E3A8A';

function colorForStudentEvent(ev: RealCalendarEvent): string {
  const t = ev.event_type?.toLowerCase() || '';
  return EVENT_TYPE_COLOR[t] || DEFAULT_STUDENT_EVENT_COLOR;
}

function dateOnlyStudent(isoLike: string): string {
  if (!isoLike) return '';
  return isoLike.split('T')[0];
}

function sortEventsChronologically(a: RealCalendarEvent, b: RealCalendarEvent): number {
  const dateComp = a.event_date.localeCompare(b.event_date);
  if (dateComp !== 0) return dateComp;
  const timeA = a.start_time;
  const timeB = b.start_time;
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;
  if (!timeA && !timeB) return a.title.localeCompare(b.title);
  return (timeA ?? '').localeCompare(timeB ?? '');
}

function isStudentAuthorizedEvent(ev: RealCalendarEvent): boolean {
  if (!ev.audience) return true;
  const aud = ev.audience.trim().toLowerCase();
  return ['all', 'everyone', 'student', 'students'].includes(aud);
}

// ====================== MAIN COMPONENT ======================
interface StudentDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

export function StudentDashboard({ activeMenuItem, setActiveMenuItem,onLogout, userName = 'Student' }: StudentDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleInternalLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
  };
  const [selectedProgram, setSelectedProgram] = useState(PROGRAM_OPTIONS[0]);

  // ── Logged-in student's profile data ──
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileError('No logged-in user found. Please sign in again.');
        setProfileLoading(false);
        return;
      }

      const res = await fetch(ME_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setProfileError('Failed to load your profile. Please try again.');
        setProfileLoading(false);
        return;
      }

      const data = await res.json();

      setProfile({
        student_id: data.userId,
        full_name: data.fullName ?? '',
        student_no: data.studentNo ?? '',
        year_level: data.yearLevel ?? 0,
        program: data.program ?? '',
        gpa: data.gpa ?? null,
        academic_standing: data.academicStanding ?? '—',
        enrollment_status: data.enrollmentStatus ?? '—',
        department_id: data.departmentId ?? null,
        department_name: data.departmentNames?.[0] ?? null,
      });
      setUserEmail(data.email ?? '');

      // Keep the program selector in sync with the student's actual approved program
      if (data.program) {
        setSelectedProgram(data.program);
      }
    } catch {
      setProfileError('Could not reach the server. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Auto-close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ── Sidebar — slide-in on mobile, fixed on desktop ── */}
      <Sidebar
        menuItems={studentMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Student"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleInternalLogout}
      />

      {/* ── Desktop spacer so content clears the fixed sidebar ── */}
      <div className="hidden lg:block w-64 shrink-0" />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader
                userRole="Student"
                userName={profile?.full_name ?? userName}
                onLogout={handleInternalLogout}
              />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'   && (
            <StudentDashboardView
              selectedProgram={selectedProgram}
              profile={profile}
              loading={profileLoading}
              error={profileError}
              setActiveMenuItem={setActiveMenuItem}
            />
          )}
          {activeMenuItem === 'faculty'     && <FacultyDepartments profile={profile} />}
          {activeMenuItem === 'resources'   && <AcademicResources />}
          {activeMenuItem === 'achievements'&& <AchievementsActivities />}
          {activeMenuItem === 'inquiry'     && <InquiryContact />}
          {activeMenuItem === 'settings'    && (
            <StudentSettings
              selectedProgram={selectedProgram}
              setSelectedProgram={setSelectedProgram}
              profile={profile}
              userEmail={userEmail}
              loading={profileLoading}
              onProfileUpdated={fetchProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ====================== NOTIFICATION BELL ======================
function NotificationBell({ onGoToInquiries }: { onGoToInquiries: () => void }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, reference_id, reference_table, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setNotifications(data as NotificationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const channelName = `student-notif-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (n: NotificationRow) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      fetchNotifications();
    }
    if (n.reference_table === 'inquiries' || n.type === 'inquiry_reply') {
      setOpen(false);
      onGoToInquiries();
    }
  };

  const markAllRead = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    fetchNotifications();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-40 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ====================== STUDENT DASHBOARD VIEW ======================
interface StudentDashboardViewProps {
  selectedProgram: string;
  profile: StudentProfile | null;
  loading: boolean;
  error: string | null;
  setActiveMenuItem: (id: string) => void;
}

function StudentDashboardView({ selectedProgram, profile, loading, setActiveMenuItem }: StudentDashboardViewProps) {
  const displayId = profile?.student_no ?? '—';
  const displayYearLevel = profile?.year_level ? `${profile.year_level} Year` : '—';
  const displayStanding = profile?.academic_standing ?? '—';

  const [upcomingEvents, setUpcomingEvents] = useState<RealCalendarEvent[]>([]);
  const [inquiries, setInquiries] = useState<StudentInquiry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        // Load Upcoming Activities
        const evRes = await fetch(CALENDAR_API_URL_STUDENT, { headers: { Authorization: `Bearer ${token}` } });
        if (evRes.ok) {
          const data = await evRes.json();
          const todayStr = new Date().toISOString().split('T')[0];
          const studentOnly = ((data ?? []) as RealCalendarEvent[])
            .filter(isStudentAuthorizedEvent)
            .filter(e => dateOnlyStudent(e.event_date) >= todayStr)
            .sort(sortEventsChronologically);
          setUpcomingEvents(studentOnly);
        }

        // Load Active Inquiries
        if (userId) {
          const { data: inqData } = await supabase
            .from('inquiries')
            .select('*')
            .eq('student_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
          if (inqData) setInquiries(inqData);
        }

      } catch (err) {
        console.error('Failed to load dashboard widgets', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div>
      {/* ── Stat cards (Non-clickable) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        
        {/* Card 1: Student ID */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-center cursor-default">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <User className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">
            {loading ? <span className="inline-block h-6 w-20 bg-gray-200 rounded animate-pulse" /> : displayId}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">Student ID</div>
        </div>

        {/* Card 2: Year Level */}
        {/* Card 2: Year Level & Program */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-center cursor-default">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">
            {loading ? <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" /> : displayYearLevel}
          </div>
          <div 
            className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 truncate" 
            title={profile?.program || 'Program'}
          >
            Year Level {profile?.program ? ` • ${profile.program}` : ''}
          </div>
        </div>

        {/* Card 3: Academic Standing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-center cursor-default">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">
            {loading ? <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse" /> : displayStanding}
          </div>
          <div className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">Academic Standing</div>
        </div>

      </div>

      {/* ── Bottom Action Cards (Clickable) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inquiry Card */}
        <div 
          onClick={() => setActiveMenuItem('inquiry')} 
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md transition-all flex flex-col h-[490px]"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Inquiry & Contact</h2>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loadingData ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : inquiries.length > 0 ? (
              inquiries.map(inq => (
                <div key={inq.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                  <div className="min-w-0 pr-4">
                    <div className="text-sm font-bold text-gray-900 truncate mb-1">{inq.subject}</div>
                    <div className="text-xs text-gray-500">Submitted {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider flex-shrink-0 ${inq.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inq.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-semibold text-gray-600">No active inquiries</p>
                <p className="text-xs mt-1 text-gray-400">Click here to ask a question or submit a concern.</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Card */}
        <div 
          onClick={() => setActiveMenuItem('achievements')} 
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md transition-all flex flex-col h-[490px]"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Activities</h2>
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loadingData ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map(ev => (
                <div key={ev.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-1.5 border-l-4" style={{ borderLeftColor: colorForStudentEvent(ev) }}>
                  <span className="truncate text-sm font-bold text-gray-900">{ev.title}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})} 
                    {ev.start_time && ` · ${formatSingleTime(ev.start_time)}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Calendar className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-semibold text-gray-600">No upcoming activities</p>
                <p className="text-xs mt-1 text-gray-400">Your schedule is clear for now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== FACULTY DEPARTMENTS ======================
function FacultyDepartments({ profile }: { profile: StudentProfile | null }) {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      setLoading(true);
      setLoadError('');
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, program, department')
          .in('role', ['department_chair', 'faculty']);

        if (error) throw error;

        const studentProg = profile.program || profile.department_name || '';

        // Smart string matcher to link Faculty/Chairs to the Student's Program
        const isMatch = (targetStr: string, stProg: string) => {
          const t = (targetStr || '').toLowerCase();
          const s = (stProg || '').toLowerCase();
          if (!t || !s) return false;
          if (t === s || t.includes(s) || s.includes(t)) return true;
          if ((s.includes('beed') || s.includes('elementary')) && (t.includes('beed') || t.includes('elementary'))) return true;
          if ((s.includes('btled') || s.includes('technology') || s.includes('livelihood')) && (t.includes('btled') || t.includes('technology') || t.includes('livelihood'))) return true;
          if ((s.includes('math') || s.includes('mathematics')) && (t.includes('math') || t.includes('mathematics'))) return true;
          if (s.includes('english') && t.includes('english')) return true;
          if (s.includes('science') && t.includes('science')) return true;
          return false;
        };

        const matched = (data || []).filter((p) => {
          const targetStr = [p.program, p.department].filter(Boolean).join(' ');
          return isMatch(targetStr, studentProg);
        });

        // Sort so the Chairman always appears at the top
        matched.sort((a, b) => {
          if (a.role === 'department_chair' && b.role !== 'department_chair') return -1;
          if (a.role !== 'department_chair' && b.role === 'department_chair') return 1;
          return (a.full_name || '').localeCompare(b.full_name || '');
        });

        setFaculty(matched);
      } catch (err) {
        setLoadError('Could not reach the database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      load();
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const departmentName = profile.department_name || profile.program || 'Your Program';

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty & Departments</h1>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
          {departmentName}
        </h2>
        <p className="text-xs text-gray-400 mb-6">Faculty assigned to your specific program</p>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 border-t-transparent rounded-full animate-spin text-blue-600" />
            <span className="text-sm">Loading faculty...</span>
          </div>
        ) : faculty.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm text-gray-400">No faculty members found for your program yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.map((f) => {
              const isChair = f.role === 'department_chair';
              
              return (
                <div key={f.id} className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  isChair ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50' : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center font-bold text-lg shadow-sm ${
                      isChair ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(f.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2 truncate">
                        <span className="truncate">{f.full_name}</span>
                        {isChair && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider font-bold rounded-md flex-shrink-0">
                            Chairman
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                        {isChair ? 'Department Chairman' : (f.position || 'Faculty Member')}
                      </div>
                      {f.email && (
                        <div className="text-xs sm:text-sm text-blue-600 mt-0.5 truncate">
                          {f.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ====================== ACADEMIC RESOURCES  ======================
function AcademicResources() {
  return <AcademicDocumentsViewer />;
}

// ====================== ACHIEVEMENTS & ACTIVITIES ======================
const ROLE_DISPLAY_LABEL_STUDENT: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  college_dean: 'Dean',
  department_chair: 'Dept. Chair',
  faculty: 'Faculty',
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

function AchievementsActivities() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<RealCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RealCalendarEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(CALENDAR_API_URL_STUDENT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setLoadError('Failed to load events.');
        setEvents([]);
        return;
      }
      const data = await res.json();
      const studentOnlyData = ((data ?? []) as RealCalendarEvent[]).filter(isStudentAuthorizedEvent);
      setEvents(studentOnlyData);
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

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const jumpToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, RealCalendarEvent[]>();
    const sorted = [...events].sort(sortEventsChronologically);
    sorted.forEach((ev) => {
      const d = dateOnlyStudent(ev.event_date);
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
      .filter((e) => dateOnlyStudent(e.event_date) >= todayStr)
      .sort(sortEventsChronologically);
  }, [events, todayStr]);

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
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
          Calendar & Activities
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Stay updated on academic schedules, university activities, and important deadlines.
        </p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Main Calendar Grid (2 Cols on lg) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
          {/* Month Navigation Toolbar */}
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
                {Array.from({ length: 7 }, (_, i) => today.getFullYear() - 2 + i).map((yr) => (
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

          {/* Days Header */}
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
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading activities…</span>
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
                    aria-label={`${formatDate(dateStr)}${hasEvents ? `, ${dayEvents.length} activities` : ''}`}
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
                            setSelectedEvent(ev);
                          }}
                          className="text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs hover:brightness-110 transition-all"
                          style={{ backgroundColor: colorForStudentEvent(ev) }}
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

                    {/* Mobile Indicators */}
                    {hasEvents && (
                      <div className="sm:hidden flex gap-1 flex-wrap px-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: colorForStudentEvent(ev) }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                    )}

                    {/* Hover / Tap Popover with Time Range */}
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
                            {dayEvents.length} {dayEvents.length === 1 ? 'activity' : 'activities'}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                          {dayEvents.map((ev) => {
                            const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50/40 border-l-[3px] space-y-1 cursor-pointer transition-colors"
                                style={{ borderLeftColor: colorForStudentEvent(ev) }}
                              >
                                <div className="text-xs font-semibold text-gray-900 leading-snug">
                                  {ev.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                  <span className="font-medium text-gray-700">
                                    {timeRangeStr}
                                  </span>
                                  {ev.event_type && (
                                    <span className="uppercase text-[9px] font-bold text-gray-600">
                                      {ev.event_type}
                                    </span>
                                  )}
                                </div>
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

        {/* ── Upcoming Activities Side Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Upcoming Activities</h2>
            <span className="px-2 py-0.5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-full">
              {upcomingEvents.length}
            </span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No upcoming activities scheduled</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {upcomingEvents.map((ev) => {
                const evDate = dateOnlyStudent(ev.event_date);
                const isDueToday = evDate === todayStr;
                const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50/60 transition-all cursor-pointer group space-y-1.5"
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
                      <span className="font-medium text-gray-700">
                        {timeRangeStr}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colorForStudentEvent(ev) }}
                      />
                      <span className="truncate capitalize">{ev.event_type || 'Activity'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Event Details Modal ── */}
      {selectedEvent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white mb-1"
                  style={{ backgroundColor: colorForStudentEvent(selectedEvent) }}
                >
                  {selectedEvent.event_type || 'Activity'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 bg-gray-50 rounded-xl p-4 text-xs sm:text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">Date: </span>
                <span>{formatLongDate(dateOnlyStudent(selectedEvent.event_date))}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-900">Time: </span>
                <span>{formatEventTimeRange(selectedEvent.start_time, selectedEvent.end_time)}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-900">Posted by: </span>
                <span>
                  {ROLE_DISPLAY_LABEL_STUDENT[selectedEvent.posted_by_role ?? ''] ??
                    selectedEvent.posted_by_role ??
                    'University'}
                </span>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== INQUIRY / CONTACT ======================
function InquiryContact() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [inquiries, setInquiries] = useState<StudentInquiry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<StudentInquiry | null>(null);

  const fetchInquiries = async () => {
    setLoadingHistory(true);
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) { setLoadingHistory(false); return; }

      const { data, error } = await supabase
        .from('inquiries')
        .select('id, subject, category, message, reply, status, created_at, replied_at')
        .eq('student_id', currentUserId)
        .order('created_at', { ascending: false });

      if (!error && data) setInquiries(data as StudentInquiry[]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Realtime — reflect the dean's reply as soon as it's saved
  useEffect(() => {
    const channelName = `student-inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => fetchInquiries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!subject.trim() || !message.trim()) {
      setSubmitError('Please fill in the subject and message.');
      return;
    }

    setSubmitting(true);
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setSubmitError('No logged-in user found. Please sign in again.');
        return;
      }

      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('full_name')
        .eq('user_id', currentUserId)
        .single();

      const { error: insertError } = await supabase.from('inquiries').insert({
        student_id: currentUserId,
        sender_id: currentUserId,
        sender_name: profileData?.full_name ?? localStorage.getItem('userFullName') ?? 'Student',
        sender_role: 'student',
        subject: subject.trim(),
        category,
        message: message.trim(),
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSubject('');
      setCategory(INQUIRY_CATEGORIES[0]);
      setMessage('');
      setSubmitSuccess(true);
      fetchInquiries();
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
      setSubmitError('Failed to submit your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      {/* ── Submit form ── */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Submit a Concern or Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {INQUIRY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              required
            />
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          {submitSuccess && <p className="text-sm text-green-600">Your inquiry has been submitted successfully!</p>}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      {/* ── History of past inquiries ── */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Inquiry History</h2>
          <button onClick={fetchInquiries} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Loading history...</div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm text-gray-400">You haven't submitted any inquiries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <button
                key={inq.id}
                onClick={() => setSelectedInquiry(inq)}
                className="w-full text-left p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{inq.subject}</span>
                  {inq.status === 'pending' ? (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                  ) : (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Answered</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {inq.category && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{inq.category}</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(inq.created_at)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{inq.message}</p>
                {inq.status === 'answered' && (
                  <p className="text-xs text-blue-600 mt-1.5 truncate">Dean replied — tap to view</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail modal (shows the dean's reply, if any) ── */}
      {selectedInquiry && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="min-w-0">
                {selectedInquiry.category && (
                  <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mb-2">
                    {selectedInquiry.category}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedInquiry.subject}</h3>
                <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(selectedInquiry.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Your Message</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                {selectedInquiry.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    Awaiting reply from the Dean
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Answered
                  </span>
                )}
              </div>
              {selectedInquiry.reply && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Dean's Reply</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedInquiry.reply}</p>
                  {selectedInquiry.replied_at && (
                    <p className="text-xs text-blue-400 mt-2">{formatDate(selectedInquiry.replied_at)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== SETTINGS ======================
type StudentSettingsTab = 'profile' | 'security' | 'notifications';

interface StudentSettingsProps {
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  profile: StudentProfile | null;
  userEmail: string;
  loading: boolean;
  onProfileUpdated: () => void;
}

function StudentSettings({ profile, userEmail, loading, onProfileUpdated }: StudentSettingsProps) {
  const [activeTab, setActiveTab] = useState<StudentSettingsTab>('profile');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);

  // Editable fields, initialized from profile/auth once loaded
  const [fullNameInput, setFullNameInput] = useState('');
  const [studentNoInput, setStudentNoInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullNameInput(profile.full_name);
    }
    if (profile?.student_no) {
      setStudentNoInput(profile.student_no);
    }
  }, [profile?.full_name, profile?.student_no]);

  useEffect(() => {
    setEmailInput(userEmail);
  }, [userEmail]);

  const handleSaveChanges = async () => {
    const trimmedName = fullNameInput.trim();
    const trimmedStudentNo = studentNoInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedName) {
      setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    if (!trimmedStudentNo) {
      setSaveMessage({ type: 'error', text: 'Student ID cannot be empty.' });
      return;
    }
    if (!trimmedEmail) {
      setSaveMessage({ type: 'error', text: 'Email address cannot be empty.' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: trimmedName,
          student_no: trimmedStudentNo,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveMessage({ type: 'error', text: err.error || 'Failed to save changes. Please try again.' });
        return;
      }

      if (trimmedEmail !== userEmail) {
        setSaveMessage({ type: 'success', text: 'Name and Student ID saved. Email address changes are not yet supported — contact your Department Chair to update your email.' });
      } else {
        setSaveMessage({ type: 'success', text: 'Your changes have been saved.' });
      }

      onProfileUpdated();
    } catch {
      setSaveMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: StudentSettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile Information', icon: <User className="w-4 h-4" /> },
    { key: 'security', label: 'Password & Security', icon: <Lock className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and system preferences.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveChanges}
            disabled={saving || loading}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 text-sm rounded-xl border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Body: vertical tabs + panel */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar tab list */}
        <nav className="bg-white rounded-xl shadow-md p-3 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 last:mb-0 transition-colors text-left ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 min-h-[520px]">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500 mb-6">Update your personal details.</p>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                      <input
                        type="text"
                        value={studentNoInput}
                        onChange={(e) => setStudentNoInput(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Password & Security</h2>
              <p className="text-sm text-gray-500 mb-6">Keep your account secure.</p>
              <div className="space-y-3 max-w-md">
                <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Change Password
                </button>
                <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500 mb-6">Choose what you want to be notified about.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500 mt-1">Receive email updates about your activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Announcement Alerts</p>
                    <p className="text-xs text-gray-500 mt-1">Get notified about important announcements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementAlerts}
                      onChange={(e) => setAnnouncementAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}