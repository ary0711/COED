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
  UserCircle,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState } from 'react';

const facultyMenuItems = [
  { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  { icon: BookOpen, label: 'Teaching Load', id: 'teaching-load' },
  { icon: FileText, label: 'Research & Extension', id: 'research' },
  { icon: Award, label: 'Achievements', id: 'achievements' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: BarChart3, label: 'Evaluation Results', id: 'evaluation' },
  { icon: FileText, label: 'Reports', id: 'reports' },
  { icon: UserCircle, label: 'My Profile', id: 'profile' },
];

interface FacultyDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem }: FacultyDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={facultyMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Faculty Member"
      />
      <div className="flex-1 ml-64">
        <DashboardHeader userRole="Faculty" userName="Prof. Sarah Johnson" />
        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <FacultyDashboardView />}
          {activeMenuItem === 'teaching-load' && <TeachingLoad />}
          {activeMenuItem === 'research' && <ResearchExtension />}
          {activeMenuItem === 'achievements' && <FacultyAchievements />}
          {activeMenuItem === 'records' && <AcademicRecordsView />}
          {activeMenuItem === 'evaluation' && <EvaluationResults />}
          {activeMenuItem === 'reports' && <ReportsView />}
          {activeMenuItem === 'profile' && <MyProfile />}
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
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">Welcome back, Prof. Sarah Johnson</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-600">Teaching Units</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Users className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">156</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <FileText className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Pending Reports</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Award className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">4.8/5.0</div>
          <div className="text-sm text-gray-600">Evaluation Rating</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className={`p-4 rounded-lg border-l-4 ${ann.type === 'urgent' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                <div className="font-medium text-gray-900">{ann.title}</div>
                <div className="text-sm text-gray-600 mt-1">{ann.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Q4 Report Submission</div>
                <div className="text-sm text-gray-600">Due: February 20, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <Calendar className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Grade Encoding Deadline</div>
                <div className="text-sm text-gray-600">Due: February 28, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Research Output Submission</div>
                <div className="text-sm text-gray-600">Due: March 15, 2026</div>
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
    { code: 'CS101', name: 'Introduction to Computer Science', units: 3, studentCount: 45, schedule: 'MWF 8:00–9:00 AM', room: 'Room 201', semester: '2nd Semester AY 2025–2026' },
    { code: 'CS201', name: 'Data Structures', units: 3, studentCount: 38, schedule: 'TTH 10:00–11:30 AM', room: 'Room 305', semester: '2nd Semester AY 2025–2026' },
    { code: 'CS301', name: 'Software Engineering', units: 3, studentCount: 42, schedule: 'MWF 1:00–2:00 PM', room: 'Lab 102', semester: '2nd Semester AY 2025–2026' },
    { code: 'CS401', name: 'Capstone Project', units: 3, studentCount: 31, schedule: 'TTH 2:00–3:30 PM', room: 'Room 410', semester: '2nd Semester AY 2025–2026' },
  ];

  const enrolledStudents = [
    { id: '2024-001', name: 'Dela Cruz, Juan', year: '1st Year', status: 'Regular' },
    { id: '2024-042', name: 'Santos, Maria Clara', year: '1st Year', status: 'Regular' },
    { id: '2023-156', name: 'Garcia, Roberto', year: '2nd Year', status: 'Irregular' },
    { id: '2024-089', name: 'Lumbera, Bienvenido', year: '1st Year', status: 'Regular' },
    { id: '2023-211', name: 'Reyes, Ana Liza', year: '2nd Year', status: 'Irregular' },
  ];

  if (view === 'students' && selectedSubject) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setView('list'); setSelectedSubject(null); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Enrolled Students</h1>
            <p className="text-gray-600">{selectedSubject.code} – {selectedSubject.name}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Users size={20} />
              <span>Total Enrolled: {selectedSubject.studentCount} Students</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all">
              <Download size={16} /> Export Class List
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Student ID</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Full Name</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Year Level</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((student, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm text-gray-600">{student.id}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{student.name}</td>
                  <td className="py-4 px-6 text-gray-700">{student.year}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${student.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Teaching Load</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-sm text-blue-600 font-medium mb-1">Academic Year</div>
          <div className="font-semibold text-gray-900">2025–2026</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-sm text-blue-600 font-medium mb-1">Semester</div>
          <div className="font-semibold text-gray-900">Second Semester</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Load</div>
          <div className="text-2xl font-bold text-blue-600">12 Units</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assigned Courses</h2>
        </div>
        <table className="w-full text-left">
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
                  <button
                    onClick={() => { setSelectedSubject(sub); setView('students'); }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline underline-offset-4"
                  >
                    View Students
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    { title: 'AI in Philippine Education', type: 'Research', date: 'Jan 15, 2026', status: 'Approved' },
    { title: 'Community Literacy Program', type: 'Extension', date: 'Feb 2, 2026', status: 'Pending' },
    { title: 'Blockchain in Records Management', type: 'Research', date: 'Feb 10, 2026', status: 'Rejected' },
  ];

  const approved = submissions.filter(s => s.status === 'Approved');

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${map[status]}`}>{status}</span>;
  };

  const statusIcon = (status: string) => {
    if (status === 'Approved') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'Rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research & Extension</h1>
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'submit', label: 'Submit' }, { id: 'track', label: 'Track Status' }, { id: 'approved', label: 'Approved' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit New Output</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setResearchType('research')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${researchType === 'research' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Research</button>
                <button type="button" onClick={() => setResearchType('extension')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${researchType === 'extension' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Extension Activity</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input type="text" value={researchTitle} onChange={e => setResearchTitle(e.target.value)} placeholder="Enter title" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
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
            <button onClick={() => alert('✅ Submission sent for approval!')} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors">
              Submit for Approval
            </button>
          </div>
        </div>
      )}

      {tab === 'track' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Submission Tracker</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {submissions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {statusIcon(s.status)}
                  <div>
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-500">{s.type} · Submitted {s.date}</div>
                  </div>
                </div>
                {statusBadge(s.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'approved' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Approved Research & Extension</h2>
          </div>
          {approved.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No approved submissions yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {approved.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">{s.title}</div>
                      <div className="text-sm text-gray-500">{s.type} · Approved on {s.date}</div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
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
    { title: 'Best Paper Award – ICEICE 2025', date: 'Nov 2025', status: 'Approved', category: 'Research' },
    { title: 'Outstanding Faculty Awardee', date: 'Jan 2026', status: 'Pending', category: 'Teaching' },
    { title: 'Community Service Medal', date: 'Mar 2025', status: 'Approved', category: 'Extension' },
    { title: 'Innovation Grant Recipient', date: 'Oct 2024', status: 'Approved', category: 'Research' },
  ];

  const approved = achievements.filter(a => a.status === 'Approved');

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Achievements</h1>
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ id: 'submit', label: 'Submit' }, { id: 'approved', label: 'Approved' }, { id: 'history', label: 'History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'submit' && (
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit New Achievement</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Award / Achievement Title *</label>
              <input type="text" value={awardTitle} onChange={e => setAwardTitle(e.target.value)} placeholder="e.g., Best Paper Award" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Received</label>
              <input type="date" value={awardDate} onChange={e => setAwardDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
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
            <button onClick={() => alert('✅ Achievement submitted for review!')} className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-colors">
              Submit for Review
            </button>
          </div>
        </div>
      )}

      {tab === 'approved' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Approved Achievements</h2>
            <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">{approved.length} Total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {approved.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{a.title}</div>
                    <div className="text-sm text-gray-500">{a.category} · {a.date}</div>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Achievement History</h2>
          </div>
          <table className="w-full text-left">
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
      )}
    </div>
  );
}

// ====================== 5.4 ACADEMIC RECORDS ======================
function AcademicRecordsView() {
  const handleDownload = (name: string) => alert(`📥 Downloading: ${name}`);
  const [activeCategory, setActiveCategory] = useState('All');

  const documents = [
    { name: 'Faculty Handbook 2025–2026', category: 'Handbook', size: '2.4 MB' },
    { name: 'Academic Policies & Guidelines', category: 'Policy', size: '1.1 MB' },
    { name: 'Research Memorandum No. 2026-01', category: 'Memorandum', size: '340 KB' },
    { name: 'Administrative Memorandum No. 2026-03', category: 'Memorandum', size: '280 KB' },
    { name: 'Leave Application Form', category: 'Form', size: '120 KB' },
    { name: 'Research Proposal Template', category: 'Form', size: '95 KB' },
    { name: 'Grade Sheet Template', category: 'Form', size: '88 KB' },
    { name: 'Faculty Evaluation Form', category: 'Form', size: '110 KB' },
  ];

  const categories = ['All', 'Handbook', 'Policy', 'Memorandum', 'Form'];
  const filtered = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

  const categoryColor: Record<string, string> = {
    Handbook: 'bg-blue-100 text-blue-700',
    Policy: 'bg-purple-100 text-purple-700',
    Memorandum: 'bg-orange-100 text-orange-700',
    Form: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === c ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filtered.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{doc.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[doc.category]}`}>{doc.category}</span>
                    <span className="text-xs text-gray-400">{doc.size}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDownload(doc.name)} className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                <Download size={15} /> Download
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
        { label: 'Teaching Effectiveness', score: 4.9, icon: TrendingUp },
        { label: 'Communication Skills', score: 4.7, icon: MessageSquare },
        { label: 'Student Engagement', score: 4.8, icon: Users },
        { label: 'Course Content Quality', score: 4.8, icon: BookOpen },
      ],
    },
    '1st Sem AY 2025–2026': {
      overall: 4.6,
      metrics: [
        { label: 'Teaching Effectiveness', score: 4.7, icon: TrendingUp },
        { label: 'Communication Skills', score: 4.5, icon: MessageSquare },
        { label: 'Student Engagement', score: 4.6, icon: Users },
        { label: 'Course Content Quality', score: 4.6, icon: BookOpen },
      ],
    },
    '2nd Sem AY 2024–2025': {
      overall: 4.5,
      metrics: [
        { label: 'Teaching Effectiveness', score: 4.6, icon: TrendingUp },
        { label: 'Communication Skills', score: 4.4, icon: MessageSquare },
        { label: 'Student Engagement', score: 4.5, icon: Users },
        { label: 'Course Content Quality', score: 4.5, icon: BookOpen },
      ],
    },
  };

  const current = semesterData[selectedSemester];

  const ratingLabel = (score: number) => {
    if (score >= 4.8) return { label: 'Outstanding', color: 'text-green-600' };
    if (score >= 4.5) return { label: 'Very Satisfactory', color: 'text-blue-600' };
    return { label: 'Satisfactory', color: 'text-yellow-600' };
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Results</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {semesters.map(s => (
          <button key={s} onClick={() => setSelectedSemester(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSemester === s ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-blue-600 mb-2">{current.overall}</div>
          <div className="text-gray-500 mb-1">Overall Rating (out of 5.0)</div>
          <div className={`font-semibold text-lg ${ratingLabel(current.overall).color}`}>{ratingLabel(current.overall).label}</div>
          <div className="mt-4 text-sm text-gray-400">{selectedSemester}</div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            {current.metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{m.score}/5.0</span>
                      <span className={`text-xs font-semibold ${ratingLabel(m.score).color}`}>{ratingLabel(m.score).label}</span>
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
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Semester Evaluation Records</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700">Semester</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Overall Rating</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {semesters.map((s, i) => {
              const d = semesterData[s];
              const r = ratingLabel(d.overall);
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{s}</td>
                  <td className="py-4 px-6 text-center font-bold text-blue-600">{d.overall}/5.0</td>
                  <td className="py-4 px-6 text-center"><span className={`font-semibold ${r.color}`}>{r.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================== 5.6 REPORTS ======================
function ReportsView() {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [period, setPeriod] = useState('');
  const [academicYear, setAcademicYear] = useState('2025–2026');
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [tab, setTab] = useState<'form' | 'submitted'>('form');

  const submittedReports = [
    { type: 'Monthly', period: 'January 2026', date: 'Feb 1, 2026', status: 'Received' },
    { type: 'Quarterly', period: 'Q3 AY 2025–2026', date: 'Jan 10, 2026', status: 'Received' },
    { type: 'Monthly', period: 'December 2025', date: 'Jan 3, 2026', status: 'Received' },
  ];

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
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('form')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'form' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Submit Report</button>
        <button onClick={() => setTab('submitted')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'submitted' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Submitted Reports</button>
      </div>

      {tab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Faculty Report Form</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setReportType('monthly')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${reportType === 'monthly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Monthly</button>
                  <button type="button" onClick={() => setReportType('quarterly')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${reportType === 'quarterly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Quarterly</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
                  <option>2025–2026</option>
                  <option>2024–2025</option>
                  <option>2023–2024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{reportType === 'monthly' ? 'Month *' : 'Quarter *'}</label>
                {reportType === 'monthly' ? (
                  <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select Month</option>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                      <option key={m}>{m} {academicYear.split('–')[0]}</option>
                    ))}
                  </select>
                ) : (
                  <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
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
                <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Notable accomplishments this period..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Challenges</label>
                <textarea value={challenges} onChange={e => setChallenges(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Issues or difficulties encountered..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Suggested improvements or actions..." />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={generateFormalReport} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5" /> Generate Preview
                </button>
                <button type="button" onClick={() => {
                  if (!period.trim()) { alert('Please select a reporting period.'); return; }
                  alert(`✅ Report for ${period} submitted to the Dean.`);
                }} className="flex-1 py-4 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Send className="w-5 h-5" /> Submit to Dean
                </button>
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="bg-white rounded-2xl shadow-md p-8 overflow-auto max-h-[85vh] border border-gray-200">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Printer size={18} /> Print Preview</h3>
                <div className="flex gap-3">
                  <button onClick={() => alert('📥 Downloading PDF...')} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setShowPreview(false)} className="text-red-600 hover:text-red-700 text-sm font-medium">Close</button>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: generatedReport }} />
            </div>
          )}
        </div>
      )}

      {tab === 'submitted' && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Submitted Reports</h2>
          </div>
          <table className="w-full text-left">
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
      )}
    </div>
  );
}

// ====================== 5.7 MY PROFILE ======================
function MyProfile() {
  const [name, setName] = useState('Prof. Sarah Johnson');
  const [email, setEmail] = useState('sarah.johnson@university.edu.ph');
  const [editingField, setEditingField] = useState<'name' | 'email' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'name' | 'email' | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEdit = (field: 'name' | 'email') => {
    setEditingField(field);
    setTempValue(field === 'name' ? name : email);
  };

  const handleSave = () => {
    if (editingField === 'name') setName(tempValue);
    if (editingField === 'email') setEmail(tempValue);
    setEditingField(null);
    showSuccess('Updated successfully.');
  };

  const handleDelete = () => {
    if (showDeleteConfirm === 'name') setName('');
    if (showDeleteConfirm === 'email') setEmail('');
    setShowDeleteConfirm(null);
    showSuccess('Field cleared.');
  };

  const fields = [
    { key: 'name' as const, label: 'Full Name', value: name },
    { key: 'email' as const, label: 'Email Address', value: email },
  ];

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">View and update your profile information</p>
      </div>

      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md max-w-xl overflow-hidden">
        {/* Avatar area */}
        <div className="flex flex-col items-center py-10 bg-gray-50 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-[#1E3A8A] flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-white">
              {name ? name.trim().split(' ').map(w => w[0]).slice(0, 2).join('') : '?'}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-lg">{name || '—'}</p>
          <p className="text-sm text-gray-500">{email || '—'}</p>
        </div>

        {/* Fields */}
        <div className="divide-y divide-gray-100">
          {fields.map(field => (
            <div key={field.key} className="flex items-center gap-4 px-6 py-5">
              <div className="w-32 shrink-0 text-sm font-medium text-gray-500">{field.label}</div>
              <div className="flex-1">
                {editingField === field.key ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={e => setTempValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditingField(null); }}
                      className="flex-1 px-3 py-2 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button onClick={handleSave} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm ${field.value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {field.value || 'Not set'}
                  </span>
                )}
              </div>
              {editingField !== field.key && (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(field.key)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(field.key)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Clear">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Clear Field</h3>
                <p className="text-sm text-gray-500">This will remove the current value.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to clear the <strong>{showDeleteConfirm === 'name' ? 'Full Name' : 'Email Address'}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors">
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}