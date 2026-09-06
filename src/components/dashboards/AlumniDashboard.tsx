import { 
  User, 
  FileText, 
  Award, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  CheckCircle,
  Menu,
  History,
  Download,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Settings,
  Lock,
  LogOut,
  Check,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// ====================== TRACER SURVEY API HELPERS ======================
interface TracerSurveyData {
  alumni_id: string;
  employment_status: string;
  job_title: string;
  employer: string;
  years_employed: number;
  monthly_salary: string;
  relevance: string;
  updated_at?: string;
}

const TRACER_API_URL = 'http://localhost:5000/api/tracer-survey';

function getToken() {
  return localStorage.getItem('token');
}

async function parseErrorOrThrow(res: Response) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || res.statusText);
}

async function getTracerSurvey(_alumniId: string) {
  const res = await fetch(`${TRACER_API_URL}/mine`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) await parseErrorOrThrow(res);
  return res.json();
}

async function saveTracerSurvey(data: TracerSurveyData) {
  const { alumni_id, ...payload } = data;
  const res = await fetch(TRACER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

async function updateTracerSurvey(_alumniId: string, data: Partial<TracerSurveyData>) {
  const { alumni_id, ...payload } = data as TracerSurveyData;
  const res = await fetch(TRACER_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

function validateTracerSurvey(data: Partial<TracerSurveyData>): string[] {
  const errors: string[] = [];
  if (!data.employment_status) errors.push('Employment status is required.');
  if (data.employment_status === 'employed' || data.employment_status === 'self-employed') {
    if (!data.job_title) errors.push('Job title is required.');
    if (!data.employer) errors.push('Employer/company is required.');
  }
  return errors;
}

async function getDashboardStats(_alumniId: string) {
  const res = await fetch(`${TRACER_API_URL}/dashboard-stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) await parseErrorOrThrow(res);
  return res.json();
}

const alumniMenuItems = [
  { icon: Bell,         label: 'Dashboard',              id: 'dashboard'   },
  { icon: FileText,     label: 'Graduate Tracer Survey',  id: 'tracer'      },
  { icon: CalendarIcon, label: 'Alumni Calendar',         id: 'calendar'    },
  { icon: BookOpen,     label: 'College Information',     id: 'college-info'},
  { icon: Award,        label: 'Achievements',            id: 'achievements'},
  { icon: FileText,     label: 'Documents & Resources',   id: 'documents'   },
  { icon: MessageSquare,label: 'Inquiry / Contact',       id: 'inquiry'     },
  { icon: Settings,     label: 'Settings',               id: 'settings'    },
];

interface AlumniDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onRoleChange?: () => void;
  onLogout?: () => void;
  userName?: string;
  idNumber?: string;
}

export function AlumniDashboard({
  activeMenuItem,
  setActiveMenuItem,
  onLogout,
  userName,
  idNumber,
}: AlumniDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const handleInternalLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    if (onLogout) {
      onLogout();
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id_number', idNumber)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setUserEmail(data.email ?? '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (idNumber) fetchProfile();
  }, [idNumber]);
  
  // Auto-close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-transparent">

      {/* ── Sidebar — slide-in on mobile, fixed on desktop ── */}
      <Sidebar
        menuItems={alumniMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Alumni"
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
                userRole="Alumni"
                userName={userName ?? 'Alumni'}
                onLogout={handleInternalLogout}
              />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'    && <AlumniDashboardView setActiveMenuItem={setActiveMenuItem} alumniId={idNumber || 'ALU-2020-0458'} />}
          {activeMenuItem === 'tracer'       && <TracerSurvey alumniId={idNumber || 'ALU-2020-0458'} />}
          {activeMenuItem === 'calendar'     && <AlumniCalendar />}
          {activeMenuItem === 'college-info' && <CollegeInformation />}
          {activeMenuItem === 'achievements' && <AlumniAchievements />}
          {activeMenuItem === 'documents'    && <DocumentsResources />}
          {activeMenuItem === 'inquiry'      && <AlumniInquiry />}
          {activeMenuItem === 'settings'     && (
            <AlumniSettings
              profile={profile}
              userEmail={userEmail}
              loading={profileLoading}
              onProfileUpdated={fetchProfile}
              idNumber={idNumber || ''}
              onLogout={handleInternalLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ====================== NOTIFICATION BELL ======================
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
    const channelName = `alumni-notif-channel-${Math.random().toString(36).slice(2)}`;
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

// ====================== DASHBOARD VIEW ======================
function AlumniDashboardView({
  setActiveMenuItem,
  alumniId,
}: {
  setActiveMenuItem: (id: string) => void;
  alumniId: string;
}) {
  const [stats, setStats] = useState({
    surveyStatus: 'Not Started',
    employmentStatus: 'Not Set',
    lastUpdated: null as string | null,
    membershipStatus: 'Active',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats(alumniId);
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [alumniId]);

  return (
    <div>
      {/* Tracer Status */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.surveyStatus}
          </div>
          <div className="text-xs text-gray-600">Tracer Survey</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">
            {stats.lastUpdated
              ? `Last updated: ${new Date(stats.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'No data yet'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.employmentStatus}
          </div>
          <div className="text-xs text-gray-600">Employment</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">Full-time Teacher</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.membershipStatus}
          </div>
          <div className="text-xs text-gray-600">Alumni Status</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">Member since 2020</div>
        </div>
      </div>

      {/* Announcements & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Announcements
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Alumni Homecoming 2026</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">March 30, 2026 • College Grounds</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Career Mentorship Program</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Now accepting applications</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveMenuItem('achievements')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 text-sm sm:text-base">Recent Awards</div>
              <div className="text-xs sm:text-sm text-gray-600">See the college's latest honors and recognitions</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('achievements')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 text-sm sm:text-base">Research Highlights</div>
              <div className="text-xs sm:text-sm text-gray-600">Explore recent publications and partnerships</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== TRACER SURVEY (ALUMNI DASHBOARD) ======================
function TracerSurvey({ alumniId }: { alumniId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [formData, setFormData] = useState({
    employmentStatus: 'employed',
    jobTitle: '',
    employer: '',
    yearsEmployed: '',
    monthlySalary: '25000-30000',
    relevance: 'very-relevant',
  });

  // Load existing survey through your existing Express route: GET /api/tracer-survey/mine
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const existing = await getTracerSurvey(alumniId);
        if (existing) {
          setFormData({
            employmentStatus: existing.employment_status || 'employed',
            jobTitle: existing.job_title || '',
            employer: existing.employer || '',
            yearsEmployed: String(existing.years_employed ?? ''),
            monthlySalary: existing.monthly_salary || '25000-30000',
            relevance: existing.relevance || 'very-relevant',
          });
          setLastUpdated(existing.updated_at);
          setIsNew(false);
          setIsEditing(false);
        } else {
          setIsNew(true);
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Failed to load existing survey:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [alumniId]);

  // Trigger modal validation
  const initiateSubmit = () => {
    const payload = {
      alumni_id: alumniId,
      employment_status: formData.employmentStatus,
      job_title: formData.jobTitle,
      employer: formData.employer,
      years_employed: Number(formData.yearsEmployed) || 0,
      monthly_salary: formData.monthlySalary,
      relevance: formData.relevance,
    };

    const validationErrors = validateTracerSurvey(payload);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    setShowConfirmModal(true);
  };

  // Confirmed submission to POST /api/tracer-survey or PUT /api/tracer-survey
  const handleConfirmedSave = async () => {
    setSaving(true);
    const payload = {
      alumni_id: alumniId,
      employment_status: formData.employmentStatus,
      job_title: formData.jobTitle,
      employer: formData.employer,
      years_employed: Number(formData.yearsEmployed) || 0,
      monthly_salary: formData.monthlySalary,
      relevance: formData.relevance,
    };

    try {
      if (isNew) {
        await saveTracerSurvey(payload);
      } else {
        await updateTracerSurvey(alumniId, payload);
      }

      setLastUpdated(new Date().toISOString());
      setIsNew(false);
      setIsEditing(false);
      setShowConfirmModal(false);

      setFeedbackModal({
        open: true,
        type: 'success',
        title: 'Survey Recorded Successfully',
        message: 'Your employment and career details have been synchronized with the College Dean registry.',
      });
    } catch (err: any) {
      setShowConfirmModal(false);
      setFeedbackModal({
        open: true,
        type: 'error',
        title: 'Submission Error',
        message: err?.message || 'Could not save survey response. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-800">Retrieving Graduate Tracer Profile</p>
        <p className="text-xs text-gray-400 mt-1">Connecting to institutional records...</p>
      </div>
    );
  }

  const isEmployedType =
    formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed';

  return (
    <div className="space-y-6">
      {/* ── Section Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#1E3A8A]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Institutional Graduate Tracer
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Accreditation & CHED Compliance Career Tracking System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Update Information
            </button>
          ) : !isNew && isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Active Status Banner ── */}
      {!isNew && !isEditing && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Tracer Profile is Active</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Last updated on{' '}
                <span className="font-semibold">
                  {lastUpdated
                    ? new Date(lastUpdated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Recent Session'}
                </span>
                . Your responses are officially counted in college analytics.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full w-fit">
            Verified Record
          </span>
        </div>
      )}

      {/* ── Validation Alerts ── */}
      {errors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <X className="w-4 h-4 text-rose-600" /> Missing Required Fields:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Professional & Employment Profile
          </span>
          <span className="text-xs text-gray-400">Alumni ID: {alumniId}</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Employment Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Current Employment Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="employed">Employed (Government / Private / NGO)</option>
                <option value="self-employed">Self-Employed / Entrepreneur / Freelancer</option>
                <option value="unemployed">Unemployed (Actively Seeking Employment)</option>
                <option value="further-study">Pursuing Advanced Degree / Graduate Studies</option>
              </select>
            </div>

            {/* Relevance to Degree */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Degree Alignment & Relevance
              </label>
              <select
                value={formData.relevance}
                onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="very-relevant">Directly Relevant (Education / Teaching Field)</option>
                <option value="relevant">Relevant (Related Discipline or Instructional Role)</option>
                <option value="somewhat-relevant">Somewhat Relevant (General Skills Applied)</option>
                <option value="not-relevant">Not Relevant (Different Industry)</option>
              </select>
            </div>

            {/* Position / Job Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Designation / Position Title {isEmployedType && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Master Teacher I, Secondary Math Teacher"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Employer / Institution */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Employer / Institution Name {isEmployedType && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Department of Education / St. Theresa Academy"
                value={formData.employer}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Years in Position */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Tenure in Role (Years)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.yearsEmployed}
                onChange={(e) => setFormData({ ...formData, yearsEmployed: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Monthly Salary Bracket */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Monthly Compensation Bracket
              </label>
              <select
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="below-20000">Below ₱20,000</option>
                <option value="20000-25000">₱20,000 – ₱25,000</option>
                <option value="25000-30000">₱25,000 – ₱30,000</option>
                <option value="30000-40000">₱30,000 – ₱40,000</option>
                <option value="above-40000">Above ₱40,000</option>
              </select>
            </div>
          </div>

          {/* Submission Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-100">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Discard Changes
                </button>
              )}
              <button
                type="button"
                onClick={initiateSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {isNew ? 'Submit Survey Response' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Submission Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto mb-3.5">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">Confirm Tracer Submission</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              You are about to save your employment details under{' '}
              <span className="font-semibold text-gray-800">
                {formData.jobTitle || formData.employmentStatus}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-gray-800">
                {formData.employer || 'Self / N/A'}
              </span>
              . This information will be aggregated in the Dean's accreditation report.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleConfirmedSave}
                disabled={saving}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-all shadow-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Feedback Modal ── */}
      {feedbackModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
                feedbackModal.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {feedbackModal.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <X className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">{feedbackModal.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">{feedbackModal.message}</p>

            <button
              type="button"
              onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== ALUMNI CALENDAR ======================
function AlumniCalendar() {
  interface CalendarEvent {
    id: string;
    title: string;
    date: number;
    type: 'homecoming' | 'mentorship' | 'meeting' | 'seminar' | 'other';
    description?: string;
    location?: string;
    color?: string;
  }

  const calendarEventsData: CalendarEvent[] = [
    { id: '1', title: 'Alumni Homecoming 2026',       date: 30, type: 'homecoming', description: 'Annual alumni homecoming celebration', location: 'College Grounds', color: '#3B82F6' },
    { id: '2', title: 'Career Mentorship Kickoff',     date: 8,  type: 'mentorship', description: "Orientation for this year's mentorship program", location: 'COED Conference Hall', color: '#10B981' },
    { id: '3', title: 'Alumni Association Meeting',    date: 15, type: 'meeting',    description: 'Quarterly officers meeting', location: "Dean's Office", color: '#A855F7' },
    { id: '4', title: 'Continuing Education Seminar',  date: 22, type: 'seminar',    description: 'Professional development seminar for licensed teachers', location: 'AVR', color: '#F97316' },
  ];

  const today = new Date();
  const [currentDate] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDay + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'homecoming':
        return 'bg-blue-500';
      case 'mentorship':
        return 'bg-green-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'seminar':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventsForDay = (day: number) => {
    return calendarEventsData.filter(event => event.date === day);
  };

  const formatDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const upcomingEvents = calendarEventsData.filter(event => {
    const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return eventDate >= todayDate;
  }).sort((a, b) => a.date - b.date);

  const historyEvents = calendarEventsData.filter(event => {
    const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return eventDate < todayDate;
  }).sort((a, b) => b.date - a.date);

  const isPastDay = (day: number) => {
    if (!day) return false;
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateToCheck < todayDate;
  };

  const isToday = (day: number) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Alumni Calendar</h1>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alumni Activities</h3>
            <p className="text-sm text-gray-500">{monthName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const events = day ? getEventsForDay(day) : [];
            const isTodayDate = day ? isToday(day) : false;
            const isPast = day ? isPastDay(day) : false;

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border border-gray-100 rounded-lg ${
                  !day
                    ? 'bg-gray-50'
                    : isPast
                      ? 'bg-gray-200 opacity-60 hover:bg-gray-300'
                      : 'bg-white hover:bg-[#F8FAFC] cursor-pointer'
                } ${isTodayDate ? 'ring-2 ring-[#2563EB] ring-offset-1' : ''} transition-colors`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isPast
                        ? 'text-gray-600'
                        : isTodayDate
                          ? 'text-[#2563EB]'
                          : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-xs ${getEventColor(event.type)} text-white px-1 py-0.5 rounded truncate ${
                            isPast ? 'opacity-70' : ''
                          } cursor-pointer hover:shadow-md transition-all`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Homecoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Mentorship</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Meeting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-600">Seminar</span>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date</p>
                <p className="text-sm text-gray-900">{formatDate(selectedEvent.date)}</p>
              </div>
              {selectedEvent.location && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                  <p className="text-sm text-gray-900">{selectedEvent.location}</p>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
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
            <CalendarIcon className="w-4 h-4" />
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
                  <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedEvent(ev)}>
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(ev.date)}{ev.location ? ` · ${ev.location}` : ''}</div>
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
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(ev.date)}{ev.location ? ` · ${ev.location}` : ''}</div>
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

// ====================== DOCUMENTS & RESOURCES ======================
interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size_label: string;
  file_url: string;
  created_at: string;
}

async function getDocuments() {
  const { data, error } = await supabase
    .from('alumni_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DocumentItem[];
}

function downloadDocument(fileUrl: string, name: string) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function DocumentsResources() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(documents.map((d) => d.category)))];
  const filtered = activeCategory === 'All' ? documents : documents.filter((d) => d.category === activeCategory);

  const categoryColor: Record<string, string> = {
    Directory: 'bg-blue-100 text-blue-700',
    Guide: 'bg-purple-100 text-purple-700',
    Policy: 'bg-orange-100 text-orange-700',
    Form: 'bg-green-100 text-green-700',
  };

  const handleDownload = (doc: DocumentItem) => {
    downloadDocument(doc.file_url, doc.name);
  };

  if (loading) {
    return <p className="text-gray-600">Loading documents...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Documents & Resources</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
              activeCategory === c
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-5 text-gray-600 text-sm">No documents available.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[doc.category] || 'bg-gray-100 text-gray-700'}`}>
                        {doc.category}
                      </span>
                      {doc.size_label && <span className="text-xs text-gray-400">{doc.size_label}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Download size={14} /> <span className="hidden xs:inline sm:inline">Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== INQUIRY / CONTACT ======================
const INQUIRY_CATEGORIES = [
  'Documents',
  'Employment',
  'Alumni Records',
  'Events',
  'System',
  'Account',
  'Suggestion',
  'Other',
];

interface AlumniInquiryRow {
  id: string;
  subject: string;
  category: string | null;
  message: string;
  reply: string | null;
  status: 'pending' | 'answered';
  created_at: string;
  replied_at: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string) {
  return status === 'answered'
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700';
}

function AlumniInquiry() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<AlumniInquiryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<AlumniInquiryRow | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setHistoryError('Your session looks outdated. Please log out and log in again.');
        return;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('id, subject, category, message, reply, status, created_at, replied_at')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as AlumniInquiryRow[]) ?? []);
    } catch (err) {
      setHistoryError('Failed to load inquiry history.');
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const channelName = `alumni-inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => loadHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setSubmitMessage({ type: 'error', text: 'Your session looks outdated. Please log out and log in again.' });
        return;
      }

      const { data: profileData } = await supabase
        .from('alumni_profiles')
        .select('full_name')
        .eq('user_id', currentUserId)
        .single();

      const { error } = await supabase.from('inquiries').insert({
        sender_id: currentUserId,
        sender_name: profileData?.full_name ?? localStorage.getItem('userFullName') ?? 'Alumni',
        sender_role: 'alumni',
        subject: subject.trim(),
        category,
        message: message.trim(),
        status: 'pending',
        student_id: currentUserId,
      });

      if (error) throw error;

      setSubmitMessage({ type: 'success', text: 'Your inquiry has been submitted successfully! We will contact you soon.' });
      setSubject('');
      setCategory(INQUIRY_CATEGORIES[0]);
      setMessage('');
      await loadHistory();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit your inquiry. Please try again.' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

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
              required
            >
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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

          {submitMessage && (
            <p className={`text-sm ${submitMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {submitMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      {/* ── Inquiry History ── */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" /> My Inquiry History
          </h2>
          <button onClick={loadHistory} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {historyLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-lg" />
            <div className="h-16 bg-gray-100 rounded-lg" />
          </div>
        ) : historyError ? (
          <p className="text-sm text-red-600">{historyError}</p>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">You haven't submitted any inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {history.map((inq) => (
              <button
                key={inq.id}
                onClick={() => setSelectedInquiry(inq)}
                className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{inq.subject}</div>
                    {inq.category && <div className="text-xs sm:text-sm text-gray-600 mt-1">{inq.category}</div>}
                    <div className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{inq.message}</div>
                    <div className="text-xs text-gray-400 mt-2">{formatDate(inq.created_at)}</div>
                    {inq.status === 'answered' && (
                      <p className="text-xs text-blue-600 mt-1.5">Dean replied — tap to view</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${getStatusStyle(inq.status)}`}>
                    {inq.status === 'answered' ? 'Answered' : 'Pending'}
                  </span>
                </div>
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

// ====================== COLLEGE INFORMATION ======================
function CollegeInformation() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">College Information</h1>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">About COED</h2>
        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
          The College of Education has been at the forefront of teacher education and professional development for over 32 years.
          Our commitment to excellence has produced thousands of passionate educators who are making a difference in classrooms across the nation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">32+</div>
            <div className="text-xs sm:text-sm text-gray-600">Years of Excellence</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">5,000+</div>
            <div className="text-xs sm:text-sm text-gray-600">Alumni Graduates</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">98%</div>
            <div className="text-xs sm:text-sm text-gray-600">Employment Rate</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Current Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Elementary Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BEEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Secondary Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BSEd (English, Math, Science, Social Studies)</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Special Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BSNEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Educational Leadership</h3>
            <p className="text-xs sm:text-sm text-gray-600">Master's, PhD Programs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== ALUMNI ACHIEVEMENTS ======================
interface AwardItem {
  id: string;
  title: string;
  org: string;
  year: string;
}

const DEFAULT_AWARDS: AwardItem[] = [
  { id: 'a1', title: 'Excellence in Teacher Education Award', org: 'National Commission', year: '2025' },
  { id: 'a2', title: 'Level III Accreditation Status', org: 'AACCUP', year: '2025' },
];

function AlumniAchievements() {
  const [awards, setAwards] = useState<AwardItem[]>(DEFAULT_AWARDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<{ title: string; org: string; year: string }>({ title: '', org: '', year: '' });

  const startEdit = (award: AwardItem) => {
    setEditingId(award.id);
    setShowAddForm(false);
    setDraft({ title: award.title, org: award.org, year: award.year });
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setDraft({ title: '', org: '', year: '' });
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setDraft({ title: '', org: '', year: '' });
  };

  const saveEdit = () => {
    if (!draft.title.trim()) return;
    setAwards((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...draft } : a)));
    cancelForm();
  };

  const saveNew = () => {
    if (!draft.title.trim()) return;
    setAwards((prev) => [...prev, { id: `a-${Date.now()}`, ...draft }]);
    cancelForm();
  };

  const removeAward = (id: string) => {
    if (!confirm('Remove this award?')) return;
    setAwards((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) cancelForm();
  };

  const rowColors = ['bg-yellow-50 border-yellow-500', 'bg-blue-50 border-blue-500', 'bg-purple-50 border-purple-500', 'bg-green-50 border-green-500'];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">College Achievements</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Awards</h2>
            <button
              onClick={startAdd}
              className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-3">
            {awards.map((award, i) => {
              const [bg, border] = rowColors[i % rowColors.length].split(' ');
              const isEditingThis = editingId === award.id;

              if (isEditingThis) {
                return (
                  <div key={award.id} className={`p-4 rounded-lg border-l-4 ${bg} border-gray-300`}>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        placeholder="Award title"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={draft.org}
                          onChange={(e) => setDraft({ ...draft, org: e.target.value })}
                          placeholder="Awarding body"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={draft.year}
                          onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                          placeholder="Year"
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700">Save</button>
                        <button onClick={cancelForm} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300">Cancel</button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={award.id} className={`group p-4 ${bg} border-l-4 ${border} rounded-lg`}>
                  <div className="flex items-start gap-3">
                    <Award className={`w-5 h-5 mt-1 flex-shrink-0 ${border.replace('border-', 'text-')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{award.title}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{award.org}{award.year ? ` - ${award.year}` : ''}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => startEdit(award)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md"
                        aria-label="Edit award"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeAward(award.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-md"
                        aria-label="Delete award"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {showAddForm && (
              <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">New award</span>
                  <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Award title"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.org}
                      onChange={(e) => setDraft({ ...draft, org: e.target.value })}
                      placeholder="Awarding body"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={draft.year}
                      onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                      placeholder="Year"
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={saveNew} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700">Add Award</button>
                </div>
              </div>
            )}

            {awards.length === 0 && !showAddForm && (
              <p className="text-sm text-gray-500 text-center py-4">No awards yet. Click "Add" to create one.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Research Highlights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">285 Publications</div>
              <div className="text-xs sm:text-sm text-gray-600">Since 2020</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">International Partnerships</div>
              <div className="text-xs sm:text-sm text-gray-600">5 countries collaboration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== SETTINGS ======================
interface AlumniSettingsProps {
  profile: { full_name: string; email: string } | null;
  userEmail: string;
  loading: boolean;
  onProfileUpdated: () => void;
  idNumber: string;
  onLogout?: () => void;
}

function AlumniSettings({ profile, userEmail, loading, onProfileUpdated, idNumber, onLogout }: AlumniSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);

  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullNameInput(profile.full_name);
    }
  }, [profile?.full_name]);

  useEffect(() => {
    setEmailInput(userEmail);
  }, [userEmail]);

  const handleSaveChanges = async () => {
    const trimmedName = fullNameInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedName) {
      setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    if (!trimmedEmail) {
      setSaveMessage({ type: 'error', text: 'Email address cannot be empty.' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName, email: trimmedEmail })
        .eq('id_number', idNumber);

      if (error) throw error;
      setSaveMessage({ type: 'success', text: 'Your changes have been saved.' });
      onProfileUpdated();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullNameInput(profile?.full_name ?? '');
    setEmailInput(userEmail);
    setSaveMessage(null);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Settings</h1>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Basic Settings
        </h2>

        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h3>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
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

          {saveMessage && (
            <p className={`text-sm mt-3 ${saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {saveMessage.text}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Password & Security
          </h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              Change Password
            </button>
            <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              Enable Two-Factor Authentication
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notifications
        </h2>

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

      {/* Account Actions */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <LogOut className="w-5 h-5" /> Account Actions
        </h2>

        <div className="space-y-3">
          <button 
            onClick={onLogout}
            className="w-full px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
          >
            Log Out from Account
          </button>
          <p className="text-xs text-gray-500 text-center">This will sign you out from your session and return to the home page</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleSaveChanges}
          disabled={saving || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}