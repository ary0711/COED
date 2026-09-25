import {
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Calendar,
  ArrowLeft,
  DollarSign,
  Building,
  Users,
  ExternalLink,
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
  AlertCircle,
  Loader2,
  Eye,
  FolderOpen,
  User,
  CalendarDays,
  MapPin,
  Filter,
  Search,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect, useMemo } from 'react';
import { AccomplishmentReport } from './AccomplishmentReport';
import { ExtensionReport } from './ExtensionReport';
import { DeansListGenerator } from './DeansListGenerator';
import { WfhReport } from '../WfhReport'; 
import { ReportTrackerPanel } from '../ReportTrackerPanel';
import { ResearchExtension } from '../ResearchExtension'; 

const facultyMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',            id: 'dashboard' },
  { icon: BookOpen,        label: 'Teaching Load',        id: 'teaching-load' },
  { icon: FileText,        label: 'Research & Extension', id: 'research' },
  { icon: Award,           label: 'Achievements',         id: 'achievements' },
  { icon: GraduationCap,   label: "Dean's List",          id: 'deans-list' },
  { icon: FolderOpen,      label: 'Academic Resources',   id: 'academic-resources' },
  { icon: FileText,        label: 'Reports',              id: 'reports' },
  { icon: Calendar,        label: 'Calendar',             id: 'calendar' },
  { icon: Settings,        label: 'Settings',             id: 'settings' },
];

interface FacultyDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

const ME_API_URL = 'http://localhost:5000/api/me';
const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

function getResearchToken() {
  return localStorage.getItem('token');
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'validation';
  title: string;
  message: string;
}

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem, onLogout, userName = 'Faculty' }: FacultyDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleInternalLogout = () => {
    localStorage.clear();
    if (onLogout) {
      onLogout();
    }
  };

  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : '';

  const [departmentNames, setDepartmentNames] = useState<string[]>([]);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(ME_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDepartmentNames(data.departmentNames ?? []);
      } catch {
        // silent
      }
    };
    loadMe();
  }, [token]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* ── Sidebar ── */}
      <Sidebar
        menuItems={facultyMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Faculty Member"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleInternalLogout}
      />

      <div className="hidden lg:block w-64 shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader userRole="Faculty" userName={userName} onLogout={handleInternalLogout} departmentNames={departmentNames} />
            </div>
          </div>
        </div>

        {/* Removed max-w-7xl and mx-auto to utilize all side space */}
        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full flex-1 flex flex-col">
          {activeMenuItem === 'dashboard'          && <FacultyDashboardView setActiveMenuItem={setActiveMenuItem} userId={userId} />}
          {activeMenuItem === 'teaching-load'      && <TeachingLoad />}
          {activeMenuItem === 'research'           && <ResearchExtension userId={userId} />}
          {activeMenuItem === 'achievements'       && <FacultyAchievements />}
          {activeMenuItem === 'deans-list'         && <DeansListGenerator userId={userId} userName={userName} />}
          {activeMenuItem === 'academic-resources' && <AcademicResources />}
          {activeMenuItem === 'reports'            && <ReportsView userId={userId} userName={userName} />}
          {activeMenuItem === 'calendar'           && <FacultyCalendar />}
          {activeMenuItem === 'settings'           && <FacultySettings />}
          {activeMenuItem === 'extension-report'   && (
            <ExtensionReport userId={userId} userName={userName} />
          )}
        </main>
      </div>
    </div>
  );
}

// ====================== 5.0 DASHBOARD (FIXED HEIGHT CARDS & NO SCREEN SCROLL) ======================
interface FacultyDashboardViewProps {
  setActiveMenuItem: (id: string) => void;
  userId: string;
}

