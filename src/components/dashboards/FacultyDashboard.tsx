import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Award,
  FileText,
  Calendar,
  ArrowLeft,
  Building,
  Users,
  Download,
  Upload,
  Clock,
  CheckCircle,
  Settings,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  GraduationCap,
  Loader2,
  Eye,
  FolderOpen,
  User,
  CalendarDays,
  MapPin,
  Filter,
  Search,
  AlertCircle,
  X,
  Menu,
  EyeOff,
  Bell,
  Edit3,
  Trash2,
  Plus,
  Save,
  Folder,
  Shield,
} from 'lucide-react';

import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { DeansListGenerator } from './DeansListGenerator';
import { ReportTrackerPanel } from '../ReportTrackerPanel';
import { ResearchExtension } from '../ResearchExtension'; 
import { AcademicDocumentsViewer } from '../AcademicDocumentsViewer';
import { FacultyAchievements } from '../FacultyAchievements';
import { FacultyClubSection } from './FacultyClubSection';
import { ReportsSection } from '../ReportsSection'; 
import AccreditationWorkspace from '../AccreditationWorkspace'; 

const facultyMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',             id: 'dashboard' },
  { icon: BookOpen,        label: 'Teaching Load',         id: 'teaching-load' },
  { icon: FileText,        label: 'Research & Extension', id: 'research' },
  { icon: Award,           label: 'Achievements',         id: 'achievements' },
  { icon: GraduationCap,   label: "Dean's List",          id: 'deans-list' },
  { icon: FolderOpen,      label: 'Academic Resources',   id: 'academic-resources' },
  { icon: Folder,      label: 'Accreditation',   id: 'accreditation' },
  { icon: FileText,        label: 'Reports',              id: 'reports' },
  { icon: Calendar,        label: 'Calendar',             id: 'calendar' },
  { icon: Settings,        label: 'Settings',             id: 'settings' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface FacultyDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  onRoleChange?: () => void;
  userName?: string;
}

const ME_API_URL = 'http://localhost:5000/api/me';
const CLUB_ADVISER_ME_URL = 'http://localhost:5000/api/clubs/adviser/me';

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

  const [isAdviser, setIsAdviser] = useState(false);

useEffect(() => {
  const checkAdviser = async () => {
    try {
      const res = await fetch(CLUB_ADVISER_ME_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdviser(!!data.club);
      }
    } catch {
      // silent
    }
  };
  checkAdviser();
}, [token]);

const menuItems = useMemo(() => {
  if (!isAdviser) return facultyMenuItems;
  const settings = facultyMenuItems[facultyMenuItems.length - 1];
  return [
    ...facultyMenuItems.slice(0, -1),
    { icon: Shield, label: 'Club', id: 'club' },
    settings,
  ];
}, [isAdviser]);

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
      <Sidebar
        menuItems={menuItems}
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

        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full flex-1 flex flex-col">
          {activeMenuItem === 'dashboard'         && <FacultyDashboardView setActiveMenuItem={setActiveMenuItem} userId={userId} />}
          {activeMenuItem === 'teaching-load'     && <TeachingLoad />}
          {activeMenuItem === 'research'          && <ResearchExtension userId={userId} userName={userName} />}
          {activeMenuItem === 'achievements'      && <FacultyAchievements userName={userName} />}
          {activeMenuItem === 'deans-list'         && <DeansListGenerator userId={userId} userName={userName} />}
          {activeMenuItem === 'academic-resources' && <AcademicResources />}
          {activeMenuItem === 'accreditation' && <AccreditationWorkspace userRole="faculty" />} 
          {activeMenuItem === 'reports'             && <ReportsSection userId={userId} userName={userName} />}
          {activeMenuItem === 'calendar'          && <FacultyCalendar />}
          {activeMenuItem === 'club' && isAdviser && <FacultyClubSection />}
          {activeMenuItem === 'settings'          && <FacultySettings />}
         
        </main>
      </div>
    </div>
  );
}

