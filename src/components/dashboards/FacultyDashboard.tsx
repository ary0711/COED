import { 
  User, 
  BookOpen, 
  Award, 
  FileText, 
  BarChart3, 
  Bell, 
  Calendar,
  Upload 
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';

const facultyMenuItems = [
  { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  { icon: User, label: 'My Profile', id: 'profile' },
  { icon: BookOpen, label: 'Teaching Load', id: 'teaching-load' },
  { icon: FileText, label: 'Research & Extension', id: 'research' },
  { icon: Award, label: 'Achievements', id: 'achievements' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: BarChart3, label: 'Evaluation Results', id: 'evaluation' },
  { icon: FileText, label: 'Reports', id: 'reports' },
];

interface FacultyDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function FacultyDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: FacultyDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={facultyMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Faculty Member"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Faculty"
          userName="Prof. Sarah Johnson"
          onRoleChange={onRoleChange}
        />

        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <FacultyDashboardView />}
          {activeMenuItem === 'profile' && <FacultyProfile />}
          {activeMenuItem === 'teaching-load' && <TeachingLoad />}
          {activeMenuItem === 'research' && <ResearchExtension />}
          {activeMenuItem === 'achievements' && <FacultyAchievements />}
          {activeMenuItem === 'records' && <AcademicRecordsView />}
          {activeMenuItem === 'evaluation' && <EvaluationResults />}
          {activeMenuItem === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

function FacultyDashboardView() {
  const announcements = [
    { id: 1, title: 'Quarterly Report Deadline - February 20', date: '2 days ago', type: 'urgent' },
    { id: 2, title: 'Faculty Development Seminar', date: '1 week ago', type: 'info' },
    { id: 3, title: 'Student Evaluation Period Open', date: '3 days ago', type: 'info' },
  ];

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">Welcome back, Prof. Sarah Johnson</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-600">Teaching Units</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">156</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Pending Reports</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">4.8/5.0</div>
          <div className="text-sm text-gray-600">Evaluation Rating</div>
        </div>
      </div>

      {/* Announcements, Deadlines & Report Submission */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-lg border-l-4 ${
                  announcement.type === 'urgent' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="font-medium text-gray-900">{announcement.title}</div>
                <div className="text-sm text-gray-600 mt-1">{announcement.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Q4 Report Submission</div>
                <div className="text-sm text-gray-600">Due: February 20, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Grade Submission</div>
                <div className="text-sm text-gray-600">Due: February 25, 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Quick Report Submission */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Submit Report</h2>
          </div>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option>Monthly Report</option>
                <option>Quarterly Report</option>
                <option>Special Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
              <input 
                type="text" 
                placeholder="e.g. Q1 2026 or January 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
              <input 
                type="file" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 mt-2"
            >
              <Upload className="w-4 h-4" />
              Submit Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FacultyProfile() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            SJ
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Prof. Sarah Johnson</h2>
            <p className="text-gray-600">Computer Science Department</p>
            <p className="text-sm text-gray-500">Faculty ID: FAC-2024-0089</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value="s.johnson@university.edu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value="+1 (234) 567-8901"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input
              type="text"
              value="Associate Professor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value="Computer Science"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>
        </div>

        <div className="mt-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function TeachingLoad() {
  const subjects = [
    { code: 'CS101', name: 'Introduction to Computer Science', units: 3, students: 45, schedule: 'MWF 8:00-9:00 AM' },
    { code: 'CS201', name: 'Data Structures', units: 3, students: 38, schedule: 'TTH 10:00-11:30 AM' },
    { code: 'CS301', name: 'Software Engineering', units: 3, students: 42, schedule: 'MWF 1:00-2:00 PM' },
    { code: 'CS401', name: 'Capstone Project', units: 3, students: 31, schedule: 'TTH 2:00-3:30 PM' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Teaching Load</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Academic Year 2025-2026</h2>
              <p className="text-gray-600">Second Semester</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">12 Units</div>
              <div className="text-sm text-gray-600">Total Teaching Load</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Course Code</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Course Name</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Units</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Students</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{subject.code}</td>
                  <td className="py-4 px-6 text-gray-700">{subject.name}</td>
                  <td className="py-4 px-6 text-center text-gray-700">{subject.units}</td>
                  <td className="py-4 px-6 text-center text-gray-700">{subject.students}</td>
                  <td className="py-4 px-6 text-gray-700">{subject.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResearchExtension() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research & Extension</h1>
      
      <div className="grid gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Research Output</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Research Title</label>
              <input
                type="text"
                placeholder="Enter research title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
              <input
                type="file"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Submit for Approval
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Research Submissions</h2>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Machine Learning in Education</div>
                  <div className="text-sm text-gray-600">Submitted: Jan 15, 2026</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Approved
                </span>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Community Literacy Program Report</div>
                  <div className="text-sm text-gray-600">Submitted: Feb 5, 2026</div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacultyAchievements() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Achievements</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Achievement</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Title</label>
            <input
              type="text"
              placeholder="e.g., Best Research Award 2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Award</option>
              <option>Recognition</option>
              <option>Publication</option>
              <option>Certification</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Document</label>
            <input
              type="file"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Submit for Approval
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Achievements</h2>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Outstanding Faculty Award 2025</div>
                <div className="text-sm text-gray-600">Submitted: Dec 10, 2025 • Approved</div>
              </div>
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AcademicRecordsView() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600 mb-4">View institutional documents and policies</p>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Faculty Handbook 2025-2026</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700">Download</button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Academic Policies</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationResults() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Results</h1>
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">4.8</div>
          <div className="text-gray-600">Overall Rating (out of 5.0)</div>
          <div className="text-sm text-gray-500 mt-1">Based on 156 student evaluations</div>
        </div>

        <div className="space-y-4">
          {[
            { category: 'Teaching Effectiveness', rating: 4.9 },
            { category: 'Course Content', rating: 4.8 },
            { category: 'Communication Skills', rating: 4.7 },
            { category: 'Student Engagement', rating: 4.8 },
          ].map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <span className="text-sm font-bold text-blue-600">{item.rating}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(item.rating / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved Reports</h2>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Q3 2025 Department Report</div>
                <div className="text-sm text-gray-600">Approved: Dec 15, 2025</div>
              </div>
              <button className="text-blue-600 hover:text-blue-700">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}