function FacultyDashboardView({ setActiveMenuItem, userId }: FacultyDashboardViewProps) {
  const [teachingUnits, setTeachingUnits] = useState<number>(12);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [pendingReportsList, setPendingReportsList] = useState<any[]>([]);
  const [nearestEvent, setNearestEvent] = useState<any>(null);
  const [researchExtensionList, setResearchExtensionList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // 1. Fetch Calendar Events
        const calendarRes = await fetch('http://localhost:5000/api/calendar-events', { headers });
        if (calendarRes.ok) {
          const events = await calendarRes.json();
          const today = new Date().toISOString().split('T')[0];
          const upcoming = (Array.isArray(events) ? events : [])
            .filter((e: any) => {
              const eventDate = e.event_date ? e.event_date.split('T')[0] : '';
              const aud = (e.audience || 'all').toLowerCase();
              return eventDate >= today && ['all', 'everyone', 'faculty'].includes(aud);
            })
            .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date));

          if (upcoming.length > 0) {
            setNearestEvent(upcoming[0]);
          }
        }

        // 2. Fetch Pending Reports
        const [accRes, extRes, wfhRes] = await Promise.all([
          fetch('http://localhost:5000/api/accomplishment-reports/my-draft', { headers }).catch(() => null),
          fetch('http://localhost:5000/api/extension-reports/my-draft', { headers }).catch(() => null),
          fetch('http://localhost:5000/api/wfh-reports/my-draft', { headers }).catch(() => null),
        ]);

        const reports: any[] = [];
        if (accRes && accRes.ok) {
          const accDraft = await accRes.json();
          if (accDraft && accDraft.id) {
            reports.push({
              title: 'Accomplishment Report',
              period: `${accDraft.quarter || 'Q1'} Quarter ${accDraft.year || '2026'}`,
              status: 'Draft',
              date: accDraft.updated_at,
            });
          }
        }
        if (extRes && extRes.ok) {
          const extDraft = await extRes.json();
          if (extDraft && extDraft.id) {
            reports.push({
              title: 'Extension Report',
              period: `${extDraft.quarter || 'Q1'} Quarter ${extDraft.year || '2026'}`,
              status: 'Draft',
              date: extDraft.updated_at,
            });
          }
        }
        if (wfhRes && wfhRes.ok) {
          const wfhDraft = await wfhRes.json();
          if (wfhDraft && wfhDraft.id) {
            reports.push({
              title: 'WFH Report',
              period: wfhDraft.reporting_period || 'Period Report',
              status: 'Draft',
              date: wfhDraft.updated_at,
            });
          }
        }

        setPendingReportsCount(reports.length);
        setPendingReportsList(reports);

        // 3. Fetch Research & Extension Submissions
        const researchRes = await fetch('http://localhost:5000/api/research-submissions/mine', { headers });
        if (researchRes.ok) {
          const submissions = await researchRes.json();
          setResearchExtensionList(Array.isArray(submissions) ? submissions : []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full gap-4 sm:gap-5 animate-in fade-in duration-300">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 shrink-0">
        
        {/* Card 1: Teaching Load */}
        <div
          onClick={() => setActiveMenuItem('teaching-load')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E3A8A] group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 bg-blue-50 text-[#1E3A8A] rounded-full">
              Current Load
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {teachingUnits} <span className="text-base font-normal text-gray-400">Units</span>
            </div>
            <div className="text-sm font-medium text-gray-500 mt-0.5">Teaching Load</div>
          </div>
        </div>

        {/* Card 2: Pending Reports */}
        <div
          onClick={() => setActiveMenuItem('reports')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
              Action Required
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : pendingReportsCount}
            </div>
            <div className="text-sm font-medium text-gray-500 mt-0.5">Pending Reports</div>
          </div>
        </div>

        {/* Card 3: Upcoming Activities */}
        <div
          onClick={() => setActiveMenuItem('calendar')}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            {nearestEvent && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full uppercase tracking-wider">
                Nearest Event
              </span>
            )}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#1E3A8A] transition-colors">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : nearestEvent ? (
                nearestEvent.title
              ) : (
                'No Upcoming Events'
              )}
            </div>
            <div className="text-sm font-medium text-gray-500 mt-0.5">
              {nearestEvent ? formatDate(nearestEvent.event_date) : 'Open calendar schedule'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Big Cards (Fixed Height & Internal Scrolling) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Left Bottom Card: Reports */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[500px] xl:h-[500px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Pending & Draft Reports</h2>
              <p className="text-xs text-gray-500">Faculty quarterly submissions & records</p>
            </div>
            <button
              onClick={() => setActiveMenuItem('reports')}
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              Open Reports <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
              </div>
            ) : pendingReportsList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <CheckCircle className="w-8 h-8 text-emerald-500/50 mb-2" />
                <p className="text-sm font-semibold text-gray-700">No pending reports</p>
                <p className="text-xs text-gray-400 mt-0.5">All your drafts and scheduled reports are submitted.</p>
              </div>
            ) : (
              pendingReportsList.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActiveMenuItem('reports')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-gray-200/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.period} · Saved {formatDate(item.date)}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0 uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Bottom Card: Research & Extension Status */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[500px] xl:h-[500px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Research & Extension Status</h2>
              <p className="text-xs text-gray-500">Tracking status of submitted research projects</p>
            </div>
            <button
              onClick={() => setActiveMenuItem('research')}
              className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
              </div>
            ) : researchExtensionList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-700">No submissions found</p>
                <p className="text-xs text-gray-400 mt-0.5">Submit your research and community extension works to review status.</p>
              </div>
            ) : (
              researchExtensionList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveMenuItem('research')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-gray-200/60 flex items-center justify-center shrink-0">
                      {item.type === 'research' ? (
                        <BookOpen className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Building className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="text-sm font-semibold text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-400 capitalize mt-0.5">
                        {item.type} · Submitted {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      item.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status || 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
// ====================== ACADEMIC RESOURCES (FACULTY) ======================
function AcademicResources() {
  interface AcademicDoc {
    id: string;
    title: string;
    document_type: 'handbook' | 'policy' | 'form' | 'memorandum';
    file_size: number;
    file_name?: string;
  }

  const DOC_TYPE_LABELS: Record<string, string> = {
    handbook: 'Handbook',
    policy: 'Policy',
    memorandum: 'Memorandum',
    form: 'Form',
  };

  const categoryColor: Record<string, string> = {
    Handbook: 'bg-blue-100 text-blue-700',
    Policy: 'bg-purple-100 text-purple-700',
    Memorandum: 'bg-orange-100 text-orange-700',
    Form: 'bg-green-100 text-green-700',
  };

  const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';

  const [documents, setDocuments] = useState<AcademicDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const categories = ['All', 'Handbook', 'Policy', 'Form', 'Memorandum'];

  const fetchDocuments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(DOCS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load documents.');
        setDocuments([]);
        return;
      }
      const data = await res.json();
      setDocuments(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePreview = async (doc: AcademicDoc) => {
    setPreviewingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to open preview.');
        return;
      }

      const { url, file_type } = await res.json();

      if (file_type === 'application/pdf' || file_type?.startsWith('image/')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
        window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setLoadError('Could not connect to the server for preview.');
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDownload = async (doc: AcademicDoc) => {
    setDownloadingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to generate download link.');
        return;
      }
      const { url, file_name } = await res.json();

      const link = document.createElement('a');
      link.href = url;
      link.download = file_name || doc.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLoadError('Could not reach the server for download.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = activeCategory === 'All'
    ? documents
    : documents.filter((d) => DOC_TYPE_LABELS[d.document_type] === activeCategory);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Resources</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeCategory === c
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No documents found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((doc) => {
              const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
              const isPreviewing = previewingId === doc.id;
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            categoryColor[label] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                      title="View file without downloading"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isPreviewing ? 'Opening…' : 'View'}</span>
                    </button>

                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Download file"
                    >
                      {isDownloading ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Download'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== 5.1 TEACHING LOAD ======================
interface ClassListFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

function TeachingLoad() {
  const [view, setView] = useState<'list' | 'students'>('list');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [classListFiles, setClassListFiles] = useState<Record<string, ClassListFile>>({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadSubjectCode, setUploadSubjectCode] = useState('');

  const ACCEPTED_CLASS_LIST_TYPES = '.xlsx,.xls,.pdf,.doc,.docx';

  const subjects = [
    { code: 'CS101', name: 'Introduction to Computer Science', units: 3, studentCount: 45, schedule: 'MWF 8:00–9:00 AM',   room: 'Room 201', semester: '2nd Semester AY 2025–2026' },
    { code: 'CS201', name: 'Data Structures',                  units: 3, studentCount: 38, schedule: 'TTH 10:00–11:30 AM', room: 'Room 305', semester: '2nd Semester AY 2025–2026' },
    { code: 'CS301', name: 'Software Engineering',             units: 3, studentCount: 42, schedule: 'MWF 1:00–2:00 PM',   room: 'Lab 102',  semester: '2nd Semester AY 2025–2026' },
    { code: 'CS401', name: 'Capstone Project',                 units: 3, studentCount: 31, schedule: 'TTH 2:00–3:30 PM',   room: 'Room 410', semester: '2nd Semester AY 2025–2026' },
  ];

  const enrolledStudents = [
    { id: '2024-001', name: 'Dela Cruz, Juan',       year: '1st Year', status: 'Regular'   },
    { id: '2024-042', name: 'Santos, Maria Clara',   year: '1st Year', status: 'Regular'   },
    { id: '2023-156', name: 'Garcia, Roberto',       year: '2nd Year', status: 'Irregular' },
    { id: '2024-089', name: 'Lumbera, Bienvenido',   year: '1st Year', status: 'Regular'   },
    { id: '2023-211', name: 'Reyes, Ana Liza',       year: '2nd Year', status: 'Irregular' },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openUploadModal = (subjectCode?: string) => {
    setUploadSubjectCode(subjectCode ?? '');
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setUploadSubjectCode('');
  };

  const handleClassListFile = (file: File) => {
    if (!uploadSubjectCode) {
      alert('Please select a subject first.');
      return;
    }
    setClassListFiles(prev => ({
      ...prev,
      [uploadSubjectCode]: {
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    }));
    closeUploadModal();
    alert('✅ Class list uploaded successfully!');
  };

  const UploadModal = () => (
    uploadModalOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload Class List</h2>
            <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={uploadSubjectCode}
                onChange={(e) => setUploadSubjectCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subject</option>
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>{sub.code} – {sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class List File</label>
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">Excel, PDF, or Word up to 10MB</p>
                <input
                  type="file"
                  accept={ACCEPTED_CLASS_LIST_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleClassListFile(f);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );

  if (view === 'students' && selectedSubject) {
    const uploadedFile = classListFiles[selectedSubject.code];

    return (
      <>
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

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
            {uploadedFile ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{uploadedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {uploadedFile.type} · {formatFileSize(uploadedFile.size)} · Uploaded {uploadedFile.uploadedAt}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openUploadModal(selectedSubject.code)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 flex-shrink-0"
                >
                  Replace File
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-500">No class list file uploaded for this subject yet.</p>
                <button
                  onClick={() => openUploadModal(selectedSubject.code)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <Upload size={14} /> Upload Class List
                </button>
              </div>
            )}
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
        <UploadModal />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Teaching Load</h1>
      </div>

      <div className="mb-6">
        <button
          onClick={() => openUploadModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors w-fit"
        >
          <Upload size={16} /> Upload Class List
        </button>
      </div>

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

        <div className="divide-y divide-gray-100 sm:hidden">
          {subjects.map((sub, i) => {
            const hasClassList = !!classListFiles[sub.code];
            return (
              <div key={i} className="p-4 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{sub.code}</span>
                    <p className="text-gray-700 text-sm">{sub.name}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold ml-2 flex-shrink-0">{sub.units} units</span>
                </div>
                <div className="text-xs text-gray-500">{sub.schedule} · {sub.room}</div>
                {hasClassList && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Class list uploaded
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-gray-600">{sub.studentCount} students</span>
                  <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline underline-offset-4">
                    View Students
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Course Code</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Descriptive Name</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Units</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Students</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Schedule</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700">Room</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Class List</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, i) => {
                const hasClassList = !!classListFiles[sub.code];
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{sub.code}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.name}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{sub.units}</td>
                    <td className="py-4 px-6 text-center font-bold text-gray-900">{sub.studentCount}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.schedule}</td>
                    <td className="py-4 px-6 text-gray-700">{sub.room}</td>
                    <td className="py-4 px-6 text-center">
                      {hasClassList ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <CheckCircle size={12} /> Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                          Not uploaded
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => { setSelectedSubject(sub); setView('students'); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline underline-offset-4">
                        View Students
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <UploadModal />
    </>
  );
}

// ====================== 5.3 ACHIEVEMENTS ======================
interface FileAttachment {
  name: string;
  url: string;
  size?: number;
}

interface AchievementSubmission {
  id: string;
  title: string;
  type: 'achievement';
  category: string | null;
  date_received: string | null;
  file_name: string | null;
  file_url: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export default function FacultyAchievements() {
  const [tab, setTab] = useState<'submit' | 'approved' | 'history'>('submit');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardCategory, setAwardCategory] = useState('');
  const [awardDate, setAwardDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<AchievementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    const oversized = newFiles.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'File Too Large',
        message: `Some files exceed 15MB: ${oversized.map((f) => f.name).join(', ')}`,
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getResearchToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions((data ?? []).filter((s: any) => s.type === 'achievement'));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const approved = submissions.filter((a) => a.status === 'approved');
  const pendingCount = submissions.filter((a) => a.status === 'pending').length;
  const rejectedCount = submissions.filter((a) => a.status === 'rejected').length;

  const displayStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const handleSubmit = async () => {
    if (!awardTitle.trim()) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Missing Required Field',
        message: 'Please enter an award/achievement title before submitting.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', awardTitle.trim());
      formData.append('type', 'achievement');
      formData.append('category', awardCategory.trim());
      if (awardDate) formData.append('date_received', awardDate);

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch(RESEARCH_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getResearchToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: err.error || res.statusText || 'Failed to submit achievement.',
        });
        return;
      }

      const data: AchievementSubmission = await res.json();
      setSubmissions((prev) => [data, ...prev]);
      setAwardTitle('');
      setAwardCategory('');
      setAwardDate('');
      setSelectedFiles([]);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Submitted',
        message: 'Your achievement and attachments have been successfully submitted for review!',
      });
    } catch {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server. Please check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionFiles = (a: AchievementSubmission): FileAttachment[] => {
    if (Array.isArray(a.files) && a.files.length > 0) {
      return a.files;
    }
    if (a.file_url) {
      return [{ name: a.file_name || 'Attached Document', url: a.file_url }];
    }
    return [];
  };

  const openFile = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faculty Achievements</h1>
          <p className="text-sm text-gray-500 mt-1">Submit, monitor, and document your academic and professional recognitions.</p>
        </div>
        
        <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-xl w-fit border border-gray-200/60 self-start sm:self-auto">
          {[
            { id: 'submit', label: 'Submit Achievement', count: null },
            { id: 'approved', label: 'Approved', count: approved.length },
            { id: 'history', label: 'History & Tracking', count: submissions.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.id ? 'bg-blue-50 text-blue-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {tab === 'submit' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900">Submit New Achievement</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Provide verified information and certificates regarding your achievement for Dean evaluation.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    Achievement Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Award / Achievement Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={awardTitle}
                        onChange={(e) => setAwardTitle(e.target.value)}
                        placeholder="e.g., Outstanding Researcher of the Year, Best Paper Award"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                        <input
                          type="text"
                          value={awardCategory}
                          onChange={(e) => setAwardCategory(e.target.value)}
                          placeholder="e.g., Research, Teaching, Community Outreach"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date Received / Conferred</label>
                        <input
                          type="date"
                          value={awardDate}
                          onChange={(e) => setAwardDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    Supporting Certificates & Evidences
                  </h3>

                  <label className="border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer block bg-gray-50/40 group">
                    <div className="w-10 h-10 bg-white shadow-2xs border border-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">
                      Click to browse or drop certificate files here
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">PDF, JPG, PNG, DOCX up to 15MB each</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500">
                        {selectedFiles.length} file(s) attached:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-100/80 rounded-xl text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[240px] sm:max-w-[340px] font-medium text-blue-950">
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-gray-400 text-[11px]">{(file.size / 1024).toFixed(0)} KB</span>
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-all text-xs sm:text-sm disabled:opacity-60 shadow-2xs flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit for Endorsement'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'approved' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Endorsed Achievements</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Officially recognized achievements by the College Dean</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold px-2.5 py-1 rounded-full">
                  {approved.length} Verified
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                  <span className="text-xs sm:text-sm">Loading achievements…</span>
                </div>
              ) : approved.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Award className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No approved achievements yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted achievements that are verified will be archived here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {approved.map((a) => {
                    const files = getSubmissionFiles(a);
                    return (
                      <div
                        key={a.id}
                        className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
                              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  {a.category || 'General'}
                                </span>
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{a.title}</h4>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Approved on {formatDate(a.updated_at)}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Approved
                          </span>
                        </div>

                        {files.length > 0 && (
                          <div className="pl-12 sm:pl-14 flex flex-wrap gap-2 pt-1">
                            {files.map((f, i) => (
                              <button
                                key={i}
                                onClick={() => openFile(f.url)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors border border-gray-200/80 font-medium"
                                title="Open attachment"
                              >
                                <Eye size={12} />
                                <span className="max-w-[160px] truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Achievement Records</h2>
                <p className="text-xs text-gray-500 mt-0.5">Timeline of all submitted awards and recognition filings</p>
              </div>

              {loading ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                  <span className="text-xs sm:text-sm">Loading history…</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No submission records found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {submissions.map((a) => {
                    const files = getSubmissionFiles(a);
                    return (
                      <div key={a.id} className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                {a.category || 'General'}
                              </span>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{a.title}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Conferred: {formatDate(a.date_received)} · Submitted: {formatDate(a.created_at)}
                            </div>
                          </div>
                          
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              a.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : a.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {displayStatus(a.status)}
                          </span>
                        </div>

                        {a.dean_remarks && (
                          <div className="mt-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                            <span className="font-bold block mb-0.5">Dean's Feedback:</span>
                            {a.dean_remarks}
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {files.map((f, i) => (
                              <button
                                key={i}
                                onClick={() => openFile(f.url)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gray-50 hover:bg-blue-50 text-blue-700 border border-gray-200/80 font-medium"
                              >
                                <Eye size={12} />
                                <span className="max-w-[160px] truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Achievement Overview
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Filings</span>
                <span className="text-base font-bold text-gray-900">{submissions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
                <span className="text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Approved
                </span>
                <span className="text-base font-bold text-emerald-700">{approved.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/60">
                <span className="text-xs sm:text-sm text-amber-800 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Under Review
                </span>
                <span className="text-base font-bold text-amber-700">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100/60">
                <span className="text-xs sm:text-sm text-rose-800 font-medium flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" /> Action Required
                </span>
                <span className="text-base font-bold text-rose-700">{rejectedCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3.5 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> Guidelines & Reminders
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Upload authentic certifications, plaque scans, or official citations.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Supported formats: PDF, JPG, PNG, DOCX (up to 15MB per file).</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Evaluation usually takes 3–5 working days by the Dean's Office.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Check the History tab for reviewer feedback if revisions are requested.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modal.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : modal.type === 'error'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {modal.type === 'success' && <CheckCircle className="w-6 h-6" />}
              {modal.type === 'error' && <XCircle className="w-6 h-6" />}
              {modal.type === 'validation' && <Info className="w-6 h-6" />}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">{modal.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{modal.message}</p>

            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Drafts ───
interface DraftSummary {
  id: string;
  quarter?: string;
  year?: string;
  reporting_period?: string;
  progress: number;
  updated_at: string;
  created_at: string;
}

const ACCOMPLISHMENT_DRAFTS_URL = 'http://localhost:5000/api/accomplishment-reports';
const EXTENSION_DRAFTS_URL = 'http://localhost:5000/api/extension-reports';
const WFH_DRAFTS_URL = 'http://localhost:5000/api/wfh-reports';

function getDraftsToken() {
  return localStorage.getItem('token');
}

function MyDraftsPanel({ onEdit }: { onEdit: (type: 'accomplishment' | 'extension' | 'wfh') => void }) {
  const [accDraft, setAccDraft] = useState<DraftSummary | null>(null);
  const [extDraft, setExtDraft] = useState<DraftSummary | null>(null);
  const [wfhDraft, setWfhDraft] = useState<DraftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchDrafts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = getDraftsToken();
      const [accRes, extRes, wfhRes] = await Promise.all([
        fetch(`${ACCOMPLISHMENT_DRAFTS_URL}/my-draft`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${EXTENSION_DRAFTS_URL}/my-draft`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${WFH_DRAFTS_URL}/my-draft`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      let hadError = false;
      if (accRes.ok) setAccDraft(await accRes.json());
      else hadError = true;

      if (extRes.ok) setExtDraft(await extRes.json());
      else hadError = true;

      if (wfhRes.ok) setWfhDraft(await wfhRes.json());
      else hadError = true;

      if (hadError) setLoadError('Failed to load one or more drafts.');
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const cards = [
    accDraft ? { type: 'accomplishment' as const, label: 'Accomplishment Report', draft: accDraft, subtitle: `${accDraft.quarter || ''} Quarter, ${accDraft.year || ''}` } : null,
    extDraft ? { type: 'extension' as const, label: 'Extension Report', draft: extDraft, subtitle: `${extDraft.quarter || ''} Quarter, ${extDraft.year || ''}` } : null,
    wfhDraft ? { type: 'wfh' as const, label: 'WFH Accomplishment Report', draft: wfhDraft, subtitle: wfhDraft.reporting_period || 'Work-From-Home' } : null,
  ].filter(Boolean) as { type: 'accomplishment' | 'extension' | 'wfh'; label: string; draft: DraftSummary; subtitle: string }[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">My Drafts</h2>
      <p className="text-xs text-gray-400 mb-4">Reports you've started but haven't submitted yet.</p>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading drafts...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <p className="text-sm text-gray-400">No drafts yet — start a report and click "Save Draft" to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(({ type, label, draft, subtitle }) => (
            <div
              key={type}
              className="p-4 rounded-xl border border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {subtitle} · {draft.progress ?? 0}% complete
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Last saved {formatDate(draft.updated_at)}</div>
              </div>
              <button
                onClick={() => onEdit(type)}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors flex-shrink-0"
              >
                Continue Editing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== 5.4 REPORTS ======================
function ReportsView({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'drafts' | 'track' | 'accomplishment' | 'extension' | 'wfh'>('drafts');

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports</h1>

      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab('drafts')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'drafts' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Drafts
        </button>

        <button
          type="button"
          onClick={() => setTab('track')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'track' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Track Status
        </button>

        <button
          type="button"
          onClick={() => setTab('accomplishment')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Accomplishment Report
        </button>

        <button
          type="button"
          onClick={() => setTab('extension')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Extension Report
        </button>

        <button
          type="button"
          onClick={() => setTab('wfh')}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'wfh' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          WFH Report
        </button>
      </div>

      {tab === 'drafts' && <MyDraftsPanel onEdit={(type) => setTab(type as any)} />}
      {tab === 'track' && <ReportTrackerPanel />}
      {tab === 'accomplishment' && <AccomplishmentReport userId={userId} userName={userName} />}
      {tab === 'extension' && <ExtensionReport userId={userId} userName={userName} />}
      {tab === 'wfh' && <WfhReport userId={userId} userName={userName} />}
    </div>
  );
}

// ====================== 5.5 CALENDAR ======================
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  end_date?: string | null;
  location: string | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | string | null;
  audience?: string | null;
  organizer_id: string | null;
  department: string | null;
  department_ids: string[] | null;
  status: string | null;
  posted_by_role: string | null;
  created_at: string;
  updated_at: string;
}

const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

const TYPE_TO_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};
const DEFAULT_EVENT_COLOR = '#1E3A8A';

const ROLE_DISPLAY_LABEL: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  college_dean: 'Dean',
  department_chair: 'Dept. Chair',
  faculty: 'Faculty',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function colorForEvent(ev: CalendarEvent): string {
  if (!ev.event_type) return DEFAULT_EVENT_COLOR;
  if (ev.event_type.includes('::')) {
    const parts = ev.event_type.split('::');
    if (parts[1] && parts[1].startsWith('#')) {
      return parts[1];
    }
  }
  const normalized = ev.event_type.trim().toLowerCase();
  return TYPE_TO_COLOR[normalized] || DEFAULT_EVENT_COLOR;
}

function displayEventType(ev: CalendarEvent): string {
  if (!ev.event_type) return 'Activity';
  if (ev.event_type.includes('::')) {
    return ev.event_type.split('::')[0];
  }
  return ev.event_type;
}

function dateOnly(isoLike: string): string {
  if (!isoLike) return '';
  return isoLike.split('T')[0];
}

function formatSingleTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hoursNum = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hoursNum)) return timeStr;
  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const hours12 = hoursNum % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

function formatEventTimeRange(start?: string | null, end?: string | null): string {
  const s = formatSingleTime(start);
  const e = formatSingleTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return 'Time not specified';
}

function sortEventsChronologically(a: CalendarEvent, b: CalendarEvent): number {
  const dateComp = a.event_date.localeCompare(b.event_date);
  if (dateComp !== 0) return dateComp;
  const timeA = a.start_time;
  const timeB = b.start_time;
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;
  if (!timeA && !timeB) return a.title.localeCompare(b.title);
  return (timeA ?? '').localeCompare(timeB ?? '');
}

function formatTimeFromDate(isoLike: string): string | null {
  if (!isoLike || !isoLike.includes('T')) return null;
  const timePart = isoLike.split('T')[1];
  if (!timePart || timePart.startsWith('00:00:00')) return null;
  const d = new Date(isoLike);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isFacultyAuthorizedEvent(ev: CalendarEvent): boolean {
  if (!ev.audience) return true;
  const aud = ev.audience.trim().toLowerCase();
  return ['all', 'everyone', 'faculty'].includes(aud);
}

function FacultyCalendar() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Primary View Mode: Active Calendar vs Event History / Archive
  const [viewMode, setViewMode] = useState<'calendar' | 'archive'>('calendar');

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Archive Search & Filter State
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYear, setArchiveYear] = useState<string>('all');
  const [archiveMonth, setArchiveMonth] = useState<string>('all');
  const [archiveType, setArchiveType] = useState<string>('all');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const jumpToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(CALENDAR_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load events: ' + (err.error || res.statusText));
        setEvents([]);
        return;
      }
      const data = await res.json();
      const facultyOnly = (Array.isArray(data) ? data : []).filter(isFacultyAuthorizedEvent);
      setEvents(facultyOnly);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...events].sort(sortEventsChronologically);
    sorted.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (!d) return;
      const current = map.get(d) || [];
      current.push(ev);
      map.set(d, current);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate.get(dateStr) || [];
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => dateOnly(e.event_date) >= todayStr)
      .sort(sortEventsChronologically);
  }, [events, todayStr]);

  const pastEvents = useMemo(() => {
    return events
      .filter((e) => dateOnly(e.event_date) < todayStr)
      .sort((a, b) => sortEventsChronologically(b, a));
  }, [events, todayStr]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    pastEvents.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (d) years.add(d.split('-')[0]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [pastEvents]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pastEvents.forEach((ev) => {
      if (ev.event_type) types.add(ev.event_type.toLowerCase());
    });
    return Array.from(types).sort();
  }, [pastEvents]);

  const filteredArchiveEvents = useMemo(() => {
    const query = archiveSearch.toLowerCase().trim();
    return pastEvents.filter((ev) => {
      const date = dateOnly(ev.event_date);
      const [year, month] = date.split('-');

      if (archiveYear !== 'all' && year !== archiveYear) return false;
      if (archiveMonth !== 'all' && parseInt(month, 10) !== parseInt(archiveMonth, 10)) return false;
      if (archiveType !== 'all' && (ev.event_type || '').toLowerCase() !== archiveType) return false;

      if (!query) return true;

      const titleMatch = ev.title?.toLowerCase().includes(query);
      const descMatch = ev.description?.toLowerCase().includes(query);
      const locMatch = ev.location?.toLowerCase().includes(query);
      const typeMatch = ev.event_type?.toLowerCase().includes(query);
      return titleMatch || descMatch || locMatch || typeMatch;
    });
  }, [pastEvents, archiveSearch, archiveYear, archiveMonth, archiveType]);

  const groupedArchiveEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    filteredArchiveEvents.forEach((ev) => {
      const d = dateOnly(ev.event_date);
      if (!d) return;
      const dateObj = new Date(d + 'T00:00:00');
      const key = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [filteredArchiveEvents]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar & View Switcher ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Faculty Calendar & Activities
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View academic schedules, departmental meetings, and faculty-wide deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'archive'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Event History</span>
              {pastEvents.length > 0 && (
  <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full">
    {pastEvents.length}
  </span>
)}
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Mode 1: Calendar & Upcoming Agenda Side-by-Side Grid ── */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
            <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/40 gap-3">
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select month"
                  value={currentMonth.getMonth()}
                  onChange={(e) =>
                    setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value, 10), 1))
                  }
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Select year"
                  value={currentMonth.getFullYear()}
                  onChange={(e) =>
                    setCurrentMonth(new Date(parseInt(e.target.value, 10), currentMonth.getMonth(), 1))
                  }
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {Array.from({ length: 9 }, (_, i) => today.getFullYear() - 4 + i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <button
                  onClick={jumpToToday}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  aria-label="Previous month"
                  className="p-2 rounded-xl hover:bg-white hover:shadow-2xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="p-2 rounded-xl hover:bg-white hover:shadow-2xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/20">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{DAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A]" />
                <span className="text-sm font-medium">Loading events…</span>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-50 bg-gray-50/30"
                  />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayIndexInWeek = (firstDay + day - 1) % 7;
                  const isRightmostCol = dayIndexInWeek >= 5;
                  const dateStr = `${currentMonth.getFullYear()}-${String(
                    currentMonth.getMonth() + 1
                  ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isTodayDate = dateStr === todayStr;
                  const isPast = dateStr < todayStr;
                  const isSelected = selectedCalendarDate === dateStr;
                  const isHovered = hoveredDate === dateStr;
                  const showPopover = (isHovered || isSelected) && hasEvents;

                  return (
                    <div
                      key={day}
                      tabIndex={hasEvents ? 0 : -1}
                      aria-label={`${formatDate(dateStr)}${hasEvents ? `, ${dayEvents.length} events` : ''}`}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => {
                        setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
                      }}
                      className={`relative min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-100 p-1.5 sm:p-2 cursor-pointer transition-colors outline-none focus:bg-blue-50/30 ${
                        isSelected
                          ? 'bg-blue-50/50 ring-2 ring-[#1E3A8A] ring-inset z-20'
                          : isPast
                          ? 'bg-gray-50/40 hover:bg-gray-100/50'
                          : 'bg-white hover:bg-blue-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-transform ${
                            isTodayDate
                              ? 'bg-[#1E3A8A] text-white shadow-2xs'
                              : isPast
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>

                        {hasEvents && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-[#1E3A8A]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className="text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs hover:brightness-110 transition-all"
                            style={{ backgroundColor: colorForEvent(ev) }}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] font-semibold text-gray-400 px-1">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>

                      {hasEvents && (
                        <div className="sm:hidden flex gap-1 flex-wrap px-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colorForEvent(ev) }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                      )}

                      {showPopover && (
                        <div
                          role="tooltip"
                          className={`absolute bottom-full mb-2 z-50 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 text-left transition-all animate-in fade-in zoom-in-95 ${
                            isRightmostCol ? 'right-0' : 'left-0'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-900">
                              {formatLongDate(dateStr)}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                            {dayEvents.map((ev) => {
                              const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                              const evColor = colorForEvent(ev);
                              const evTypeName = displayEventType(ev);

                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50/40 border-l-[3px] space-y-1 cursor-pointer transition-colors"
                                  style={{ borderLeftColor: evColor }}
                                >
                                  <div className="text-xs font-semibold text-gray-900 leading-snug">
                                    {ev.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                    <span className="flex items-center gap-1 font-medium text-gray-700">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      {timeRangeStr}
                                    </span>
                                    <span
                                      className="flex items-center gap-1 uppercase text-[9px] font-bold px-1.5 py-0.2 rounded text-white"
                                      style={{ backgroundColor: evColor }}
                                    >
                                      {evTypeName}
                                    </span>
                                  </div>
                                  {ev.location && (
                                    <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">{ev.location}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Agenda Sidebar Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1E3A8A]" />
                <h2 className="text-sm font-bold text-gray-900">Upcoming Agenda</h2>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-full">
                {upcomingEvents.length}
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No upcoming faculty events</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {upcomingEvents.map((ev) => {
                  const evDate = dateOnly(ev.event_date);
                  const isDueToday = evDate === todayStr;
                  const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                  const evColor = colorForEvent(ev);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50/60 transition-all cursor-pointer group space-y-1.5"
                      style={{ borderLeftWidth: 3, borderLeftColor: evColor }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">
                          {ev.title}
                        </span>
                        {isDueToday ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
                            Today
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                            {formatDate(evDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {timeRangeStr}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: evColor }}
                        />
                        <span className="truncate capitalize font-medium">{displayEventType(ev)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mode 2: Event History / Archive View ── */}
      {viewMode === 'archive' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Search past faculty activities by title, description, or type..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/40"
                />
                {archiveSearch && (
                  <button
                    onClick={() => setArchiveSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(archiveSearch || archiveYear !== 'all' || archiveMonth !== 'all' || archiveType !== 'all') && (
                <button
                  onClick={() => {
                    setArchiveSearch('');
                    setArchiveYear('all');
                    setArchiveMonth('all');
                    setArchiveType('all');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap self-end sm:self-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              <select
                aria-label="Filter by year"
                value={archiveYear}
                onChange={(e) => setArchiveYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by month"
                value={archiveMonth}
                onChange={(e) => setArchiveMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={String(idx + 1).padStart(2, '0')}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by type"
                value={archiveType}
                onChange={(e) => setArchiveType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="all">All Types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredArchiveEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No past activities match your criteria</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or reset the active filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedArchiveEvents).map((groupMonth) => (
                <div key={groupMonth} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {groupMonth}
                    </h3>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[11px] font-semibold text-gray-400">
                      {groupedArchiveEvents[groupMonth].length} events
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedArchiveEvents[groupMonth].map((ev) => {
                      const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                      const eventColor = colorForEvent(ev);
                      const eventTypeName = displayEventType(ev);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/40 hover:bg-white transition-all cursor-pointer group shadow-2xs space-y-3"
                          style={{ borderLeftWidth: 4, borderLeftColor: eventColor }}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                                {ev.title}
                              </h4>
                              {ev.event_type && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white flex-shrink-0"
                                  style={{ backgroundColor: eventColor }}
                                >
                                  {eventTypeName}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">
                                {formatDate(dateOnly(ev.event_date))}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {timeRangeStr}
                              </span>
                            </div>

                            {ev.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-gray-400">
                            <span>Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}</span>
                            <span className="text-[#1E3A8A] font-semibold flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> View
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Event Details Modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: colorForEvent(selectedEvent) }}
                />
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{formatLongDate(dateOnly(selectedEvent.event_date))}</p>
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
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Time</p>
                <p className="text-sm font-semibold text-gray-900">{formatEventTimeRange(selectedEvent.start_time, selectedEvent.end_time)}</p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.event_type && (
                <div className="pt-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{
                      backgroundColor: colorForEvent(selectedEvent) + '20',
                      color: colorForEvent(selectedEvent),
                    }}
                  >
                    {displayEventType(selectedEvent)}
                  </span>
                </div>
              )}
              {selectedEvent.posted_by_role && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Posted By</p>
                  <p className="text-sm text-gray-900">{ROLE_DISPLAY_LABEL[selectedEvent.posted_by_role] ?? selectedEvent.posted_by_role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== 5.6 SETTINGS ======================
type TabKey = 'profile' | 'security' | 'notifications' | 'account';

function FacultySettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);
  const [departmentNotices, setDepartmentNotices] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [contactEmailInput, setContactEmailInput] = useState('');
  const [contactNoInput, setContactNoInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');

  const [readOnly, setReadOnly] = useState({
    facultyId: '',
    position: '',
    departmentName: '',
    dateHired: '',
    status: '',
  });

  const fetchMe = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setLoadError('Failed to load your profile.');
        setLoading(false);
        return;
      }
      const data = await res.json();

      setFullNameInput(data.fullName ?? '');
      setEmailInput(data.email ?? '');
      setContactEmailInput(data.contactEmail ?? '');
      setContactNoInput(data.contactNo ?? '');
      setSpecializationInput(data.specialization ?? '');
      setReadOnly({
        facultyId: data.facultyId ?? '—',
        position: data.position ?? '—',
        departmentName: data.departmentNames?.[0] ?? '—',
        dateHired: data.dateHired
          ? new Date(data.dateHired).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : '—',
        status: data.status ?? '—',
      });
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleSaveChanges = async () => {
    const trimmedName = fullNameInput.trim();
    if (!trimmedName) {
      setSaveMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: trimmedName,
          contact_email: contactEmailInput.trim(),
          contact_no: contactNoInput.trim(),
          specialization: specializationInput.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveMessage({ type: 'error', text: err.error || 'Failed to save changes.' });
        return;
      }

      setSaveMessage({ type: 'success', text: 'Your changes have been saved.' });
      await fetchMe();
    } catch {
      setSaveMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchMe();
    setSaveMessage(null);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile Information', icon: <User className="w-4 h-4" /> },
    { key: 'security', label: 'Password & Security', icon: <Lock className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { key: 'account', label: 'Account Actions', icon: <LogOut className="w-4 h-4" /> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and system preferences.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={saving || loading}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}
      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 text-sm rounded-xl border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <nav className="bg-white rounded-xl shadow-md p-3 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 last:mb-0 transition-colors text-left ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-500 mb-6">Update your personal details.</p>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID</label>
                      <input
                        type="text"
                        value={readOnly.facultyId}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Login Email</label>
                      <input
                        type="email"
                        value={emailInput}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={contactEmailInput}
                        onChange={(e) => setContactEmailInput(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="text"
                        value={contactNoInput}
                        onChange={(e) => setContactNoInput(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <input
                        type="text"
                        value={specializationInput}
                        onChange={(e) => setSpecializationInput(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={readOnly.position}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={readOnly.departmentName}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Hired</label>
                      <input
                        type="text"
                        value={readOnly.dateHired}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Password & Security</h2>
              <p className="text-sm text-gray-500 mb-6">Keep your account secure.</p>
              <div className="space-y-3 max-w-md">
                <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Change Password
                </button>
                <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500 mb-6">Choose what you want to be notified about.</p>
              <div className="space-y-4">
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
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Actions</h2>
              <p className="text-sm text-gray-500 mb-6">Manage your active sessions.</p>
              <div className="space-y-3 max-w-md">
                <button className="w-full px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
                  Log Out from All Devices
                </button>
                <p className="text-xs text-gray-500 text-center">This will sign you out from all active sessions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}