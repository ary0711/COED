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
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect } from 'react';

const studentMenuItems = [
  { icon: Bell,         label: 'Dashboard',               id: 'dashboard'    },
  { icon: User,         label: 'Faculty & Departments',    id: 'faculty'      },
  { icon: FileText,     label: 'Evaluations & Feedback',   id: 'evaluations'  },
  { icon: BookOpen,     label: 'Academic Resources',       id: 'resources'    },
  { icon: Award,        label: 'Achievements & Activities',id: 'achievements' },
  { icon: MessageSquare,label: 'Inquiry / Contact',        id: 'inquiry'      },
  { icon: Settings,     label: 'Settings',                 id: 'settings'     },
];

interface StudentDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

export function StudentDashboard({ activeMenuItem, setActiveMenuItem, userName = 'Student' }: StudentDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">

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
                userName={userName}
              />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'   && <StudentDashboardView />}
          {activeMenuItem === 'faculty'     && <FacultyDepartments />}
          {activeMenuItem === 'evaluations' && <EvaluationsFeedback />}
          {activeMenuItem === 'resources'   && <AcademicResources />}
          {activeMenuItem === 'achievements'&& <AchievementsActivities />}
          {activeMenuItem === 'inquiry'     && <InquiryContact />}
          {activeMenuItem === 'settings'    && <StudentSettings />}
        </main>
      </div>
    </div>
  );
}

// ====================== STUDENT DASHBOARD VIEW ======================
function StudentDashboardView() {
  const announcements = [
    { id: 1, title: 'Midterm Examination Schedule Released', date: 'Feb 12, 2026', type: 'important' },
    { id: 2, title: 'Faculty Evaluation Period Open',        date: 'Feb 10, 2026', type: 'info'      },
    { id: 3, title: 'College Foundation Day Activities',     date: 'Feb 8, 2026',  type: 'info'      },
  ];

  return (
    <div>
      <div className="bg-[#1E3A8A] rounded-xl shadow-lg p-5 sm:p-6 text-white mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            John Michael Cruz
          </h2>
          <p className="text-blue-100 mb-1">Student ID: 2023-00458</p>
          <p className="text-blue-100">
            Bachelor of Secondary Education - Mathematics
          </p>
          <p className="text-blue-100">
            3rd Year, Second Semester
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">8</div>
          <div className="text-xs sm:text-sm text-gray-600">Enrolled Subjects</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">5</div>
          <div className="text-xs sm:text-sm text-gray-600">Evaluations Done</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 mb-2" />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">3</div>
          <div className="text-xs sm:text-sm text-gray-600">Pending Evaluations</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <Award className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 mb-2" />
          <div className="text-base sm:text-xl font-bold text-gray-900">Dean's List</div>
          <div className="text-xs sm:text-sm text-gray-600">Academic Standing</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Announcements
          </h2>
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Complete Faculty Evaluation</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">3 faculty evaluations pending - Due: Feb 20</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Upcoming Examinations</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Midterm exams start March 1, 2026</div>
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

// ====================== EVALUATIONS & FEEDBACK ======================
function EvaluationsFeedback() {
  const handleEvaluate = (faculty: string) => alert(`Opening evaluation form for: ${faculty}`);

  const pendingEvaluations = [
    { faculty: 'Prof. Sarah Johnson',   subject: 'Data Structures'       },
    { faculty: 'Dr. Michael Chen',      subject: 'Discrete Mathematics'  },
    { faculty: 'Prof. Robert Anderson', subject: 'Educational Psychology'},
  ];

  const completedEvaluations = [
    { faculty: 'Dr. Patricia Williams', subject: 'Special Education', date: 'Feb 10, 2026' },
    { faculty: 'Prof. David Martinez',  subject: 'Physical Education', date: 'Feb 9, 2026'  },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Evaluations & Feedback</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pending Faculty Evaluations</h2>
        <div className="space-y-3">
          {pendingEvaluations.map((evaluation, index) => (
            <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{evaluation.faculty}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{evaluation.subject}</div>
                </div>
                <button
                  onClick={() => handleEvaluate(evaluation.faculty)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex-shrink-0"
                >
                  Evaluate Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Completed Evaluations</h2>
        <div className="space-y-3">
          {completedEvaluations.map((evaluation, index) => (
            <div key={index} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{evaluation.faculty}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{evaluation.subject}</div>
                  <div className="text-xs text-gray-500 mt-1">Completed: {evaluation.date}</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
                  Submitted
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================== ACADEMIC RESOURCES ======================
function AcademicResources() {
  const handleDownload = (title: string) => alert(`📥 Downloading: ${title}`);

  const resources = [
    { title: 'Academic Calendar 2025-2026',  type: 'PDF', size: '2.5 MB'  },
    { title: 'Student Handbook',             type: 'PDF', size: '5.8 MB'  },
    { title: 'Registration Forms',           type: 'PDF', size: '890 KB'  },
    { title: 'Scholarship Application Form', type: 'PDF', size: '1.5 MB'  },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Resources</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Academic Calendar</h2>
        <div className="p-4 sm:p-6 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Second Semester</div>
              <div className="font-medium text-gray-900 text-sm sm:text-base">January 6 - May 15, 2026</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Midterm Examinations</div>
              <div className="font-medium text-gray-900 text-sm sm:text-base">March 1-7, 2026</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Final Examinations</div>
              <div className="font-medium text-gray-900 text-sm sm:text-base">May 8-14, 2026</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Summer Term</div>
              <div className="font-medium text-gray-900 text-sm sm:text-base">June 1 - July 31, 2026</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Downloadable Resources</h2>
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{resource.title}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{resource.type} • {resource.size}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(resource.title)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex-shrink-0"
                >
                  Download
                </button>
              </div>
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
    { id: '5', title: 'Evaluation Period', date: 28, type: 'deadline', description: 'Faculty evaluation period closes', program: 'Academics', color: '#EF4444' },
  ];

  const today = new Date();
  const [currentDate] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Get first day of month and number of days
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

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {/* Calendar Header */}
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

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
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

        {/* Event Legend */}
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

      {/* Event Details Modal */}
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

      {/* Activities Section */}
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
function InquiryContact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('✅ Your inquiry has been submitted successfully!');
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Submit a Concern or Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" required />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  );
}

// ====================== SETTINGS ======================
function StudentSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input type="text" defaultValue="John Michael Cruz" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input type="text" defaultValue="2023-00458" disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" defaultValue="john.cruz@university.edu" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
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
          {/* Email Notifications */}
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

          {/* Announcement Alerts */}
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
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Enrolled Program</p>
            <p className="text-sm font-medium text-gray-900 mb-3">Bachelor of Secondary Education - Mathematics</p>
            <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Year Level:</span> 3rd Year</p>
            <p className="text-xs text-gray-600"><span className="font-semibold">Semester:</span> Second Semester</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 uppercase font-semibold mb-1">Current Status</p>
            <p className="text-sm font-medium text-gray-900">Active Enrollment</p>
            <p className="text-xs text-gray-600 mt-2">Enrolled Subjects: 8</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Academic Standing</p>
            <p className="text-sm font-medium text-gray-900">Dean's List</p>
            <p className="text-xs text-gray-600 mt-2">Excellent academic performance maintained</p>
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
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Save Changes
        </button>
        <button className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}