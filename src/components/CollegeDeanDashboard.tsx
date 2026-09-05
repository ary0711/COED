import React, { useState, useEffect, useCallback } from 'react';
import { notifyRole } from '../notificationService';
import { HomePage } from './coed/HomePage';
import { AboutPage } from './coed/AboutPage';
import { ClubsPage } from './coed/ClubsPage';
import { ResearchPage } from './coed/ResearchPage';
import { DepartmentsPage } from './coed/DepartmentsPage';
import { AchievementsPage } from './coed/AchievementsPage';
import { AccreditationPage } from './coed/AccreditationPage';
import { ContactPage } from './coed/ContactPage';
import { Footer } from './coed/Footer';
import HomePageEditor from './pages/HomePageEditor';
import AboutPageEditor from './pages/AboutPageEditor';
import DepartmentsPageEditor from './pages/DepartmentsPageEditor';
import ClubsPageEditor from './pages/ClubsPageEditor';
import ResearchPageEditor from './pages/ResearchPageEditor';
import AchievementsPageEditor from './pages/AchievementsPageEditor';
import AccreditationPageEditor from './pages/AccreditationPageEditor';
import ContactPageEditor from './pages/ContactPageEditor';
import FooterPageEditor from './pages/FooterPageEditor';
import {
  getHomepageContent, getHomepageStats, getHomepageFeatures, getHomepageAnnouncements, saveHomepageContent, saveHomepageStats
} from '../landing-page/services/homepageService';
import {
  getAboutContent, getAboutStats, getCoreValues, getCoreValueCards, getFacultyMembers, saveAboutContent, saveAboutStats, saveCoreValues, saveCoreValueCards, saveFacultyMembers
} from '../landing-page/services/aboutService';
import {
  getDepartmentContent, getColleges, saveDepartmentContent, saveColleges
} from '../landing-page/services/departmentService';
import {
  getClubsContent, getClubStatistics, getOrganizations, getCommittees, saveClubsContent, saveClubStatistics, saveOrganizations, saveCommittees
} from '../landing-page/services/clubsService';
import type {
  CoreValue, FacultyMember, AboutStat, CoreValueCard, ClubStatistic, Organization, Committee
} from '../landing-page/services/landingPageTypes';
import {
  loadResearchContent, loadResearchPublications, loadAwards, loadFeaturedAlumni, saveResearchPage
} from '../landing-page/services/researchService';
import { achievementsService } from '../landing-page/services/achievementsService';
import { accreditationService } from '../landing-page/services/accreditationService';
import { contactService } from '../landing-page/services/contactService';
import { footerService } from '../landing-page/services/footerService';
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
  CheckCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  UserCircle,
  ShieldCheck,
  BookOpen,
  History,
  Menu,
  MessageCircle,
  Send,
  Inbox,
  CircleDot,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Lock,
  Bell,
  LogOut,
  Info,
  KeyRound,
} from 'lucide-react';

import { supabase } from '../supabaseClient';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { ChartsSection } from './ChartsSection';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  id_number: string;
  department: string | null;
  status: string;
  created_at: string;
}

const STUDENT_INQUIRY_CATEGORIES = [
  'Academic',
  'Enrollment',
  'Documents',
  'Faculty',
  'System',
  'Account',
  'Suggestion',
  'Other',
];

const ALUMNI_INQUIRY_CATEGORIES = [
  'Documents',
  'Employment',
  'Alumni Records',
  'Events',
  'System',
  'Account',
  'Suggestion',
  'Other',
];

interface Inquiry {
  id: string;
  student_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'alumni';
  subject: string;
  category: string | null;
  message: string;
  reply: string | null;
  status: 'pending' | 'answered';
  created_at: string;
  replied_at: string | null;
  profiles: {
    full_name: string;
    id_number: string;
  } | null;
}

