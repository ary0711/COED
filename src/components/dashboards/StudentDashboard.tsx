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
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const studentMenuItems = [
  { icon: Bell,         label: 'Dashboard',               id: 'dashboard'    },
  { icon: User,         label: 'Faculty & Departments',    id: 'faculty'      },
  { icon: BookOpen,     label: 'Academic Resources',       id: 'resources'    },
  { icon: Award,        label: 'Achievements & Activities',id: 'achievements' },
  { icon: MessageSquare,label: 'Inquiry / Contact',        id: 'inquiry'      },
  { icon: Settings,     label: 'Settings',                 id: 'settings'     },
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
            />
          )}
          {activeMenuItem === 'faculty'     && <FacultyDepartments />}
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
// Self-contained: reads/writes the shared `notifications` table, scoped
// to the logged-in user via localStorage('userId') (this app uses a
// custom JWT login, not Supabase Auth, so there's no auth session to
// read the user from). Updates live via a realtime subscription.
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
// Header/welcome banner and the "Enrolled Subjects" stat card have been
// removed per request. The remaining stat cards now span 3 columns.
interface StudentDashboardViewProps {
  selectedProgram: string;
  profile: StudentProfile | null;
  loading: boolean;
  error: string | null;
}

function StudentDashboardView({ selectedProgram, profile, loading }: StudentDashboardViewProps) {
  const announcements = [
    { id: 1, title: 'Midterm Examination Schedule Released', date: 'Feb 12, 2026', type: 'important' },
    { id: 2, title: 'Faculty Evaluation Period Open',        date: 'Feb 10, 2026', type: 'info'      },
    { id: 3, title: 'College Foundation Day Activities',     date: 'Feb 8, 2026',  type: 'info'      },
  ];

  const displayId = profile?.student_no ?? '—';
  const displayYearLevel = profile?.year_level ?? '—';
  const displayStanding = profile?.academic_standing ?? '—';

  return (
    <div>
      {/* ── Stat cards — 3-column now that Enrolled Subjects has been removed ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-2" />
          <div className="text-base sm:text-xl font-bold text-gray-900 truncate">
            {loading ? <span className="inline-block h-5 w-16 bg-gray-200 rounded animate-pulse" /> : displayId}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Student ID</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {loading ? <span className="inline-block h-6 w-8 bg-gray-200 rounded animate-pulse" /> : displayYearLevel}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Year Level</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <Award className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 mb-2" />
          <div className="text-base sm:text-xl font-bold text-gray-900">
            {loading ? <span className="inline-block h-5 w-20 bg-gray-200 rounded animate-pulse" /> : displayStanding}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Academic Standing</div>
        </div>
      </div>

      {/* ── Announcements / Upcoming Deadlines — same lg:grid-cols-2 pattern as Faculty ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className={`p-4 rounded-lg border-l-4 ${a.type === 'important' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                <div className="font-medium text-gray-900 text-sm sm:text-base">{a.title}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{a.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Midterm Examinations</div>
                <div className="text-xs sm:text-sm text-gray-600">Starts: March 1, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Enrollment Verification</div>
                <div className="text-xs sm:text-sm text-gray-600">Due: February 28, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Scholarship Application Deadline</div>
                <div className="text-xs sm:text-sm text-gray-600">Due: March 15, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== FACULTY DEPARTMENTS ======================
interface FacultyMember {
  id: string;
  full_name: string;
  email: string | null;
  position: string | null;
}

function FacultyDepartments() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const token = localStorage.getItem('token');

        const meRes = await fetch(ME_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          setLoadError('Failed to load your profile.');
          setLoading(false);
          return;
        }
        const me = await meRes.json();

        if (!me.departmentId) {
          setLoadError('No department is associated with your program yet.');
          setLoading(false);
          return;
        }

        setDepartmentName(me.departmentNames?.[0] ?? '');

        const facultyRes = await fetch(`http://localhost:5000/api/faculty/by-department/${me.departmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!facultyRes.ok) {
          setLoadError('Failed to load faculty for your department.');
          setLoading(false);
          return;
        }
        const facultyData = await facultyRes.json();
        setFaculty(facultyData ?? []);
      } catch {
        setLoadError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty & Departments</h1>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
          {departmentName ? `${departmentName} Faculty` : 'My Faculty Members'}
        </h2>
        <p className="text-xs text-gray-400 mb-4">Faculty assigned to your program's department</p>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading faculty...</span>
          </div>
        ) : faculty.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <User className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No faculty found for your department yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {faculty.map((f) => (
              <div key={f.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{f.full_name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{f.position ?? 'Faculty'}</div>
                    {f.email && <div className="text-xs sm:text-sm text-blue-600">{f.email}</div>}
                  </div>
                  <User className="w-7 h-7 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AcademicResources() {
  interface AcademicDoc {
    id: string;
    title: string;
    document_type: 'handbook' | 'policy' | 'form' | 'memorandum';
    file_size: number;
    file_name?: string;
  }

  const DOC_TYPE_LABELS: Record<string, string> = {
    handbook: 'Handbook',
    policy: 'Policy',
    memorandum: 'Memorandum',
    form: 'Form',
  };

  const categoryColor: Record<string, string> = {
    Handbook: 'bg-blue-100 text-blue-700',
    Policy: 'bg-purple-100 text-purple-700',
    Memorandum: 'bg-orange-100 text-orange-700',
    Form: 'bg-green-100 text-green-700',
  };

  const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';

  const [documents, setDocuments] = useState<AcademicDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const categories = ['All', 'Handbook', 'Policy', 'Form', 'Memorandum'];

  const fetchDocuments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(DOCS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load documents.');
        setDocuments([]);
        return;
      }
      const data = await res.json();
      setDocuments(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePreview = async (doc: AcademicDoc) => {
    setPreviewingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to open preview.');
        return;
      }

      const { url, file_type } = await res.json();

      if (file_type === 'application/pdf' || file_type?.startsWith('image/')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
        window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setLoadError('Could not connect to the server for preview.');
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDownload = async (doc: AcademicDoc) => {
    setDownloadingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to generate download link.');
        return;
      }
      const { url, file_name } = await res.json();

      const link = document.createElement('a');
      link.href = url;
      link.download = file_name || doc.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLoadError('Could not reach the server for download.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = activeCategory === 'All'
    ? documents
    : documents.filter((d) => DOC_TYPE_LABELS[d.document_type] === activeCategory);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Resources</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeCategory === c
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No documents found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((doc) => {
              const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
              const isPreviewing = previewingId === doc.id;
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            categoryColor[label] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isPreviewing ? 'Opening…' : 'View'}
                    </button>

                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Download'
                      )}
                    </button>
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

// ====================== ACHIEVEMENTS & ACTIVITIES ======================
interface RealCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // "YYYY-MM-DDTHH:mm:ss"
  department_ids: string[] | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | null;
  status: string | null;
  posted_by_role: string | null;
}

const CALENDAR_API_URL_STUDENT = 'http://localhost:5000/api/calendar-events';

const EVENT_TYPE_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#EF4444',
  exam: '#F59E0B',
};
const DEFAULT_STUDENT_EVENT_COLOR = '#1E3A8A';

const ROLE_DISPLAY_LABEL_STUDENT: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  department_chair: 'Dept. Chair',
};

function colorForStudentEvent(ev: RealCalendarEvent): string {
  return (ev.event_type && EVENT_TYPE_COLOR[ev.event_type]) || DEFAULT_STUDENT_EVENT_COLOR;
}

function dateOnlyStudent(isoLike: string): string {
  return isoLike.split('T')[0];
}

function AchievementsActivities() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<RealCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState<RealCalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

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
      setEvents((data ?? []) as RealCalendarEvent[]);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => dateOnlyStudent(e.event_date) === dateStr);
  };

  const upcomingEvents = events
    .filter(e => dateOnlyStudent(e.event_date) >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const historyEvents = events
    .filter(e => dateOnlyStudent(e.event_date) < todayStr)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isToday = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === todayStr;
  };
  const isPastDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr < todayStr;
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Achievements & Activities</h1>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">College Calendar</h3>
            <p className="text-sm text-gray-500">{monthName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-2 bg-gray-50 rounded-lg" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayEvents = getEventsForDay(day);
              const isTodayDate = isToday(day);
              const isPast = isPastDay(day);

              return (
                <div
                  key={day}
                  className={`min-h-[80px] p-2 border border-gray-100 rounded-lg ${
                    isPast ? 'bg-gray-200 opacity-60' : 'bg-white hover:bg-[#F8FAFC]'
                  } ${isTodayDate ? 'ring-2 ring-[#2563EB] ring-offset-1' : ''} transition-colors`}
                >
                  <div className={`text-sm font-medium mb-1 ${isPast ? 'text-gray-600' : isTodayDate ? 'text-[#2563EB]' : 'text-gray-900'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`text-xs text-white px-1 py-0.5 rounded truncate cursor-pointer hover:shadow-md transition-all ${isPast ? 'opacity-70' : ''}`}
                        style={{ backgroundColor: colorForStudentEvent(event) }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 flex-wrap">
          {Object.entries(EVENT_TYPE_COLOR).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorForStudentEvent(selectedEvent) }} />
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                <p className="text-sm text-gray-900">{formatDate(dateOnlyStudent(selectedEvent.event_date))}</p>
              </div>
              {selectedEvent.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.posted_by_role && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Posted By</p>
                  <p className="text-sm text-gray-900">{ROLE_DISPLAY_LABEL_STUDENT[selectedEvent.posted_by_role] ?? selectedEvent.posted_by_role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'upcoming' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Upcoming Activities</span>
            <span className="sm:hidden">Upcoming</span>
            {upcomingEvents.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{upcomingEvents.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Activity History</span>
            <span className="sm:hidden">History</span>
            {historyEvents.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{historyEvents.length}</span>}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedEvent(ev)}>
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: colorForStudentEvent(ev) }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(dateOnlyStudent(ev.event_date))}
                      {ev.posted_by_role && ` · Posted by ${ROLE_DISPLAY_LABEL_STUDENT[ev.posted_by_role] ?? ev.posted_by_role}`}
                    </div>
                    {ev.description && <div className="text-xs text-gray-400 mt-1">{ev.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No past events</p>
                </div>
              ) : historyEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => setSelectedEvent(ev)}>
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: colorForStudentEvent(ev) }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(dateOnlyStudent(ev.event_date))}
                      {ev.posted_by_role && ` · Posted by ${ROLE_DISPLAY_LABEL_STUDENT[ev.posted_by_role] ?? ev.posted_by_role}`}
                    </div>
                    {ev.description && <div className="text-xs text-gray-300 mt-1">{ev.description}</div>}
                  </div>
                  <span className="text-xs text-gray-400 italic flex-shrink-0 mt-1">Past</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================== INQUIRY / CONTACT ======================
// Category dropdown + inquiry history (with the dean's reply, if any).
// Submitting inserts into the shared `inquiries` table with
// sender_role: 'student', so it shows up in the dean's Inquiries page.
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
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
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
        </div>
      )}
    </div>
  );
}

// ====================== SETTINGS ======================
interface StudentSettingsProps {
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  profile: StudentProfile | null;
  userEmail: string;
  loading: boolean;
  onProfileUpdated: () => void;
}

type StudentSettingsTab = 'profile' | 'security' | 'notifications' | 'academic' | 'account';

function StudentSettings({ selectedProgram, setSelectedProgram, profile, userEmail, loading, onProfileUpdated }: StudentSettingsProps) {
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

  const displayYearLevel = profile?.year_level ?? '—';
  const displayStanding = profile?.academic_standing ?? '—';
  const displayEnrollmentStatus = profile?.enrollment_status ?? '—';

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

      // Email is intentionally not sent to the backend — this app has
      // no real Supabase Auth session to safely re-verify a changed
      // email against (matches the PATCH /api/me route's own note).
      // If the user typed a different email, let them know it wasn't
      // applied rather than silently ignoring it.
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

  const handleCancel = () => {
    setFullNameInput(profile?.full_name ?? '');
    setStudentNoInput(profile?.student_no ?? '');
    setEmailInput(userEmail);
    setSaveMessage(null);
  };

  const tabs: { key: StudentSettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile Information', icon: <User className="w-4 h-4" /> },
    { key: 'security', label: 'Password & Security', icon: <Lock className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { key: 'academic', label: 'Academic Settings', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'account', label: 'Account Actions', icon: <LogOut className="w-4 h-4" /> },
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
            onClick={handleCancel}
            disabled={saving}
            className="px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
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

      {/* Body: vertical tabs + panel (matches the Dean's Settings layout) */}
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

        {/* Panel — fixed min-height so switching tabs doesn't resize the card */}
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

          {activeTab === 'academic' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Academic Settings</h2>
              <p className="text-sm text-gray-500 mb-6">Your program, standing, and enrollment status.</p>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> Your Program
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedProgram || '—'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the program you registered under, approved by your Department Chair. Contact your Chair if this needs to change.
                  </p>
                  <p className="text-xs text-gray-600 mt-3">
                    <span className="font-semibold">Year Level:</span> {displayYearLevel}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1">Current Status</p>
                  <p className="text-sm font-medium text-gray-900">{displayEnrollmentStatus}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Academic Standing</p>
                  <p className="text-sm font-medium text-gray-900">{displayStanding}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Actions</h2>
              <p className="text-sm text-gray-500 mb-6">Manage your active sessions.</p>
              <div className="space-y-3 max-w-md">
                <button className="w-full px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
                  Log Out from All Devices
                </button>
                <p className="text-xs text-gray-500 text-center">This will sign you out from all active sessions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}