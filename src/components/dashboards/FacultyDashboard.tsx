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
  { icon: FileText,    label: 'Academic Records',    id: 'records' },
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

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem, userName = 'Faculty' }: FacultyDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Kuhaon ang userId gikan sa JWT token
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : '';

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
            {activeMenuItem === 'research'      && <ResearchExtension userId={userId} />}
            {activeMenuItem === 'achievements'  && <FacultyAchievements />}
            {activeMenuItem === 'records'       && <AcademicRecordsView />}
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

  function ResearchExtension({ userId }: { userId: string }) {
    const [tab, setTab] = useState<'submit' | 'track' | 'approved'>('submit');
    const [researchTitle, setResearchTitle] = useState('');
    const [researchType, setResearchType] = useState<'research' | 'extension'>('research');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      const load = async () => {
        try {
          const res = await fetch(`${RESEARCH_API_URL}/mine`, {
            headers: { Authorization: `Bearer ${getResearchToken()}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSubmissions(data ?? []);
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
        pending:  'bg-yellow-100 text-yellow-700',
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
        alert('Please enter a title.');
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
          alert('❌ Failed to submit: ' + (err.error || res.statusText));
          return;
        }

        const data: ResearchSubmission = await res.json();
        setSubmissions(prev => [data, ...prev]);
        setResearchTitle('');
        setSelectedFile(null);
        alert('✅ Submission sent for approval!');
      } catch {
        alert('❌ Could not reach the server. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    const handleDownload = (s: ResearchSubmission) => {
      if (s.file_url) {
        window.open(s.file_url, '_blank');
      } else {
        alert('No file was attached to this submission.');
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
    const pendingCount = achievements.filter(a => a.status === 'Pending').length;
    const rejectedCount = achievements.filter(a => a.status === 'Rejected').length;

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

        {/* ── Main content (2/3) + side panel (1/3) so wide screens aren't left empty ── */}
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

          {/* ── Side panel: fills the empty space on wide screens ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Achievement Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Submitted</span>
                  <span className="text-lg font-bold text-gray-900">{achievements.length}</span>
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
      </div>
    );
  }

  // ====================== 5.4 ACADEMIC RECORDS ======================
  function AcademicRecordsView() {
    const handleDownload = (name: string) => alert(`📥 Downloading: ${name}`);
    const [activeCategory, setActiveCategory] = useState('All');

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

  // ====================== 5.6 REPORTS ======================
  function ReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'accomplishment' | 'extension' | 'monitoring'>('accomplishment');


    return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('accomplishment')}
  className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
  Accomplishment Report
</button>
<button onClick={() => setTab('extension')}
  className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
  Extension Report
</button>
      </div>

      {tab === 'accomplishment' && (
        <AccomplishmentReport userId={userId} userName={userName} />
      )}

      {tab === 'extension' && (
  <ExtensionReport userId={userId} userName={userName} />
)}

    </div>
  );
}


  // ====================== 5.7 CALENDAR (NEW DESIGN) ======================
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
    const [currentDate] = useState(new Date(today.getFullYear(), today.getMonth()));

    const calendarEvents: CalendarEvent[] = [
      { id: '1', title: 'Faculty Meeting', date: 5, type: 'meeting', description: 'Monthly faculty meeting', program: 'College of Education', color: '#3B82F6' },
      { id: '2', title: 'Research Seminar', date: 12, type: 'seminar', description: 'Seminar on AI in Education', program: 'Research Department', color: '#10B981' },
      { id: '3', title: 'Report Deadline', date: 15, type: 'deadline', description: 'Quarterly report submission', program: 'Administration', color: '#EF4444' },
      { id: '4', title: 'Department Event', date: 22, type: 'event', description: 'Annual department gathering', program: 'College of Education', color: '#A855F7' },
      { id: '5', title: 'Evaluation Period', date: 28, type: 'deadline', description: 'Faculty evaluation period', program: 'HR Department', color: '#EF4444' },
    ];

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
        case 'meeting': return 'bg-blue-500';
        case 'seminar': return 'bg-green-500';
        case 'deadline': return 'bg-red-500';
        case 'event': return 'bg-purple-500';
        default: return 'bg-gray-500';
      }
    };

    const getEventsForDay = (day: number) => {
      return calendarEvents.filter(event => event.date === day);
    };

    const formatDate = (day: number) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const upcomingEvents = calendarEvents.filter(event => {
      const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return eventDate >= todayDate;
    }).sort((a, b) => a.date - b.date);

    const historyEvents = calendarEvents.filter(event => {
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
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Calendar</h1>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                        : 'bg-white hover:bg-gray-50 cursor-pointer'
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
            {activeTab === 'upcoming' && (
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No upcoming activities</p>
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
                    <p className="text-sm">No past activities</p>
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

  // ====================== 5.8 SETTINGS ======================
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