// ─── Role & Status Config ─────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  dean:             { label: 'Dean',        color: '#1E3A8A', bg: '#DBEAFE', icon: <ShieldCheck   className="w-3 h-3" /> },
  department_chair: { label: 'Dept. Chair', color: '#7C3AED', bg: '#EDE9FE', icon: <UserCheck     className="w-3 h-3" /> },
  faculty:          { label: 'Faculty',     color: '#065F46', bg: '#D1FAE5', icon: <BookOpen      className="w-3 h-3" /> },
  staff:            { label: 'Staff',       color: '#92400E', bg: '#FEF3C7', icon: <UserCircle    className="w-3 h-3" /> },
  student:          { label: 'Student',     color: '#1D4ED8', bg: '#DBEAFE', icon: <GraduationCap className="w-3 h-3" /> },
  alumni:           { label: 'Alumni',      color: '#BE185D', bg: '#FCE7F3', icon: <Users         className="w-3 h-3" /> },
  admin:            { label: 'Admin',       color: '#DC2626', bg: '#FEE2E2', icon: <ShieldCheck   className="w-3 h-3" /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; pulse?: boolean }> = {
  active:   { label: 'Active',   color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  inactive: { label: 'Inactive', color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  pending:  { label: 'Pending',  color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B', pulse: true },
};

const PAGE_SIZE = 10;
const DEFAULT_PROGRAMS = ['BEED', 'BSED-MATH', 'BSED-ENGLISH', 'BTLED'];

const deanMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',               id: 'dashboard' },
  { icon: Users,           label: 'User Management',         id: 'users' },
  { icon: FileText,        label: 'Academic Records',        id: 'records' },
  { icon: GraduationCap,   label: 'Faculty & Staff',         id: 'faculty' },
  { icon: Calendar,        label: 'Calendar & Activities',   id: 'calendar' },
  { icon: Award,           label: 'Research & Achievements', id: 'research' },
  { icon: UserCheck,       label: 'Alumni Tracer',           id: 'alumni' },
  { icon: MessageCircle,   label: 'Inquiries',               id: 'inquiries' },
  { icon: Edit,            label: 'Landing Page Management', id: 'landing' },
  { icon: Megaphone,       label: 'Announcements',           id: 'announcements' },
  { icon: BarChart3,       label: 'Quarterly Reports',       id: 'reports' },
  { icon: Settings,        label: 'System Settings',         id: 'settings' },
];

interface CollegeDeanDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
}

export function CollegeDeanDashboard({
  activeMenuItem,
  setActiveMenuItem,
  onLogout,
}: CollegeDeanDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuItemClick = (id: string) => {
    setActiveMenuItem(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        menuItems={deanMenuItems}
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
        userRole="College Dean"
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="hidden lg:block w-64 shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-0 z-20 flex items-stretch bg-white border-b border-gray-200 shadow-sm">
          <button
            className="lg:hidden flex items-center justify-center px-4 text-gray-600 hover:bg-gray-100 border-r border-gray-200 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <DashboardHeader
              userRole="College Dean"
              userName="Dr. Elizabeth Martinez"
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeMenuItem === 'dashboard'     && <DashboardView onGoToInquiries={() => setActiveMenuItem('inquiries')} />}
          {activeMenuItem === 'users'         && <UserManagement />}
          {activeMenuItem === 'records'       && <AcademicRecords />}
          {activeMenuItem === 'faculty'       && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar'      && <CalendarActivities />}
          {activeMenuItem === 'research'      && <ResearchAchievements />}
          {activeMenuItem === 'alumni'        && <AlumniTracer />}
          {activeMenuItem === 'inquiries'     && <InquiriesManagement />}
          {activeMenuItem === 'landing'       && <LandingPageManagement />}
          {activeMenuItem === 'announcements' && <AnnouncementsContent />}
          {activeMenuItem === 'reports'       && <ReportsAnalytics />}
          {activeMenuItem === 'settings'      && <SystemSettings />}
        </main>
      </div>
    </div>
  );
}

// ─── Inquiries Summary Card (Dashboard) ───────────────────────────────────────
function InquiriesSummaryCard({ onViewAll }: { onViewAll: () => void }) {
  const [studentPending, setStudentPending] = useState(0);
  const [alumniPending, setAlumniPending]   = useState(0);
  const [recent, setRecent]                 = useState<Inquiry[]>([]);
  const [loading, setLoading]               = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, profiles(full_name, id_number)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudentPending(data.filter((i: Inquiry) => i.sender_role === 'student' && i.status === 'pending').length);
      setAlumniPending(data.filter((i: Inquiry) => i.sender_role === 'alumni' && i.status === 'pending').length);
      setRecent(data.filter((i: Inquiry) => i.status === 'pending').slice(0, 4));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    const channelName = `dashboard-inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => fetchSummary())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSummary]);

  const totalPending = studentPending + alumniPending;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#1E3A8A]" />
          <span className="text-sm font-semibold text-gray-800">Inquiries</span>
        </div>
        {totalPending > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
            <CircleDot className="w-3 h-3" /> {totalPending} unreplied
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ backgroundColor: '#DBEAFE' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#1D4ED8', opacity: 0.8 }}>Student</p>
            <p className="text-2xl font-bold leading-none" style={{ color: '#1D4ED8' }}>{loading ? '—' : studentPending}</p>
            <p className="text-[11px] mt-1" style={{ color: '#1D4ED8', opacity: 0.65 }}>unreplied</p>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: '#FCE7F3' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#BE185D', opacity: 0.8 }}>Alumni</p>
            <p className="text-2xl font-bold leading-none" style={{ color: '#BE185D' }}>{loading ? '—' : alumniPending}</p>
            <p className="text-[11px] mt-1" style={{ color: '#BE185D', opacity: 0.65 }}>unreplied</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-xs">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-300">
              <Inbox className="w-8 h-8 mb-1 opacity-40" />
              <p className="text-xs text-gray-400">All inquiries answered</p>
            </div>
          ) : (
            recent.map(inquiry => (
              <div key={inquiry.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {inquiry.profiles?.full_name ?? inquiry.sender_name}
                    {inquiry.profiles?.id_number && (
                      <span className="font-normal text-gray-400"> · {inquiry.profiles.id_number}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{inquiry.subject}</p>
                </div>
                <span
                  className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                  style={inquiry.sender_role === 'alumni'
                    ? { backgroundColor: '#FCE7F3', color: '#BE185D' }
                    : { backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
                >
                  {inquiry.sender_role}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onViewAll}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-50 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          View all inquiries <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ onGoToInquiries }: { onGoToInquiries: () => void }) {
  const [facultyCount, setFacultyCount] = useState<number>(0);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [studentLoading, setStudentLoading] = useState(true);
  const [departmentCount, setDepartmentCount] = useState<number>(0);
  const [departmentLoading, setDepartmentLoading] = useState(true);

  useEffect(() => {
    const loadDepartmentCount = async () => {
      try {
        setDepartmentLoading(true);
        const response = await fetch('http://localhost:5000/api/departments/count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          setDepartmentCount(0);
          return;
        }
        setDepartmentCount(Number(result.count) || 0);
      } catch {
        setDepartmentCount(0);
      } finally {
        setDepartmentLoading(false);
      }
    };
    loadDepartmentCount();
  }, []);

  useEffect(() => {
    const loadFacultyCount = async () => {
      try {
        setFacultyLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/faculty-count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          setFacultyCount(0);
          return;
        }
        setFacultyCount(Number(result.count) || 0);
      } catch {
        setFacultyCount(0);
      } finally {
        setFacultyLoading(false);
      }
    };
    loadFacultyCount();
  }, []);

  useEffect(() => {
    const loadStudentCount = async () => {
      try {
        setStudentLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/student-count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          setStudentCount(0);
          return;
        }
        setStudentCount(Number(result.count) || 0);
      } catch {
        setStudentCount(0);
      } finally {
        setStudentLoading(false);
      }
    };
    loadStudentCount();
  }, []);

  const mobileMetrics = [
    { label: 'Total Faculty', value: facultyLoading ? '...' : facultyCount.toLocaleString(), sub: 'Faculty members', color: '#1E3A8A', bg: '#DBEAFE' },
    { label: 'Total Students', value: studentLoading ? '...' : studentCount.toLocaleString(), sub: 'Active student accounts', color: '#065F46', bg: '#D1FAE5' },
    { label: 'Active Departments', value: departmentLoading ? '...' : departmentCount.toLocaleString(), sub: 'All operational', color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Pending Reports', value: '23', sub: '8 newly added', color: '#B45309', bg: '#FEF3C7' },
    { label: 'Alumni Responses', value: '1,256', sub: '+18.7% response rate', color: '#BE185D', bg: '#FCE7F3' },
    { label: 'Evaluation Rating', value: '4.6', sub: 'Out of 5.0 avg.', color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Research Submitted', value: '14', sub: '2 pending approval', color: '#065F46', bg: '#D1FAE5' },
    { label: 'Completion Rate', value: '94%', sub: 'Student evaluations', color: '#9D174D', bg: '#FCE7F3' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-gray-500 text-sm">Welcome back! Here's your college overview</p>
      </div>

      <div className="mb-4">
        {/* MOBILE */}
        <div className="flex gap-3 overflow-x-auto pb-4 sm:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {[
            { title: 'Total Faculty', value: facultyLoading ? '...' : facultyCount.toLocaleString(), icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE' },
            { title: 'Total Students', value: studentLoading ? '...' : studentCount.toLocaleString(), icon: Users, iconColor: '#10B981', iconBgColor: '#D1FAE5' },
            { title: 'Active Departments', value: departmentLoading ? '...' : departmentCount.toLocaleString(), icon: Building2, iconColor: '#8B5CF6', iconBgColor: '#EDE9FE' },
            { title: 'Pending Reports', value: '23', icon: FileText, iconColor: '#F59E0B', iconBgColor: '#FEF3C7', trend: '8', trendUp: false },
            { title: 'Alumni Responses', value: '1,256', icon: UserCheck, iconColor: '#EF4444', iconBgColor: '#FEE2E2', trend: '18.7%', trendUp: true },
          ].map((card) => (
            <div key={card.title} className="flex-shrink-0 w-48 h-40">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        {/* DESKTOP */}
        <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="min-h-[160px]">
            <SummaryCard title="Total Faculty" value={facultyLoading ? '...' : facultyCount.toLocaleString()} icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" />
          </div>
          <div className="min-h-[160px]">
            <SummaryCard title="Total Students" value={studentLoading ? '...' : studentCount.toLocaleString()} icon={Users} iconColor="#10B981" iconBgColor="#D1FAE5" />
          </div>
          <div className="min-h-[160px]">
            <SummaryCard title="Active Departments" value={departmentLoading ? '...' : departmentCount.toLocaleString()} icon={Building2} iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
          </div>
          <div className="min-h-[160px]">
            <SummaryCard title="Pending Reports" value="23" icon={FileText} iconColor="#F59E0B" iconBgColor="#FEF3C7" trend="8" trendUp={false} />
          </div>
          <div className="min-h-[160px]">
            <SummaryCard title="Alumni Responses" value="1,256" icon={UserCheck} iconColor="#EF4444" iconBgColor="#FEE2E2" trend="18.7%" trendUp={true} />
          </div>
        </div>
      </div>

      <div className="lg:hidden mb-4">
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          Key Metrics · Use the web version for full charts &amp; analytics
        </p>
        <div className="grid grid-cols-2 gap-3">
          {mobileMetrics.map((m) => (
            <div key={m.label} className="rounded-2xl p-4" style={{ backgroundColor: m.bg }}>
              <p className="text-xs font-medium mb-1" style={{ color: m.color, opacity: 0.75 }}>{m.label}</p>
              <p className="text-2xl font-bold leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs" style={{ color: m.color, opacity: 0.6 }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-0 overflow-auto">
          <ChartsSection />
        </div>
        <div className="flex flex-col min-h-0 lg:max-h-[calc(100vh-280px)]">
          <InquiriesSummaryCard onViewAll={onGoToInquiries} />
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4">
        <div className="h-80">
          <InquiriesSummaryCard onViewAll={onGoToInquiries} />
        </div>
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement() {
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers]               = useState<Profile[]>([]);
  const [filtered, setFiltered]         = useState<Profile[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [activating, setActivating]     = useState<string | null>(null);

  const [modal, setModal]         = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected]   = useState<Profile | null>(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [fetchError, setFetchError] = useState('');

  const [form, setForm] = useState({
    full_name: '', email: '', role: 'student',
    id_number: '', department: '', status: 'active', password: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.error || 'Failed to load users.');
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(data ?? []);
    } catch {
      setFetchError('Could not reach the server. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id_number.toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all')   result = result.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter);
    setTotal(result.length);
    setPage(1);
    setFiltered(result);
  }, [users, search, roleFilter, statusFilter]);

  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages   = Math.ceil(total / PAGE_SIZE);
  const pendingCount = users.filter(u => u.status === 'pending').length;

  const openAdd = () => {
    setForm({ full_name: '', email: '', role: 'student', id_number: '', department: '', status: 'active', password: '' });
    setFormError('');
    setModal('add');
  };
  const openEdit = (user: Profile) => {
    setSelected(user);
    setForm({
      full_name: user.full_name, email: user.email, role: user.role,
      id_number: user.id_number, department: user.department ?? '',
      status: user.status, password: '',
    });
    setFormError('');
    setModal('edit');
  };
  const openDelete = (user: Profile) => { setSelected(user); setModal('delete'); };

  const handleAdd = async () => {
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email address is required.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) { setFormError('Please enter a valid email address.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!form.password) { setFormError('Password is required.'); return; }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.email.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          full_name: form.full_name.trim(),
          id_number: form.id_number.trim(),
          department: form.department.trim() || null,
          status: form.status,
        }),
      });

      const responseText = await response.text();
      let result: any = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = { error: responseText || 'The server returned an invalid response.' };
      }

      if (!response.ok) {
        let errorMessage = result.error || result.message || result.details || result.hint;
        if (!errorMessage) {
          switch (response.status) {
            case 400: errorMessage = 'Invalid user information. Please check the form and try again.'; break;
            case 401: errorMessage = 'You are not authorized to create this account.'; break;
            case 403: errorMessage = 'You do not have permission to create users.'; break;
            case 409: errorMessage = 'A user with this email or ID number already exists.'; break;
            case 500: errorMessage = 'The server encountered an error while creating the account.'; break;
            default:  errorMessage = `Failed to create account. Server returned ${response.status}.`;
          }
        }
        setFormError(errorMessage);
        return;
      }

      setModal(null);
      setSelected(null);
      setForm({ full_name: '', email: '', role: 'student', id_number: '', department: '', status: 'active', password: '' });
      setShowPassword(false);
      setFormError('');
      await fetchUsers();
    } catch (error: any) {
      if (error?.name === 'TypeError' && error?.message?.toLowerCase().includes('fetch')) {
        setFormError('Unable to connect to the backend server on http://localhost:5000.');
      } else {
        setFormError(error?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!selected) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/auth/users/${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          role: form.role,
          id_number: form.id_number.trim(),
          department: form.department.trim() || null,
          status: form.status,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error || result.message || 'Failed to update user.');
        return;
      }

      setModal(null);
      setSelected(null);
      setForm({ full_name: '', email: '', role: 'student', id_number: '', department: '', status: 'active', password: '' });
      await fetchUsers();
    } catch (error: any) {
      setFormError(error.message || 'Unable to connect to the backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormError('');
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${selected.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const text = await response.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: text || 'Server returned an invalid response.' };
      }

      if (!response.ok) {
        setFormError(result.error || result.message || `Failed to delete user. Server returned ${response.status}.`);
        return;
      }

      setModal(null);
      setSelected(null);
      setFormError('');
      setForm({ full_name: '', email: '', role: 'student', id_number: '', department: '', status: 'active', password: '' });
      await fetchUsers();
    } catch (error: any) {
      setFormError(error?.message || 'Unable to connect to the backend server.');
    } finally {
      setSaving(false);
    }
  };

  const activatePending = async (user: Profile) => {
    setActivating(user.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!res.ok) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        const { data: existingUser } = await supabase.from('users').select('id').eq('username', profile.email).single();
        if (!existingUser) {
          await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: profile.email,
              password: 'ChangeMe@123',
              role: profile.role,
            }),
          });
        }
      }
    } finally {
      setActivating(null);
      fetchUsers();
    }
  };

  const toggleStatus = async (user: Profile) => {
    if (user.status === 'pending') return;
    const next = user.status === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/auth/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: next }),
    });
    fetchUsers();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} user{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={fetchUsers} className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{fetchError}</div>
      )}

      {pendingCount > 0 && (
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="relative flex h-3 w-3 flex-shrink-0 mt-0.5 sm:mt-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{pendingCount} account{pendingCount !== 1 ? 's' : ''} pending activation.</span>
            {' '}Filter by <span className="font-semibold">Pending</span> status.
          </p>
          <button onClick={() => setStatusFilter('pending')} className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
            View
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="all">All Roles</option>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Dept.</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((user) => {
                  const role         = ROLE_CONFIG[user.role]    ?? { label: user.role,   color: '#374151', bg: '#F3F4F6', icon: null };
                  const status       = STATUS_CONFIG[user.status] ?? { label: user.status, color: '#374151', bg: '#F3F4F6', dot: '#6B7280' };
                  const isPending    = user.status === 'pending';
                  const isActivating = activating === user.id;
                  return (
                    <tr key={user.id} className={`transition-colors ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-blue-50/30'}`}>
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: role.bg, color: role.color }}>
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate max-w-[120px] sm:max-w-none">{user.full_name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <span className="text-xs sm:text-sm font-mono text-gray-700 bg-gray-100 px-1.5 sm:px-2 py-1 rounded-lg">{user.id_number}</span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: role.bg, color: role.color }}>
                          {role.icon}<span className="hidden sm:inline">{role.label}</span>
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{user.department ?? '—'}</span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 text-center">
                        <button onClick={() => toggleStatus(user)}
                          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: status.bg, color: status.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: status.dot }} />
                          <span className="hidden sm:inline">{status.label}</span>
                        </button>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <button onClick={() => activatePending(user)} disabled={isActivating}
                              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg">
                              {isActivating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                              <span className="hidden sm:inline">Activate</span>
                            </button>
                          )}
                          <button onClick={() => openEdit(user)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openDelete(user)} className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-500">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 sm:p-2 rounded-lg border border-gray-200">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 sm:p-2 rounded-lg border border-gray-200">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{formError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              {modal === 'add' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID Number *</label>
                  <input type="text" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm">
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {modal === 'add' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Min. 6 characters" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border rounded-xl text-sm">Cancel</button>
              <button onClick={modal === 'add' ? handleAdd : handleEdit} disabled={saving} className="flex-1 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete User</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete {selected.full_name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar & Activities ────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  department_ids: string[] | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | null;
  status: string | null;
  posted_by_role: string | null;
  created_at: string;
  updated_at: string;
}

interface DeptOption { id: string; name: string; }

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
  department_chair: 'Dept. Chair',
};

function colorForCalendarEvent(ev: CalendarEvent): string {
  return (ev.event_type && TYPE_TO_COLOR[ev.event_type]) || DEFAULT_EVENT_COLOR;
}

function dateOnlyStr(isoLike: string): string {
  return isoLike.split('T')[0];
}

function CalendarActivities() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyForm = { title: '', date: '', description: '', event_type: 'meeting', target_department_id: '' };
  const [form, setForm] = useState(emptyForm);
  
const [formError, setFormError] = useState('');
const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const getToken = () => localStorage.getItem('token');
const DEPARTMENT_COLORS: Record<string, string> = {
  'All Departments': '#3B82F6', // Blue
  'Bachelor of Technology and Livelihood Education Program': '#EAB308', // Yellow
  'Bachelor of Education Major in Math & English Program': '#F97316', // Orange
  'Bachelor of Elementary Education Program': '#22C55E', // Green
};

