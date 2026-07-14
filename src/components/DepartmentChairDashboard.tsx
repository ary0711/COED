import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  FileCheck2,
  ClipboardList,
  Megaphone,
  GraduationCap,
  CheckCircle,
  Clock,
  Plus,
  Download,
  ArrowLeft,
  Menu,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  Filter,
  Upload,
  FileSpreadsheet,
  Trash2,
  Bell,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { NotificationsPanel } from './NotificationsPanel';
import { FacultyMonitoringTable } from './FacultyMonitoringTable';

// NOTE: These two components already exist in your Faculty dashboard folder.
// Update the import path below if your project structure places them elsewhere
// (e.g. '../faculty/AccomplishmentReport').
import { AccomplishmentReport } from './dashboards/AccomplishmentReport';
import { ExtensionReport } from './dashboards/ExtensionReport';


const chairMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',           id: 'dashboard' },
  { icon: Calendar,        label: 'Department Calendar', id: 'calendar' },
  { icon: Users,           label: 'Faculty Monitoring',  id: 'faculty' },
  { icon: FileCheck2,      label: 'Reports',             id: 'chairReports' },
  { icon: FileText,        label: 'Reports Monitoring',  id: 'reports' },
  { icon: ClipboardList,   label: 'Academic Records',    id: 'records' },
  { icon: Megaphone,       label: 'Announcements',       id: 'announcements' },
  { icon: UserCheck,       label: 'Student Approvals',   id: 'approvals' },
];

interface DepartmentChairDashboardProps {
  onRoleChange?: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  program: string;
  description: string;
  color: string;
}

