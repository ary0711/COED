import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  UserCheck,
  LayoutDashboard,
  Settings,
  Calendar,
  Award,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { ChartsSection } from './ChartsSection';
import { NotificationsPanel } from './NotificationsPanel';
import { QuarterlyReportTracker } from './QuarterlyReportTracker';

const deanMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Users, label: 'User Management', id: 'users' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: GraduationCap, label: 'Faculty & Staff', id: 'faculty' },
  { icon: Calendar, label: 'Calendar & Activities', id: 'calendar' },
  { icon: Award, label: 'Research & Achievements', id: 'research' },
  { icon: ClipboardCheck, label: 'Evaluation Management', id: 'evaluation' },
  { icon: UserCheck, label: 'Alumni Tracer', id: 'alumni' },
  { icon: BarChart3, label: 'Reports & Analytics', id: 'reports' },
  { icon: Megaphone, label: 'Announcements', id: 'announcements' },
  { icon: Edit, label: 'Landing Page Management', id: 'landing' },
  { icon: Settings, label: 'System Settings', id: 'settings' },
];

interface CollegeDeanDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function CollegeDeanDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: CollegeDeanDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={deanMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="College Dean - Full Access"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="College Dean"
          userName="Dr. Elizabeth Martinez"
          onRoleChange={onRoleChange}
        />

        <main className="p-8">
          {activeMenuItem === 'dashboard' && <DashboardView />}
          {activeMenuItem === 'users' && <UserManagement />}
          {activeMenuItem === 'records' && <AcademicRecords />}
          {activeMenuItem === 'faculty' && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar' && <CalendarActivities />}
          {activeMenuItem === 'research' && <ResearchAchievements />}
          {activeMenuItem === 'evaluation' && <EvaluationManagement />}
          {activeMenuItem === 'alumni' && <AlumniTracer />}
          {activeMenuItem === 'reports' && <ReportsAnalytics />}
          {activeMenuItem === 'announcements' && <AnnouncementsContent />}
          {activeMenuItem === 'landing' && <LandingPageManagement />}
          {activeMenuItem === 'settings' && <SystemSettings />}
        </main>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">College Dean Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your college overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
        <SummaryCard
          title="Total Faculty"
          value="142"
          icon={GraduationCap}
          iconColor="#2563EB"
          iconBgColor="#DBEAFE"
          trend="5.2%"
          trendUp={true}
        />
        <SummaryCard
          title="Total Students"
          value="3,847"
          icon={Users}
          iconColor="#10B981"
          iconBgColor="#D1FAE5"
          trend="12.3%"
          trendUp={true}
        />
        <SummaryCard
          title="Active Departments"
          value="8"
          icon={Building2}
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
        />
        <SummaryCard
          title="Pending Reports"
          value="23"
          icon={FileText}
          iconColor="#F59E0B"
          iconBgColor="#FEF3C7"
          trend="8"
          trendUp={false}
        />
        <SummaryCard
          title="Alumni Responses"
          value="1,256"
          icon={UserCheck}
          iconColor="#EF4444"
          iconBgColor="#FEE2E2"
          trend="18.7%"
          trendUp={true}
        />
      </div>

      <ChartsSection />
      <NotificationsPanel userType="dean" />
      <div className="mt-6">
        <QuarterlyReportTracker />
      </div>
    </div>
  );
}

