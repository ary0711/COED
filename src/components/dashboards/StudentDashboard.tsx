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

// Shape of the row we read out of `student_profiles`
interface StudentProfile {
  student_id: string;
  full_name: string;
  student_no: string;
  year_level: number;
  program: string;
  gpa: number | null;
  academic_standing: string;
  enrollment_status: string;
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

interface StudentDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

export function StudentDashboard({ activeMenuItem, setActiveMenuItem, userName = 'Student' }: StudentDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      // This app uses a custom username/password login (not Supabase Auth),
      // so there's no supabase.auth session to read. The logged-in user's
      // profiles.id is stored in localStorage at login time instead.
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setProfileError('No logged-in user found. Please sign in again.');
        setProfileLoading(false);
        return;
      }

      const { data: profileData, error: profileFetchError } = await supabase
        .from('student_profiles')
        .select('student_id, full_name, student_no, year_level, program, gpa, academic_standing, enrollment_status')
        .eq('user_id', currentUserId)
        .single();

      if (profileFetchError) throw profileFetchError;

      setProfile(profileData as StudentProfile);
      setUserEmail(localStorage.getItem('userEmail') ?? '');

      // Keep the program selector in sync with the student's actual enrolled program
      if (profileData?.program && PROGRAM_OPTIONS.includes(profileData.program)) {
        setSelectedProgram(profileData.program);
      }
    }  finally {
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
function FacultyDepartments() {
  const faculties = [
    { name: 'Prof. Sarah Johnson',   dept: 'Computer Science',       position: 'Associate Professor', email: 's.johnson@university.edu' },
    { name: 'Dr. Michael Chen',      dept: 'Mathematics',            position: 'Professor',            email: 'm.chen@university.edu'    },
    { name: 'Dr. Patricia Williams', dept: 'Special Education',      position: 'Department Chair',     email: 'p.williams@university.edu'},
    { name: 'Prof. Robert Anderson', dept: 'Educational Leadership', position: 'Professor',            email: 'r.anderson@university.edu'},
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty & Departments</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">My Faculty Members</h2>
        <div className="grid gap-4">
          {faculties.map((faculty, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">{faculty.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{faculty.position} - {faculty.dept}</div>
                  <div className="text-xs sm:text-sm text-blue-600">{faculty.email}</div>
                </div>
                <User className="w-7 h-7 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Department Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Computer Science Department</h3>
            <p className="text-sm text-gray-600 mb-2">Chair: Dr. Jennifer Lee</p>
            <p className="text-sm text-gray-600">Office: CS Building, 3rd Floor</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Mathematics Department</h3>
            <p className="text-sm text-gray-600 mb-2">Chair: Dr. Michael Chen</p>
            <p className="text-sm text-gray-600">Office: Math Building, 2nd Floor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== ACADEMIC RESOURCES ======================
// The standalone "Academic Calendar" card has been removed per request.
// The downloadable resources list now follows the Faculty "Academic
// Records" design language (category filter pills + list rows), but with
// student-appropriate categories/content — not the faculty's own files.
function AcademicResources() {
  const handleDownload = (title: string) => alert(`📥 Downloading: ${title}`);
  const [activeCategory, setActiveCategory] = useState('All');

  const resources = [
    { title: 'Student Handbook 2025–2026',        category: 'Handbook', size: '5.8 MB' },
    { title: 'Enrollment & Registration Guide',    category: 'Policy',   size: '1.2 MB' },
    { title: 'Grading & Academic Policies',        category: 'Policy',   size: '980 KB' },
    { title: 'Scholarship Application Form',       category: 'Form',     size: '1.5 MB' },
    { title: 'Change of Program Form',             category: 'Form',     size: '210 KB' },
    { title: 'Leave of Absence Request Form',      category: 'Form',     size: '150 KB' },
    { title: 'Advisory No. 2026-02 — Class Suspensions', category: 'Memorandum', size: '190 KB' },
  ];

  const categories = ['All', 'Handbook', 'Policy', 'Form', 'Memorandum'];
  const filtered = activeCategory === 'All' ? resources : resources.filter(r => r.category === activeCategory);

  const categoryColor: Record<string, string> = {
    Handbook:   'bg-blue-100 text-blue-700',
    Policy:     'bg-purple-100 text-purple-700',
    Memorandum: 'bg-orange-100 text-orange-700',
    Form:       'bg-green-100 text-green-700',
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Resources</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeCategory === c ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filtered.map((resource, index) => (
            <div key={index} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{resource.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[resource.category]}`}>{resource.category}</span>
                    <span className="text-xs text-gray-400">{resource.size}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(resource.title)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================== ACHIEVEMENTS & ACTIVITIES ======================
function AchievementsActivities() {
  interface CalendarEvent {
    id: string;
    title: string;
    date: number;
    type: 'meeting' | 'seminar' | 'deadline' | 'event';
    description?: string;
    program?: string;
    color?: string;
  }

  const calendarEventsData: CalendarEvent[] = [
    { id: '1', title: 'Faculty Meeting', date: 5, type: 'meeting', description: 'Department faculty meeting and discussions', program: 'Education', color: '#3B82F6' },
    { id: '2', title: 'Research Seminar', date: 12, type: 'seminar', description: 'Guest speaker on educational research methods', program: 'Research', color: '#10B981' },
    { id: '3', title: 'Report Deadline', date: 15, type: 'deadline', description: 'Submit final research report', program: 'Academics', color: '#EF4444' },
    { id: '4', title: 'Department Event', date: 22, type: 'event', description: 'College foundation day celebration and activities', program: 'Events', color: '#A855F7' },
    { id: '5', title: 'Submission Period', date: 28, type: 'deadline', description: 'Academic records submission period closes', program: 'Academics', color: '#EF4444' },
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
      case 'meeting':
        return 'bg-blue-500';
      case 'seminar':
        return 'bg-green-500';
      case 'deadline':
        return 'bg-red-500';
      case 'event':
        return 'bg-purple-500';
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
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Achievements & Activities</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">College Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900 text-sm sm:text-base">Dean's List Recognition</div>
              <div className="text-xs sm:text-sm text-gray-600">First Semester 2025-2026</div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900 text-sm sm:text-base">Math Quiz Bowl Champion</div>
              <div className="text-xs sm:text-sm text-gray-600">January 2026</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">College Calendar</h3>
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
            <span className="text-xs text-gray-600">Meeting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Seminar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600">Deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Event</span>
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
              {selectedEvent.program && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Program</p>
                  <p className="text-sm text-gray-900">{selectedEvent.program}</p>
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
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(ev.date)} · {ev.program}</div>
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
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(ev.date)} · {ev.program}</div>
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

function StudentSettings({ selectedProgram, setSelectedProgram, profile, userEmail, loading, onProfileUpdated }: StudentSettingsProps) {
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
    if (!profile?.student_id) return;

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
      const { error: profileUpdateError } = await supabase
        .from('student_profiles')
        .update({ full_name: trimmedName, student_no: trimmedStudentNo })
        .eq('student_id', profile.student_id);

      if (profileUpdateError) throw profileUpdateError;

      // Only touch auth email if it actually changed
      if (trimmedEmail !== userEmail) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (emailUpdateError) throw emailUpdateError;
        setSaveMessage({ type: 'success', text: 'Changes saved. Check your inbox to confirm your new email address.' });
      } else {
        setSaveMessage({ type: 'success', text: 'Your changes have been saved.' });
      }

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
    setStudentNoInput(profile?.student_no ?? '');
    setEmailInput(userEmail);
    setSaveMessage(null);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Settings</h1>

      {/* ⚙️ BASIC SETTINGS */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Basic Settings
        </h2>

        {/* Profile Information */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h3>

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

          {saveMessage && (
            <p className={`text-sm mt-3 ${saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {saveMessage.text}
            </p>
          )}
        </div>

        {/* Password / Security */}
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

      {/* 🔔 NOTIFICATIONS */}
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

      {/* 🎓 ACADEMIC SETTINGS */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Academic Settings
        </h2>

        <div className="space-y-4">
          {/* Program Selection */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="program-select" className="text-xs text-blue-600 uppercase font-semibold mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> Select Your Program
            </label>
            <select
              id="program-select"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROGRAM_OPTIONS.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Choose the program you are currently enrolled in.
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

      {/* 📄 ACCOUNT ACTIONS */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <LogOut className="w-5 h-5" /> Account Actions
        </h2>

        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
            Log Out from All Devices
          </button>
          <p className="text-xs text-gray-500 text-center">This will sign you out from all active sessions</p>
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