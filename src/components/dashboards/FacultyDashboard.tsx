import {
    BookOpen,
    Award,
    FileText,
    BarChart3,
    Calendar,
    Send,
    ArrowLeft,
    Users,
    Download,
    Upload,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Printer,
    TrendingUp,
    MessageSquare,
    Star,
    Bell,
    Pencil,
    Trash2,
    Save,
    X,
    Menu,
    Settings,
    Lock,
    LogOut,
  } from 'lucide-react';
  import { Sidebar } from '../Sidebar';
  import { DashboardHeader } from '../DashboardHeader';
  import { supabase } from '../../supabaseClient';
  import { notifyRole } from '../../notificationService';
  import { useState, useEffect } from 'react';

  const facultyMenuItems = [
    { icon: BarChart3,   label: 'Dashboard',          id: 'dashboard' },
    { icon: BookOpen,    label: 'Teaching Load',       id: 'teaching-load' },
    { icon: FileText,    label: 'Research & Extension',id: 'research' },
    { icon: Award,       label: 'Achievements',        id: 'achievements' },
    { icon: FileText,    label: 'Academic Records',    id: 'records' },
    { icon: BarChart3,   label: 'Evaluation Results',  id: 'evaluation' },
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

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem, userName = 'Faculty' }: FacultyDashboardProps) {
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
      <div className="flex min-h-screen bg-transparent">

        {/* ── Sidebar — slide-in on mobile, fixed on desktop ── */}
        <Sidebar
          menuItems={facultyMenuItems}
          activeItem={activeMenuItem}
          onItemClick={setActiveMenuItem}
          userRole="Faculty Member"
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
                <DashboardHeader userRole="Faculty" userName={userName} />
              </div>
            </div>
          </div>

          <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {activeMenuItem === 'dashboard'     && <FacultyDashboardView />}
            {activeMenuItem === 'teaching-load' && <TeachingLoad />}
            {activeMenuItem === 'research'      && <ResearchExtension />}
            {activeMenuItem === 'achievements'  && <FacultyAchievements />}
            {activeMenuItem === 'records'       && <AcademicRecordsView />}
            {activeMenuItem === 'evaluation'    && <EvaluationResults />}
            {activeMenuItem === 'reports'       && <ReportsView />}
            {activeMenuItem === 'calendar'      && <FacultyCalendar />}
            {activeMenuItem === 'settings'      && <FacultySettings />}
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
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Faculty Dashboard</h1>
          <p className="text-gray-600">Welcome back, Prof. Sarah Johnson</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">12</div>
            <div className="text-xs sm:text-sm text-gray-600">Teaching Units</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">156</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Students</div>
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
  function TeachingLoad() {
    const [view, setView] = useState<'list' | 'students'>('list');
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

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

    if (view === 'students' && selectedSubject) {
      return (
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
      );
    }

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Teaching Load</h1>
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
            {subjects.map((sub, i) => (
              <div key={i} className="p-4 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{sub.code}</span>
                    <p className="text-gray-700 text-sm">{sub.name}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold ml-2 flex-shrink-0">{sub.units} units</span>
                </div>
                <div className="text-xs text-gray-500">{sub.schedule} · {sub.room}</div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-gray-600">{sub.studentCount} students</span>
                  <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline underline-offset-4">
                    View Students
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table layout for sm+ */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Code</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Course Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Units</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Students</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Schedule</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700">Room</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{sub.code}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.name}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{sub.units}</td>
                    <td className="py-4 px-6 text-center font-bold text-gray-900">{sub.studentCount}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.schedule}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.room}</td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline underline-offset-4">
                        View Students
                      </button>
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

  // ====================== 5.2 RESEARCH & EXTENSION ======================
  function ResearchExtension() {
    const [tab, setTab] = useState<'submit' | 'track' | 'approved'>('submit');
    const [researchTitle, setResearchTitle] = useState('');
    const [researchType, setResearchType] = useState<'research' | 'extension'>('research');
    const [fileName, setFileName] = useState('');

    const submissions = [
      { title: 'AI in Philippine Education',        type: 'Research',  date: 'Jan 15, 2026', status: 'Approved' },
      { title: 'Community Literacy Program',         type: 'Extension', date: 'Feb 2, 2026',  status: 'Pending'  },
      { title: 'Blockchain in Records Management',   type: 'Research',  date: 'Feb 10, 2026', status: 'Rejected' },
    ];

    const approved = submissions.filter(s => s.status === 'Approved');

    const statusBadge = (status: string) => {
      const map: Record<string, string> = {
        Pending:  'bg-yellow-100 text-yellow-700',
        Approved: 'bg-green-100 text-green-700',
        Rejected: 'bg-red-100 text-red-700',
      };
      return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${map[status]}`}>{status}</span>;
    };

    const statusIcon = (status: string) => {
      if (status === 'Approved') return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
      if (status === 'Rejected') return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      return <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
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

        {tab === 'submit' && (
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8 max-w-2xl">
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
                  <input type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
                </label>
                {fileName && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={14} /> {fileName}</p>}
              </div>
              <button onClick={() => alert('✅ Submission sent for approval!')} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base">
                Submit for Approval
              </button>
            </div>
          </div>
        )}

        {tab === 'track' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submission Tracker</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {submissions.map((s, i) => (
                <div key={i} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    {statusIcon(s.status)}
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{s.title}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{s.type} · Submitted {s.date}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{statusBadge(s.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'approved' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Approved Research & Extension</h2>
            </div>
            {approved.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No approved submissions yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approved.map((s, i) => (
                  <div key={i} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{s.title}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{s.type} · Approved on {s.date}</div>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0">
                      <Download size={14} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ====================== 5.3 ACHIEVEMENTS ======================
  function FacultyAchievements() {
    const [tab, setTab] = useState<'submit' | 'approved' | 'history'>('submit');
    const [awardTitle, setAwardTitle] = useState('');
    const [awardDate, setAwardDate] = useState('');
    const [fileName, setFileName] = useState('');

    const achievements = [
      { title: 'Best Paper Award – ICEICE 2025',  date: 'Nov 2025', status: 'Approved', category: 'Research'   },
      { title: 'Outstanding Faculty Awardee',      date: 'Jan 2026', status: 'Pending',  category: 'Teaching'   },
      { title: 'Community Service Medal',          date: 'Mar 2025', status: 'Approved', category: 'Extension'  },
      { title: 'Innovation Grant Recipient',       date: 'Oct 2024', status: 'Approved', category: 'Research'   },
    ];

    const approved = achievements.filter(a => a.status === 'Approved');

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

        {tab === 'submit' && (
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8 max-w-2xl">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Submit New Achievement</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Award / Achievement Title *</label>
                <input type="text" value={awardTitle} onChange={e => setAwardTitle(e.target.value)} placeholder="e.g., Best Paper Award" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
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
                  <input type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
                </label>
                {fileName && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={14} /> {fileName}</p>}
              </div>
              <button onClick={() => alert('✅ Achievement submitted for review!')} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base">
                Submit for Review
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
            <div className="divide-y divide-gray-100">
              {approved.map((a, i) => (
                <div key={i} className="flex items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{a.title}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{a.category} · {a.date}</div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0">
                    <Download size={14} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Achievement History</h2>
            </div>
            <div className="divide-y divide-gray-100 sm:hidden">
              {achievements.map((a, i) => (
                <div key={i} className="p-4 space-y-1">
                  <div className="font-medium text-gray-900 text-sm">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.category} · {a.date}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${a.status === 'Approved' ? 'bg-green-100 text-green-700' : a.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.status}
                  </span>
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
                  {achievements.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{a.title}</td>
                      <td className="py-4 px-6 text-gray-600">{a.category}</td>
                      <td className="py-4 px-6 text-gray-600">{a.date}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${a.status === 'Approved' ? 'bg-green-100 text-green-700' : a.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====================== 5.4 ACADEMIC RECORDS ======================
  function AcademicRecordsView() {
    const handleDownload = (name: string) => alert(`📥 Downloading: ${name}`);
    const [activeCategory, setActiveCategory] = useState('All');
    useState<any[]>([]);
    const documents = [
      { name: 'Faculty Handbook 2025–2026',          category: 'Handbook',   size: '2.4 MB'  },
      { name: 'Academic Policies & Guidelines',       category: 'Policy',     size: '1.1 MB'  },
      { name: 'Research Memorandum No. 2026-01',      category: 'Memorandum', size: '340 KB'  },
      { name: 'Administrative Memorandum No. 2026-03',category: 'Memorandum', size: '280 KB'  },
      { name: 'Leave Application Form',               category: 'Form',       size: '120 KB'  },
      { name: 'Research Proposal Template',           category: 'Form',       size: '95 KB'   },
      { name: 'Grade Sheet Template',                 category: 'Form',       size: '88 KB'   },
      { name: 'Faculty Evaluation Form',              category: 'Form',       size: '110 KB'  },
    ];

    const categories = ['All', 'Handbook', 'Policy', 'Memorandum', 'Form'];
    const filtered = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

    const categoryColor: Record<string, string> = {
      Handbook:   'bg-blue-100 text-blue-700',
      Policy:     'bg-purple-100 text-purple-700',
      Memorandum: 'bg-orange-100 text-orange-700',
      Form:       'bg-green-100 text-green-700',
    };

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeCategory === c ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[doc.category]}`}>{doc.category}</span>
                      <span className="text-xs text-gray-400">{doc.size}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDownload(doc.name)} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0">
                  <Download size={14} /> <span className="hidden xs:inline sm:inline">Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ====================== 5.5 EVALUATION RESULTS ======================
  function EvaluationResults() {
    const [selectedSemester, setSelectedSemester] = useState('2nd Sem AY 2025–2026');

    const semesters = ['2nd Sem AY 2025–2026', '1st Sem AY 2025–2026', '2nd Sem AY 2024–2025'];

    const semesterData: Record<string, { overall: number; metrics: { label: string; score: number; icon: any }[] }> = {
      '2nd Sem AY 2025–2026': {
        overall: 4.8,
        metrics: [
          { label: 'Teaching Effectiveness', score: 4.9, icon: TrendingUp    },
          { label: 'Communication Skills',   score: 4.7, icon: MessageSquare },
          { label: 'Student Engagement',     score: 4.8, icon: Users         },
          { label: 'Course Content Quality', score: 4.8, icon: BookOpen      },
        ],
      },
      '1st Sem AY 2025–2026': {
        overall: 4.6,
        metrics: [
          { label: 'Teaching Effectiveness', score: 4.7, icon: TrendingUp    },
          { label: 'Communication Skills',   score: 4.5, icon: MessageSquare },
          { label: 'Student Engagement',     score: 4.6, icon: Users         },
          { label: 'Course Content Quality', score: 4.6, icon: BookOpen      },
        ],
      },
      '2nd Sem AY 2024–2025': {
        overall: 4.5,
        metrics: [
          { label: 'Teaching Effectiveness', score: 4.6, icon: TrendingUp    },
          { label: 'Communication Skills',   score: 4.4, icon: MessageSquare },
          { label: 'Student Engagement',     score: 4.5, icon: Users         },
          { label: 'Course Content Quality', score: 4.5, icon: BookOpen      },
        ],
      },
    };

    const current = semesterData[selectedSemester];

    const ratingLabel = (score: number) => {
      if (score >= 4.8) return { label: 'Outstanding',       color: 'text-green-600' };
      if (score >= 4.5) return { label: 'Very Satisfactory', color: 'text-blue-600'  };
      return               { label: 'Satisfactory',          color: 'text-yellow-600' };
    };

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Evaluation Results</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {semesters.map(s => (
            <button key={s} onClick={() => setSelectedSemester(s)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${selectedSemester === s ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 flex flex-col items-center justify-center">
            <div className="text-5xl sm:text-6xl font-bold text-blue-600 mb-2">{current.overall}</div>
            <div className="text-gray-500 mb-1 text-sm sm:text-base">Overall Rating (out of 5.0)</div>
            <div className={`font-semibold text-base sm:text-lg ${ratingLabel(current.overall).color}`}>{ratingLabel(current.overall).label}</div>
            <div className="mt-4 text-xs sm:text-sm text-gray-400 text-center">{selectedSemester}</div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
            <div className="space-y-5 sm:space-y-6">
              {current.metrics.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">{m.score}/5.0</span>
                        <span className={`text-xs font-semibold hidden sm:inline ${ratingLabel(m.score).color}`}>{ratingLabel(m.score).label}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(m.score / 5) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Semester Evaluation Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[400px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Semester</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">Overall Rating</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((s, i) => {
                  const d = semesterData[s];
                  const r = ratingLabel(d.overall);
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900 text-sm">{s}</td>
                      <td className="py-3 px-4 sm:py-4 sm:px-6 text-center font-bold text-blue-600 text-sm">{d.overall}/5.0</td>
                      <td className="py-3 px-4 sm:py-4 sm:px-6 text-center"><span className={`font-semibold text-xs sm:text-sm ${r.color}`}>{r.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ====================== 5.6 REPORTS ======================
  function ReportsView() {
    
    useEffect(() => {
  loadDeadlines();
}, []);

useEffect(() => {
  const channel = supabase
    .channel('report-deadlines')

    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'report_deadlines'
      },
     (payload: any) => {
        setDeadlines(prev => [
          payload.new,
          ...prev
        ]);
      }
    )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

    const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
    const [period, setPeriod] = useState('');
    const [academicYear, setAcademicYear] = useState('2025–2026');
    const [highlights, setHighlights] = useState('');
    const [challenges, setChallenges] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [generatedReport, setGeneratedReport] = useState('');
    const [tab, setTab] = useState<'form' | 'submitted'>('form');
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [showModal, setShowModal] =
  useState(false);

const [modalTitle, setModalTitle] =
  useState('');

const [modalMessage, setModalMessage] =
  useState('');
    const submittedReports = [
      { type: 'Monthly',    period: 'January 2026',      date: 'Feb 1, 2026',  status: 'Received' },
      { type: 'Quarterly',  period: 'Q3 AY 2025–2026',   date: 'Jan 10, 2026', status: 'Received' },
      { type: 'Monthly',    period: 'December 2025',      date: 'Jan 3, 2026',  status: 'Received' },
    ];
    async function loadDeadlines() {
  const { data, error } = await supabase
    .from('report_deadlines')
    .select('*')
    .order('due_date', {
      ascending: true
    });

  if (!error && data) {
    setDeadlines(data);
  }
}
    async function submitReport() {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setModalTitle('Error');
      setModalMessage('User not found');
      setShowModal(true);
      return;
    }

    const { error } = await supabase
      .from('reports')
      .insert([
        {
          faculty_id: user.id,
          report_type: reportType,
          period: period,
          status: 'pending'
        }
      ]);

    if (error) throw error;

      await supabase
  .from('reports')
  .insert([
    {
      faculty_id: user.id,
      report_type: reportType,
      period,
      status: 'pending',
      highlights,
      challenges,
      recommendations
    }
  ]);
      await notifyRole(
      'dean',
      'New Faculty Report Submitted',
      `${period} report submitted by faculty`
      );

      await notifyRole(
      'department_chair',
      'New Faculty Report Submitted',
      `${period} report submitted by faculty`
      );   
    setPeriod('');
    setHighlights('');
    setChallenges('');
    setRecommendations('');

    setModalTitle('Success');
    setModalMessage('Report submitted successfully.');
    setShowModal(true);

  } catch (error) {
    console.error(error);
    setModalTitle('Error');
    setModalMessage('Failed to submit report.');
    setShowModal(true);
  }
}
    const generateFormalReport = () => {
      if (!period.trim()) { alert('Please select a Reporting Period.'); return; }
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 60px 50px; line-height: 1.65; color: #1f2937; background: white;">
          <div style="text-align: center; margin-bottom: 70px;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1E3A8A; margin: 0 0 12px 0;">${reportType.toUpperCase()} REPORT</h1>
            <p style="font-size: 22px; margin: 8px 0; color: #374151;">College of Education</p>
            <p style="font-size: 20px; margin: 15px 0; color: #1f2937;">Academic Year: ${academicYear} — ${period}</p>
            <p style="font-size: 16px; margin: 35px 0 8px 0; color: #4b5563;">Prepared by: <strong>Prof. Sarah Johnson</strong></p>
            <p style="font-size: 15px; color: #6b7280;">Date: ${today}</p>
          </div>
          <h2 style="font-size: 20px; color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Introduction</h2>
          <p style="font-size: 15.5px; margin-top: 15px;">This ${reportType} report summarizes teaching and academic activities for <strong>${period}</strong>, AY ${academicYear}.</p>
          <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Student and Class Data</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
            <thead><tr style="background: #f1f5f9;"><th style="border: 1px solid #cbd5e1; padding: 12px; text-align: left;">Month</th><th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Students</th><th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Classes</th><th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Attendance</th></tr></thead>
            <tbody>
              <tr><td style="border: 1px solid #cbd5e1; padding: 12px;">January 2026</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">156</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">18</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">92%</td></tr>
              <tr><td style="border: 1px solid #cbd5e1; padding: 12px;">February 2026</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">162</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">20</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">89%</td></tr>
            </tbody>
          </table>
          <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Analysis & Highlights</h2>
          <p style="font-size: 15.5px;">${highlights || 'No specific highlights recorded for this period.'}</p>
          <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Issues / Problems Encountered</h2>
          <p style="font-size: 15.5px;">${challenges || 'No significant issues encountered during this period.'}</p>
          <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Recommendations</h2>
          <p style="font-size: 15.5px;">${recommendations || 'Continuing with existing academic strategies.'}</p>
          <div style="margin-top: 100px; text-align: center; font-size: 15px; color: #4b5563;">
            <p>Respectfully submitted,</p>
            <p style="margin-top: 50px; font-weight: bold;">Prof. Sarah Johnson</p>
            <p>Faculty Member, College of Education</p>
          </div>
        </div>`;
      setGeneratedReport(reportHTML);
      setShowPreview(true);
    };

    return (
      <div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports</h1>
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    Active Report Deadlines
  </h2>

  {deadlines.length === 0 ? (
    <div className="text-gray-500">
      No deadlines posted.
    </div>
  ) : (
    deadlines.map(deadline => (
      <div
        key={deadline.id}
        className="border rounded-xl p-4 mb-3"
      >
        <div className="font-semibold text-gray-900">
          {deadline.title}
        </div>

        <div className="text-gray-600 mt-1">
          {deadline.description}
        </div>

        <div className="text-red-600 font-medium mt-2">
          Due:
          {' '}
          {new Date(
            deadline.due_date
          ).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila'
          })}
        </div>
      </div>
    ))
  )}

</div>
        <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('form')} className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'form' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Submit Report</button>
          <button onClick={() => setTab('submitted')} className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'submitted' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Submitted Reports</button>
        </div>

        {tab === 'form' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Faculty Report Form</h2>
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                  <div className="flex gap-3 sm:gap-4">
                    <button type="button" onClick={() => setReportType('monthly')} className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${reportType === 'monthly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Monthly</button>
                    <button type="button" onClick={() => setReportType('quarterly')} className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${reportType === 'quarterly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Quarterly</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option>2025–2026</option>
                    <option>2024–2025</option>
                    <option>2023–2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{reportType === 'monthly' ? 'Month *' : 'Quarter *'}</label>
                  {reportType === 'monthly' ? (
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                      <option value="">Select Month</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                        <option key={m}>{m} {academicYear.split('–')[0]}</option>
                      ))}
                    </select>
                  ) : (
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                      <option value="">Select Quarter</option>
                      <option>Q1 AY {academicYear}</option>
                      <option>Q2 AY {academicYear}</option>
                      <option>Q3 AY {academicYear}</option>
                      <option>Q4 AY {academicYear}</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Highlights</label>
                  <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" placeholder="Notable accomplishments this period..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Challenges</label>
                  <textarea value={challenges} onChange={e => setChallenges(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" placeholder="Issues or difficulties encountered..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                  <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" placeholder="Suggested improvements or actions..." />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button type="button" onClick={generateFormalReport} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                    <Eye className="w-5 h-5" /> Generate Preview
                  </button>
                  <button
  type="button"
  onClick={submitReport}
  className="flex-1 py-4 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base">
  <Send className="w-5 h-5" />
  Submit Report
</button>

                </div>
              </div>
            </div>

            {showPreview && (
              <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8 overflow-auto max-h-[85vh] border border-gray-200">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b gap-3">
                  <h3 className="text-base sm:text-xl font-semibold flex items-center gap-2"><Printer size={18} /> Print Preview</h3>
                  <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                    <button onClick={() => alert('📥 Downloading PDF...')} className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <Download size={14} /> PDF
                    </button>
                    <button onClick={() => setShowPreview(false)} className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium">Close</button>
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: generatedReport }} />
              </div>
            )}
          </div>
        )}

        {tab === 'submitted' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submitted Reports</h2>
            </div>
            <div className="divide-y divide-gray-100 sm:hidden">
              {submittedReports.map((r, i) => (
                <div key={i} className="p-4 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">{r.type} Report</span>
                      <p className="text-xs text-gray-600">{r.period} · {r.date}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase flex-shrink-0">{r.status}</span>
                  </div>
                  <button onClick={() => alert(`📥 Downloading ${r.type} report for ${r.period}`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Download size={12} /> Download
                  </button>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left min-w-[520px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Report Type</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Period</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Submitted</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Status</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedReports.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{r.type}</td>
                      <td className="py-4 px-6 text-gray-700">{r.period}</td>
                      <td className="py-4 px-6 text-gray-600">{r.date}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{r.status}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => alert(`📥 Downloading ${r.type} report for ${r.period}`)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mx-auto">
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {modalTitle}
        </h3>

        <p className="text-gray-600">
          {modalMessage}
        </p>
      </div>

      <div className="border-t p-4 flex justify-end">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          OK
        </button>
      </div>

    </div>
  </div>
)}
      </div>
    );
  }

  // ====================== 5.7 CALENDAR ======================
  interface CalendarEvent {
    id: string;
    title: string;
    date: number;
    type: 'meeting' | 'seminar' | 'deadline' | 'event';
    description?: string;
    program?: string;
    color?: string;
  }

  function FacultyCalendar() {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const calendarEvents: CalendarEvent[] = [
      { id: '1', title: 'Faculty Meeting', date: 5, type: 'meeting', description: 'Monthly faculty meeting', program: 'College of Education', color: '#3B82F6' },
      { id: '2', title: 'Research Seminar', date: 12, type: 'seminar', description: 'Seminar on AI in Education', program: 'Research Department', color: '#10B981' },
      { id: '3', title: 'Report Deadline', date: 15, type: 'deadline', description: 'Quarterly report submission', program: 'Administration', color: '#EF4444' },
      { id: '4', title: 'Department Event', date: 22, type: 'event', description: 'Annual department gathering', program: 'College of Education', color: '#A855F7' },
      { id: '5', title: 'Evaluation Period', date: 28, type: 'deadline', description: 'Faculty evaluation period', program: 'HR Department', color: '#EF4444' },
    ];

    const isPastDay = (day: number) => {
      return new Date(currentYear, currentMonth, day) < new Date(currentYear, currentMonth, today.getDate());
    };

    const isToday = (day: number) => {
      return day === today.getDate();
    };

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
      return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const upcomingActivities = calendarEvents
      .filter(e => e.date >= today.getDate())
      .sort((a, b) => a.date - b.date);

    const historyActivities = calendarEvents
      .filter(e => e.date < today.getDate())
      .sort((a, b) => b.date - a.date);

    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

    const eventTypeIcon = (type: string) => {
      switch (type) {
        case 'meeting': return '📋';
        case 'seminar': return '🎓';
        case 'deadline': return '⏰';
        case 'event': return '🎉';
        default: return '📌';
      }
    };

    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Calendar</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{monthName}</h2>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {days.map(day => {
                  const dayEvents = calendarEvents.filter(e => e.date === day);
                  const past = isPastDay(day);
                  const present = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        present
                          ? 'ring-2 ring-[#2563EB] ring-offset-1 bg-white'
                          : past
                          ? 'bg-gray-200 opacity-60'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-semibold mb-1 ${present ? 'text-[#2563EB]' : past ? 'text-gray-600' : 'text-gray-900'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-1 flex-wrap justify-center">
                          {dayEvents.map(event => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: event.color }}
                              title={event.title}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming & History Tabs */}
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'upcoming' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming <span className="inline-block ml-1 bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">{upcomingActivities.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'history' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                History <span className="inline-block ml-1 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">{historyActivities.length}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activeTab === 'upcoming' && (
                <>
                  {upcomingActivities.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No upcoming activities</p>
                  ) : (
                    upcomingActivities.map(activity => (
                      <button
                        key={activity.id}
                        onClick={() => setSelectedEvent(activity)}
                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors text-xs sm:text-sm border-l-4"
                        style={{ borderColor: activity.color }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{eventTypeIcon(activity.type)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{activity.title}</div>
                            <div className="text-xs text-gray-500">Day {activity.date}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <>
                  {historyActivities.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No past activities</p>
                  ) : (
                    historyActivities.map(activity => (
                      <button
                        key={activity.id}
                        onClick={() => setSelectedEvent(activity)}
                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors text-xs sm:text-sm border-l-4 opacity-75"
                        style={{ borderColor: activity.color }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{eventTypeIcon(activity.type)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{activity.title}</div>
                            <div className="text-xs text-gray-500">Past · Day {activity.date}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
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
                    style={{ backgroundColor: selectedEvent.color }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Day {selectedEvent.date}</p>
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
                {selectedEvent.program && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Program</p>
                    <p className="text-sm text-gray-900">{selectedEvent.program}</p>
                  </div>
                )}

                {selectedEvent.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{
                      backgroundColor: selectedEvent.color + '20',
                      color: selectedEvent.color,
                    }}
                  >
                    {selectedEvent.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====================== 5.7 SETTINGS ======================
  function FacultySettings() {
    const [announcementAlerts, setAnnouncementAlerts] = useState(true);
    const [departmentNotices, setDepartmentNotices] = useState(true);

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
                <input type="text" defaultValue="Prof. Sarah Johnson" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID</label>
                <input type="text" defaultValue="FAC-2018-001" disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" defaultValue="sarah.johnson@university.edu.ph" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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
            {/* Announcement Alerts */}
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

            {/* Department Notices */}
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