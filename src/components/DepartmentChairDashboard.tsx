import { useState } from 'react';
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

export function DepartmentChairDashboard({ activeMenuItem, setActiveMenuItem }: DepartmentChairDashboardProps) {
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
        />

        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} />}
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

function ChairDashboardView({ setActiveMenuItem }: { setActiveMenuItem: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
        <p className="text-gray-600">Computer Science Department Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Faculty" value="18" icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="2" trendUp={true} />
        <SummaryCard title="Submitted Reports" value="14" icon={CheckCircle} iconColor="#10B981" iconBgColor="#D1FAE5" />
        <SummaryCard title="Pending Reports" value="4" icon={Clock} iconColor="#F59E0B" iconBgColor="#FEF3C7" />
        <SummaryCard title="Upcoming Activities" value="6" icon={Calendar} iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <NotificationsPanel userType="chair" />

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setActiveMenuItem('reports')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">View Faculty Reports</div>
              <div className="text-sm text-gray-600">Check submission status</div>
            </button>
            <button 
              onClick={() => setActiveMenuItem('calendar')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
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
  const [events, setEvents] = useState([
    { id: 1, title: 'Faculty Development Seminar', date: 'March 15, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 2, title: 'Department Meeting', date: 'March 18, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 3, title: 'Math Quiz Bowl', date: 'March 20, 2026', dept: 'Mathematics', color: '#10B981' },
  ]);

  const handleAddEvent = () => {
    const title = prompt("Enter Event Title:");
    if (title) {
      const newEvent = {
        id: Date.now(),
        title,
        date: new Date().toLocaleDateString(),
        dept: 'Computer Science',
        color: '#2563EB'
      };
      setEvents([newEvent, ...events]);
    }
  };

  const handleEdit = (id: number) => {
    const newTitle = prompt("Update Event Title:", events.find(e => e.id === id)?.title);
    if (newTitle) {
      setEvents(events.map(e => e.id === id ? { ...e, title: newTitle } : e));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Department Calendar</h1>
        <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Interactive Calendar View</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="p-4 rounded-lg border-l-4" style={{ borderLeftColor: event.color, backgroundColor: `${event.color}15` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.date} • {event.dept}</div>
                </div>
                <button onClick={() => handleEdit(event.id)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
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
      <FacultyMonitoringTable />
    </div>
  );
}

function ReportsMonitoring() {
  const [reports] = useState([
    { id: 1, faculty: 'Dr. Sarah Johnson', report: 'Q4 2025 Report', status: 'Submitted', date: 'Feb 10, 2026' },
    { id: 2, faculty: 'Prof. Michael Chen', report: 'Q4 2025 Report', status: 'Pending', date: 'Not yet submitted' },
  ]);

  const handleView = (faculty: string) => alert(`Opening report details for ${faculty}`);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports Monitoring</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Faculty Name</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Report</th>
              <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-t border-gray-200">
                <td className="py-4 px-6 font-medium">{report.faculty}</td>
                <td className="py-4 px-6">{report.report}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {report.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  {report.status === 'Submitted' && (
                    <button onClick={() => handleView(report.faculty)} className="text-blue-600 font-medium">View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AcademicRecordsView() {
  const handleDownload = (doc: string) => alert(`Downloading: ${doc}`);
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-3">
          {['Curriculum 2025', 'Faculty Load Summary'].map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button onClick={() => handleDownload(doc)} className="text-blue-600 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnnouncementsView() {
  const handleDetails = (title: string) => alert(`Details for: ${title}`);
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Announcements</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        {['Faculty Seminar', 'Report Deadline'].map((ann, index) => (
          <div key={index} className="p-4 mb-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 flex justify-between items-center">
            <span className="font-medium">{ann}</span>
            <button onClick={() => handleDetails(ann)} className="text-blue-600 text-sm">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}