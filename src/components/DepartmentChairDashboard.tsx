import { 
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  Megaphone,
  GraduationCap,
  CheckCircle,
  Clock,
  Plus,
  Download
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';

const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Calendar, label: 'Department Calendar', id: 'calendar' },
  { icon: Users, label: 'Faculty Monitoring', id: 'faculty' },
  { icon: FileText, label: 'Reports Monitoring', id: 'reports' },
  { icon: ClipboardList, label: 'Academic Records', id: 'records' },
  { icon: Megaphone, label: 'Announcements', id: 'announcements' },
];

interface DepartmentChairDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function DepartmentChairDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: DepartmentChairDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={chairMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Department Chair"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Department Chair"
          userName="Prof. James Anderson"
          onRoleChange={onRoleChange}
        />

        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <ChairDashboardView />}
          {activeMenuItem === 'calendar' && <DepartmentCalendar />}
          {activeMenuItem === 'faculty' && <FacultyMonitoring />}
          {activeMenuItem === 'reports' && <ReportsMonitoring />}
          {activeMenuItem === 'records' && <AcademicRecordsView />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
        </main>
      </div>
    </div>
  );
}

function ChairDashboardView() {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
        <p className="text-gray-600">Computer Science Department Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Faculty"
          value="18"
          icon={GraduationCap}
          iconColor="#2563EB"
          iconBgColor="#DBEAFE"
          trend="2"
          trendUp={true}
        />
        <SummaryCard
          title="Submitted Reports"
          value="14"
          icon={CheckCircle}
          iconColor="#10B981"
          iconBgColor="#D1FAE5"
        />
        <SummaryCard
          title="Pending Reports"
          value="4"
          icon={Clock}
          iconColor="#F59E0B"
          iconBgColor="#FEF3C7"
        />
        <SummaryCard
          title="Upcoming Activities"
          value="6"
          icon={Calendar}
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <NotificationsPanel userType="chair" />

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <div className="font-medium text-gray-900">View Faculty Reports</div>
              <div className="text-sm text-gray-600">Check submission status</div>
            </button>
            <button className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <div className="font-medium text-gray-900">Add Department Event</div>
              <div className="text-sm text-gray-600">Schedule activities</div>
            </button>
          </div>
        </div>
      </div>

      <FacultyMonitoringTable />
    </div>
  );
}

function DepartmentCalendar() {
  const departments = [
    { name: 'Computer Science', color: '#2563EB' },
    { name: 'Mathematics', color: '#10B981' },
    { name: 'Special Education', color: '#8B5CF6' },
    { name: 'Educational Leadership', color: '#F59E0B' },
  ];

  const events = [
    { id: 1, title: 'Faculty Development Seminar', date: 'March 15, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 2, title: 'Department Meeting', date: 'March 18, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 3, title: 'Math Quiz Bowl', date: 'March 20, 2026', dept: 'Mathematics', color: '#10B981' },
    { id: 4, title: 'Special Ed Workshop', date: 'March 22, 2026', dept: 'Special Education', color: '#8B5CF6' },
    { id: 5, title: 'Leadership Conference', date: 'March 25, 2026', dept: 'Educational Leadership', color: '#F59E0B' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Department Calendar</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Color Legend */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Color Code</h2>
        <div className="flex flex-wrap gap-4">
          {departments.map((dept, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: dept.color }}
              />
              <span className="text-sm text-gray-700">{dept.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Interactive Calendar View</p>
            <p className="text-sm text-gray-500">Editable by Department Chairs • Viewable by All</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-lg border-l-4"
              style={{ 
                borderLeftColor: event.color,
                backgroundColor: `${event.color}15`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.date} • {event.dept}</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacultyMonitoring() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Faculty Monitoring</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Faculty List</h2>
        <p className="text-sm text-gray-600 mb-4">Computer Science Department - 18 Faculty Members</p>
      </div>
      <FacultyMonitoringTable />
    </div>
  );
}

function ReportsMonitoring() {
  const reports = [
    { faculty: 'Dr. Sarah Johnson', report: 'Q4 2025 Report', status: 'Submitted', date: 'Feb 10, 2026' },
    { faculty: 'Prof. Michael Chen', report: 'Q4 2025 Report', status: 'Pending', date: 'Not yet submitted' },
    { faculty: 'Dr. Patricia Williams', report: 'Q4 2025 Report', status: 'Submitted', date: 'Feb 12, 2026' },
    { faculty: 'Prof. Robert Anderson', report: 'Q4 2025 Report', status: 'Submitted', date: 'Feb 9, 2026' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports Monitoring</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This is a monitoring view only. You can view submitted and pending reports but cannot approve them.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Faculty Name</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Report</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Submission Date</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{report.faculty}</td>
                  <td className="py-4 px-6 text-gray-700">{report.report}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      report.status === 'Submitted' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{report.date}</td>
                  <td className="py-4 px-6 text-center">
                    {report.status === 'Submitted' && (
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View
                      </button>
                    )}
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

function AcademicRecordsView() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>View Only:</strong> You can view department-related academic records but cannot modify them.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Documents</h2>
        <div className="space-y-3">
          {[
            'Computer Science Curriculum 2025',
            'Faculty Load Summary',
            'Department Annual Report',
            'Student Performance Statistics'
          ].map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnouncementsView() {
  const announcements = [
    { title: 'Faculty Development Seminar', date: 'Feb 10, 2026', type: 'College-wide' },
    { title: 'Quarterly Report Deadline', date: 'Feb 8, 2026', type: 'College-wide' },
    { title: 'Department Meeting Reminder', date: 'Feb 5, 2026', type: 'College-wide' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Announcements</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>View Only:</strong> College-wide announcements. Only the Dean can create announcements.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{announcement.title}</div>
                  <div className="text-sm text-gray-600">{announcement.date} • {announcement.type}</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}