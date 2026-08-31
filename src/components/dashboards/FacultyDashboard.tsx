import {
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Calendar,
  ArrowLeft,
  Users,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
  Star,
  Bell,
  X,
  Menu,
  Settings,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  GraduationCap,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react';
  import { Sidebar } from '../Sidebar';
  import { DashboardHeader } from '../DashboardHeader';
  import { useState, useEffect } from 'react';
  import { AccomplishmentReport } from './AccomplishmentReport';
  import { ExtensionReport } from './ExtensionReport';
  import { DeansListGenerator } from './DeansListGenerator';

  const facultyMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',          id: 'dashboard' },
  { icon: BookOpen,    label: 'Teaching Load',       id: 'teaching-load' },
  { icon: FileText,    label: 'Research & Extension',id: 'research' },
  { icon: Award,       label: 'Achievements',        id: 'achievements' },
  { icon: GraduationCap, label: "Dean's List",       id: 'deans-list' },
  { icon: FileText,    label: 'Reports',             id: 'reports' },
  { icon: Calendar,    label: 'Calendar',            id: 'calendar' },
  { icon: Settings,    label: 'Settings',            id: 'settings' },
];

  interface FacultyDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

const ME_API_URL = 'http://localhost:5000/api/me';

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem, onLogout, userName = 'Faculty' }: FacultyDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleInternalLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
  };

  // Kuhaon ang userId gikan sa JWT token
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : '';

  // Faculty JWTs don't carry department info (unlike chairs), so it's
  // fetched once on mount from /api/me, which looks it up fresh from
  // faculty_profiles + departments.
  const [departmentNames, setDepartmentNames] = useState<string[]>([]);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(ME_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDepartmentNames(data.departmentNames ?? []);
      } catch {
        // silent — department line just won't render if this fails
      }
    };
    loadMe();
  }, [token]);

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
          menuItems={facultyMenuItems}
          activeItem={activeMenuItem}
          onItemClick={setActiveMenuItem}
          userRole="Faculty Member"
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
                <DashboardHeader userRole="Faculty" userName={userName} onLogout={handleInternalLogout} departmentNames={departmentNames} />
              </div>
            </div>
          </div>

          <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {activeMenuItem === 'dashboard'     && <FacultyDashboardView />}
            {activeMenuItem === 'teaching-load' && <TeachingLoad />}
            {activeMenuItem === 'research'      && <ResearchExtension userId={userId} />}
            {activeMenuItem === 'achievements'  && <FacultyAchievements />}
            {activeMenuItem === 'deans-list'    && <DeansListGenerator userId={userId} userName={userName} />}
            {activeMenuItem === 'reports' && <ReportsView userId={userId} userName={userName} />}
            {activeMenuItem === 'calendar'      && <FacultyCalendar />}
            {activeMenuItem === 'settings'          && <FacultySettings />}
{activeMenuItem === 'extension-report'  && (
  <ExtensionReport
    userId={userId}
    userName={userName}
  />
)}
          </main>
        </div>
      </div>
    );
  }

  // ====================== 5.0 DASHBOARD ======================
  function FacultyDashboardView() {
    const announcements = [
      { id: 1, title: 'Quarterly Report Deadline – February 20', date: '2 days ago', type: 'urgent' },
      { id: 2, title: 'Faculty Development Seminar – March 5', date: '1 week ago', type: 'info' },
      { id: 3, title: 'Research Grant Application Now Open', date: '2 weeks ago', type: 'info' },
    ];

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">12</div>
            <div className="text-xs sm:text-sm text-gray-600">Teaching Units</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">3</div>
            <div className="text-xs sm:text-sm text-gray-600">Pending Reports</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <Award className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">4.8/5.0</div>
            <div className="text-xs sm:text-sm text-gray-600">Evaluation Rating</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className={`p-4 rounded-lg border-l-4 ${ann.type === 'urgent' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{ann.title}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">{ann.date}</div>
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
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Q4 Report Submission</div>
                  <div className="text-xs sm:text-sm text-gray-600">Due: February 20, 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Grade Encoding Deadline</div>
                  <div className="text-xs sm:text-sm text-gray-600">Due: February 28, 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Research Output Submission</div>
                  <div className="text-xs sm:text-sm text-gray-600">Due: March 15, 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================== 5.1 TEACHING LOAD ======================
  interface ClassListFile {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  }

  function TeachingLoad() {
    const [view, setView] = useState<'list' | 'students'>('list');
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

    // Class list files uploaded per subject (keyed by course code).
    // These contain the roster of students for that subject and can be
    // an Excel, PDF, or Word file.
    const [classListFiles, setClassListFiles] = useState<Record<string, ClassListFile>>({});
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadSubjectCode, setUploadSubjectCode] = useState('');

    const ACCEPTED_CLASS_LIST_TYPES = '.xlsx,.xls,.pdf,.doc,.docx';

    const subjects = [
      { code: 'CS101', name: 'Introduction to Computer Science', units: 3, studentCount: 45, schedule: 'MWF 8:00–9:00 AM',   room: 'Room 201', semester: '2nd Semester AY 2025–2026' },
      { code: 'CS201', name: 'Data Structures',                  units: 3, studentCount: 38, schedule: 'TTH 10:00–11:30 AM', room: 'Room 305', semester: '2nd Semester AY 2025–2026' },
      { code: 'CS301', name: 'Software Engineering',             units: 3, studentCount: 42, schedule: 'MWF 1:00–2:00 PM',   room: 'Lab 102',  semester: '2nd Semester AY 2025–2026' },
      { code: 'CS401', name: 'Capstone Project',                 units: 3, studentCount: 31, schedule: 'TTH 2:00–3:30 PM',   room: 'Room 410', semester: '2nd Semester AY 2025–2026' },
    ];

    const enrolledStudents = [
      { id: '2024-001', name: 'Dela Cruz, Juan',        year: '1st Year', status: 'Regular'   },
      { id: '2024-042', name: 'Santos, Maria Clara',    year: '1st Year', status: 'Regular'   },
      { id: '2023-156', name: 'Garcia, Roberto',        year: '2nd Year', status: 'Irregular' },
      { id: '2024-089', name: 'Lumbera, Bienvenido',   year: '1st Year', status: 'Regular'   },
      { id: '2023-211', name: 'Reyes, Ana Liza',        year: '2nd Year', status: 'Irregular' },
    ];

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const openUploadModal = (subjectCode?: string) => {
      setUploadSubjectCode(subjectCode ?? '');
      setUploadModalOpen(true);
    };

    const closeUploadModal = () => {
      setUploadModalOpen(false);
      setUploadSubjectCode('');
    };

    const handleClassListFile = (file: File) => {
      if (!uploadSubjectCode) {
        alert('Please select a subject first.');
        return;
      }
      setClassListFiles(prev => ({
        ...prev,
        [uploadSubjectCode]: {
          name: file.name,
          size: file.size,
          type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
          uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      }));
      closeUploadModal();
      alert('✅ Class list uploaded successfully!');
    };

    const UploadModal = () => (
      uploadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload Class List</h2>
              <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={uploadSubjectCode}
                  onChange={(e) => setUploadSubjectCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.code} value={sub.code}>{sub.code} – {sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class List File</label>
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">Excel, PDF, or Word up to 10MB</p>
                  <input
                    type="file"
                    accept={ACCEPTED_CLASS_LIST_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleClassListFile(f);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null
    );

    if (view === 'students' && selectedSubject) {
      const uploadedFile = classListFiles[selectedSubject.code];

      return (
        <>
          <div className="animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <button onClick={() => { setView('list'); setSelectedSubject(null); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Enrolled Students</h1>
                <p className="text-gray-600 text-sm sm:text-base truncate">{selectedSubject.code} – {selectedSubject.name}</p>
              </div>
            </div>

            {/* ── Uploaded class list file details ── */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
              {uploadedFile ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{uploadedFile.name}</div>
                      <div className="text-xs text-gray-500">
                        {uploadedFile.type} · {formatFileSize(uploadedFile.size)} · Uploaded {uploadedFile.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openUploadModal(selectedSubject.code)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 flex-shrink-0"
                  >
                    Replace File
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-gray-500">No class list file uploaded for this subject yet.</p>
                  <button
                    onClick={() => openUploadModal(selectedSubject.code)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex-shrink-0"
                  >
                    <Upload size={14} /> Upload Class List
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 bg-blue-50 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 text-blue-800 font-medium text-sm sm:text-base">
                  <Users size={18} />
                  <span>Total Enrolled: {selectedSubject.studentCount} Students</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all w-fit">
                  <Download size={16} /> Export Class List
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[480px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Student ID</th>
                      <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Full Name</th>
                      <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Year Level</th>
                      <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((student, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono text-xs sm:text-sm text-gray-600">{student.id}</td>
                        <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900 text-sm">{student.name}</td>
                        <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{student.year}</td>
                        <td className="py-3 px-4 sm:py-4 sm:px-6 text-center">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase ${student.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <UploadModal />
        </>
      );
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Teaching Load</h1>
        </div>

        {/* ── Upload class list button — top left ── */}
        <div className="mb-6">
          <button
            onClick={() => openUploadModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors w-fit"
          >
            <Upload size={16} /> Upload Class List
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Academic Year</div>
            <div className="font-semibold text-gray-900">2025–2026</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Semester</div>
            <div className="font-semibold text-gray-900">Second Semester</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Load</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">12 Units</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assigned Courses</h2>
          </div>

          {/* Mobile card layout */}
          <div className="divide-y divide-gray-100 sm:hidden">
            {subjects.map((sub, i) => {
              const hasClassList = !!classListFiles[sub.code];
              return (
                <div key={i} className="p-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{sub.code}</span>
                      <p className="text-gray-700 text-sm">{sub.name}</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold ml-2 flex-shrink-0">{sub.units} units</span>
                  </div>
                  <div className="text-xs text-gray-500">{sub.schedule} · {sub.room}</div>
                  {hasClassList && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Class list uploaded
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-gray-600">{sub.studentCount} students</span>
                    <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline underline-offset-4">
                      View Students
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table layout for sm+ */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Course Code</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Descriptive Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Units</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Students</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Schedule</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Room</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Class List</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, i) => {
                  const hasClassList = !!classListFiles[sub.code];
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{sub.code}</td>
                      <td className="py-4 px-6 text-gray-700">{sub.name}</td>
                      <td className="py-4 px-6 text-center text-gray-700">{sub.units}</td>
                      <td className="py-4 px-6 text-center font-bold text-gray-900">{sub.studentCount}</td>
                      <td className="py-4 px-6 text-gray-700">{sub.schedule}</td>
                      <td className="py-4 px-6 text-gray-700">{sub.room}</td>
                      <td className="py-4 px-6 text-center">
                        {hasClassList ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <CheckCircle size={12} /> Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                            Not uploaded
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline underline-offset-4">
                          View Students
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <UploadModal />
      </>
    );
  }

  // ====================== 5.2 RESEARCH & EXTENSION ======================
  // All reads/writes go through the Express API (JWT-authenticated),
  // matching the accomplishment/extension reports setup — no direct
  // Supabase calls from the browser.
  const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

  function getResearchToken() {
    return localStorage.getItem('token');
  }

  interface ResearchSubmission {
    id: string;
    title: string;
    type: 'research' | 'extension';
    file_name: string | null;
    file_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
  }

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'validation';
  title: string;
  message: string;
}

 function ResearchExtension({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'submit' | 'track' | 'approved'>('submit');
  const [researchTitle, setResearchTitle] = useState('');
  const [researchType, setResearchType] = useState<'research' | 'extension'>('research');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getResearchToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions((data ?? []).filter((s: any) => s.type === 'research' || s.type === 'extension'));
        }
      } catch {
        // silent — same as the reports components' load-error behavior
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const approved = submissions.filter(s => s.status === 'approved');
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const displayType = (type: string) => type === 'research' ? 'Research' : 'Extension';
  const displayStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${map[status]}`}>{displayStatus(status)}</span>;
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    return <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
  };

  const handleSubmit = async () => {
    if (!researchTitle.trim()) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Missing Required Field',
        message: 'Please enter a title before submitting.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', researchTitle.trim());
      formData.append('type', researchType);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(RESEARCH_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getResearchToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: err.error || res.statusText || 'Failed to submit.',
        });
        return;
      }

      const data: ResearchSubmission = await res.json();
      setSubmissions(prev => [data, ...prev]);
      setResearchTitle('');
      setSelectedFile(null);
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Output Submitted',
        message: 'Your submission has been sent for approval!',
      });
    } catch {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (s: ResearchSubmission) => {
    if (s.file_url) {
      window.open(s.file_url, '_blank');
    } else {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'No File Found',
        message: 'No file was attached to this submission.',
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Research & Extension</h1>
      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {[{ id: 'submit', label: 'Submit' }, { id: 'track', label: 'Track Status' }, { id: 'approved', label: 'Approved' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main content (2/3) + side panel (1/3) so wide screens aren't left empty ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {tab === 'submit' && (
            <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Submit New Output</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                  <div className="flex gap-3 sm:gap-4">
                    <button type="button" onClick={() => setResearchType('research')} className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${researchType === 'research' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Research</button>
                    <button type="button" onClick={() => setResearchType('extension')} className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${researchType === 'extension' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Extension Activity</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input type="text" value={researchTitle} onChange={e => setResearchTitle(e.target.value)} placeholder="Enter title" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 10MB</p>
                    <input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {selectedFile && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={14} /> {selectedFile.name}</p>}
                </div>
                <button onClick={handleSubmit} disabled={submitting} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          )}

          {tab === 'track' && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submission Tracker</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Loading…</div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No submissions yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {submissions.map((s) => (
                    <div key={s.id} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        {statusIcon(s.status)}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{s.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{displayType(s.type)} · Submitted {formatDate(s.created_at)}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{statusBadge(s.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'approved' && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Approved Research & Extension</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Loading…</div>
              ) : approved.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No approved submissions yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {approved.map((s) => (
                    <div key={s.id} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{s.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{displayType(s.type)} · Approved on {formatDate(s.updated_at)}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(s)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Side panel: fills the empty space on wide screens ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Submission Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Submitted</span>
                <span className="text-lg font-bold text-gray-900">{submissions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Approved</span>
                <span className="text-lg font-bold text-green-700">{approved.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><Clock className="w-4 h-4 text-yellow-500" /> Pending</span>
                <span className="text-lg font-bold text-yellow-700">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> Rejected</span>
                <span className="text-lg font-bold text-red-700">{rejectedCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Submission Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Accepted formats: PDF, DOCX (up to 10MB)</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Review usually takes 5–7 business days</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Titles must match your official proposal</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>You'll be notified by email once reviewed</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation & Status Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative transform transition-all">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                modal.type === 'success' ? 'bg-green-100 text-green-600' :
                modal.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {modal.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {modal.type === 'error' && <XCircle className="w-6 h-6" />}
                {modal.type === 'validation' && <Info className="w-6 h-6" />}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {modal.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {modal.message}
              </p>

              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


 // ====================== 5.3 ACHIEVEMENTS ======================
interface AchievementSubmission {
  id: string;
  title: string;
  type: 'achievement';
  category: string | null;
  date_received: string | null;
  file_name: string | null;
  file_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'validation';
  title: string;
  message: string;
}

export default function FacultyAchievements() {
  const [tab, setTab] = useState<'submit' | 'approved' | 'history'>('submit');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardCategory, setAwardCategory] = useState('Research');
  const [awardDate, setAwardDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<AchievementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getResearchToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions((data ?? []).filter((s: any) => s.type === 'achievement'));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const approved = submissions.filter(a => a.status === 'approved');
  const pendingCount = submissions.filter(a => a.status === 'pending').length;
  const rejectedCount = submissions.filter(a => a.status === 'rejected').length;

  const displayStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const handleSubmit = async () => {
    if (!awardTitle.trim()) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Missing Required Field',
        message: 'Please enter an award/achievement title before submitting.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', awardTitle.trim());
      formData.append('type', 'achievement');
      formData.append('category', awardCategory);
      if (awardDate) formData.append('date_received', awardDate);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(RESEARCH_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getResearchToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: err.error || res.statusText || 'Failed to submit achievement.',
        });
        return;
      }

      const data: AchievementSubmission = await res.json();
      setSubmissions(prev => [data, ...prev]);
      setAwardTitle('');
      setAwardCategory('Research');
      setAwardDate('');
      setSelectedFile(null);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Submitted',
        message: 'Your achievement has been successfully submitted for review!',
      });
    } catch {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server. Please check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (a: AchievementSubmission) => {
    if (a.file_url) {
      window.open(a.file_url, '_blank');
    } else {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'No File Found',
        message: 'No file was attached to this submission.',
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Achievements</h1>
      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'submit', label: 'Submit' }, { id: 'approved', label: 'Approved' }, { id: 'history', label: 'History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {tab === 'submit' && (
            <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Submit New Achievement</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Award / Achievement Title *</label>
                  <input type="text" value={awardTitle} onChange={e => setAwardTitle(e.target.value)} placeholder="e.g., Best Paper Award" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select value={awardCategory} onChange={e => setAwardCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option>Research</option>
                    <option>Teaching</option>
                    <option>Extension</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Received</label>
                  <input type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Certificate / Document</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                    <input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {selectedFile && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={14} /> {selectedFile.name}</p>}
                </div>
                <button onClick={handleSubmit} disabled={submitting} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          )}

          {tab === 'approved' && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Approved Achievements</h2>
                <span className="bg-green-100 text-green-700 text-xs sm:text-sm font-bold px-3 py-1 rounded-full">{approved.length} Total</span>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Loading…</div>
              ) : approved.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No approved achievements yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {approved.map((a) => (
                    <div key={a.id} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{a.title}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{a.category ?? '—'} · {formatDate(a.date_received)}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(a)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Achievement History</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Loading…</div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No submissions yet.</div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 sm:hidden">
                    {submissions.map((a) => (
                      <div key={a.id} className="p-4 space-y-1">
                        <div className="font-medium text-gray-900 text-sm">{a.title}</div>
                        <div className="text-xs text-gray-500">{a.category ?? '—'} · {formatDate(a.date_received)}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {displayStatus(a.status)}
                        </span>
                        {a.dean_remarks && <p className="text-xs text-red-600 mt-1">Remarks: {a.dean_remarks}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left min-w-[480px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="py-4 px-6 text-sm font-semibold text-gray-700">Achievement</th>
                          <th className="py-4 px-6 text-sm font-semibold text-gray-700">Category</th>
                          <th className="py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                          <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-900">{a.title}</td>
                            <td className="py-4 px-6 text-gray-600">{a.category ?? '—'}</td>
                            <td className="py-4 px-6 text-gray-600">{formatDate(a.date_received)}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {displayStatus(a.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Achievement Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Submitted</span>
                <span className="text-lg font-bold text-gray-900">{submissions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Approved</span>
                <span className="text-lg font-bold text-green-700">{approved.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><Clock className="w-4 h-4 text-yellow-500" /> Pending</span>
                <span className="text-lg font-bold text-yellow-700">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> Rejected</span>
                <span className="text-lg font-bold text-red-700">{rejectedCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" /> Submission Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Accepted formats: PDF, JPG, PNG (up to 10MB)</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Review usually takes 3–5 business days</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Attach the official certificate or citation</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>You'll be notified by email once reviewed</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation & Status Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative transform transition-all">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                modal.type === 'success' ? 'bg-green-100 text-green-600' :
                modal.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {modal.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {modal.type === 'error' && <XCircle className="w-6 h-6" />}
                {modal.type === 'validation' && <Info className="w-6 h-6" />}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {modal.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {modal.message}
              </p>

              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  // ─── My Drafts (shared: works for both Chair and Faculty) ────────────────────
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

  // ====================== 5.4 REPORTS ======================
  function ReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'drafts' | 'accomplishment' | 'extension' | 'monitoring'>('drafts');

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('drafts')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'drafts' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
          My Drafts
        </button>
        <button onClick={() => setTab('accomplishment')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
          Accomplishment Report
        </button>
        <button onClick={() => setTab('extension')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
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


  // ====================== 5.5 CALENDAR ======================

  interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    event_date: string; // "YYYY-MM-DDTHH:mm:ss"
    end_date: string | null;
    location: string | null;
    event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | null;
    organizer_id: string | null;
    department: string | null;
    department_ids: string[] | null;
    status: string | null;
    posted_by_role: string | null;
    created_at: string;
    updated_at: string;
  }

  const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

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

  function colorForEvent(ev: CalendarEvent): string {
    return (ev.event_type && TYPE_TO_COLOR[ev.event_type]) || DEFAULT_EVENT_COLOR;
  }

  function dateOnly(isoLike: string): string {
    return isoLike.split('T')[0];
  }

  function FacultyCalendar() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

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
      } catch {
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

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Calendar</h1>

        {loadError && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {loadError}
          </div>
        )}

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading events…</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] p-2 bg-gray-50 rounded-lg" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayEvents = getEventsForDay(day);
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isTodayDate = dateStr === todayStr;
                const isPast = dateStr < todayStr;

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] p-2 border border-gray-100 rounded-lg ${
                      isPast ? 'bg-gray-200 opacity-60' : 'bg-white hover:bg-gray-50'
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
                          style={{ backgroundColor: colorForEvent(event) }}
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

          {/* Event Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 flex-wrap">
            {Object.entries(TYPE_TO_COLOR).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-6">Loading…</p>
            ) : activeTab === 'upcoming' ? (
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No upcoming activities</p>
                  </div>
                ) : upcomingEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedEvent(ev)}>
                    <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: colorForEvent(ev) }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(dateOnly(ev.event_date))} · Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}
                         </div>
                      {ev.description && <div className="text-xs text-gray-400 mt-1">{ev.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {historyEvents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No past activities</p>
                  </div>
                ) : historyEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => setSelectedEvent(ev)}>
                    <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: colorForEvent(ev) }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-600 text-sm">{ev.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                         {formatDate(dateOnly(ev.event_date))} · Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}
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

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: colorForEvent(selectedEvent) }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">{formatDate(dateOnly(selectedEvent.event_date))}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedEvent.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.event_type && (
                  <div className="pt-4 border-t border-gray-200">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase"
                      style={{
                        backgroundColor: colorForEvent(selectedEvent) + '20',
                        color: colorForEvent(selectedEvent),
                      }}
                    >
                      {selectedEvent.event_type}
                    </span>
                  </div>
                )}
                {selectedEvent.posted_by_role && (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">Posted By</p>
    <p className="text-sm text-gray-900">{ROLE_DISPLAY_LABEL[selectedEvent.posted_by_role] ?? selectedEvent.posted_by_role}</p>
  </div>
)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====================== 5.6 SETTINGS ======================
 function FacultySettings() {
    const [announcementAlerts, setAnnouncementAlerts] = useState(true);
    const [departmentNotices, setDepartmentNotices] = useState(true);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [fullNameInput, setFullNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [contactEmailInput, setContactEmailInput] = useState('');
    const [contactNoInput, setContactNoInput] = useState('');
    const [specializationInput, setSpecializationInput] = useState('');

    const [readOnly, setReadOnly] = useState({
      facultyId: '',
      position: '',
      departmentName: '',
      dateHired: '',
      status: '',
    });

    const fetchMe = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setLoadError('Failed to load your profile.');
          setLoading(false);
          return;
        }
        const data = await res.json();

        setFullNameInput(data.fullName ?? '');
        setEmailInput(data.email ?? '');
        setContactEmailInput(data.contactEmail ?? '');
        setContactNoInput(data.contactNo ?? '');
        setSpecializationInput(data.specialization ?? '');
        setReadOnly({
          facultyId: data.facultyId ?? '—',
          position: data.position ?? '—',
          departmentName: data.departmentNames?.[0] ?? '—',
          dateHired: data.dateHired ? new Date(data.dateHired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
          status: data.status ?? '—',
        });
      } catch {
        setLoadError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { fetchMe(); }, []);

    const handleSaveChanges = async () => {
      const trimmedName = fullNameInput.trim();
      if (!trimmedName) {
        setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
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
            contact_email: contactEmailInput.trim(),
            contact_no: contactNoInput.trim(),
            specialization: specializationInput.trim(),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSaveMessage({ type: 'error', text: err.error || 'Failed to save changes.' });
          return;
        }

        setSaveMessage({ type: 'success', text: 'Your changes have been saved.' });
        await fetchMe();
      } catch {
        setSaveMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      fetchMe();
      setSaveMessage(null);
    };

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Settings</h1>

        {loadError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
        )}

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID</label>
                    <input type="text" value={readOnly.facultyId} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Login Email</label>
                    <input type="email" value={emailInput} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={contactEmailInput}
                      onChange={(e) => setContactEmailInput(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="text"
                      value={contactNoInput}
                      onChange={(e) => setContactNoInput(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      value={specializationInput}
                      onChange={(e) => setSpecializationInput(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input type="text" value={readOnly.position} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input type="text" value={readOnly.departmentName} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Hired</label>
                    <input type="text" value={readOnly.dateHired} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                  </div>
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
                <p className="text-sm font-medium text-gray-900">Announcements</p>
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

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Department Notices</p>
                <p className="text-xs text-gray-500 mt-1">Receive updates from your department</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={departmentNotices}
                  onChange={(e) => setDepartmentNotices(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
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