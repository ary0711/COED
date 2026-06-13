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
  Download,
  ArrowLeft,
  Menu,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';

const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           id: 'dashboard' },
  { icon: Calendar,        label: 'Department Calendar', id: 'calendar' },
  { icon: Users,           label: 'Faculty Monitoring',  id: 'faculty' },
  { icon: FileText,        label: 'Reports Monitoring',  id: 'reports' },
  { icon: ClipboardList,   label: 'Academic Records',    id: 'records' },
  { icon: Megaphone,       label: 'Announcements',       id: 'announcements' },
];

interface DepartmentChairDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function DepartmentChairDashboard({ activeMenuItem, setActiveMenuItem }: DepartmentChairDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">

      {/* ── Sidebar — slide-in on mobile, fixed on desktop ── */}
      <Sidebar
        menuItems={chairMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Department Chair"
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
                userRole="Department Chair"
                userName="Prof. James Anderson"
              />
            </div>
          </div>
        </div>

        {/* ── Page content ── */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {activeMenuItem === 'dashboard'     && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'calendar'      && <DepartmentCalendar />}
          {activeMenuItem === 'faculty'       && <FacultyMonitoring />}
          {activeMenuItem === 'reports'       && <ReportsMonitoring />}
          {activeMenuItem === 'records'       && <AcademicRecordsView />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard overview
───────────────────────────────────────────── */
function ChairDashboardView({ setActiveMenuItem }: { setActiveMenuItem: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
        <p className="text-gray-600">Computer Science Department Overview</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        {/* Mobile: horizontal scroll — no fixed height so content is never clipped */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 sm:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {[
            { title: 'Total Faculty',       value: '18', icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE', trend: '2',      trendUp: true      },
            { title: 'Submitted Reports',   value: '14', icon: CheckCircle,   iconColor: '#10B981', iconBgColor: '#D1FAE5', trend: undefined, trendUp: undefined },
            { title: 'Pending Reports',     value: '4',  icon: Clock,         iconColor: '#F59E0B', iconBgColor: '#FEF3C7', trend: undefined, trendUp: undefined },
            { title: 'Upcoming Activities', value: '6',  icon: Calendar,      iconColor: '#8B5CF6', iconBgColor: '#EDE9FE', trend: undefined, trendUp: undefined },
          ].map((card) => (
            // No fixed height — card grows to fit its content
            <div key={card.title} className="flex-shrink-0 w-44">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        {/* sm+: normal responsive grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard title="Total Faculty"       value="18" icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="2" trendUp={true} />
          <SummaryCard title="Submitted Reports"   value="14" icon={CheckCircle}   iconColor="#10B981" iconBgColor="#D1FAE5" />
          <SummaryCard title="Pending Reports"     value="4"  icon={Clock}         iconColor="#F59E0B" iconBgColor="#FEF3C7" />
          <SummaryCard title="Upcoming Activities" value="6"  icon={Calendar}      iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
        </div>
      </div>

      {/* Notifications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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

/* ─────────────────────────────────────────────
   Department Calendar
───────────────────────────────────────────── */
function DepartmentCalendar() {
  const [events, setEvents] = useState([
    { id: 1, title: 'Faculty Development Seminar', date: 'March 15, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 2, title: 'Department Meeting',           date: 'March 18, 2026', dept: 'Computer Science', color: '#2563EB' },
    { id: 3, title: 'Math Quiz Bowl',               date: 'March 20, 2026', dept: 'Mathematics',      color: '#10B981' },
  ]);

  const handleAddEvent = () => {
    const title = prompt('Enter Event Title:');
    if (title) {
      setEvents([{ id: Date.now(), title, date: new Date().toLocaleDateString(), dept: 'Computer Science', color: '#2563EB' }, ...events]);
    }
  };

  const handleEdit = (id: number) => {
    const newTitle = prompt('Update Event Title:', events.find(e => e.id === id)?.title);
    if (newTitle) setEvents(events.map(e => e.id === id ? { ...e, title: newTitle } : e));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Department Calendar</h1>
        <button
          onClick={handleAddEvent}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="h-64 sm:h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
          <div className="text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
            <p className="italic text-sm sm:text-base">Interactive Calendar Integration (Coming Soon)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-lg border-l-4"
              style={{ borderLeftColor: event.color, backgroundColor: `${event.color}15` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.date} • {event.dept}</div>
                </div>
                <button
                  onClick={() => handleEdit(event.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors self-start sm:self-auto"
                >
                  Edit Title
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Faculty Monitoring
───────────────────────────────────────────── */
function FacultyMonitoring() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty Monitoring</h1>
      <FacultyMonitoringTable />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reports Monitoring
───────────────────────────────────────────── */
function ReportsMonitoring() {
  const [view, setView] = useState<'table' | 'details'>('table');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [reports] = useState([
    {
      id: 1,
      faculty: 'Dr. Sarah Johnson',
      report: 'Q4 2025 Performance Report',
      status: 'Submitted',
      dateSubmitted: 'Feb 10, 2026',
      content: 'Summary of student achievements and research progress for the semester. All course objectives met with 95% passing rate.',
    },
    {
      id: 2,
      faculty: 'Prof. Michael Chen',
      report: 'Q4 2025 Performance Report',
      status: 'Pending',
      dateSubmitted: '---',
      content: '',
    },
  ]);

  if (view === 'details' && selectedReport) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { setView('table'); setSelectedReport(null); }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Report Details</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedReport.report}</h2>
              <p className="text-blue-600 font-medium">Faculty: {selectedReport.faculty}</p>
            </div>
            <div className="sm:text-right">
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${selectedReport.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {selectedReport.status}
              </span>
              <p className="text-xs text-gray-500 mt-2 italic">Submission Date: {selectedReport.dateSubmitted}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <h3 className="text-lg font-semibold text-gray-800">Faculty Submission Content:</h3>
            <div className="p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed italic">
              "{selectedReport.content || 'No content provided for this report.'}"
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-medium hover:underline">
              <Download size={18} /> Download Full Attachment (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports Monitoring</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Faculty Name</th>
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Report Type</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Date Submitted</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-4 sm:px-6 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-900 whitespace-nowrap">{report.faculty}</td>
                  <td className="py-4 px-4 sm:px-6 text-gray-600">{report.report}</td>
                  <td className="py-4 px-4 sm:px-6 text-center text-gray-500 font-mono text-sm whitespace-nowrap">{report.dateSubmitted}</td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-center">
                    {report.status === 'Submitted' ? (
                      <button
                        onClick={() => { setSelectedReport(report); setView('details'); }}
                        className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-sm font-medium whitespace-nowrap"
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Awaiting Submission</span>
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

/* ─────────────────────────────────────────────
   Academic Records
───────────────────────────────────────────── */
function AcademicRecordsView() {
  const handleDownload = (doc: string) => alert(`Downloading: ${doc}`);
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="space-y-3">
          {['Curriculum 2025', 'Faculty Load Summary'].map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all self-start sm:self-auto"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Announcements
───────────────────────────────────────────── */
function AnnouncementsView() {
  const handleDetails = (title: string) => alert(`Opening details for: ${title}`);
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Announcements</h1>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        {['Faculty Seminar', 'Report Submission Deadline'].map((ann, index) => (
          <div
            key={index}
            className="p-4 mb-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-blue-100 transition-colors"
          >
            <span className="font-medium text-gray-800">{ann}</span>
            <button
              onClick={() => handleDetails(ann)}
              className="px-3 py-1 text-blue-600 hover:underline font-medium text-sm self-start sm:self-auto"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}