const getDepartmentColor = (name: string) => {
  if (name === 'All Departments') return '#3B82F6';

  if (name.toLowerCase().includes('technology and livelihood')) {
    return '#EAB308';
  }

  if (
    name.toLowerCase().includes('math') &&
    name.toLowerCase().includes('english')
  ) {
    return '#F97316';
  }

  if (name.toLowerCase().includes('elementary education')) {
    return '#22C55E';
  }

  return '#8B5CF6';
};
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const fetchEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(CALENDAR_API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to load events: ' + (err.error || res.statusText));
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents((data ?? []) as CalendarEvent[]);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from('departments').select('id, name').order('name');
    if (!error && data) setDepartments(data);
  };

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, []);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => dateOnlyStr(e.event_date) === dateStr);
  };

  const upcomingEvents = events
    .filter(e => dateOnlyStr(e.event_date) >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const historyEvents = events
    .filter(e => dateOnlyStr(e.event_date) < todayStr)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
  };

  const handleAddEvent = async () => {
    setFormError('');
    if (!form.title.trim()) { setFormError('Event title is required.'); return; }
    if (!form.date)          { setFormError('Please select a date.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(CALENDAR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_date: `${form.date}T00:00:00`,
          event_type: form.event_type,
          status: 'upcoming',
          target_department_id: form.target_department_id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError('Failed to save event: ' + (err.error || res.statusText));
        return;
      }

      const data = await res.json();
      setEvents(prev => [...prev, data as CalendarEvent]);
      resetForm();
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${CALENDAR_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError('Failed to delete event: ' + (err.error || res.statusText));
        return;
      }
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const departmentLabel = (ev: CalendarEvent) => {
    if (!ev.department_ids || ev.department_ids.length === 0) return 'All Departments';
    const names = ev.department_ids.map(id => departments.find(d => d.id === id)?.name ?? 'Unknown');
    return names.join(', ');
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
          <p className="text-gray-500 text-sm mt-1">Manage events and track activity history</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading events…</span>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isPast  = dateStr < todayStr;
              return (
                <div key={day} className={`min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-100 p-1 sm:p-1.5 ${isPast ? 'bg-gray-50/60' : 'bg-white'}`}>
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                    isToday ? 'bg-[#1E3A8A] text-white' : isPast ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 1).map(ev => (
                      <div key={ev.id} className="text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded truncate text-white hidden sm:block" style={{ backgroundColor: colorForCalendarEvent(ev) }} title={ev.title}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 0 && (
                      <div className="sm:hidden flex gap-0.5 flex-wrap px-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <span key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorForCalendarEvent(ev) }} />
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
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'upcoming' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Upcoming Activities</span>
            <span className="sm:hidden">Upcoming</span>
            {upcomingEvents.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{upcomingEvents.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Activity History</span>
            <span className="sm:hidden">History</span>
            {historyEvents.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{historyEvents.length}</span>}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: colorForCalendarEvent(ev) }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(dateOnlyStr(ev.event_date))} · {departmentLabel(ev)} · Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}
                    </div>
                    {ev.description && <div className="text-xs text-gray-400 mt-1">{ev.description}</div>}
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} disabled={deletingId === ev.id} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No past events</p>
                </div>
              ) : historyEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: colorForCalendarEvent(ev) }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(dateOnlyStr(ev.event_date))} · {departmentLabel(ev)} · Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Unknown'}
                    </div>
                    {ev.description && <div className="text-xs text-gray-300 mt-1">{ev.description}</div>}
                  </div>
                  <span className="text-xs text-gray-400 italic flex-shrink-0 mt-1">Past</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4">
          <div
  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
  onClick={() => setShowModal(false)}
/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 z-[10000] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Event</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {formError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{formError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Faculty Meeting" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="relative">
  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
    Target Department
  </label>

  {/* Selected Department */}
  <button
    type="button"
    onClick={() =>
      setShowDepartmentDropdown(!showDepartmentDropdown)
    }
    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-left"
  >
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          backgroundColor: getDepartmentColor(
            form.target_department_id
              ? departments.find(
                  d => d.id === form.target_department_id
                )?.name || ''
              : 'All Departments'
          )
        }}
      />

      <span className="truncate">
        {form.target_department_id
          ? departments.find(
              d => d.id === form.target_department_id
            )?.name || 'All Departments'
          : 'All Departments'}
      </span>
    </div>

    <svg
      className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
        showDepartmentDropdown ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {/* Dropdown */}
  {showDepartmentDropdown && (
    <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      
      {/* All Departments */}
      <button
        type="button"
        onClick={() => {
          setForm({
            ...form,
            target_department_id: ''
          });
          setShowDepartmentDropdown(false);
        }}
        className={`w-full px-3 py-2.5 flex items-center gap-2 text-sm text-left hover:bg-gray-50 transition-colors ${
          form.target_department_id === ''
            ? 'bg-blue-50'
            : ''
        }`}
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#3B82F6' }}
        />

        <span className="truncate">
          All Departments
        </span>

        {form.target_department_id === '' && (
          <Check className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" />
        )}
      </button>

      {/* Departments */}
      {departments.map(d => {
        const isSelected =
          form.target_department_id === d.id;

        return (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setForm({
                ...form,
                target_department_id: d.id
              });
              setShowDepartmentDropdown(false);
            }}
            className={`w-full px-3 py-2.5 flex items-center gap-2 text-sm text-left hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50' : ''
            }`}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: getDepartmentColor(d.name)
              }}
            />

            <span className="truncate">
              {d.name}
            </span>

            {isSelected && (
              <Check className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  )}
</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Type</label>
                <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.keys(TYPE_TO_COLOR).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAddEvent} disabled={submitting} className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? 'Saving...' : (<><Check className="w-4 h-4" /> Add Event</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Academic Records ─────────────────────────────────────────────────────────
interface TargetRoleOption {
  id: string;
  label: string;
}

const DOC_AUDIENCE_ROLES: TargetRoleOption[] = [
  { id: 'student', label: 'Students' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'department_chair', label: 'Department Chairs' },
  { id: 'alumni', label: 'Alumni' },
];

const DOC_ROLE_LABELS: Record<string, string> = {
  student: 'Students',
  faculty: 'Faculty',
  department_chair: 'Chairs',
  alumni: 'Alumni',
};

interface AcademicDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: 'handbook' | 'policy' | 'form' | 'memorandum';
  target_roles?: string[];
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  handbook: 'Handbook',
  policy: 'Policy',
  form: 'Form',
  memorandum: 'Memorandum',
};

const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';

function getDocsToken() {
  return localStorage.getItem('token');
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AcademicRecords() {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AcademicDocument | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    document_type: 'handbook' as 'handbook' | 'policy' | 'form' | 'memorandum',
    target_roles: ['student', 'faculty', 'department_chair', 'alumni'],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<AcademicDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('document_type', typeFilter);
      params.set('status', statusFilter);

      const res = await fetch(`${DOCS_API_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getDocsToken()}` },
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
  }, [typeFilter, statusFilter]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      document_type: 'handbook',
      target_roles: ['student', 'faculty', 'department_chair', 'alumni'],
    });
    setFile(null);
    setFormError('');
    setEditingDoc(null);
  };

  const openUpload = () => {
    resetForm();
    setShowUploadModal(true);
  };

  const openEdit = (doc: AcademicDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      description: doc.description ?? '',
      document_type: doc.document_type,
      target_roles: doc.target_roles?.length
        ? doc.target_roles
        : ['student', 'faculty', 'department_chair', 'alumni'],
    });
    setFile(null);
    setFormError('');
    setShowUploadModal(true);
  };

  const handleToggleRole = (roleId: string) => {
    setForm((prev) => {
      const exists = prev.target_roles.includes(roleId);
      const updated = exists
        ? prev.target_roles.filter((r) => r !== roleId)
        : [...prev.target_roles, roleId];
      return { ...prev, target_roles: updated };
    });
  };

  const handleSelectAllRoles = () => {
    if (form.target_roles.length === DOC_AUDIENCE_ROLES.length) {
      setForm((prev) => ({ ...prev, target_roles: [] }));
    } else {
      setForm((prev) => ({ ...prev, target_roles: DOC_AUDIENCE_ROLES.map((r) => r.id) }));
    }
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (form.target_roles.length === 0) {
      setFormError('Please select at least one target audience role.');
      return;
    }
    if (!editingDoc && !file) {
      setFormError('Please choose a file to upload.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('document_type', form.document_type);
      fd.append('target_roles', JSON.stringify(form.target_roles));
      if (file) fd.append('file', file);

      const url = editingDoc ? `${DOCS_API_URL}/${editingDoc.id}` : DOCS_API_URL;
      const method = editingDoc ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getDocsToken()}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || 'Failed to save document.');
        return;
      }

      setShowUploadModal(false);
      resetForm();
      await fetchDocuments();
    } catch {
      setFormError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (doc: AcademicDocument) => {
    const nextStatus = doc.status === 'active' ? 'archived' : 'active';
    const fd = new FormData();
    fd.append('status', nextStatus);
    const res = await fetch(`${DOCS_API_URL}/${doc.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getDocsToken()}` },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setLoadError(err.error || 'Failed to update document status.');
      return;
    }
    fetchDocuments();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`${DOCS_API_URL}/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getDocsToken()}` },
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to delete document.');
        return;
      }
      setDeleteConfirm(null);
      await fetchDocuments();
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc: AcademicDocument) => {
    setDownloadingId(doc.id);
    try {
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getDocsToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to generate download link.');
        return;
      }
      const { url } = await res.json();
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Academic Records — Documents</h1>
        <button
          onClick={openUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Categories</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <FileText className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No documents found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const targetRoles = doc.target_roles || [];
              const isAllAudience = targetRoles.length === DOC_AUDIENCE_ROLES.length;

              return (
                <div key={doc.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {DOC_TYPE_LABELS[doc.document_type]}
                        </span>
                        {doc.status === 'archived' && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">Archived</span>
                        )}
                        <span>{formatDate(doc.created_at)}</span>
                        <span>· {formatFileSize(doc.file_size)}</span>
                      </div>

                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-gray-500 mr-1">Audience:</span>
                        {isAllAudience ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] rounded-md font-medium">
                            Everyone
                          </span>
                        ) : (
                          targetRoles.map((r: string) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] rounded-md font-medium"
                            >
                              {DOC_ROLE_LABELS[r] || r}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40"
                      title="Download"
                    >
                      {downloadingId === doc.id ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                    <button onClick={() => openEdit(doc)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchive(doc)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title={doc.status === 'active' ? 'Archive' : 'Restore'}
                    >
                      {doc.status === 'active' ? <History className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setDeleteConfirm(doc)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Student Handbook 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                <select
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Target Audience *</label>
                  <button
                    type="button"
                    onClick={handleSelectAllRoles}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {form.target_roles.length === DOC_AUDIENCE_ROLES.length ? 'Deselect All' : 'Select Everyone'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {DOC_AUDIENCE_ROLES.map((role) => {
                    const isChecked = form.target_roles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all text-xs font-medium ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(role.id)}
                          className="w-3.5 h-3.5 rounded accent-blue-600 text-blue-600 cursor-pointer"
                        />
                        <span>{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {editingDoc ? 'Replace File (optional)' : 'File *'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {editingDoc && <p className="text-xs text-gray-400 mt-1">Current file: {editingDoc.file_name}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingDoc ? 'Save Changes' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Document?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <span className="font-semibold text-gray-800">"{deleteConfirm.title}"</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Faculty & Staff ──────────────────────────────────────────────────────────
function FacultyStaffManagement() {
  const [facultyList, setFacultyList] = useState<Profile[]>([]);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [facultyCount, setFacultyCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [viewModal, setViewModal] = useState<'faculty' | 'staff' | null>(null);
  const [search, setSearch] = useState('');

  const loadCounts = async () => {
    try {
      setLoading(true);
      const facultyResponse = await fetch('http://localhost:5000/api/auth/faculty-count');
      const facultyResult = await facultyResponse.json();
      if (!facultyResponse.ok || !facultyResult.success) {
        setFacultyCount(0);
      } else {
        setFacultyCount(Number(facultyResult.count) || 0);
      }

      const staffResponse = await fetch('http://localhost:5000/api/auth/staff-count');
      const staffResult = await staffResponse.json();
      if (!staffResponse.ok || !staffResult.success) {
        setStaffCount(0);
      } else {
        setStaffCount(Number(staffResult.count) || 0);
      }
    } catch {
      setFacultyCount(0);
      setStaffCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCounts(); }, []);

  const openList = async (type: 'faculty' | 'staff') => {
    setViewModal(type);
    setSearch('');
    setLoadingList(true);
    try {
      if (type === 'faculty') {
        const response = await fetch('http://localhost:5000/api/auth/faculty');
        const result = await response.json();
        setFacultyList(result.success && Array.isArray(result.data) ? result.data : []);
      } else {
        const response = await fetch('http://localhost:5000/api/auth/staff');
        const result = await response.json();
        setStaffList(result.success && Array.isArray(result.data) ? result.data : []);
      }
    } catch {
      if (type === 'faculty') setFacultyList([]);
      else setStaffList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const closeList = () => {
    setViewModal(null);
    setSearch('');
  };

  const activeList = viewModal === 'faculty' ? facultyList : viewModal === 'staff' ? staffList : [];
  const filteredList = search.trim()
    ? activeList.filter((person) => {
        const searchText = search.toLowerCase().trim();
        return (
          (person.full_name ?? '').toLowerCase().includes(searchText) ||
          (person.email ?? '').toLowerCase().includes(searchText) ||
          (person.id_number ?? '').toLowerCase().includes(searchText) ||
          (person.department ?? '').toLowerCase().includes(searchText)
        );
      })
    : activeList;

  const accent = viewModal === 'faculty' ? '#2563EB' : '#16A34A';
  const accentBg = viewModal === 'faculty' ? '#DBEAFE' : '#D1FAE5';

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty & Staff Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Faculty Profiles</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">{loading ? '...' : facultyCount.toLocaleString()}</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Active Faculty Members</p>
          <button onClick={() => openList('faculty')} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View All Faculty
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Staff Profiles</h2>
          <p className="text-3xl font-bold text-green-600 mb-2">{loading ? '...' : staffCount.toLocaleString()}</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Active Staff Members</p>
          <button onClick={() => openList('staff')} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View All Staff
          </button>
        </div>
      </div>

      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeList} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl p-5 sm:p-6 z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {viewModal === 'faculty' ? 'All Faculty' : 'All Staff'}
                  <span className="ml-2 text-sm font-semibold text-gray-400">({filteredList.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {viewModal === 'faculty' ? 'Active faculty members registered in the system' : 'Active staff members registered in the system'}
                </p>
              </div>
              <button onClick={closeList} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={viewModal === 'faculty' ? 'Search faculty name, email, department...' : 'Search staff name, email, department...'}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
              {loadingList ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading {viewModal}...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                  <Users className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm text-gray-400">
                    {search ? `No ${viewModal} found matching "${search}"` : `No active ${viewModal} found`}
                  </p>
                </div>
              ) : (
                filteredList.map((person) => {
                  const isFaculty = viewModal === 'faculty';
                  const name = person.full_name || 'Unnamed User';
                  const role = person.department || (isFaculty ? 'Faculty' : 'Staff');
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <div key={person.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: accentBg, color: accent }}>
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{role}</p>
                        {person.email && <p className="text-[11px] text-gray-400 truncate mt-0.5">{person.email}</p>}
                        {person.id_number && <p className="text-[11px] text-gray-400 truncate">ID: {person.id_number}</p>}
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: accentBg, color: accent }}>
                        {isFaculty ? 'Faculty' : 'Staff'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Research & Achievements ──────────────────────────────────────────────────
interface ResearchSubmissionRow {
  id: string;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  category: string | null;
  file_name: string | null;
  file_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
  submitter: { full_name: string; department: string | null } | null;
}

const RESEARCH_API_URL_DEAN = 'http://localhost:5000/api/research-submissions';
const RESEARCH_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending Review', color: '#92400E', bg: '#FEF3C7' },
  approved: { label: 'Approved',       color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Rejected',       color: '#991B1B', bg: '#FEE2E2' },
};

function getResearchTokenDean() {
  return localStorage.getItem('token');
}

function ResearchAchievements() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'research' | 'extension' | 'achievement'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [submissions, setSubmissions] = useState<ResearchSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<ResearchSubmissionRow | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const url = statusFilter === 'all' ? RESEARCH_API_URL_DEAN : `${RESEARCH_API_URL_DEAN}?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getResearchTokenDean()}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load submissions.');
        setSubmissions([]);
        return;
      }
      const data = await res.json();
      setSubmissions(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, [statusFilter]);

  const decide = async (submission: ResearchSubmissionRow, status: 'approved' | 'rejected', dean_remarks?: string) => {
    setActionId(submission.id);
    try {
      const res = await fetch(`${RESEARCH_API_URL_DEAN}/${submission.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getResearchTokenDean()}` },
        body: JSON.stringify({ status, dean_remarks }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to update submission status.');
        return;
      }
      setSubmissions(prev => prev.filter(s => s.id !== submission.id));
      setRejectFor(null);
      setRemarksInput('');
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const typeLabel = (t: string) => t === 'research' ? 'Research' : t === 'extension' ? 'Extension' : 'Achievement';
  const filtered = typeFilter === 'all' ? submissions : submissions.filter(s => s.type === typeFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Research, Extension & Achievements</h1>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="research">Research</option>
            <option value="extension">Extension</option>
            <option value="achievement">Achievements</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{loadError}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          {statusFilter === 'pending' ? 'Pending Approvals' : statusFilter === 'approved' ? 'Approved Submissions' : statusFilter === 'rejected' ? 'Rejected Submissions' : 'All Submissions'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading submissions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No submissions found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const cfg = RESEARCH_STATUS_LABEL[item.status];
              return (
                <div key={item.id} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</div>
                      <div className="text-sm text-gray-600">
                        {item.submitter?.full_name ?? 'Unknown'}
                        {item.submitter?.department ? ` · ${item.submitter.department}` : ''}
                        {' · '}{typeLabel(item.type)}
                        {item.category ? ` (${item.category})` : ''} · {formatDate(item.created_at)}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View File{item.file_name ? ` (${item.file_name})` : ''}
                          </a>
                        )}
                      </div>
                      {item.dean_remarks && (
                        <p className="text-xs text-red-600 mt-1.5">Remarks: {item.dean_remarks}</p>
                      )}
                    </div>
                    {item.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => decide(item, 'approved')}
                          disabled={actionId === item.id}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-60"
                        >
                          {actionId === item.id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => { setRejectFor(item); setRemarksInput(''); }}
                          disabled={actionId === item.id}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Submission?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <span className="font-semibold text-gray-800">{rejectFor.submitter?.full_name}</span>'s "{rejectFor.title}".
            </p>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason (optional)</label>
            <textarea
              value={remarksInput}
              onChange={e => setRemarksInput(e.target.value)}
              rows={3}
              placeholder="Let them know what needs revision..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectFor(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => decide(rejectFor, 'rejected', remarksInput)}
                disabled={actionId === rejectFor.id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {actionId === rejectFor.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Alumni Tracer ────────────────────────────────────────────────────────────
function AlumniTracer() {
  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Alumni Tracer Management</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6"><h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Total Alumni</h3><p className="text-2xl sm:text-3xl font-bold text-blue-600">5,234</p></div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6"><h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Responses</h3><p className="text-2xl sm:text-3xl font-bold text-green-600">1,256</p></div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6"><h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Employed</h3><p className="text-2xl sm:text-3xl font-bold text-purple-600">98%</p></div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6"><h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Response Rate</h3><p className="text-2xl sm:text-3xl font-bold text-orange-600">24%</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Employment Statistics</h2>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
        <div className="h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Inquiries (Student & Alumni Q&A) ─────────────────────────────────────────
// Two-column layout: Alumni inquiries on the LEFT, Student inquiries on the
// RIGHT, as requested. Each column is its own scrollable panel so the dean
// can browse and reply to both groups without switching pages. Each
// inquiry now carries a `category` (set by the sender) shown as a badge
// in the list and a category filter dropdown per column.
function InquiriesManagement() {
  const [studentInquiries, setStudentInquiries] = useState<Inquiry[]>([]);
  const [alumniInquiries, setAlumniInquiries]   = useState<Inquiry[]>([]);
  const [contactMessages, setContactMessages]   = useState<ContactMessage[]>([]);
  const [loading, setLoading]                   = useState(true);

  const [activeSection, setActiveSection] = useState<'student' | 'alumni' | 'contact'>('student');

  const [studentFilter, setStudentFilter]       = useState<'all' | 'pending' | 'answered'>('all');
  const [alumniFilter, setAlumniFilter]         = useState<'all' | 'pending' | 'answered'>('all');
  const [contactFilter, setContactFilter]       = useState<'all' | 'pending' | 'answered'>('all');
  const [studentCategoryFilter, setStudentCategoryFilter] = useState('all');
  const [alumniCategoryFilter, setAlumniCategoryFilter]   = useState('all');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all');

  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [activeContact, setActiveContact] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText]         = useState('');
  const [sending, setSending]             = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, profiles(full_name, id_number)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudentInquiries(data.filter((i: Inquiry) => i.sender_role === 'student'));
      setAlumniInquiries(data.filter((i: Inquiry) => i.sender_role === 'alumni'));
    }

    const { data: contactData, error: contactError } = await supabase
      .from(CONTACT_API_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (!contactError && contactData) {
      setContactMessages(contactData);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  // Realtime updates so new inquiries show up without a manual refresh
  useEffect(() => {
    const channelName = `inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => {
        fetchInquiries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: CONTACT_API_TABLE }, () => {
        fetchInquiries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchInquiries]);

  const openInquiry = (inquiry: Inquiry) => {
    setActiveInquiry(inquiry);
    setActiveContact(null);
    setReplyText(inquiry.reply ?? '');
  };
  const openContact = (contact: ContactMessage) => {
    setActiveContact(contact);
    setActiveInquiry(null);
    setReplyText(contact.reply ?? '');
  };
  const closeModal = () => { setActiveInquiry(null); setActiveContact(null); setReplyText(''); };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      if (activeInquiry) {
        const { error } = await supabase
          .from('inquiries')
          .update({
            reply: replyText.trim(),
            status: 'answered',
            replied_at: new Date().toISOString(),
          })
          .eq('id', activeInquiry.id);

        if (!error) {
          await notifyRole(activeInquiry.sender_role, 'Your inquiry has been answered', replyText.trim());
          closeModal();
          fetchInquiries();
        }
      } else if (activeContact) {
        const { error } = await supabase
          .from(CONTACT_API_TABLE)
          .update({
            reply: replyText.trim(),
            status: 'answered',
            replied_at: new Date().toISOString(),
          })
          .eq('id', activeContact.id);

        if (!error) {
          closeModal();
          fetchInquiries();
        }
      }
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });

  const filterList = <T extends { status: string; category?: string | null }>(
    list: T[],
    statusF: 'all' | 'pending' | 'answered',
    categoryF: string,
  ) => {
    let result = list;
    if (statusF !== 'all') result = result.filter(i => i.status === statusF);
    if (categoryF !== 'all') result = result.filter(i => (i.category ?? 'Other') === categoryF);
    return result;
  };

  const pendingStudentCount = studentInquiries.filter(i => i.status === 'pending').length;
  const pendingAlumniCount  = alumniInquiries.filter(i => i.status === 'pending').length;
  const pendingContactCount = contactMessages.filter(i => i.status === 'pending').length;

  const SECTION_TABS = [
    { id: 'student' as const, label: 'Student Inquiries', pending: pendingStudentCount },
    { id: 'alumni'  as const, label: 'Alumni Inquiries',  pending: pendingAlumniCount },
    { id: 'contact' as const, label: 'Contact Messages',  pending: pendingContactCount },
  ];

  // Reusable column so both sides stay visually identical and easy to scan
  const InquiryColumn = ({
    accentColor, accentBg, list, statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter, categories, onOpen, emptyIcon: EmptyIcon,
  }: {
    accentColor: string;
    accentBg: string;
    list: (Inquiry | ContactMessage)[];
    statusFilter: 'all' | 'pending' | 'answered';
    setStatusFilter: (f: 'all' | 'pending' | 'answered') => void;
    categoryFilter: string;
    setCategoryFilter: (c: string) => void;
    categories: string[];
    onOpen: (item: any) => void;
    emptyIcon: React.ComponentType<{ className?: string }>;
  }) => {
    const shown = filterList(list as any, statusFilter, categoryFilter);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        {/* Column header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3" style={{ backgroundColor: accentBg }}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h2>
            <span className="text-xs font-semibold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">{list.length}</span>
          </div>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-white flex-shrink-0" style={{ backgroundColor: accentColor }}>
              <CircleDot className="w-3 h-3" /> {pendingCount} new
            </span>
          )}
        </div>

        {/* Filter tabs + category dropdown */}
        <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-gray-50 space-y-2">
          <div className="flex gap-1">
            {(['all', 'pending', 'answered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={statusFilter === f ? { backgroundColor: accentColor } : undefined}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-64 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center h-full text-gray-400 py-10">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading...</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-full text-gray-300 py-10">
              <EmptyIcon className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm text-gray-400">No matching items</p>
            </div>
          ) : (
            shown.map((item: any) => (
              <button
                key={item.id}
                onClick={() => onOpen(item)}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {item.profiles?.full_name ?? item.sender_name}
                  </span>
                  {item.status === 'pending' ? (
                    <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                  ) : (
                    <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Answered</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {item.category || 'Other'}
                  </span>
                  {item.profiles?.id_number && (
                    <span className="text-[10px] font-mono text-gray-400">{item.profiles.id_number}</span>
                  )}
                  {item.sender_email && (
                    <span className="text-[10px] font-mono text-gray-400 truncate">{item.sender_email}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 truncate mb-0.5">{item.subject}</p>
                <p className="text-xs text-gray-400 truncate">{item.message}</p>
                <p className="text-[10px] text-gray-300 mt-1.5">{formatDate(item.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  const activeItem = activeInquiry ?? activeContact;
  const activeIsContact = !!activeContact;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Inquiries</h1>
            <p className="text-gray-500 text-sm mt-1">Answer questions from students, alumni, and website visitors</p>
          </div>
          <button onClick={fetchInquiries} className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      {/* Two-column layout: Alumni (left) / Student (right) — full height, scrollable independently */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 lg:max-h-[calc(100vh-220px)]">
        <div className="min-h-[420px] lg:min-h-0">
          <InquiryColumn
            accentColor="#1D4ED8"
            accentBg="#DBEAFE"
            list={studentInquiries}
            statusFilter={studentFilter}
            setStatusFilter={setStudentFilter}
            categoryFilter={studentCategoryFilter}
            setCategoryFilter={setStudentCategoryFilter}
            categories={STUDENT_INQUIRY_CATEGORIES}
            onOpen={openInquiry}
            emptyIcon={Inbox}
          />
        )}
        {activeSection === 'alumni' && (
          <InquiryColumn
            accentColor="#BE185D"
            accentBg="#FCE7F3"
            list={alumniInquiries}
            statusFilter={alumniFilter}
            setStatusFilter={setAlumniFilter}
            categoryFilter={alumniCategoryFilter}
            setCategoryFilter={setAlumniCategoryFilter}
            categories={ALUMNI_INQUIRY_CATEGORIES}
            onOpen={openInquiry}
            emptyIcon={Inbox}
          />
        )}
        {activeSection === 'contact' && (
          <InquiryColumn
            accentColor="#059669"
            accentBg="#D1FAE5"
            list={contactMessages}
            statusFilter={contactFilter}
            setStatusFilter={setContactFilter}
            categoryFilter={contactCategoryFilter}
            setCategoryFilter={setContactCategoryFilter}
            categories={CONTACT_INQUIRY_CATEGORIES}
            onOpen={openContact}
            emptyIcon={MessageCircle}
          />
        )}
      </div>

      {/* Reply modal */}
      {activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={
                      activeIsContact
                        ? { backgroundColor: '#D1FAE5', color: '#059669' }
                        : activeInquiry!.sender_role === 'alumni'
                          ? { backgroundColor: '#FCE7F3', color: '#BE185D' }
                          : { backgroundColor: '#DBEAFE', color: '#1D4ED8' }
                    }
                  >
                    {activeIsContact ? 'Contact Form' : activeInquiry!.sender_role === 'alumni' ? 'Alumni' : 'Student'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                    {activeItem.category || 'Other'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 truncate">{activeItem.subject}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  From {activeIsContact ? activeContact!.sender_name : (activeInquiry!.profiles?.full_name ?? activeInquiry!.sender_name)}
                  {activeIsContact && activeContact!.sender_email && <> · {activeContact!.sender_email}</>}
                  {!activeIsContact && activeInquiry!.profiles?.id_number && <> · {activeInquiry!.profiles.id_number}</>}
                  {' '}· {formatDate(activeItem.created_at)}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeItem.message}</p>
            </div>

            {activeItem.reply && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Previous reply</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{activeItem.reply}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Reply</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Type your response here..."
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Consolidated Reports & Analytics ─────────────────────────────────────────
const ACCOMPLISHMENT_API_URL = 'http://localhost:5000/api/accomplishment-reports';
const EXTENSION_API_URL = 'http://localhost:5000/api/extension-reports';
const USERS_API_URL = 'http://localhost:5000/api/auth/users';

interface AccomplishmentReportRow {
  id: string;
  submitted_by: string;
  quarter: string;
  year: string;
  program_chair?: string | null;
  program?: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  progress: number;
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
  pi1_data?: any[]; pi2_data?: any[]; pi3_data?: any[]; pi4_data?: any[];
  pi5_data?: any[]; pi6_data?: any[]; pi7_data?: any[]; pi8_data?: any[];
  mfo3_pi1_data?: any[]; mfo3_pi2_data?: any[]; mfo3_pi3_data?: any[]; mfo3_pi4_data?: any[];
  mfo4_pi1_data?: any[]; mfo4_pi2_data?: any[]; other_data?: any[]; awards_data?: any[];
  doc_entries_data?: any[];
  other_accomplishments?: string | null;
  rows?: any[];
}

interface ExtensionReportRow {
  id: string;
  submitted_by: string;
  quarter: string;
  year: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  progress: number;
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
  rows?: any[];
}

interface ConsolidatedReportRow {
  profile: Profile & { program?: string | null };
  departmentName: string;
  accomplishmentReport: AccomplishmentReportRow | null;
  extensionReport: ExtensionReportRow | null;
  effectiveStatus: 'not_started' | 'submitted' | 'approved' | 'rejected';
  effectiveProgress: number;
  lastUpdated: string | null;
}

function getCurrentQuarterString(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const quarterNum = Math.floor(month / 3) + 1;
  return `Q${quarterNum} ${year}`;
}

function getDynamicQuarterOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years = [currentYear + 1, currentYear, currentYear - 1];
  const options: string[] = [];
  years.forEach((y) => {
    ['Q4', 'Q3', 'Q2', 'Q1'].forEach((q) => {
      options.push(`${q} ${y}`);
    });
  });
  return options;
}

function parseQuarterYear(selected: string): { quarter: string; year: string } {
  const [q, y] = selected.split(' ');
  const currentYear = String(new Date().getFullYear());
  const qMap: Record<string, string> = {
    Q1: '1st',
    Q2: '2nd',
    Q3: '3rd',
    Q4: '4th',
  };
  return {
    quarter: qMap[q] || '1st',
    year: y || currentYear,
  };
}

const REPORT_STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#991B1B', bg: '#FEE2E2' },
  submitted:   { label: 'Pending Review', color: '#92400E', bg: '#FEF3C7' },
  approved:    { label: 'Approved',    color: '#065F46', bg: '#D1FAE5' },
  rejected:    { label: 'Rejected',    color: '#B91C1C', bg: '#FEE2E2' },
};

function ReportsAnalytics() {
  const [rows, setRows] = useState<ConsolidatedReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterSelect, setQuarterSelect] = useState<string>(() => getCurrentQuarterString());
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'submitted' | 'approved' | 'rejected'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'faculty' | 'department_chair'>('all');
  const [search, setSearch] = useState('');

  const [deadline, setDeadlineState] = useState<{ id: string; due_date: string } | null>(null);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  const [sendingBulk, setSendingBulk] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<{
    type: 'accomplishment' | 'extension';
    report: AccomplishmentReportRow | ExtensionReportRow;
    profile: Profile;
  } | null>(null);

  const [rejectFor, setRejectFor] = useState<{
    type: 'accomplishment' | 'extension';
    report: AccomplishmentReportRow | ExtensionReportRow;
  } | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const dynamicQuarterOptions = getDynamicQuarterOptions();

  const showInfo = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowInfoModal(true);
  };

  const getToken = () => localStorage.getItem('token');

  const fetchDeadline = useCallback(async () => {
    const { data } = await supabase
      .from('report_deadlines')
      .select('*')
      .eq('title', `Quarterly Report – ${quarterSelect}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDeadlineState({ id: data.id, due_date: data.due_date });
      setDeadlineInput(data.due_date ? data.due_date.slice(0, 16) : '');
    } else {
      setDeadlineState(null);
      setDeadlineInput('');
    }
  }, [quarterSelect]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { quarter, year } = parseQuarterYear(quarterSelect);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch Users / Profiles
      let personnelList: (Profile & { program?: string | null })[] = [];
      const userRes = await fetch(USERS_API_URL, { headers });
      if (userRes.ok) {
        const usersData = await userRes.json();
        personnelList = (usersData ?? []).filter((u: any) =>
          ['faculty', 'chair', 'department_chair'].includes(u.role?.toLowerCase())
        );
      } else {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['faculty', 'chair', 'department_chair']);
        personnelList = profiles || [];
      }

      // 2. Fetch Reports (Accomplishment & Extension)
      const [accRes, extRes] = await Promise.all([
        fetch(ACCOMPLISHMENT_API_URL, { headers }).catch(() => null),
        fetch(EXTENSION_API_URL, { headers }).catch(() => null),
      ]);

      let accomplishmentList: AccomplishmentReportRow[] = [];
      let extensionList: ExtensionReportRow[] = [];

      if (accRes && accRes.ok) {
        const data = await accRes.json();
        accomplishmentList = Array.isArray(data) ? data : [];
      } else {
        const { data: dbAcc } = await supabase
          .from('accomplishment_reports')
          .select('*')
          .eq('quarter', quarter)
          .eq('year', year);
        accomplishmentList = (dbAcc as any) ?? [];
      }

      if (extRes && extRes.ok) {
        const data = await extRes.json();
        extensionList = Array.isArray(data) ? data : [];
      } else {
        const { data: dbExt } = await supabase
          .from('extension_reports')
          .select('*')
          .eq('quarter', quarter)
          .eq('year', year);
        extensionList = (dbExt as any) ?? [];
      }

      // Exclude draft status
      const accMap = new Map(
        accomplishmentList
          .filter((r) => r.quarter === quarter && String(r.year) === String(year) && r.status !== 'draft')
          .map((r) => [r.submitted_by, r])
      );

      const extMap = new Map(
        extensionList
          .filter((r) => r.quarter === quarter && String(r.year) === String(year) && r.status !== 'draft')
          .map((r) => [r.submitted_by, r])
      );

      // 3. Consolidate rows
      const consolidated: ConsolidatedReportRow[] = personnelList.map((p) => {
        const departmentName = p.department || p.program || 'General';
        const acc = accMap.get(p.id) ?? null;
        const ext = extMap.get(p.id) ?? null;

        let effectiveStatus: ConsolidatedReportRow['effectiveStatus'] = 'not_started';
        let progress = 0;

        if (acc || ext) {
          const statuses = [acc?.status, ext?.status].filter(Boolean);
          if (statuses.includes('submitted')) effectiveStatus = 'submitted';
          else if (statuses.includes('rejected')) effectiveStatus = 'rejected';
          else if (statuses.includes('approved')) effectiveStatus = 'approved';

          const validProgress = [acc?.progress, ext?.progress].filter((v) => typeof v === 'number') as number[];
          progress = validProgress.length > 0 ? Math.round(validProgress.reduce((a, b) => a + b, 0) / validProgress.length) : 0;
        }

        return {
          profile: p,
          departmentName,
          accomplishmentReport: acc,
          extensionReport: ext,
          effectiveStatus,
          effectiveProgress: progress,
          lastUpdated: acc?.updated_at || ext?.updated_at || null,
        };
      });

      setRows(consolidated);
    } catch (err: any) {
      showInfo('Error', err?.message || 'Failed to load reports.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [quarterSelect]);

  useEffect(() => {
    fetchDeadline();
    fetchData();
  }, [fetchDeadline, fetchData]);

  useEffect(() => {
    const channelName = `dean-consolidated-reports-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accomplishment_reports' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extension_reports' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const decideReport = async (
    type: 'accomplishment' | 'extension',
    id: string,
    status: 'approved' | 'rejected',
    remarks?: string
  ) => {
    setActionId(id);
    const targetUrl = type === 'accomplishment' ? ACCOMPLISHMENT_API_URL : EXTENSION_API_URL;
    try {
      const res = await fetch(`${targetUrl}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status, dean_remarks: remarks }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showInfo('Error', err.error || 'Failed to update report status.');
        return;
      }

      showInfo('Success', `Report successfully marked as ${status}.`);
      setSelectedReport(null);
      setRejectFor(null);
      setRemarksInput('');
      await fetchData();
    } catch {
      showInfo('Error', 'Could not reach the server. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const saveDeadline = async () => {
    if (!deadlineInput) {
      showInfo('Error', 'Please select a valid deadline date and time.');
      return;
    }
    setSavingDeadline(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const title = `Quarterly Report – ${quarterSelect}`;
      const { error } = await supabase.from('report_deadlines').upsert(
        deadline
          ? { id: deadline.id, title, description: `Submit your ${quarterSelect} quarterly report.`, due_date: deadlineInput, created_by: user?.id }
          : { title, description: `Submit your ${quarterSelect} quarterly report.`, due_date: deadlineInput, created_by: user?.id }
      );
      if (error) throw error;

      await Promise.all([
        notifyRole(
          'faculty',
          title,
          `The deadline for the ${quarterSelect} quarterly report has been set to ${new Date(deadlineInput).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        ),
        notifyRole(
          'department_chair',
          title,
          `The deadline for the ${quarterSelect} quarterly report has been set to ${new Date(deadlineInput).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        ),
      ]);

      await fetchDeadline();
      showInfo('Success', 'Deadline saved and notified to all Faculty and Department Chairs.');
    } catch (err: any) {
      showInfo('Error', err.message || 'Failed to save deadline.');
    } finally {
      setSavingDeadline(false);
    }
  };

  const sendBulkReminder = async () => {
    const pending = rows.filter((r) => r.effectiveStatus !== 'submitted' && r.effectiveStatus !== 'approved');
    if (pending.length === 0) {
      showInfo('All Done', 'Every faculty member and department chair has completed this quarter\'s report.');
      return;
    }
    setSendingBulk(true);
    try {
      const dueText = deadline
        ? ` The deadline is ${new Date(deadline.due_date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        : '';

      await Promise.all([
        notifyRole(
          'faculty',
          `Reminder: ${quarterSelect} Quarterly Report`,
          `Please complete and submit your ${quarterSelect} quarterly report.${dueText}`
        ),
        notifyRole(
          'department_chair',
          `Reminder: ${quarterSelect} Quarterly Report`,
          `Please complete and submit your ${quarterSelect} quarterly report.${dueText}`
        ),
      ]);
      showInfo('Reminder Sent', `Sent a reminder to ${pending.length} pending academic personnel.`);
    } catch (err: any) {
      showInfo('Error', err.message || 'Failed to send reminders.');
    } finally {
      setSendingBulk(false);
    }
  };

  const sendIndividualReminder = async (row: ConsolidatedReportRow) => {
    setRemindingId(row.profile.id);
    try {
      const dueText = deadline
        ? ` The deadline is ${new Date(deadline.due_date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        : '';
      const { error } = await supabase.from('notifications').insert({
        user_id: row.profile.id,
        title: `Reminder: ${quarterSelect} Quarterly Report`,
        message: `Hi ${row.profile.full_name}, please complete and submit your ${quarterSelect} quarterly report.${dueText}`,
        type: 'announcement',
        is_read: false,
      });
      if (error) throw error;
      showInfo('Reminder Sent', `Sent a reminder to ${row.profile.full_name}.`);
    } catch (err: any) {
      showInfo('Error', err.message || 'Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    if (statusFilter !== 'all' && row.effectiveStatus !== statusFilter) return false;

    if (roleFilter !== 'all') {
      const isChair = row.profile.role === 'chair' || row.profile.role === 'department_chair';
      if (roleFilter === 'department_chair' && !isChair) return false;
      if (roleFilter === 'faculty' && isChair) return false;
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      const matchName = (row.profile.full_name || '').toLowerCase().includes(query);
      const matchDept = (row.departmentName || '').toLowerCase().includes(query);
      if (!matchName && !matchDept) return false;
    }

    return true;
  });

  const submittedCount = rows.filter((r) => r.effectiveStatus === 'submitted').length;
  const approvedCount  = rows.filter((r) => r.effectiveStatus === 'approved').length;
  const notStartedCount = rows.filter((r) => r.effectiveStatus === 'not_started').length;
  const overallProgress = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.effectiveProgress, 0) / rows.length)
    : 0;

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Quarterly Report Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consolidated submission monitoring and approval for Faculty and Department Chairs
          </p>
        </div>
        <select
          value={quarterSelect}
          onChange={(e) => setQuarterSelect(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {dynamicQuarterOptions.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      {/* Summary cards (without Draft) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">Overall Progress</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#1E3A8A]">{overallProgress}%</p>
        </div>
        <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: '#D1FAE5' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#065F46', opacity: 0.8 }}>Approved</p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#065F46' }}>{approvedCount}</p>
        </div>
        <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: '#FEF3C7' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#92400E', opacity: 0.8 }}>Pending Review</p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#92400E' }}>{submittedCount}</p>
        </div>
        <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: '#FEE2E2' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#991B1B', opacity: 0.8 }}>Not Started</p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#991B1B' }}>{notStartedCount}</p>
        </div>
      </div>

      {/* Deadline & Reminder Action Row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Set Deadline for {quarterSelect}
        </label>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="datetime-local"
            value={deadlineInput}
            onChange={(e) => setDeadlineInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            onClick={saveDeadline}
            disabled={savingDeadline}
            className="px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 flex-shrink-0"
          >
            {savingDeadline ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {savingDeadline ? 'Saving...' : deadline ? 'Update Deadline' : 'Set Deadline'}
          </button>
          <button
            onClick={sendBulkReminder}
            disabled={sendingBulk}
            className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 flex-shrink-0"
          >
            {sendingBulk ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Megaphone className="w-4 h-4" />
            )}
            {sendingBulk ? 'Sending...' : 'Send Bulk Reminder'}
          </button>
        </div>

        {deadline && (
          <p className="text-xs text-gray-500 mt-2.5">
            Current deadline: <span className="font-semibold text-gray-700">{formatDateTime(deadline.due_date)}</span>
          </p>
        )}
      </div>

      {/* Filters (Search, Role, Status - without Draft) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search personnel, department..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="all">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="department_chair">Department Chairs</option>
            </select>

            {/* Status Filter (without Draft) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Consolidated Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-blue-600 border-t-transparent rounded-full animate-spin"
                style={{ borderWidth: 3, borderStyle: 'solid' }}
              />
              <p className="text-sm text-gray-500">Loading quarterly reports...</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No reports or personnel found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submissions</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map((row) => {
                  const isChair = row.profile.role === 'chair' || row.profile.role === 'department_chair';
                  const cfg = REPORT_STATUS_BADGE[row.effectiveStatus] || REPORT_STATUS_BADGE.not_started;

                  return (
                    <tr key={row.profile.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: '#D1FAE5', color: '#065F46' }}
                          >
                            {(row.profile.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate max-w-[140px] sm:max-w-none">
                              {row.profile.full_name}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[140px] sm:max-w-none">
                              {row.departmentName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isChair ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isChair ? 'Department Chair' : 'Faculty'}
                        </span>
                      </td>

                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.accomplishmentReport ? (
                            <button
                              onClick={() => setSelectedReport({ type: 'accomplishment', report: row.accomplishmentReport!, profile: row.profile })}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Accomplishment
                            </button>
                          ) : null}
                          {row.extensionReport ? (
                            <button
                              onClick={() => setSelectedReport({ type: 'extension', report: row.extensionReport!, profile: row.profile })}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Extension
                            </button>
                          ) : null}
                          {!row.accomplishmentReport && !row.extensionReport && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${row.effectiveProgress}%`,
                                backgroundColor:
                                  row.effectiveStatus === 'approved'
                                    ? '#10B981'
                                    : row.effectiveProgress > 0
                                    ? '#F59E0B'
                                    : '#D1D5DB',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                            {row.effectiveProgress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 sm:py-4 px-4 sm:px-6 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center justify-center gap-1">
                          {row.accomplishmentReport || row.extensionReport ? (
                            <button
                              onClick={() =>
                                setSelectedReport(
                                  row.accomplishmentReport
                                    ? { type: 'accomplishment', report: row.accomplishmentReport, profile: row.profile }
                                    : { type: 'extension', report: row.extensionReport!, profile: row.profile }
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Review submission details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => sendIndividualReminder(row)}
                              disabled={remindingId === row.profile.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-60"
                              title="Send reminder notice"
                            >
                              {remindingId === row.profile.id ? (
                                <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Megaphone className="w-3.5 h-3.5" />
                              )}
                              <span>{remindingId === row.profile.id ? 'Sending…' : 'Remind'}</span>
                            </button>
                          )}
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

      {/* Detail & Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900 capitalize">
                  {selectedReport.type} Report — {selectedReport.profile.full_name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedReport.report.quarter} Quarter, {selectedReport.report.year} · Status:{' '}
                  <span className="font-semibold uppercase">{selectedReport.report.status}</span>
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {selectedReport.report.dean_remarks && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <span className="font-semibold">Dean's remarks:</span> {selectedReport.report.dean_remarks}
                </div>
              )}

              {selectedReport.type === 'extension' ? (
                <GenericJsonTable
                  rows={selectedReport.report.rows ?? []}
                  columns={[
                    { key: 'extension_project', label: 'Project/Activity' },
                    { key: 'highlights', label: 'Highlights' },
                    { key: 'partner_linkage', label: 'Partner/Linkage' },
                    { key: 'num_trainees', label: 'No. of Trainees' },
                    { key: 'venue', label: 'Venue' },
                    { key: 'inclusive_date', label: 'Inclusive Date' },
                  ]}
                />
              ) : (
                <div className="space-y-4">
                  {[
                    { title: 'PI 1: Licensure Exam Passers', rows: (selectedReport.report as AccomplishmentReportRow).pi1_data, cols: [['date_exam','Date'],['no_first_time','First-time Takers'],['no_passers','Passers'],['passing_pct_first','Passing %']] },
                    { title: 'PI 2: Graduate Employment', rows: (selectedReport.report as AccomplishmentReportRow).pi2_data, cols: [['no_graduates','Graduates'],['no_employed','Employed'],['percentage','Percentage']] },
                    { title: 'PI 4: Syllabus Submission', rows: (selectedReport.report as AccomplishmentReportRow).pi4_data, cols: [['name_faculty','Faculty'],['courses_taught','Courses'],['status_syllabus','Status']] },
                    { title: 'PI 7: Trainings/Seminars', rows: (selectedReport.report as AccomplishmentReportRow).pi7_data, cols: [['name_faculty','Faculty'],['title_training','Title'],['date','Date'],['venue','Venue']] },
                    { title: 'Research & Publications', rows: (selectedReport.report as AccomplishmentReportRow).mfo3_pi3_data, cols: [['title_research','Title'],['proponents','Proponents'],['name_publication','Publication']] },
                  ].filter((s) => s.rows && s.rows.length > 0).map(section => (
                    <div key={section.title}>
                      <p className="font-semibold text-sm text-gray-800 mb-1">{section.title}</p>
                      <GenericJsonTable rows={section.rows!} columns={section.cols.map(([key, label]) => ({ key, label }))} />
                    </div>
                  ))}

                  {(selectedReport.report as AccomplishmentReportRow).other_accomplishments && (
                    <div>
                      <p className="font-semibold text-sm text-gray-800 mb-1">Other Accomplishments</p>
                      <p className="text-sm text-gray-600">{(selectedReport.report as AccomplishmentReportRow).other_accomplishments}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedReport.report.status === 'submitted' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => decideReport(selectedReport.type, selectedReport.report.id, 'approved')}
                    disabled={actionId === selectedReport.report.id}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    {actionId === selectedReport.report.id ? 'Approving...' : 'Approve Submission'}
                  </button>
                  <button
                    onClick={() => {
                      setRejectFor({ type: selectedReport.type, report: selectedReport.report });
                      setRemarksInput('');
                    }}
                    disabled={actionId === selectedReport.report.id}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject Submission
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Report?</h3>
            <p className="text-sm text-gray-500 mb-4">Provide reasons or revisions needed for the submitter.</p>
            <textarea
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              rows={3}
              placeholder="Enter remarks..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectFor(null)} className="flex-1 py-2.5 border rounded-xl text-sm">Cancel</button>
              <button
                onClick={() => decideReport(rejectFor.type, rejectFor.report.id, 'rejected', remarksInput)}
                disabled={actionId === rejectFor.report.id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {actionId === rejectFor.report.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{modalTitle}</h3>
              <p className="mt-2 text-gray-600">{modalMessage}</p>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button onClick={() => setShowInfoModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenericJsonTable({ rows, columns }: { rows: any[]; columns: { key: string; label: string }[] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs text-gray-400 italic py-1">No entries recorded.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((c) => (
              <th
                key={c.key}
                className="border border-gray-200 px-2.5 py-1.5 text-left font-semibold text-gray-600"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className="border border-gray-200 px-2.5 py-1.5 align-top text-gray-700"
                >
                  {row[c.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// ─── Announcements ────────────────────────────────────────────────────────────
const ANNOUNCEMENTS_API_URL = 'http://localhost:5000/api/announcements';
const ALL_ROLES = ['department_chair', 'faculty', 'student', 'alumni'];

const ANNOUNCEMENT_ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  department_chair: {
    label: 'Department Chairs',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  faculty: {
    label: 'Faculty',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  student: {
    label: 'Students',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  alumni: {
    label: 'Alumni',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

interface DeptOption {
  id: string;
  name: string;
}

function AnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modal display for announcement composer
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Search & Filter UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  // Status & Feedback modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...ALL_ROLES]);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);

  function formatManilaTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const getToken = () => localStorage.getItem('token');

  const loadAnnouncements = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(ANNOUNCEMENTS_API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load announcements.');
        setAnnouncements([]);
        return;
      }
      const data = await res.json();
      setAnnouncements(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    if (!error && data) setDepartments(data);
  };

  useEffect(() => {
    loadAnnouncements();
    loadDepartments();

    const channelName = `announcements-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => loadAnnouncements()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const selectAllRoles = () => setSelectedRoles([...ALL_ROLES]);
  const deselectAllRoles = () => setSelectedRoles([]);

  const closeComposer = () => {
    setIsComposerOpen(false);
  };

  const publishAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setModalType('error');
      setModalTitle('Required Fields Missing');
      setModalMessage('Please provide both an announcement title and detailed content.');
      setShowModal(true);
      return;
    }
    if (selectedRoles.length === 0) {
      setModalType('error');
      setModalTitle('No Recipients Selected');
      setModalMessage('Please select at least one recipient role for this announcement.');
      setShowModal(true);
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch(ANNOUNCEMENTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_role: selectedRoles,
          target_department_id: targetDepartmentId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModalType('error');
        setModalTitle('Publishing Failed');
        setModalMessage(err.error || 'Failed to publish announcement.');
        setShowModal(true);
        return;
      }

      setTitle('');
      setContent('');
      setSelectedRoles([...ALL_ROLES]);
      setTargetDepartmentId('');
      setIsComposerOpen(false);

      setModalType('success');
      setModalTitle('Announcement Published');
      setModalMessage('Your broadcast has been registered and distributed to the selected audience.');
      setShowModal(true);
      await loadAnnouncements();
    } catch (err: any) {
      setModalType('error');
      setModalTitle('Publishing Error');
      setModalMessage(err?.message || 'Failed to publish announcement.');
      setShowModal(true);
    } finally {
      setPublishing(false);
    }
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        setModalType('error');
        setModalTitle('Delete Failed');
        setModalMessage(err.error || 'Failed to delete announcement.');
        setShowModal(true);
        return;
      }

      await supabase
        .from('notifications')
        .delete()
        .eq('reference_id', id)
        .eq('reference_table', 'announcements');

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setItemToDelete(null);
    } catch {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to delete announcement.');
      setShowModal(true);
    } finally {
      setDeletingId(null);
    }
  };

  const roleLabel = (r: string) => ANNOUNCEMENT_ROLE_CONFIG[r]?.label ?? r;
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? 'Department-Restricted' : null;

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      filterDepartment === 'all'
        ? true
        : filterDepartment === 'college_wide'
        ? !a.target_department_id
        : a.target_department_id === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[#1E3A8A]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Announcements Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Create official notices and broadcast targeted updates across departments.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Total Records:</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {filteredAnnouncements.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white text-gray-700 font-medium"
            >
              <option value="all">All Scopes</option>
              <option value="college_wide">College-Wide Only</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} Only
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to refresh announcements</p>
            <p className="text-rose-600 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {/* ── Feed List ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-16 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-800">Synchronizing Announcements</p>
          <p className="text-xs text-gray-400 mt-1">Fetching latest published broadcasts from system records...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Announcements Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || filterDepartment !== 'all'
              ? 'No matching announcements found for the selected criteria.'
              : 'There are currently no active announcements published.'}
          </p>
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E40AF] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Post First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => {
            const roles: string[] = announcement.target_role ?? [];
            const dept = deptName(announcement.target_department_id);

            return (
              <div
                key={announcement.id}
                className="bg-white rounded-xl border border-gray-200/80 hover:border-gray-300 transition-all p-5 shadow-sm hover:shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatManilaTime(announcement.created_at)}
                      </span>

                      {dept ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" />
                          {dept} Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" />
                          College-Wide
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug tracking-tight">
                      {announcement.title}
                    </h3>

                    <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-0.5">
                      {announcement.content}
                    </div>

                    {/* Target Roles */}
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-400 mr-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Audience:
                      </span>
                      {roles.map((r: string) => {
                        const conf = ANNOUNCEMENT_ROLE_CONFIG[r];
                        return (
                          <span
                            key={r}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              conf
                                ? `${conf.bg} ${conf.text} ${conf.border}`
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {roleLabel(r)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 sm:pl-3 sm:border-l sm:border-gray-100">
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          id: announcement.id,
                          title: announcement.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE ANNOUNCEMENT MODAL ── */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                <Megaphone className="w-5 h-5 text-[#1E3A8A]" />
                Create New Announcement
              </div>
              <button
                type="button"
                onClick={closeComposer}
                disabled={publishing}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination Schedule & Room Assignments"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Content / Memorandum <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type the announcement details and instructions here..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all resize-none"
                />
              </div>

              {/* Roles Section */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    Target Recipient Roles <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllRoles}
                      className="text-[11px] text-[#1E3A8A] font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllRoles}
                      className="text-[11px] text-gray-500 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate">{roleLabel(role)}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 shrink-0 ml-1 stroke-[2.5]" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0 ml-1 rounded-full border border-gray-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department Restriction */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  Department Scope (Optional)
                </label>
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white text-gray-800"
                >
                  <option value="">All Departments (College-Wide)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} Department Only
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeComposer}
                disabled={publishing}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={publishAnnouncement}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Deletion Modal ── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Delete Announcement?</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Are you sure you want to permanently remove{' '}
              <span className="font-semibold text-gray-800">"{itemToDelete.title}"</span>? Associated notifications will also be cleared.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDelete(itemToDelete.id)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                {deletingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {deletingId ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback Status Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
                modalType === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {modalType === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <CircleDot className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">{modalTitle}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">{modalMessage}</p>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-colors shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Landing Page Management ──────────────────────────────────────────────────
function LandingPageManagement() {
  function updateClubsField(section: string, field: string, value: string) {
    setClubsContent((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  const [footerContent, setFooterContent] = useState<any>({});
  const [footerQuickLinks, setFooterQuickLinks] = useState<any[]>([]);
  const [footerSocialLinks, setFooterSocialLinks] = useState<any[]>([]);
  const [contactContent, setContactContent] = useState<any>({});
  const [officeHours, setOfficeHours] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [accreditationContent, setAccreditationContent] = useState<any>(null);
  const [overviewItems, setOverviewItems] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [achievementPageContent, setAchievementPageContent] = useState<any>(null);
  const [achievementBanner, setAchievementBanner] = useState<any>(null);
  const [achievementBannerStats, setAchievementBannerStats] = useState<any[]>([]);
  const [achievementStatistics, setAchievementStatistics] = useState<any[]>([]);
  const [achievementTopnotchers, setAchievementTopnotchers] = useState<any[]>([]);
  const [achievementCollegeAchievements, setAchievementCollegeAchievements] = useState<any[]>([]);
  const [clubsContent, setClubsContent] = useState<any>({});
  const [clubsStatistics, setClubsStatistics] = useState<ClubStatistic[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [coreValueCards, setCoreValueCards] = useState<CoreValueCard[]>([]);
  const [aboutStats, setAboutStats] = useState<AboutStat[]>([]);
  const [homeContent, setHomeContent] = useState<any>({});
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [departmentContent, setDepartmentContent] = useState<any>({});
  const [dean, setDean] = useState<FacultyMember | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [aboutContent, setAboutContent] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [researchContent, setResearchContent] = useState<any>({});
  const [researchPublications, setResearchPublications] = useState<any[]>([]);
  const [researchAwards, setResearchAwards] = useState<any[]>([]);
  const [featuredAlumni, setFeaturedAlumni] = useState<any[]>([]);
  const [activePage, setActivePage] = useState<
    'homepage' | 'about' | 'departments' | 'clubs' | 'research' | 'achievements' | 'accreditation' | 'contact' | 'footer'
  >('homepage');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadHomepageContent();
    loadAboutContent();
    loadFeatures();
    loadStats();
    loadAnnouncements();
    loadCoreValues();
    loadFacultyMembers();
    loadDepartments();
    loadAboutStats();
    loadCoreValueCards();
    loadDepartmentContent();
    loadColleges();
    loadClubsContent();
    loadClubsStatistics();
    loadOrganizations();
    loadCommittees();
    loadResearchPageData();
    loadAchievementsPage();
    loadAccreditationData();
    loadContactData();
    loadFooterData();
  }, []);

  const pages = [
    { key: 'homepage', label: 'Homepage' },
    { key: 'about', label: 'About Page' },
    { key: 'departments', label: 'Departments Page' },
    { key: 'clubs', label: 'Clubs Page' },
    { key: 'research', label: 'Research Page' },
    { key: 'achievements', label: 'Achievements Page' },
    { key: 'accreditation', label: 'Accreditation Page' },
    { key: 'contact', label: 'Contact Page' },
    { key: 'footer', label: 'Footer' },
  ];

  const pageTitles = {
    homepage: 'Homepage',
    about: 'About Page',
    departments: 'Departments Page',
    clubs: 'Clubs Page',
    research: 'Research Page',
    achievements: 'Achievements Page',
    accreditation: 'Accreditation Page',
    contact: 'Contact Page',
    footer: 'Footer',
  };

  const saveHandlers = {
    homepage: saveHomePage,
    about: saveAboutPage,
    departments: saveDepartmentsPage,
    clubs: saveClubsPage,
    research: handleSaveResearchPage,
    achievements: saveAchievementsPage,
    accreditation: saveAccreditationPage,
    contact: saveContactPage,
    footer: saveFooterPage,
  };

  async function loadFooterData() {
    const [content, quickLinks, socialLinks] = await Promise.all([
      footerService.getFooterContent(),
      footerService.getQuickLinks(),
      footerService.getSocialLinks(),
    ]);
    setFooterContent(content || {});
    setFooterQuickLinks(quickLinks || []);
    setFooterSocialLinks(socialLinks || []);
  }

  async function saveFooterPage() {
    try {
      await footerService.saveFooterContent(footerContent);
      await footerService.saveQuickLinks(footerQuickLinks);
      await footerService.saveSocialLinks(footerSocialLinks);
      setModalMessage('Footer Updated Successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setModalMessage('Failed to save footer');
      setShowSuccessModal(true);
    }
  }

  async function loadContactData() {
    const [content, hours, socials] = await Promise.all([
      contactService.getPageContent(),
      contactService.getOfficeHours(),
      contactService.getSocialLinks(),
    ]);
    setContactContent(content);
    setOfficeHours(hours || []);
    setSocialLinks(socials || []);
  }

  async function saveContactPage() {
    try {
      await contactService.savePageContent(contactContent);
      await contactService.saveOfficeHours(officeHours);
      await contactService.saveSocialLinks(socialLinks);
      setModalMessage('Contact Page Updated Successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setModalMessage('Failed to save contact page');
      setShowSuccessModal(true);
    }
  }

  async function saveAccreditationPage() {
    try {
      await accreditationService.savePageContent(accreditationContent);
      await accreditationService.saveOverview(overviewItems);
      await accreditationService.saveLevels(levels);
      await accreditationService.savePrograms(programs);
      await accreditationService.saveCertifications(certifications);
      setModalMessage('Accreditation Page Updated Successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setModalMessage('Failed to save accreditation page');
      setShowSuccessModal(true);
    }
  }

  async function saveAchievementsPage() {
    try {
      await achievementsService.savePageContent(achievementPageContent);
      await achievementsService.saveBanner(achievementBanner);
      await achievementsService.saveBannerStats(achievementBannerStats);
      await achievementsService.saveStatistics(achievementStatistics);
      await achievementsService.saveTopnotchers(achievementTopnotchers);
      await achievementsService.saveCollegeAchievements(achievementCollegeAchievements);
      setModalMessage('Achievements Page Updated Successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setModalMessage('Failed to save achievements page');
      setShowSuccessModal(true);
    }
  }

  async function loadAccreditationData() {
    const [content, overview, levelData, programData, certificationData] = await Promise.all([
      accreditationService.getPageContent(),
      accreditationService.getOverview(),
      accreditationService.getLevels(),
      accreditationService.getPrograms(),
      accreditationService.getCertifications(),
    ]);
    setAccreditationContent(content);
    setOverviewItems(overview || []);
    setLevels(levelData || []);
    setPrograms(programData || []);
    setCertifications(certificationData || []);
  }

  async function loadResearchPageData() {
    const content = await loadResearchContent();
    const publications = await loadResearchPublications();
    const achievements = await loadAwards();
    const alumni = await loadFeaturedAlumni();
    setResearchContent(content);
    setResearchPublications(publications);
    setResearchAwards(achievements);
    setFeaturedAlumni(alumni);
  }

  async function handleSaveResearchPage() {
    await saveResearchPage(researchContent, researchPublications, researchAwards, featuredAlumni);
    setModalMessage('Research Page Updated Successfully!');
    setShowSuccessModal(true);
  }

  function updateResearchField(section: string, field: string, value: string) {
    setResearchContent((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  async function saveClubsPage() {
    await saveClubsContent(clubsContent);
    await saveClubStatistics(clubsStatistics);
    await saveOrganizations(organizations);
    await saveCommittees(committees);
    setModalMessage('Clubs Page Updated Successfully!');
    setShowSuccessModal(true);
  }

  function updateDepartmentField(section: string, field: string, value: string) {
    setDepartmentContent((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  async function loadClubsContent() {
    const { data } = await getClubsContent();
    const formatted: any = {};
    data?.forEach(item => { formatted[item.section_name] = item; });
    setClubsContent(formatted);
  }

  async function loadClubsStatistics() {
    const { data } = await getClubStatistics();
    setClubsStatistics(data || []);
  }

  async function loadOrganizations() {
    const { data } = await getOrganizations();
    setOrganizations(data || []);
  }

  async function loadCommittees() {
    const { data } = await getCommittees();
    setCommittees(data || []);
  }

  async function loadColleges() {
    const { data } = await getColleges();
    setColleges(data || []);
  }

  async function loadDepartmentContent() {
    const { data } = await getDepartmentContent();
    const formatted: any = {};
    data?.forEach(item => { formatted[item.section_name] = item; });
    setDepartmentContent(formatted);
  }

  async function loadAboutStats() {
    const { data } = await getAboutStats();
    setAboutStats(data || []);
  }

  async function loadFeatures() {
    const { data } = await getHomepageFeatures();
    setFeatures(data || []);
  }

  async function loadCoreValues() {
    const { data } = await getCoreValues();
    setCoreValues(data || []);
  }

  async function loadFacultyMembers() {
    const { data } = await getFacultyMembers();
    setFacultyMembers(data || []);
    const deanMember = data?.find(member => member.member_type === 'dean');
    setDean(deanMember || null);
  }

  async function loadDepartments() {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (!error && data) setDepartments(data || []);
  }

  async function loadStats() {
    const { data } = await getHomepageStats();
    setStats(data || []);
  }

  async function loadCoreValueCards() {
    const { data } = await getCoreValueCards();
    setCoreValueCards(data || []);
  }

  async function loadAnnouncements() {
    const { data } = await getHomepageAnnouncements();
    setAnnouncements(data || []);
  }

  async function loadHomepageContent() {
    const { data } = await getHomepageContent();
    const formatted: any = {};
    data?.forEach(item => { formatted[item.section_name] = item; });
    setHomeContent(formatted);
  }

  async function loadAboutContent() {
    const { data } = await getAboutContent();
    const formatted: any = {};
    data?.forEach(item => {
      formatted[item.section_name] = {
        title: item.title,
        description: item.description,
        content: item.content,
        image: item.image,
        badge_number: item.badge_number,
      };
    });
    setAboutContent(formatted);
  }

  async function saveAboutPage() {
    await saveCoreValues(coreValues);
    await saveAboutStats(aboutStats);
    await saveFacultyMembers(facultyMembers);
    await saveCoreValueCards(coreValueCards);
    const { error } = await saveAboutContent(aboutContent);
    if (error) {
      setModalMessage(error.message);
      setShowSuccessModal(true);
      return;
    }
    setModalMessage('About Page Updated Successfully!');
    setShowSuccessModal(true);
  }

  async function saveHomePage() {
    const { error: contentError } = await saveHomepageContent(homeContent);
    if (contentError) {
      setModalMessage(`Error: ${contentError.message}`);
      setShowSuccessModal(true);
      return;
    }
    const { error: statsError } = await saveHomepageStats(stats);
    if (statsError) {
      setModalMessage(`Error: ${statsError.message}`);
      setShowSuccessModal(true);
      return;
    }
    setModalMessage('Homepage updated successfully!');
    setShowSuccessModal(true);
  }

  async function saveDepartmentsPage() {
    await saveColleges(colleges);
    await saveDepartmentContent(departmentContent);
    setModalMessage('Departments Page Updated Successfully!');
    setShowSuccessModal(true);
  }

  function updateHomepageField(section: string, field: string, value: string) {
    setHomeContent((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  function updateAboutField(section: string, field: string, value: string) {
    setAboutContent((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  async function loadAchievementsPage() {
    try {
      const [pageContent, banner, bannerStats, statistics, topnotchers, collegeAchievements] = await Promise.all([
        achievementsService.getPageContent(),
        achievementsService.getBanner(),
        achievementsService.getBannerStats(),
        achievementsService.getStatistics(),
        achievementsService.getTopnotchers(),
        achievementsService.getCollegeAchievements(),
      ]);
      setAchievementPageContent(pageContent);
      setAchievementBanner(banner);
      setAchievementBannerStats(bannerStats || []);
      setAchievementStatistics(statistics || []);
      setAchievementTopnotchers(topnotchers || []);
      setAchievementCollegeAchievements(collegeAchievements || []);
    } catch (error) {
      console.error('Failed loading achievements', error);
    }
  }

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Landing Page Management</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
        {pages.map((page) => (
          <button
            key={page.key}
            onClick={() => setActivePage(page.key as any)}
            className={`h-14 w-full rounded-2xl flex items-center justify-center font-semibold text-sm transition-all duration-300 border shadow-sm ${
              activePage === page.key
                ? 'bg-[#27469C] text-white border-[#27469C] shadow-lg scale-[1.02]'
                : 'bg-[#F8FBFF] text-[#2563EB] border-[#D6E4FF] hover:bg-[#EEF5FF] hover:border-[#7BA8FF] hover:shadow-md'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {activePage === "homepage" && (
        <HomePageEditor
          homeContent={homeContent}
          updateHomepageField={updateHomepageField}
          features={features}
          setFeatures={setFeatures}
          stats={stats}
          setStats={setStats}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
        />
      )}
      {activePage === "about" && (
        <AboutPageEditor
          aboutContent={aboutContent}
          updateAboutField={updateAboutField}
          coreValues={coreValues}
          setCoreValues={setCoreValues}
          facultyMembers={facultyMembers}
          setFacultyMembers={setFacultyMembers}
          departments={departments}
          aboutStats={aboutStats}
          setAboutStats={setAboutStats}
          coreValueCards={coreValueCards}
          setCoreValueCards={setCoreValueCards}
        />
      )}
      {activePage === "departments" && (
        <DepartmentsPageEditor
          departmentContent={departmentContent}
          updateDepartmentField={updateDepartmentField}
          colleges={colleges}
          setColleges={setColleges}
        />
      )}
      {activePage === "clubs" && (
        <ClubsPageEditor
          clubsContent={clubsContent}
          updateClubsField={updateClubsField}
          statistics={clubsStatistics}
          setStatistics={setClubsStatistics}
          organizations={organizations}
          setOrganizations={setOrganizations}
          committees={committees}
          setCommittees={setCommittees}
        />
      )}
      {activePage === "research" && (
        <ResearchPageEditor
          researchContent={researchContent}
          updateResearchField={updateResearchField}
          publications={researchPublications}
          setPublications={setResearchPublications}
          awards={researchAwards}
          setAwards={setResearchAwards}
          alumni={featuredAlumni}
          setAlumni={setFeaturedAlumni}
        />
      )}
      {activePage === "achievements" && (
        <AchievementsPageEditor
          content={achievementPageContent}
          setContent={setAchievementPageContent}
          statistics={achievementStatistics}
          setStatistics={setAchievementStatistics}
          topnotchers={achievementTopnotchers}
          setTopnotchers={setAchievementTopnotchers}
          achievements={achievementCollegeAchievements}
          setAchievements={setAchievementCollegeAchievements}
          banner={achievementBanner}
          setBanner={setAchievementBanner}
          bannerStats={achievementBannerStats}
          setBannerStats={setAchievementBannerStats}
        />
      )}
      {activePage === "accreditation" && (
        <AccreditationPageEditor
          content={accreditationContent}
          setContent={setAccreditationContent}
          overview={overviewItems}
          setOverview={setOverviewItems}
          levels={levels}
          setLevels={setLevels}
          programs={programs}
          setPrograms={setPrograms}
          certifications={certifications}
          setCertifications={setCertifications}
        />
      )}
      {activePage === "contact" && (
        <ContactPageEditor
          content={contactContent}
          setContent={setContactContent}
          officeHours={officeHours}
          setOfficeHours={setOfficeHours}
          socialLinks={socialLinks}
          setSocialLinks={setSocialLinks}
        />
      )}
      {activePage === "footer" && (
        <FooterPageEditor
          content={footerContent}
          setContent={setFooterContent}
          quickLinks={footerQuickLinks}
          setQuickLinks={setFooterQuickLinks}
          socialLinks={footerSocialLinks}
          setSocialLinks={setFooterSocialLinks}
        />
      )}

      <div className="flex gap-4 mt-6">
        <button onClick={() => setShowPreview(true)} className="px-6 py-3 bg-gray-700 text-white rounded-lg">
          Preview {pageTitles[activePage]}
        </button>
        <button onClick={() => saveHandlers[activePage]()} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Save {pageTitles[activePage]}
        </button>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Success</h2>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button onClick={() => setShowSuccessModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg">OK</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="bg-white h-screen flex flex-col">
            <div className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1E3A8A]">Website Preview</h2>
                <p className="text-xs text-gray-500">Previewing: <span className="capitalize">{activePage}</span></p>
              </div>
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#172554] transition">
                Close Preview
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              {activePage === 'homepage' ? (
                <HomePage previewMode previewContent={homeContent} previewFeatures={features} previewStats={stats} previewAnnouncements={announcements} />
              ) : activePage === 'about' ? (
                <AboutPage previewMode previewContent={aboutContent} previewStats={aboutStats} previewFacultyMembers={facultyMembers} previewCoreValues={coreValues} previewCoreValueCards={coreValueCards} previewDepartments={departments} />
              ) : activePage === 'departments' ? (
                <DepartmentsPage previewMode previewContent={departmentContent} previewColleges={colleges} />
              ) : activePage === 'clubs' ? (
                <ClubsPage previewMode previewContent={clubsContent} previewStatistics={clubsStatistics} previewOrganizations={organizations} previewCommittees={committees} />
              ) : activePage === 'research' ? (
                <ResearchPage previewMode previewContent={researchContent} previewPublications={researchPublications} previewAchievements={researchAwards} previewAlumni={featuredAlumni} />
              ) : activePage === 'achievements' ? (
                <AchievementsPage previewMode previewContent={achievementPageContent} previewBanner={achievementBanner} previewBannerStats={achievementBannerStats} previewStatistics={achievementStatistics} previewTopnotchers={achievementTopnotchers} previewCollegeAchievements={achievementCollegeAchievements} />
              ) : activePage === 'accreditation' ? (
                <AccreditationPage previewMode previewContent={accreditationContent} previewOverview={overviewItems} previewLevels={levels} previewPrograms={programs} previewCertifications={certifications} />
              ) : activePage === 'footer' ? (
                <Footer previewMode previewContent={footerContent} previewQuickLinks={footerQuickLinks} previewSocialLinks={footerSocialLinks} />
              ) : activePage === 'contact' ? (
                <ContactPage previewMode previewContent={contactContent} previewOfficeHours={officeHours} previewSocialLinks={socialLinks} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── System Settings ──────────────────────────────────────────────────────────
const NOTIF_DEFAULTS = {
  inquiries: true,
  reports: true,
  announcements: true,
  staffUpdates: false,
  systemNotifs: true,
};

interface Delegate {
  id: string;
  name: string;
  email: string;
  role: string;
}

const SETTINGS_TABS = [
  { id: 'profile',       label: 'Profile Information', icon: User },
  { id: 'security',      label: 'Password & Security',  icon: KeyRound },
  { id: 'notifications', label: 'Notifications',        icon: Bell },
  { id: 'academic',      label: 'Academic Settings',     icon: GraduationCap },
  { id: 'delegates',     label: 'Delegate Access',       icon: UserCheck },
  { id: 'backup',        label: 'Backup & Maintenance',  icon: Settings },
  { id: 'account',       label: 'Account Actions',       icon: LogOut },
] as const;

type SettingsTabId = typeof SETTINGS_TABS[number]['id'];

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#1E3A8A]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

function SystemSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

  const [programs, setPrograms] = useState<string[]>([...DEFAULT_PROGRAMS]);
  const [newProgram, setNewProgram] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [notifs, setNotifs] = useState(NOTIF_DEFAULTS);

  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [delegateEmail, setDelegateEmail] = useState('');
  const [delegateError, setDelegateError] = useState('');

  const addProgram = () => {
    const trimmed = newProgram.trim().toUpperCase();
    if (!trimmed || programs.includes(trimmed)) return;
    setPrograms(prev => [...prev, trimmed]);
    setNewProgram('');
  };

  const deleteProgram = (idx: number) => setPrograms(prev => prev.filter((_, i) => i !== idx));

  const startEdit = (idx: number) => { setEditIdx(idx); setEditVal(programs[idx]); };
  const saveEdit = () => {
    if (editIdx === null) return;
    const trimmed = editVal.trim().toUpperCase();
    if (!trimmed) return;
    setPrograms(prev => prev.map((p, i) => (i === editIdx ? trimmed : p)));
    setEditIdx(null);
  };

  const toggleNotif = (key: keyof typeof NOTIF_DEFAULTS) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  const addDelegate = () => {
    const trimmed = delegateEmail.trim();
    setDelegateError('');
    if (!trimmed) { setDelegateError('Please enter an email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setDelegateError('Please enter a valid email address.'); return; }
    if (delegates.some(d => d.email.toLowerCase() === trimmed.toLowerCase())) {
      setDelegateError('This person is already a delegate.');
      return;
    }
    setDelegates(prev => [...prev, { id: Date.now().toString(), name: trimmed.split('@')[0], email: trimmed, role: 'Delegate' }]);
    setDelegateEmail('');
  };

  const removeDelegate = (id: string) => setDelegates(prev => prev.filter(d => d.id !== id));

  const activeLabel = SETTINGS_TABS.find(t => t.id === activeTab)?.label ?? '';

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">System Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Academic Year */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Academic Year Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Academic Year</label>
              <input type="text" defaultValue="2025-2026" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base">
                <option>Second Semester</option>
                <option>First Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">Update Settings</button>
          </div>
        </div>

        {/* Programs Management */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Programs Management</h2>
          <div className="space-y-2 mb-4">
            {programs.map((prog, idx) => (
              <div key={prog} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                {editIdx === idx ? (
                  <>
                    <input value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditIdx(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-gray-800">{prog}</span>
                    <button onClick={() => startEdit(idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteProgram(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newProgram} onChange={e => setNewProgram(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProgram()}
              placeholder="New program (e.g. BSED-SCIENCE)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addProgram} className="px-3 sm:px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-medium hover:bg-[#1E40AF] transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 md:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Backup & Maintenance</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              <Download className="w-5 h-5" /> Create Backup
            </button>
            <button className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              <Settings className="w-5 h-5" /> System Maintenance
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              Last backup: February 13, 2026 at 2:00 AM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}