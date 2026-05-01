import { useState, useEffect } from 'react';
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
  Building2,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';
import { supabase } from '../supabaseClient';

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
  const [currentUser, setCurrentUser] = useState<{ full_name: string; department: string } | null>(null);

  // Fetch the logged-in user's profile from the database
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, department')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setCurrentUser(data);
      }
    };

    fetchCurrentUser();
  }, []);

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
          userName={currentUser?.full_name || 'Loading...'}
          onRoleChange={onRoleChange}
        />

        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && (
            <ChairDashboardView
              userName={currentUser?.full_name || ''}
              department={currentUser?.department || 'Department'}
            />
          )}
          {activeMenuItem === 'calendar' && <DepartmentCalendar department={currentUser?.department || 'Department'} />}
          {activeMenuItem === 'faculty' && <FacultyMonitoring department={currentUser?.department || 'Department'} />}
          {activeMenuItem === 'reports' && <ReportsMonitoring department={currentUser?.department || 'Department'} />}
          {activeMenuItem === 'records' && <AcademicRecordsView department={currentUser?.department || 'Department'} />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD VIEW — mirrors CollegeDeanDashboard style
// ─────────────────────────────────────────────
interface ChairDashboardViewProps {
  userName: string;
  department: string;
}

function ChairDashboardView({ userName, department }: ChairDashboardViewProps) {
  const [stats, setStats] = useState({
    totalFaculty: 0,
    submittedReports: 0,
    pendingReports: 0,
    upcomingActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Total faculty in the same department
      const { count: facultyCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'faculty')
        .eq('department', department);

      // Submitted evaluations / reports
      const { count: submittedCount } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'reviewed']);

      // Pending evaluations / reports
      const { count: pendingCount } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Upcoming calendar events
      const { count: eventCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString());

      setStats({
        totalFaculty: facultyCount || 0,
        submittedReports: submittedCount || 0,
        pendingReports: pendingCount || 0,
        upcomingActivities: eventCount || 0,
      });
    } catch (error) {
      console.error('Error fetching chair dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (department && department !== 'Department') {
      fetchStats();
    }
  }, [department]);

  return (
    <div>
      {/* Header — same style as CollegeDeanDashboard */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userName || 'Chair'}! — {department} Department Overview
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Summary Cards — same grid style as CollegeDeanDashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Faculty"
          value={loading ? '...' : stats.totalFaculty.toLocaleString()}
          icon={GraduationCap}
          iconColor="#2563EB"
          iconBgColor="#DBEAFE"
          trend="+2"
          trendUp={true}
        />
        <SummaryCard
          title="Submitted Reports"
          value={loading ? '...' : stats.submittedReports.toLocaleString()}
          icon={CheckCircle}
          iconColor="#10B981"
          iconBgColor="#D1FAE5"
        />
        <SummaryCard
          title="Pending Reports"
          value={loading ? '...' : stats.pendingReports.toLocaleString()}
          icon={Clock}
          iconColor="#F59E0B"
          iconBgColor="#FEF3C7"
          trend={stats.pendingReports > 0 ? 'Action Needed' : 'All Clear'}
          trendUp={false}
        />
        <SummaryCard
          title="Upcoming Activities"
          value={loading ? '...' : stats.upcomingActivities.toLocaleString()}
          icon={Calendar}
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
        />
      </div>

      {/* Notifications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

// ─────────────────────────────────────────────
// DEPARTMENT CALENDAR
// ─────────────────────────────────────────────
interface DepartmentProps {
  department: string;
}

function DepartmentCalendar({ department }: DepartmentProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    event_type: 'activity',
  });

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) console.error('Failed to load events:', error.message);
    else setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const openModal = (event: any = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date ? event.event_date.slice(0, 16) : '',
        end_date: event.end_date ? event.end_date.slice(0, 16) : '',
        location: event.location || '',
        event_type: event.event_type || 'activity',
      });
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'activity' });
    }
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      description: formData.description || null,
      event_date: new Date(formData.event_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      location: formData.location || null,
      event_type: formData.event_type,
      department,
    };
    let error;
    if (editingEvent) {
      ({ error } = await supabase.from('calendar_events').update(payload).eq('id', editingEvent.id));
    } else {
      ({ error } = await supabase.from('calendar_events').insert([payload]));
    }
    if (error) alert('Failed to save event: ' + error.message);
    else { alert(editingEvent ? 'Event updated!' : 'Event added!'); setShowModal(false); fetchEvents(); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) alert('Failed to delete');
    else { alert('Event deleted'); fetchEvents(); }
  };

  const formatEventDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateStr));

  const typeColor: Record<string, string> = {
    activity: 'bg-green-100 text-green-700',
    meeting: 'bg-blue-100 text-blue-700',
    exam: 'bg-red-100 text-red-700',
    deadline: 'bg-orange-100 text-orange-700',
    holiday: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Department Calendar</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Placeholder calendar grid */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Interactive Calendar View</p>
            <p className="text-sm text-gray-400 mt-1">Editable by Department Chairs • Viewable by All</p>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          All Events ({events.length})
        </h2>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No events found.</div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatEventDate(event.event_date)}
                      {event.end_date && ` — ${formatEventDate(event.end_date)}`}
                    </div>
                    {event.description && <p className="text-gray-600 mt-2 text-sm">{event.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                      {event.location && <span>📍 {event.location}</span>}
                      {event.department && <span>🏢 {event.department}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${typeColor[event.event_type] || 'bg-gray-100 text-gray-700'}`}>
                      {event.event_type}
                    </span>
                    <button onClick={() => openModal(event)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(event.id, event.title)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-2xl font-semibold mb-6">{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                  <input type="datetime-local" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="activity">Activity</option>
                    <option value="meeting">Meeting</option>
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Room 301" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingEvent ? 'Update Event' : 'Add Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FACULTY MONITORING
// ─────────────────────────────────────────────
function FacultyMonitoring({ department }: DepartmentProps) {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFaculty = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'faculty')
      .eq('department', department)
      .order('full_name');
    if (error) console.error('Error fetching faculty:', error);
    else setFaculty(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (department && department !== 'Department') fetchFaculty();
  }, [department]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Faculty Monitoring</h1>
        <button onClick={fetchFaculty} className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">{department} Department</h2>
        </div>
        <p className="text-sm text-gray-600 ml-8">
          {loading ? 'Loading...' : `${faculty.length} Faculty Member${faculty.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading faculty...</div>
        ) : faculty.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No faculty found in this department.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">ID Number</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((person) => (
                  <tr key={person.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{person.full_name}</td>
                    <td className="py-4 px-6 text-gray-700">{person.email}</td>
                    <td className="py-4 px-6 text-gray-700">{person.id_number || '—'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {person.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Also show the FacultyMonitoringTable component */}
      <div className="mt-8">
        <FacultyMonitoringTable />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REPORTS MONITORING
// ─────────────────────────────────────────────
function ReportsMonitoring({ department }: DepartmentProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        evaluatee:profiles!evaluatee_id (full_name, department)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching reports:', error);
    else setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Reports Monitoring</h1>
        <button onClick={fetchReports} className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This is a monitoring view only. You can view submitted and pending reports but cannot approve them.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No reports found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Faculty Name</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{report.evaluatee?.full_name || '—'}</td>
                    <td className="py-4 px-6 text-gray-700">{report.evaluatee?.department || '—'}</td>
                    <td className="py-4 px-6 text-gray-700 capitalize">{report.evaluation_type || '—'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        report.status === 'submitted' || report.status === 'reviewed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {report.created_at
                        ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {(report.status === 'submitted' || report.status === 'reviewed') && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ACADEMIC RECORDS — view only
// ─────────────────────────────────────────────
function AcademicRecordsView({ department }: DepartmentProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('academic_records')
      .select(`
        *,
        student:profiles!student_id (full_name, id_number, department)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching records:', error);
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Academic Records</h1>
        <button onClick={fetchRecords} className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>View Only:</strong> You can view department-related academic records but cannot modify them.
        </p>
      </div>

      {/* Static documents section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Documents</h2>
        <div className="space-y-3">
          {[
            `${department} Curriculum 2025`,
            'Faculty Load Summary',
            'Department Annual Report',
            'Student Performance Statistics',
          ].map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
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

      {/* Live academic records from DB */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Academic Records</h2>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No academic records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">ID Number</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Course</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Semester</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Grade</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{record.student?.full_name || 'Unknown'}</td>
                    <td className="py-4 px-6 text-gray-700">{record.student?.id_number || '—'}</td>
                    <td className="py-4 px-6 text-gray-700">{record.course_code} - {record.course_title}</td>
                    <td className="py-4 px-6 text-gray-700">{record.semester}</td>
                    <td className="py-4 px-6 text-center font-semibold">{record.grade}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 text-xs rounded-full ${record.remarks === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {record.remarks || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ANNOUNCEMENTS — live from Dean's inputs
// ─────────────────────────────────────────────
function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // Fetch all announcements that target 'all', 'faculty', or 'department_chair'
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter client-side: show announcements for 'all', 'faculty', or 'department_chair'
      const visible = (data || []).filter((ann: any) => {
        const targets: string[] = Array.isArray(ann.target_role) ? ann.target_role : [ann.target_role];
        return targets.some((t: string) => ['all', 'faculty', 'department_chair'].includes(t));
      });

      setAnnouncements(visible);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Announcements</h1>
        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>View Only:</strong> These are college-wide announcements posted by the Dean. Only the Dean can create announcements.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann: any) => (
            <div
              key={ann.id}
              className={`p-5 rounded-xl ${ann.is_pinned ? 'bg-amber-50 border border-amber-300' : 'bg-white border border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {ann.is_pinned && <span className="text-amber-500 font-bold" title="Pinned">📌</span>}
                    <h3 className="font-semibold text-lg text-gray-900">{ann.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {ann.created_at
                      ? new Date(ann.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : ''}
                    {' '}•{' '}
                    {Array.isArray(ann.target_role)
                      ? ann.target_role.map((r: string) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
                      : ann.target_role}
                  </p>
                  <p className={`text-gray-700 ${selected?.id === ann.id ? '' : 'line-clamp-3'}`}>
                    {ann.content}
                  </p>
                  {ann.content && ann.content.length > 150 && (
                    <button
                      onClick={() => setSelected(selected?.id === ann.id ? null : ann)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                    >
                      {selected?.id === ann.id ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}