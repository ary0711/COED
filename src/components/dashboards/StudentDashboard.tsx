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
];

interface StudentDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function StudentDashboard({ activeMenuItem, setActiveMenuItem }: StudentDashboardProps) {
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
                userName="John Michael Cruz"
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
      <div className="mb-6 pb-6 border-b border-gray-200">
         <p className="text-gray-600">Welcome back, John Michael Cruz</p>
      </div>

      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-5 sm:p-6 text-white mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">John Michael Cruz</h2>
            <p className="text-blue-100 mb-1">Student ID: 2023-00458</p>
            <p className="text-blue-100">Bachelor of Secondary Education - Mathematics</p>
            <p className="text-blue-100">3rd Year, Second Semester</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-bold mb-1">3.75</div>
            <div className="text-blue-100 text-sm">Current GPA</div>
          </div>
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
  const clubs = [
    { name: 'Mathematics Society',    activity: 'Math Quiz Bowl Practice', day: 'Mondays',    time: '4:00 PM - 5:30 PM', venue: 'Math Lab 2' },
    { name: 'Computer Science Guild', activity: 'Algorithm Workshop',      day: 'Wednesdays', time: '3:30 PM - 5:00 PM', venue: 'CL 1'       },
    { name: 'Educators Guild',        activity: 'Teaching Demo',           day: 'Fridays',    time: '1:00 PM - 3:00 PM', venue: 'Hall A'     },
  ];

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

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /> Clubs Activities & Schedules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club, index) => (
            <div key={index} className="p-4 border border-gray-100 rounded-xl bg-slate-50">
              <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 mb-3 uppercase text-sm">{club.name}</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Activity</div>
                  <div className="text-sm text-gray-800">{club.activity}</div>
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">Schedule</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <div>{club.day} | {club.time}</div>
                    <div className="text-gray-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {club.venue}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Upcoming College Activities</h2>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">College Foundation Day</div>
                <div className="text-xs sm:text-sm text-gray-600">March 15, 2026 • All Day Event</div>
              </div>
            </div>
          </div>
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