function UserManagement() {
  const users = [
    { id: 1, name: 'Dr. Sarah Johnson', role: 'Faculty', dept: 'Computer Science', status: 'Active' },
    { id: 2, name: 'John Cruz', role: 'Student', dept: 'Mathematics', status: 'Active' },
    { id: 3, name: 'Dr. Michael Chen', role: 'Department Chair', dept: 'Mathematics', status: 'Active' },
    { id: 4, name: 'Maria Santos', role: 'Alumni', dept: 'Elementary Education', status: 'Active' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{user.name}</td>
                  <td className="py-4 px-6 text-gray-700">{user.role}</td>
                  <td className="py-4 px-6 text-gray-700">{user.dept}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

function AcademicRecords() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records Management</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dean's List</h2>
          <p className="text-gray-600 mb-4">Automated generation of Dean's List per semester</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate Dean's List
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Load</h2>
          <p className="text-gray-600 mb-4">View and manage faculty teaching loads</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Loads
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          <p className="text-gray-600 mb-4">Accreditation and academic documents</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Documents</h2>
        <div className="space-y-3">
          {['Accreditation Report 2025', 'Faculty Handbook', 'Academic Calendar 2025-2026'].map((doc, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacultyStaffManagement() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Faculty & Staff Management</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Profiles</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">142</p>
          <p className="text-gray-600 mb-4">Total Faculty Members</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View All Faculty
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Profiles</h2>
          <p className="text-3xl font-bold text-green-600 mb-2">28</p>
          <p className="text-gray-600 mb-4">Total Staff Members</p>
          <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View All Staff
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingPageManagement() {
  const sections = [
    "Hero Section",
    "About the College",
    "Vision, Mission & Goals",
    "Programs Offered",
    "Faculty Directory",
    "Achievements",
    "Research & Extension",
    "News & Updates",
    "Contact Information"
  ];

  const [selectedSection, setSelectedSection] = useState(sections[0]);

  const [content, setContent] = useState({
    "Hero Section": {
      title: "Welcome to the College of Education",
      description: "Empowering future educators through excellence and innovation."
    },
    "About the College": {
      title: "About COED",
      description: "The College of Education provides high-quality teacher education programs."
    },
    "Vision, Mission & Goals": {
      title: "Our Vision & Mission",
      description: "To be a center of excellence in teacher education."
    },
    "Programs Offered": {
      title: "Our Programs",
      description: "Bachelor of Elementary Education, Bachelor of Secondary Education, and more."
    },
    "Faculty Directory": {
      title: "Meet Our Faculty",
      description: "Highly qualified and experienced educators."
    },
    "Achievements": {
      title: "Our Achievements",
      description: "Top performing graduates and award-winning faculty."
    },
    "Research & Extension": {
      title: "Research & Community Engagement",
      description: "Active research and community extension programs."
    },
    "News & Updates": {
      title: "Latest News",
      description: "Stay updated with announcements and events."
    },
    "Contact Information": {
      title: "Contact Us",
      description: "Email: coed@university.edu | Phone: (123) 456-7890"
    }
  });

  const handleChange = (field: string, value: string) => {
    setContent({
      ...content,
      [selectedSection]: {
        ...content[selectedSection],
        [field]: value
      }
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">
        Landing Page Management
      </h1>

      {/* Section Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Section
        </label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {sections.map((section, index) => (
            <option key={index} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Editing: {selectedSection}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            value={content[selectedSection].title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />

          <textarea
            rows={5}
            value={content[selectedSection].description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
          />

          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
        <h3 className="text-2xl font-bold text-blue-600">
          {content[selectedSection].title}
        </h3>
        <p className="text-gray-700 mt-2">
          {content[selectedSection].description}
        </p>
      </div>
    </div>
  );
}

function CalendarActivities() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-16 h-16 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Activities</h2>
        <div className="space-y-3">
          {[
            { title: 'Faculty Development Seminar', date: 'March 15, 2026', dept: 'All Departments' },
            { title: 'Department Meeting', date: 'March 18, 2026', dept: 'Computer Science' },
            { title: 'College Foundation Day', date: 'March 25, 2026', dept: 'All Departments' },
          ].map((event, i) => (
            <div key={i} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900">{event.title}</div>
              <div className="text-sm text-gray-600">{event.date} • {event.dept}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResearchAchievements() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research, Extension & Achievements</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {[
            { title: 'Machine Learning Research Paper', author: 'Dr. Sarah Johnson', type: 'Research' },
            { title: 'Community Literacy Extension', author: 'Prof. Michael Chen', type: 'Extension' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.author} • {item.type}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvaluationManagement() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Management</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Evaluations</h3>
          <p className="text-3xl font-bold text-blue-600">3,847</p>
          <p className="text-sm text-gray-600 mt-1">Student responses</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completion Rate</h3>
          <p className="text-3xl font-bold text-green-600">94%</p>
          <p className="text-sm text-gray-600 mt-1">Students completed</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
          <p className="text-3xl font-bold text-purple-600">4.6/5.0</p>
          <p className="text-sm text-gray-600 mt-1">Overall faculty rating</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Performance Summary</h2>
        <div className="space-y-3">
          {[
            { name: 'Dr. Sarah Johnson', rating: 4.8, responses: 156 },
            { name: 'Prof. Michael Chen', rating: 4.7, responses: 142 },
            { name: 'Dr. Patricia Williams', rating: 4.9, responses: 138 },
          ].map((faculty, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{faculty.name}</div>
                  <div className="text-sm text-gray-600">{faculty.responses} responses</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{faculty.rating}</div>
                  <div className="text-xs text-gray-600">out of 5.0</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlumniTracer() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Alumni Tracer Management</h1>
      
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Alumni</h3>
          <p className="text-3xl font-bold text-blue-600">5,234</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Responses</h3>
          <p className="text-3xl font-bold text-green-600">1,256</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Employed</h3>
          <p className="text-3xl font-bold text-purple-600">98%</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Response Rate</h3>
          <p className="text-3xl font-bold text-orange-600">24%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Employment Statistics</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-16 h-16 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function ReportsAnalytics() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports & Analytics</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {['Institutional Report', 'Faculty Performance', 'Student Analytics'].map((report, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{report}</h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-16 h-16 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function AnnouncementsContent() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Announcements & Content</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Announcement</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter announcement content"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Publish Announcement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
        <div className="space-y-3">
          {[
            { title: 'Enrollment Period Extended', date: 'Feb 10, 2026', status: 'Published' },
            { title: 'Faculty Meeting Schedule', date: 'Feb 8, 2026', status: 'Published' },
          ].map((announcement, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{announcement.title}</div>
                  <div className="text-sm text-gray-600">{announcement.date}</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {announcement.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">System Settings</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Year Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Academic Year</label>
              <input
                type="text"
                defaultValue="2025-2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Second Semester</option>
                <option>First Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Update Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Maintenance</h2>
          <div className="space-y-3">
            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Create Backup
            </button>
            <button className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              System Maintenance
            </button>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Last backup: February 13, 2026 at 2:00 AM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}