interface StudentApplicant {
  id: number;
  name: string;
  email: string;
  studentId: string;
  program: string;
  yearLevel: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DepartmentChairDashboard({ activeMenuItem, setActiveMenuItem }: DepartmentChairDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Kuhaon ang userId gikan sa JWT token, susama sa Faculty Dashboard,
  // para magamit sa Chair's own Reports (Accomplishment / Extension) tab.
  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : '';
  const userName = 'Prof. James Anderson';

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={chairMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Department Chair"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="hidden lg:block w-64 shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader userRole="Department Chair" userName={userName} />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {activeMenuItem === 'dashboard'   && <ChairDashboardView setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'calendar'    && <DepartmentCalendar />}
          {activeMenuItem === 'faculty'     && <FacultyMonitoring />}
          {activeMenuItem === 'chairReports' && <ChairReportsView userId={userId} userName={userName} />}
          {activeMenuItem === 'reports'     && <ReportsMonitoring />}
          {activeMenuItem === 'records'     && <AcademicRecordsView />}
          {activeMenuItem === 'announcements' && <AnnouncementsView />}
          {activeMenuItem === 'approvals'   && <StudentApprovalsView />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard Overview
───────────────────────────────────────────── */
function ChairDashboardView({ setActiveMenuItem }: { setActiveMenuItem: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Department Chair Dashboard</h1>
        <p className="text-gray-600">Computer Science Department Overview</p>
      </div>

      <div className="mb-6">
        <div
          className="flex gap-3 overflow-x-auto pb-2 sm:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {[
            { title: 'Total Faculty',       value: '18', icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE', trend: '2', trendUp: true },
            { title: 'Submitted Reports',   value: '14', icon: CheckCircle,   iconColor: '#10B981', iconBgColor: '#D1FAE5' },
            { title: 'Pending Reports',     value: '4',  icon: Clock,         iconColor: '#F59E0B', iconBgColor: '#FEF3C7' },
            { title: 'Upcoming Activities', value: '6',  icon: Calendar,      iconColor: '#8B5CF6', iconBgColor: '#EDE9FE' },
          ].map((card) => (
            <div key={card.title} className="flex-shrink-0 w-44">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard title="Total Faculty"       value="18" icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="2" trendUp={true} />
          <SummaryCard title="Submitted Reports"   value="14" icon={CheckCircle}   iconColor="#10B981" iconBgColor="#D1FAE5" />
          <SummaryCard title="Pending Reports"     value="4"  icon={Clock}         iconColor="#F59E0B" iconBgColor="#FEF3C7" />
          <SummaryCard title="Upcoming Activities" value="6"  icon={Calendar}      iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
        </div>
      </div>

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
              onClick={() => setActiveMenuItem('approvals')}
              className="w-full p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Review Student Registrations</div>
              <div className="text-sm text-gray-600">3 pending approvals</div>
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
   Department Calendar (full interactive)
───────────────────────────────────────────── */
function DepartmentCalendar() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const PROGRAMS = ['BEED', 'BSED-ENGLISH', 'BSED-MATH', 'BTLEd-HE'];

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Faculty Development Seminar', date: '2026-05-15', program: 'All Programs', description: 'Annual faculty upskilling seminar.', color: '#3B82F6' },
    { id: '2', title: 'Department Meeting',           date: '2026-05-18', program: 'BSED-MATH',    description: 'Monthly department coordination.', color: '#10B981' },
    { id: '3', title: 'College Foundation Day',       date: '2026-05-25', program: 'All Programs', description: 'Celebration of college founding.', color: '#8B5CF6' },
    { id: '4', title: 'Graduation Rehearsal',         date: '2026-03-10', program: 'BEED',         description: 'Practice run for graduation ceremony.', color: '#F59E0B' },
    { id: '5', title: 'Alumni Homecoming',            date: '2026-04-05', program: 'All Programs', description: 'Annual alumni gathering.', color: '#EF4444' },
  ]);

  const programOptions = ['All Programs', ...PROGRAMS];
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [form, setForm] = useState({ title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' });
  const [formError, setFormError] = useState('');

  const monthName    = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth  = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay     = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const upcomingEvents = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const historyEvents  = events.filter(e => e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));

  const handleAddEvent = () => {
    setFormError('');
    if (!form.title.trim()) { setFormError('Event title is required.'); return; }
    if (!form.date)          { setFormError('Please select a date.'); return; }
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: form.title.trim(),
      date: form.date,
      program: form.program,
      description: form.description.trim(),
      color: form.color,
    };
    setEvents(prev => [...prev, newEvent]);
    setForm({ title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' });
    setShowModal(false);
  };

  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const DAYS       = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
          <p className="text-gray-500 text-sm mt-1">Manage events and track activity history</p>
        </div>
        <button
          onClick={() => { setForm({ title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' }); setFormError(''); setShowModal(true); }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr  = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDay(day);
            const isToday  = dateStr === todayStr;
            const isPast   = dateStr < todayStr;
            return (
              <div key={day} className={`min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-100 p-1 sm:p-1.5 ${isPast ? 'bg-gray-50/60' : 'bg-white'}`}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                  isToday ? 'bg-[#1E3A8A] text-white' : isPast ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 1).map(ev => (
                    <div
                      key={ev.id}
                      className="text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded truncate text-white hidden sm:block"
                      style={{ backgroundColor: ev.color }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {/* Mobile: colored dots */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex gap-0.5 flex-wrap px-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                      ))}
                    </div>
                  )}
                  {dayEvents.length > 1 && (
                    <div className="text-[9px] text-gray-400 px-1 hidden sm:block">+{dayEvents.length - 1} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming / History Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['upcoming', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `History (${historyEvents.length})`}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {(activeTab === 'upcoming' ? upcomingEvents : historyEvents).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No events found.</p>
          ) : (
            (activeTab === 'upcoming' ? upcomingEvents : historyEvents).map(ev => (
              <div
                key={ev.id}
                className="flex items-start justify-between gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                style={{ borderLeftWidth: 4, borderLeftColor: ev.color }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{ev.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(ev.date)} · {ev.program}</div>
                  {ev.description && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</div>}
                </div>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Remove event"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Event</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Faculty Meeting"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={form.program}
                  onChange={e => setForm({ ...form, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
                >
                  {programOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Color</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#1E3A8A'].map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Student Approvals
───────────────────────────────────────────── */
function StudentApprovalsView() {
  const [students, setStudents] = useState<StudentApplicant[]>([
    { id: 1, name: 'Maria Santos',   email: 'maria.santos@ctu.edu.ph',   studentId: '2024-00123', program: 'BEED',         yearLevel: '1st Year', registeredAt: 'June 28, 2026', status: 'pending'  },
    { id: 2, name: 'John Dela Cruz', email: 'john.delacruz@ctu.edu.ph',  studentId: '2024-00456', program: 'BSED-MATH',    yearLevel: '2nd Year', registeredAt: 'June 28, 2026', status: 'pending'  },
    { id: 3, name: 'Ana Reyes',      email: 'ana.reyes@ctu.edu.ph',      studentId: '2024-00789', program: 'BSED-ENGLISH', yearLevel: '1st Year', registeredAt: 'June 27, 2026', status: 'pending'  },
    { id: 4, name: 'Carlo Mendoza',  email: 'carlo.mendoza@ctu.edu.ph',  studentId: '2023-00321', program: 'BTLEd-HE',     yearLevel: '3rd Year', registeredAt: 'June 26, 2026', status: 'approved' },
    { id: 5, name: 'Liza Fernandez', email: 'liza.fernandez@ctu.edu.ph', studentId: '2023-00654', program: 'BEED',         yearLevel: '4th Year', registeredAt: 'June 25, 2026', status: 'rejected' },
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  // ── Batch upload state ──
  const [showUploadModal, setShowUploadModal]   = useState(false);
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null);
  const [uploadDragOver, setUploadDragOver]     = useState(false);
  const [uploadError, setUploadError]           = useState('');
  const [uploadSuccess, setUploadSuccess]       = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const ACCEPTED_EXT = ['.pdf', '.xls', '.xlsx'];

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.some(e => file.name.toLowerCase().endsWith(e))) {
      setUploadError('Only PDF and Excel files (.pdf, .xls, .xlsx) are accepted.');
      setUploadedFile(null);
      return false;
    }
    setUploadError('');
    setUploadedFile(file);
    return true;
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateFile(file);
  };

  const handleBatchApprove = () => {
    // UI-only: mark all current pending students as approved
    setStudents(prev => prev.map(s => s.status === 'pending' ? { ...s, status: 'approved' } : s));
    setBatchConfirmOpen(false);
    setUploadedFile(null);
    setUploadSuccess(true);
    setShowUploadModal(false);
    setTimeout(() => setUploadSuccess(false), 4000);
  };

  const approve = (id: number) => setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
  const reject  = (id: number) => setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));

  const handleConfirm = () => {
    if (!confirmModal) return;
    confirmModal.action === 'approve' ? approve(confirmModal.id) : reject(confirmModal.id);
    setConfirmModal(null);
  };

  const filtered = students.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.studentId.toLowerCase().includes(search.toLowerCase()) ||
                        s.program.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    pending:  students.filter(s => s.status === 'pending').length,
    approved: students.filter(s => s.status === 'approved').length,
    rejected: students.filter(s => s.status === 'rejected').length,
  };

  const statusBadge = (status: StudentApplicant['status']) => ({
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[status]);

  const fileIcon = (file: File) =>
    file.name.toLowerCase().endsWith('.pdf')
      ? <FileText className="w-8 h-8 text-red-500" />
      : <FileSpreadsheet className="w-8 h-8 text-green-600" />;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Student Account Approvals</h1>
          <p className="text-gray-500 text-sm">Review and manage student registration requests before they can access the portal.</p>
        </div>
        <button
          onClick={() => { setUploadedFile(null); setUploadError(''); setUploadSuccess(false); setShowUploadModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Upload className="w-4 h-4" />
          Batch Approve via File
        </button>
      </div>

      {/* Success toast */}
      {uploadSuccess && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Batch approval processed successfully. All matched pending students have been approved.
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Pending',  value: counts.pending,  color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Approved', value: counts.approved, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Rejected', value: counts.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 sm:p-4 text-center ${color}`}>
            <div className="text-xl sm:text-2xl font-bold">{value}</div>
            <div className="text-xs sm:text-sm font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or program…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === f ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No students match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr key={student.id} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{student.name}</div>
                          <div className="text-xs text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-600 font-mono whitespace-nowrap">{student.studentId}</td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-sm text-gray-700 whitespace-nowrap">{student.program}</div>
                      <div className="text-xs text-gray-400">{student.yearLevel}</div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-sm text-gray-500 whitespace-nowrap">{student.registeredAt}</td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {student.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setConfirmModal({ id: student.id, action: 'approve' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => setConfirmModal({ id: student.id, action: 'reject' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xs font-semibold whitespace-nowrap"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 italic">
                          {student.status === 'approved' ? 'Access granted' : 'Access denied'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Batch Upload Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Batch Approve via File</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Upload a list of student IDs or names. Students on the list that are currently pending will be approved all at once. Accepted formats: <span className="font-medium text-gray-700">PDF, Excel (.xls, .xlsx)</span>.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setUploadDragOver(true); }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                uploadDragOver
                  ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
                  : uploadedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-[#1E3A8A]/50 hover:bg-[#1E3A8A]/5'
              }`}
              onClick={() => document.getElementById('batch-file-input')?.click()}
            >
              <input
                id="batch-file-input"
                type="file"
                accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileInput}
              />

              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  {fileIcon(uploadedFile)}
                  <p className="font-semibold text-gray-800 text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setUploadedFile(null); setUploadError(''); }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <Upload className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Drag & drop your file here</p>
                  <p className="text-xs text-gray-400">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PDF · XLS · XLSX</p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-4 h-4 flex-shrink-0" /> {uploadError}
              </p>
            )}

            {/* Info note */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              <span className="font-semibold">Note:</span> The file should contain a column with Student IDs or full names matching registered students. Unmatched entries will be skipped.
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadedFile && setBatchConfirmOpen(true)}
                disabled={!uploadedFile}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Process & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Confirm Modal ── */}
      {batchConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7 text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Batch Approval</h3>
            <p className="text-sm text-gray-500 mb-2">
              You are about to approve all pending students matched from:
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-1 break-all">{uploadedFile?.name}</p>
            <p className="text-xs text-gray-400 mb-6">This action will grant portal access to all matched students at once.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBatchConfirmOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleBatchApprove}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Yes, Approve All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Individual Confirm Modal ── */}
      {confirmModal && (() => {
        const student = students.find(s => s.id === confirmModal.id)!;
        const isApprove = confirmModal.action === 'approve';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isApprove ? 'bg-green-100' : 'bg-red-100'}`}>
                {isApprove ? <Check className="w-7 h-7 text-green-600" /> : <X className="w-7 h-7 text-red-600" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isApprove ? 'Approve Student?' : 'Reject Student?'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isApprove
                  ? <>You are about to grant <span className="font-semibold text-gray-800">{student.name}</span> access to the student portal.</>
                  : <>You are about to deny <span className="font-semibold text-gray-800">{student.name}</span>'s registration request.</>
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isApprove ? 'Yes, Approve' : 'Yes, Reject'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
   Chair's own Reports (Accomplishment / Extension)
   — separate from "Reports Monitoring" below, which
   is for reviewing faculty submissions.
───────────────────────────────────────────── */
function ChairReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'accomplishment' | 'extension'>('accomplishment');

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">Submit and track your own Accomplishment and Extension reports as Department Chair.</p>
      </div>

      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('accomplishment')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Accomplishment Report
        </button>
        <button
          onClick={() => setTab('extension')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
        >
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
            <div key={index} className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
interface Announcement {
  id: number;
  title: string;
  description: string;
  scheduledDate: string;
  createdAt: string;
}

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Faculty Seminar',
      description: 'All faculty members are required to attend the annual professional development seminar on July 10, 2026 at the AVR.',
      scheduledDate: '2026-07-10',
      createdAt: 'June 25, 2026',
    },
    {
      id: 2,
      title: 'Report Submission Deadline',
      description: 'Please submit your Q2 2026 performance reports no later than July 5, 2026. Late submissions will not be accepted.',
      scheduledDate: '2026-07-05',
      createdAt: 'June 26, 2026',
    },
  ]);

  const [showModal, setShowModal]         = useState(false);
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', scheduledDate: '' });
  const [formError, setFormError] = useState('');

  const handleCreate = () => {
    setFormError('');
    if (!form.title.trim())       { setFormError('Title is required.'); return; }
    if (!form.description.trim()) { setFormError('Description is required.'); return; }
    if (!form.scheduledDate)      { setFormError('Please select a scheduled date.'); return; }
    const now = new Date();
    const newAnn: Announcement = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      scheduledDate: form.scheduledDate,
      createdAt: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setForm({ title: '', description: '', scheduledDate: '' });
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isUpcoming = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr >= today;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Announcements</h1>
          <p className="text-gray-500 text-sm">Post and manage announcements for faculty and students.</p>
        </div>
        <button
          onClick={() => { setForm({ title: '', description: '', scheduledDate: '' }); setFormError(''); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* List */}
      {announcements.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card top row */}
              <div className="flex items-start gap-4 p-4 sm:p-5">
                {/* Blue accent bar */}
                <div className="w-1 self-stretch rounded-full bg-[#1E3A8A] flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isUpcoming(ann.scheduledDate)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isUpcoming(ann.scheduledDate) ? 'Upcoming' : 'Past'}
                    </span>
                    <span className="text-xs text-gray-400">Posted {ann.createdAt}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug">{ann.title}</h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Scheduled: {formatDate(ann.scheduledDate)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                    className="p-2 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium"
                    title={expandedId === ann.id ? 'Collapse' : 'View details'}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === ann.id ? 'rotate-90' : ''}`} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(ann.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable description */}
              {expandedId === ann.id && (
                <div className="px-5 pb-5 pt-0 ml-5 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed pt-3">{ann.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Announcement Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Announcement</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to post an announcement.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Faculty Meeting — July 2026"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
                <p className="text-xs text-gray-400 mt-1">This is the date the announcement is about, or the event date.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Write the full announcement message here…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors"
              >
                Post Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Announcement?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <span className="font-semibold text-gray-800">"{announcements.find(a => a.id === deleteConfirm)?.title}"</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}