// ====================== DASHBOARD VIEW ======================
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 shrink-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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

// ====================== ACADEMIC RESOURCES ======================
function AcademicResources() {
  return <AcademicDocumentsViewer />;
}

// ====================== TEACHING LOAD ======================
interface TeachingSubject {
  code: string;
  name: string;
  units: number;
  courseAndYear: string;
  schedule: string;
  room: string;
}

const TEACHING_LOAD_URL = 'http://localhost:5000/api/teaching-load';
const TEACHING_LOAD_SCAN_URL = 'http://localhost:5000/api/teaching-load/scan';
const EMPTY_SUBJECT: TeachingSubject = { code: '', name: '', units: 3, courseAndYear: '', schedule: '', room: '' };

export default function TeachingLoad() {
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('1st Semester');
  const [hoursPerWeek, setHoursPerWeek] = useState(0);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TeachingSubject>(EMPTY_SUBJECT);

  const [loadingDbLoad, setLoadingDbLoad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const ACCEPTED_FILE_TYPES = '.png,.jpg,.jpeg,.pdf';
  const MAX_FILE_MB = 15; // Adjusted to match the screenshot text

  const showBanner = (type: 'success' | 'error' | 'info', text: string, ms = 5000) => {
    setBanner({ type, text });
    if (ms > 0) setTimeout(() => setBanner(null), ms);
  };

  useEffect(() => {
    const fetchTeachingLoad = async () => {
      setLoadingDbLoad(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(TEACHING_LOAD_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.subjects)) setSubjects(data.subjects);
          if (data?.academic_year) setAcademicYear(data.academic_year);
          if (data?.semester) setSemester(data.semester);
          if (data?.hours_per_week) setHoursPerWeek(Number(data.hours_per_week));
        }
      } catch (err) {
        console.error('Failed to fetch teaching load from DB:', err);
      } finally {
        setLoadingDbLoad(false);
      }
    };
    fetchTeachingLoad();
  }, []);

  const totalUnits = useMemo(
    () => subjects.reduce((acc, sub) => acc + (Number(sub.units) || 0), 0),
    [subjects]
  );

  const openUploadModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreviewOpen(false);
    setScanError('');
    setScanning(false);
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (scanning) return;
    setUploadModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreviewOpen(false);
    setScanError('');
  };

  const handleFileSelect = (file: File) => {
    setScanError('');
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setScanError(`File is too large. Maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }
    const isPdf = file.type === 'application/pdf';
    if (!isPdf && !/^image\/(png|jpe?g)$/.test(file.type)) {
      setScanError('Unsupported file. Please upload a PNG, JPG, or PDF of your faculty load.');
      return;
    }
    setSelectedFile(file);
    if (isPdf) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setScanError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(TEACHING_LOAD_SCAN_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.detail
            ? `${data.error} [${data.stage || 'unknown'}] ${data.detail}`
            : data.error || 'Failed to scan the uploaded file.'
        );
      }

      const extracted: TeachingSubject[] = Array.isArray(data.subjects)
        ? data.subjects.map((s: any) => ({
            code: String(s.code ?? '').trim(),
            name: String(s.name ?? '').trim(),
            units: Number(s.units) || 0,
            courseAndYear: String(s.courseAndYear ?? '').trim(),
            schedule: String(s.schedule ?? '').trim(),
            room: String(s.room ?? '').trim(),
          }))
        : [];

      if (extracted.length === 0) {
        throw new Error('No subjects could be found in the uploaded file. Try a clearer or higher-resolution image.');
      }

      setSubjects(extracted);
      if (data.academic_year) setAcademicYear(String(data.academic_year));
      if (data.semester) setSemester(String(data.semester));
      if (data.hours_per_week) setHoursPerWeek(Number(data.hours_per_week));

      setEditingIndex(null);
      setHasUnsaved(true);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      showBanner(
        'info',
        `Extracted ${extracted.length} subject(s) from "${selectedFile.name}". Please review the details, then click Save Changes.`,
        8000
      );
    } catch (err) {
      console.error('Scan failed:', err);
      setScanError(err instanceof Error ? err.message : 'Could not reach the server.');
    } finally {
      setScanning(false);
    }
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [...prev, { ...EMPTY_SUBJECT }]);
    setEditingIndex(subjects.length);
    setEditForm({ ...EMPTY_SUBJECT });
    setHasUnsaved(true);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    setHasUnsaved(true);
  };

  const handleStartEdit = (index: number, sub: TeachingSubject) => {
    setEditingIndex(index);
    setEditForm({ ...sub });
  };

  const handleSaveEdit = (index: number) => {
    setSubjects((prev) => prev.map((item, i) => (i === index ? editForm : item)));
    setEditingIndex(null);
    setHasUnsaved(true);
  };

  const handleSaveToDatabase = async () => {
    if (editingIndex !== null) {
      showBanner('error', 'Please confirm (✓) the subject you are editing before saving.');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(TEACHING_LOAD_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjects,
          academic_year: academicYear,
          semester,
          hours_per_week: hoursPerWeek,
          total_units: totalUnits,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHasUnsaved(false);
        showBanner('success', 'Teaching load saved successfully.');
      } else {
        showBanner('error', data.error || 'Failed to save teaching load.');
      }
    } catch (err) {
      console.error('Error saving teaching load:', err);
      showBanner('error', 'Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  const renderUploadModal = () =>
    uploadModalOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileSelect(f);
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">EVIDENCES & SUPPORTING DOCUMENTS</h2>
                <button
                  onClick={closeUploadModal}
                  disabled={scanning}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                {/* Always visible Dropzone */}
                <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-700">Click to attach files or drag and drop</p>
                  <p className="text-sm text-gray-400 mt-1">
                    PDF, DOCX, JPG, PNG, XLSX up to {MAX_FILE_MB}MB each
                  </p>
                  <input
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                      e.target.value = '';
                    }}
                  />
                </label>       

                {/* Uploaded File Item */}
                {selectedFile && (
                  <div className="border border-blue-100 rounded-xl bg-blue-50/30 p-4">
                    <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-3">
                      <span>1 file uploaded</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mb-4 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full w-full"></div>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="truncate flex items-baseline gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                        {!scanning && (
                          <button
                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); setScanError(''); }}
                            className="text-gray-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {scanError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={closeUploadModal}
                  disabled={scanning}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!selectedFile || scanning}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    'Upload & Scan'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const renderPreviewLightbox = () =>
    previewOpen && previewUrl && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#1e1e1e]/95 p-4 sm:p-8"
            onClick={() => setPreviewOpen(false)}
          >
            {/* Top Bar for filename and Close button */}
            <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between bg-black/40 text-gray-300 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">{selectedFile?.name}</span>
                  <span className="text-xs text-gray-500">({selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB)</span>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

            <div
              className="w-full h-full max-w-7xl pt-12 pb-4 flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedFile?.type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  title="Faculty Load PDF Preview"
                  className="w-full h-full rounded shadow-2xl bg-white"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Faculty Load Full Preview"
                  className="max-w-full max-h-full object-contain rounded shadow-2xl"
                />
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  const bannerStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Teaching Load</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your faculty load form to automatically populate your assigned courses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={16} /> Upload Faculty Load Form
          </button>
          <button
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
            {hasUnsaved && !saving && <span className="w-2 h-2 rounded-full bg-amber-300" />}
          </button>
        </div>
      </div>

      {banner && (
        <div className={`mb-4 p-3 border rounded-xl text-sm flex items-center gap-2 animate-in fade-in ${bannerStyles[banner.type]}`}>
          {banner.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{banner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Academic Year</div>
          <input
            type="text"
            value={academicYear}
            placeholder="e.g. 2026-2027"
            onChange={(e) => { setAcademicYear(e.target.value); setHasUnsaved(true); }}
            className="font-semibold text-gray-900 bg-white border border-blue-200 rounded px-2 py-1 text-sm w-full"
          />
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Semester</div>
          <select
            value={semester}
            onChange={(e) => { setSemester(e.target.value); setHasUnsaved(true); }}
            className="font-semibold text-gray-900 bg-white border border-blue-200 rounded px-2 py-1 text-sm w-full"
          >
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Units</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 px-1 py-1">{totalUnits} Units</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Hours / Week</div>
          <input
            type="number"
            value={hoursPerWeek}
            onChange={(e) => { setHoursPerWeek(Number(e.target.value)); setHasUnsaved(true); }}
            className="font-bold bg-white border border-blue-200 rounded px-2 py-1 text-lg w-full text-blue-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assigned Courses (Summary of Subjects)</h2>
          <button
            onClick={handleAddSubject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} /> Add Subject
          </button>
        </div>

        {loadingDbLoad ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 p-4">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-gray-700">No teaching load uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Upload your faculty load form above to automatically scan and populate your subjects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700">Subject Code</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700">Descriptive Title</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700 text-center">Units</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700">Course & Year / Section</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700">Schedule</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700">Room</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub, i) => {
                  const isEditing = editingIndex === i;
                  const inputCls = 'w-full px-2 py-1 border border-gray-300 rounded text-xs';

                  return (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors align-top">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {isEditing ? (
                          <input type="text" value={editForm.code}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            className={inputCls} />
                        ) : sub.code}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {isEditing ? (
                          <input type="text" value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className={inputCls} />
                        ) : sub.name}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700">
                        {isEditing ? (
                          <input type="number" value={editForm.units}
                            onChange={(e) => setEditForm({ ...editForm, units: Number(e.target.value) })}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center" />
                        ) : sub.units}
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {isEditing ? (
                          <input type="text" value={editForm.courseAndYear}
                            onChange={(e) => setEditForm({ ...editForm, courseAndYear: e.target.value })}
                            className={inputCls} />
                        ) : sub.courseAndYear}
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-sm">
                        {isEditing ? (
                          <textarea rows={4} value={editForm.schedule}
                            onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                            className={inputCls} />
                        ) : (
                          <div className="space-y-0.5">
                            {(sub.schedule || '').split(';').filter((p) => p.trim()).map((part, idx) => (
                              <div key={idx}>{part.trim()}</div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {isEditing ? (
                          <input type="text" value={editForm.room}
                            onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                            className={inputCls} />
                        ) : sub.room}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveEdit(i)}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              title="Confirm"
                            >
                              <CheckCircle size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(i, sub)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveSubject(i)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderUploadModal()}
      {renderPreviewLightbox()}
    </>
  );
}

// ====================== MY DRAFTS ======================
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
}

// ====================== CALENDAR ======================
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

  const [viewMode, setViewMode] = useState<'calendar' | 'archive'>('calendar');

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
                        if (!isPast) {
                          setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
                        }
                      }}
                      className={`relative min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-100 p-1.5 sm:p-2 transition-colors outline-none ${
                        isPast
                          ? 'bg-gray-100/70 text-gray-400 cursor-not-allowed select-none'
                          : 'cursor-pointer hover:bg-blue-50/20'
                      } ${
                        isSelected && !isPast
                          ? 'bg-blue-50/50 ring-2 ring-[#1E3A8A] ring-inset z-20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-transform ${
                            isTodayDate
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
                              : isPast
                              ? 'text-gray-400 bg-gray-200/50'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>

                        {hasEvents && (
                          <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${isPast ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-[#1E3A8A]'}`}>
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
                            className={`text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs transition-all ${isPast ? 'opacity-70 bg-gray-400 cursor-pointer' : 'hover:brightness-110'}`}
                            style={{ backgroundColor: isPast ? '#9CA3AF' : colorForEvent(ev) }}
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
                              style={{ backgroundColor: isPast ? '#9CA3AF' : colorForEvent(ev) }}
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
                              {formatLongDate(dateStr)} {isPast && '(Past)'}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                            {dayEvents.map((ev) => {
                              const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                              const evColor = isPast ? '#9CA3AF' : colorForEvent(ev);
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

      {selectedEvent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
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
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== SETTINGS ======================
type TabKey = 'profile' | 'security' | 'notifications';

function FacultySettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Notification States
  const [masterSwitch, setMasterSwitch] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);
  const [departmentNotices, setDepartmentNotices] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [contactNoInput, setContactNoInput] = useState('');

  const [readOnly, setReadOnly] = useState({
    facultyId: '',
    position: '',
    departmentName: '',
    status: '',
  });

  // Password & Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState('');

  // =========================================================
  // LOAD FACULTY PROFILE + NOTIFICATION PREFERENCES
  // =========================================================
  const fetchMe = async () => {
    setLoading(true);
    setLoadError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoadError('Your session has expired. Please log in again.');
        return;
      }

      const res = await fetch(
        'http://localhost:5000/api/auth/me',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to load your profile.'
        );
      }

      const profile = data.profile ?? data;

      const facultyProfile =
        data.facultyProfile ??
        data.faculty_profile ??
        data.faculty ??
        {};

      const loadedFullName =
        profile?.full_name ??
        data.fullName ??
        '';

      const loadedUsername = String(
  data.user?.username ??
  data.username ??
  profile?.username ??
  ''
).trim();

      const loadedEmail =
        facultyProfile?.contact_email ??
        profile?.email ??
        data.email ??
        '';

      const loadedContactNo =
        facultyProfile?.contact_no ??
        data.contactNo ??
        '';

      const loadedFacultyId =
        data.facultyId ??
        profile?.id_number ??
        data.idNumber ??
        '—';

      const loadedPosition =
        data.position ??
        facultyProfile?.position ??
        'Faculty';

      const loadedDepartment =
        data.departmentNames?.[0] ??
        data.departmentName ??
        profile?.department ??
        '—';

      const loadedStatus =
        data.status ??
        profile?.status ??
        facultyProfile?.status ??
        '—';

      // Profile states
      setFullNameInput(loadedFullName);
      setUsernameInput(loadedUsername);
      setEmailInput(loadedEmail);
      setContactNoInput(loadedContactNo);

      setReadOnly({
        facultyId: loadedFacultyId,
        position: loadedPosition,
        departmentName: loadedDepartment,
        status: loadedStatus,
      });

      // =====================================================
      // NOTIFICATION PREFERENCES
      // =====================================================
      if (data.preferences) {
        const allowAll =
          data.preferences.allow_all ?? true;

        const announcements =
          data.preferences.announcements ?? true;

        const staffUpdates =
          data.preferences.staff_updates ?? true;

        const reports =
          data.preferences.reports ?? true;

        setMasterSwitch(allowAll);
        setAnnouncementAlerts(announcements);
        setDepartmentNotices(staffUpdates);
        setReportAlerts(reports);
      } else {
        // Default preferences
        setMasterSwitch(true);
        setAnnouncementAlerts(true);
        setDepartmentNotices(true);
        setReportAlerts(true);
      }

      // Keep localStorage updated
      localStorage.setItem(
        'userFullName',
        loadedFullName
      );

      localStorage.setItem(
        'userUsername',
        loadedUsername
      );

      localStorage.setItem(
        'userEmail',
        loadedEmail
      );
    } catch (error) {
      console.error(
        'Failed to load faculty profile:',
        error
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Could not reach the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // =========================================================
  // SAVE PROFILE
  // =========================================================
  const saveProfile = async () => {
    const trimmedName = fullNameInput.trim();
    const trimmedUsername = usernameInput.trim();
    const trimmedEmail = emailInput.trim();
    const trimmedContactNo = contactNoInput.trim();

    if (!trimmedName) {
      setSaveMessage({
        type: 'error',
        text: 'Full name cannot be empty.',
      });

      return false;
    }

    if (trimmedEmail) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        setSaveMessage({
          type: 'error',
          text: 'Please enter a valid email address.',
        });

        return false;
      }
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setSaveMessage({
          type: 'error',
          text: 'Your session has expired. Please log in again.',
        });

        return false;
      }

      const res = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: trimmedName,
            username: trimmedUsername,
            email: trimmedEmail || null,
            contact_email: trimmedEmail || null,
            contact_no: trimmedContactNo || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to save your profile.'
        );
      }

      const savedUsername =
  data.username ??
  data.profile?.username ??
  trimmedUsername;

const savedFullName =
  data.full_name ??
  data.profile?.full_name ??
  trimmedName;

const savedEmail =
  data.email ??
  data.profile?.email ??
  trimmedEmail;

const savedContactNo =
  data.contact_no ??
  data.facultyProfile?.contact_no ??
  trimmedContactNo;

setFullNameInput(savedFullName);
setUsernameInput(savedUsername);
setEmailInput(savedEmail);
setContactNoInput(savedContactNo);

localStorage.setItem(
  'userFullName',
  savedFullName
);

localStorage.setItem(
  'userUsername',
  savedUsername
);

localStorage.setItem(
  'userEmail',
  savedEmail
);

      setSaveMessage({
        type: 'success',
        text: 'Personal information updated successfully.',
      });

      await fetchMe();

      return true;
    } catch (error) {
      console.error(
        'Faculty profile update failed:',
        error
      );

      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to save your personal information.',
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================
  const changePassword = async () => {
    setPasswordMessage('');

    if (!currentPassword) {
      setPasswordMessage(
        'Please enter your current password.'
      );
      return false;
    }

    if (!newPassword) {
      setPasswordMessage(
        'Please enter a new password.'
      );
      return false;
    }

    if (!confirmPassword) {
      setPasswordMessage(
        'Please confirm your new password.'
      );
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        'New password and confirm password do not match.'
      );
      return false;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setPasswordMessage(
        'Your new password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'
      );

      return false;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage(
        'Your new password must be different from your current password.'
      );

      return false;
    }

    setSaving(true);
    setPasswordMessage('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setPasswordMessage(
          'Your session has expired. Please log in again.'
        );

        return false;
      }

      const res = await fetch(
        'http://localhost:5000/api/auth/password',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to change your password.'
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setSaveMessage({
        type: 'success',
        text: 'Password changed successfully.',
      });

      return true;
    } catch (error) {
      console.error(
        'Faculty password update failed:',
        error
      );

      setPasswordMessage(
        error instanceof Error
          ? error.message
          : 'Failed to change your password.'
      );

      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to change your password.',
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // NOTIFICATION TOGGLES
  // =========================================================

  // Master switch:
  // ON  = turn everything ON
  // OFF = turn everything OFF
  const handleMasterSwitchToggle = (
    checked: boolean
  ) => {
    setMasterSwitch(checked);

    setAnnouncementAlerts(checked);
    setDepartmentNotices(checked);
    setReportAlerts(checked);
  };

  // Individual toggles are completely independent.
  // They DO NOT change the master switch.
  const handleAnnouncementToggle = (
    checked: boolean
  ) => {
    setAnnouncementAlerts(checked);
  };

  const handleDepartmentToggle = (
    checked: boolean
  ) => {
    setDepartmentNotices(checked);
  };

  const handleReportToggle = (
    checked: boolean
  ) => {
    setReportAlerts(checked);
  };

  // =========================================================
  // SAVE NOTIFICATION PREFERENCES
  // =========================================================
  const saveNotifications = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setSaveMessage({
          type: 'error',
          text: 'Your session has expired. Please log in again.',
        });

        return false;
      }

      const res = await fetch(
        'http://localhost:5000/api/auth/preferences',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            // Master state
            allow_all: masterSwitch,

            // Individual category states
            announcements: announcementAlerts,
            staff_updates: departmentNotices,
            reports: reportAlerts,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to update preferences.'
        );
      }

      setSaveMessage({
        type: 'success',
        text: 'Notification preferences updated successfully.',
      });

      return true;
    } catch (error) {
      console.error(
        'Failed to update notifications:',
        error
      );

      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to update preferences.',
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SAVE CHANGES
  // =========================================================
  const handleSaveChanges = async () => {
    if (activeTab === 'profile') {
      await saveProfile();
      return;
    }

    if (activeTab === 'security') {
      await changePassword();
      return;
    }

    if (activeTab === 'notifications') {
      await saveNotifications();
      return;
    }

    setSaveMessage({
      type: 'success',
      text: 'Settings saved successfully.',
    });
  };

  // =========================================================
  // TABS
  // =========================================================
  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'profile',
      label: 'Profile Information',
      icon: <User className="w-4 h-4" />,
    },
    {
      key: 'security',
      label: 'Password & Security',
      icon: <Lock className="w-4 h-4" />,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  return (
    <div>
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your account and system preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveChanges}
            disabled={saving || loading}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* =====================================================
          LOAD ERROR
      ===================================================== */}
      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      {/* =====================================================
          SAVE MESSAGE
      ===================================================== */}
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

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">

        {/* ===================================================
            SIDEBAR
        =================================================== */}
        <nav className="bg-white rounded-xl shadow-md p-3 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPasswordMessage('');
                setSaveMessage(null);
              }}
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

        {/* ===================================================
            CONTENT
        =================================================== */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">

          {/* =================================================
              PROFILE TAB
          ================================================= */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Update your personal details.
              </p>

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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) =>
                          setFullNameInput(e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>

                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) =>
                          setUsernameInput(e.target.value)
                        }
                        placeholder="Enter username"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faculty ID
                      </label>

                      <input
                        type="text"
                        value={readOnly.facultyId}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>

                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) =>
                          setEmailInput(e.target.value)
                        }
                        placeholder="Email address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                      </label>

                      <input
                        type="text"
                        value={contactNoInput}
                        onChange={(e) =>
                          setContactNoInput(e.target.value)
                        }
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>

                      <input
                        type="text"
                        value={readOnly.position}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>

                      <input
                        type="text"
                        value={readOnly.departmentName}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                    </div>

                  </div>
                </>
              )}
            </div>
          )}

          {/* =================================================
              SECURITY TAB
          ================================================= */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Password & Security
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Keep your account secure.
              </p>

              <div className="space-y-4 max-w-md">

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showCurrentPassword
                          ? 'text'
                          : 'password'
                      }
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(
                          e.target.value
                        );
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(
                          e.target.value
                        );
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Min 8 chars, Aa1@"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(
                          e.target.value
                        );
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div className="px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
                    {passwordMessage}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* =================================================
              NOTIFICATIONS TAB
          ================================================= */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Choose what you want to be notified about.
              </p>

              <div className="space-y-4">

                {/* ===========================================
                    MASTER SWITCH
                =========================================== */}
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">

                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Allow Notifications
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Turn off to turn all notification categories off.
                      You can still manually customize each category.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={masterSwitch}
                      onChange={(e) =>
                        handleMasterSwitchToggle(
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />

                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                    </div>
                  </label>

                </div>

                <hr className="border-gray-100 my-4" />

                {/* ===========================================
                    QUARTERLY REPORTS
                =========================================== */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Quarterly Reports
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Get reminders for upcoming or pending reports
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportAlerts}
                      onChange={(e) =>
                        handleReportToggle(
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />

                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                    </div>
                  </label>

                </div>

                {/* ===========================================
                    ANNOUNCEMENTS
                =========================================== */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Announcements
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Get notified about important announcements and calendar events
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementAlerts}
                      onChange={(e) =>
                        handleAnnouncementToggle(
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />

                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                    </div>
                  </label>

                </div>

                {/* ===========================================
                    DEPARTMENT NOTICES
                =========================================== */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Department Notices
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Receive updates from your department
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={departmentNotices}
                      onChange={(e) =>
                        handleDepartmentToggle(
                          e.target.checked
                        )
                      }
                      className="sr-only peer"
                    />

                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                    </div>
                  </label>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}