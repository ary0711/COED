import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { createPortal } from 'react-dom';
import { notifyRole, sendNotification } from '../notificationService';
import { HomePage } from './coed/HomePage';
import { AboutPage } from './coed/AboutPage';
import { ClubsPage } from './coed/ClubsPage';
import { ResearchPage } from './coed/ResearchPage';
import { DepartmentsPage } from './coed/DepartmentsPage';
import { AchievementsPage } from './coed/AchievementsPage';
import { AccreditationPage } from './coed/AccreditationPage';
import { ContactPage } from './coed/ContactPage';
import { sendBackendNotification } from '../notificationsApi';
import { Footer } from './coed/Footer';
import HomePageEditor from './pages/HomePageEditor';
import AnnouncementsContent from './AnnouncementsContent';
import AboutPageEditor from './pages/AboutPageEditor';
import DepartmentsPageEditor from './pages/DepartmentsPageEditor';
import AccreditationWorkspace from './AccreditationWorkspace'; 
import ClubsPageEditor from './pages/ClubsPageEditor';
import ResearchPageEditor from './pages/ResearchPageEditor';
import AchievementsPageEditor from './pages/AchievementsPageEditor';
import AccreditationPageEditor from './pages/AccreditationPageEditor';
import ContactPageEditor from './pages/ContactPageEditor';
import { FacultyStaffManagement } from './FacultyStaffManagement';
import { ReportsAnalytics } from './ReportsAnalytics'; 
import FooterPageEditor from './pages/FooterPageEditor';
import {
  getHomepageContent, getHomepageStats, getHomepageFeatures, getHomepageAnnouncements, saveHomepageContent, saveHomepageStats,saveHomepageFeatures
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
  ExternalLink,
  Edit,
  Trash2,
  Download,
  Upload,
  UploadCloud, // Gi-add ni para sa drag and drop icon
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
  FolderArchive,
  KeyRound,
  Loader2,
  Building,
  Target,
  DollarSign,
  Calendar as CalendarIcon,
  Archive,
  MapPin,
  Clock,
  Tag,
  Globe,
  Filter,
  CalendarDays,
  Pencil,
  Save,
  AlertCircle,
   FileCode,
  FileImage,
  File as FileGenericIcon,
  AlertTriangle,
  HelpCircle,
  Mail,
  Folder,
} from 'lucide-react';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { supabase } from '../supabaseClient';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';

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

const CONTACT_INQUIRY_CATEGORIES = [
  'General',
  'Admissions',
  'Partnerships',
  'Careers',
  'Feedback',
  'Other',
];

const CONTACT_API_TABLE = 'contact_messages';

interface Inquiry {
  id: string;
  sender_role: 'student' | 'alumni';
  sender_name?: string | null;
  sender_email?: string | null;
  subject: string;
  message: string;
  category?: string | null;
  status: 'pending' | 'answered';
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  is_read: boolean;

  profiles?: {
    full_name?: string | null;
    id_number?: string | null;
  } | null;
}

interface ContactMessage {
id: string | number;
full_name: string;
email: string | null;
subject: string;
message: string;
category?: string | null;
status: 'pending' | 'answered';
reply?: string | null;
replied_at?: string | null;
created_at: string;
is_read: boolean;
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
  { icon: FileText,        label: 'Academic Records',        id: 'records' },
  { icon: Folder,          label: 'Accreditation Management', id: 'accreditation' },
  { icon: GraduationCap,   label: 'Faculty',         id: 'faculty' },
  { icon: Calendar,        label: 'Calendar & Activities',   id: 'calendar' },
  { icon: Award,           label: 'Research & Achievements', id: 'research' },
  { icon: UserCheck,       label: 'Alumni Tracer',           id: 'alumni' },
  { icon: MessageCircle,   label: 'Inquiries',               id: 'inquiries' },
  { icon: BarChart3,       label: 'Quarterly Reports',       id: 'reports' },
  { icon: Megaphone,       label: 'Announcements',           id: 'announcements' },
  { icon: Settings,        label: 'System Settings',         id: 'settings' },
];

interface CollegeDeanDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onLogout?: () => void;
  userName?: string;
}

export function CollegeDeanDashboard({
  activeMenuItem,
  setActiveMenuItem,
  onLogout,
  userName,
}: CollegeDeanDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inquiriesInitialTab, setInquiriesInitialTab] = useState<
    'student' | 'alumni' | 'contact'
  >('student');

  const [currentProfile, setCurrentProfile] = useState({
  fullName: '',
  email: '',
});
  useEffect(() => {
  const loadCurrentProfile = async () => {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.profile) {
        console.error(
          'Failed to load current profile:',
          data.error
        );
        return;
      }

      setCurrentProfile({
        fullName: data.profile.full_name || '',
        email: data.profile.email || '',
      });

      localStorage.setItem(
        'userFullName',
        data.profile.full_name || ''
      );

      localStorage.setItem(
        'userEmail',
        data.profile.email || ''
      );

    } catch (error) {
      console.error(
        'Failed to load current profile:',
        error
      );
    }
  };

  loadCurrentProfile();
}, []);
  const handleMenuItemClick = (id: string) => {
    setActiveMenuItem(id);
    setSidebarOpen(false);
  };

  const handleNavigate = (
    menuItem: string,
    subTab?: string
  ) => {
    setActiveMenuItem(menuItem);

    if (menuItem === 'inquiries' && subTab) {
      setInquiriesInitialTab(
        subTab as 'student' | 'alumni' | 'contact'
      );
    }
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
  userName={currentProfile.fullName}
/>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeMenuItem === 'dashboard'     && <DashboardView onNavigate={handleNavigate} />}
          {activeMenuItem === 'users'         && <UserManagement />}
          {activeMenuItem === 'records'       && <AcademicRecords />}
          {activeMenuItem === 'accreditation' && <AccreditationWorkspace userRole="dean" />} 
          {activeMenuItem === 'faculty'       && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar'      && <CalendarActivities />}
          {activeMenuItem === 'research'      && <ResearchAchievements />}
          {activeMenuItem === 'alumni'        && <AlumniTracer />}
          {activeMenuItem === 'inquiries'     && <InquiriesManagement initialTab={inquiriesInitialTab} />}
          {activeMenuItem === 'announcements' && <AnnouncementsContent />}
          {activeMenuItem === 'reports'       && <ReportsAnalytics />}
          {activeMenuItem === 'settings' && (
    <SystemSettings
      profile={currentProfile}
      onProfileUpdate={(updatedProfile) => {
        setCurrentProfile((prev) => ({
          ...prev,
          ...updatedProfile,
        }));
      }}
      onLogout={onLogout}
    />
  )}
</main>
      </div>
    </div>
  );
}

// ─── Alumni Employment Summary Card (Dashboard) ───────────────────────────────
function AlumniEmploymentCard() {
  const [totalAlumniCount, setTotalAlumniCount] = useState<number>(0);
  const [responsesCount, setResponsesCount] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<{ employed: number; selfEmployed: number; unemployed: number }>({
    employed: 0,
    selfEmployed: 0,
    unemployed: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const { count: alumniTotal } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumni');
      setTotalAlumniCount(alumniTotal ?? 0);

      const { data: records } = await supabase
        .from('graduate_tracer_survey')
        .select('employment_status');

      const list = records ?? [];
      setResponsesCount(list.length);
      setStatusCounts({
        employed: list.filter((r: any) => r.employment_status === 'employed').length,
        selfEmployed: list.filter((r: any) => r.employment_status === 'self-employed').length,
        unemployed: list.filter((r: any) => r.employment_status === 'unemployed').length,
      });
    } catch (err) {
      console.error('Failed to load alumni employment stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const channelName = `dashboard-alumni-employment-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'graduate_tracer_survey' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  const responseRate = totalAlumniCount > 0 ? Math.round((responsesCount / totalAlumniCount) * 100) : 0;

  // Fallback to demo data if 0 responses exist so you can preview the design layout
  const isDemo = responsesCount === 0;
  const displayCounts = isDemo
    ? { employed: 5, selfEmployed: 2, unemployed: 1 }
    : statusCounts;

  const pieData = [
    { name: 'Employed', value: displayCounts.employed, color: '#10B981' },
    { name: 'Self-Employed', value: displayCounts.selfEmployed, color: '#3B82F6' },
    { name: 'Not Employed', value: displayCounts.unemployed, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#1E3A8A]" />
          <span className="text-sm font-semibold text-gray-800">Alumni Employment Status</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
          {loading ? '—' : `${responseRate}% response`}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">Loading...</div>
        ) : (
          <>
            

            {/* Quick Stats Summary Cards */}
            <div className="grid grid-cols-3 gap-2 mb-2 flex-shrink-0">
              <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
                <p className="text-[10px] font-medium text-emerald-800">Employed</p>
                <p className="text-base font-bold text-emerald-700">{displayCounts.employed}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                <p className="text-[10px] font-medium text-blue-800">Self-Employed</p>
                <p className="text-base font-bold text-blue-700">{displayCounts.selfEmployed}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-2 text-center border border-rose-100">
                <p className="text-[10px] font-medium text-rose-800">Not Employed</p>
                <p className="text-base font-bold text-rose-700">{displayCounts.unemployed}</p>
              </div>
            </div>

            <div className="flex-1 min-h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="75%"
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} alumni`, name]} />
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="circle"
                    formatter={(value: string) => <span style={{ fontSize: 11, color: '#374151' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-1 flex-shrink-0">
          {responsesCount} of {totalAlumniCount} total alumni surveyed
        </p>
      </div>
    </div>
  );
}

// ─── Inquiries Summary Card (Dashboard) ───────────────────────────────────────
// ─── Inquiries Summary Card (Dashboard) ───────────────────────────────────────
function InquiriesSummaryCard({ onNavigateToInquiries }: { onNavigateToInquiries: (tab?: 'student' | 'alumni' | 'contact') => void }) {
  const [studentPending, setStudentPending] = useState(0);
  const [alumniPending, setAlumniPending]   = useState(0);
  const [contactPending, setContactPending] = useState(0);
  const [recent, setRecent]                 = useState<Inquiry[]>([]);
  const [loading, setLoading]               = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: contactData, error: contactError }] = await Promise.all([
      supabase
        .from('inquiries')
        .select('*, profiles(full_name, id_number)')
        .order('created_at', { ascending: false }),
      supabase
        .from(CONTACT_API_TABLE)
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (!error && data) {
      setStudentPending(data.filter((i: Inquiry) => i.sender_role === 'student' && i.status === 'pending').length);
      setAlumniPending(data.filter((i: Inquiry) => i.sender_role === 'alumni' && i.status === 'pending').length);
      setRecent(data.filter((i: Inquiry) => i.status === 'pending').slice(0, 3));
    }
    if (!contactError && contactData) {
      setContactPending(contactData.filter((c: ContactMessage) => c.status === 'pending').length);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    const channelName = `dashboard-inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => fetchSummary())
      .on('postgres_changes', { event: '*', schema: 'public', table: CONTACT_API_TABLE }, () => fetchSummary())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSummary]);

  const totalPending = studentPending + alumniPending + contactPending;

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
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button 
            onClick={() => onNavigateToInquiries('student')}
            className="rounded-xl p-3 text-left transition-transform hover:scale-105 active:scale-95 border-none outline-none cursor-pointer" 
            style={{ backgroundColor: '#DBEAFE' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#1D4ED8', opacity: 0.8 }}>Student</p>
            <p className="text-2xl font-bold leading-none" style={{ color: '#1D4ED8' }}>{loading ? '—' : studentPending}</p>
            <p className="text-[11px] mt-1" style={{ color: '#1D4ED8', opacity: 0.65 }}>unreplied</p>
          </button>
          <button 
            onClick={() => onNavigateToInquiries('alumni')}
            className="rounded-xl p-3 text-left transition-transform hover:scale-105 active:scale-95 border-none outline-none cursor-pointer" 
            style={{ backgroundColor: '#FCE7F3' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#BE185D', opacity: 0.8 }}>Alumni</p>
            <p className="text-2xl font-bold leading-none" style={{ color: '#BE185D' }}>{loading ? '—' : alumniPending}</p>
            <p className="text-[11px] mt-1" style={{ color: '#BE185D', opacity: 0.65 }}>unreplied</p>
          </button>
          <button 
            onClick={() => onNavigateToInquiries('contact')}
            className="rounded-xl p-3 text-left transition-transform hover:scale-105 active:scale-95 border-none outline-none cursor-pointer" 
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#059669', opacity: 0.8 }}>Contact</p>
            <p className="text-2xl font-bold leading-none" style={{ color: '#059669' }}>{loading ? '—' : contactPending}</p>
            <p className="text-[11px] mt-1" style={{ color: '#059669', opacity: 0.65 }}>unreplied</p>
          </button>
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
          onClick={() => onNavigateToInquiries()}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-50 py-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
        >
          View all inquiries <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ onNavigate }: { onNavigate: (menuItem: string, subTab?: string) => void }) {
  const [facultyCount, setFacultyCount] = useState<number>(0);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [studentLoading, setStudentLoading] = useState(true);
  const [departmentCount, setDepartmentCount] = useState<number>(0);
  const [departmentLoading, setDepartmentLoading] = useState(true);

  // Dynamic live state for reports & tracer
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [pendingReportsLoading, setPendingReportsLoading] = useState(true);
  const [alumniResponsesCount, setAlumniResponsesCount] = useState<number>(0);
  const [tracerLoading, setTracerLoading] = useState(true);
  const [tracerResponseRate, setTracerResponseRate] = useState<number>(0);

  // --- STATES FOR DEPARTMENT MODAL ---
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  // UPDATE: Gi-add ang staff diri sa state type
  const [deptStats, setDeptStats] = useState<{ name: string; faculty: number; students: number }[]>([]);
  const [loadingDeptStats, setLoadingDeptStats] = useState(false);

  // Function to fetch department statistics dynamically
  const openDeptModal = async () => {
  setIsDeptModalOpen(true);
  setLoadingDeptStats(true);
  try {
    const token = localStorage.getItem('token');

    // 1. Official departments + users (parehas nga source sa User Management)
    const [{ data: depts }, usersRes] = await Promise.all([
      supabase.from('departments').select('id, name, code'),
      fetch('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    let users: any[] = [];
    if (usersRes.ok) {
      users = (await usersRes.json()) ?? [];
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, department, program');
      users = data ?? [];
    }

    // "BSEd-Math" / "BSED-MATH" / "bsed math" -> "BSEDMATH"
    const norm = (s?: string | null) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    const statsMap: Record<string, { name: string; faculty: number; students: number }> = {};
    const aliasToKey: Record<string, string> = {};
    const idToKey: Record<string, string> = {};

    (depts ?? []).forEach((d) => {
      statsMap[d.id] = { name: d.name.trim(), faculty: 0, students: 0 };
      idToKey[d.id] = d.id;
      aliasToKey[norm(d.name)] = d.id;
      if (d.code) aliasToKey[norm(d.code)] = d.id;
    });

    // Mo-return og list sa department keys nga mo-match sa text
    const resolveText = (val?: string | null): string[] => {
      const n = norm(val);
      if (!n) return [];
      if (aliasToKey[n]) return [aliasToKey[n]]; // exact match
      const keys = new Set<string>();
      Object.entries(aliasToKey).forEach(([alias, key]) => {
        if (alias.startsWith(n) || n.startsWith(alias)) keys.add(key);
      });
      return Array.from(keys);
    };

    const parseArr = (v: any): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch { return []; }
    };

    const unmatched: any[] = [];

    users.forEach((u) => {
      const isStudent = u.role === 'student';
      const isFaculty = u.role === 'faculty' || u.role === 'department_chair';
      if (!isStudent && !isFaculty) return;

      const keys = new Set<string>();

      // a) department_ids (UUID)
      parseArr(u.department_ids).forEach((id) => idToKey[id] && keys.add(idToKey[id]));
      // b) program / department (text)
      [u.program, u.department].forEach((t) => resolveText(t).forEach((k) => keys.add(k)));
      // c) programs array (text)
      parseArr(u.programs).forEach((t) => resolveText(t).forEach((k) => keys.add(k)));

      if (keys.size === 0) {
        unmatched.push({ name: u.full_name ?? u.username, role: u.role, program: u.program, department: u.department });
        return;
      }

      keys.forEach((k) => {
        if (isStudent) statsMap[k].students++;
        else statsMap[k].faculty++;
      });
    });

    if (unmatched.length) {
      console.warn('Users na wala ma-ihap sa bisan unsang department:', unmatched);
    }

    setDeptStats(Object.values(statsMap).sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    console.error('Failed to load department stats:', err);
  } finally {
    setLoadingDeptStats(false);
  }
};

  // 1. Department count
  useEffect(() => {
    const loadDepartmentCount = async () => {
      try {
        setDepartmentLoading(true);
        const response = await fetch('http://localhost:5000/api/departments/count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          const { count } = await supabase.from('departments').select('*', { count: 'exact', head: true });
          setDepartmentCount(count ?? 0);
          return;
        }
        setDepartmentCount(Number(result.count) || 0);
      } catch {
        const { count } = await supabase.from('departments').select('*', { count: 'exact', head: true });
        setDepartmentCount(count ?? 0);
      } finally {
        setDepartmentLoading(false);
      }
    };
    loadDepartmentCount();
  }, []);

  // 2. Faculty count
  useEffect(() => {
    const loadFacultyCount = async () => {
      try {
        setFacultyLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/faculty-count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
          setFacultyCount(count ?? 0);
          return;
        }
        setFacultyCount(Number(result.count) || 0);
      } catch {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
        setFacultyCount(count ?? 0);
      } finally {
        setFacultyLoading(false);
      }
    };
    loadFacultyCount();
  }, []);

  // 3. Student count
  useEffect(() => {
    const loadStudentCount = async () => {
      try {
        setStudentLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/student-count');
        const result = await response.json();
        if (!response.ok || !result.success) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
          setStudentCount(count ?? 0);
          return;
        }
        setStudentCount(Number(result.count) || 0);
      } catch {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
        setStudentCount(count ?? 0);
      } finally {
        setStudentLoading(false);
      }
    };
    loadStudentCount();
  }, []);

  // 4. Pending Accomplishment Reports count (Backend API + Supabase fallback)
  const loadPendingReports = useCallback(async () => {
    setPendingReportsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/accomplishment-reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pending = (data || []).filter((r: any) => r.status === 'submitted').length;
        setPendingReportsCount(pending);
      } else {
        const { count } = await supabase
          .from('accomplishment_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted');
        setPendingReportsCount(count ?? 0);
      }
    } catch {
      const { count } = await supabase
        .from('accomplishment_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
      setPendingReportsCount(count ?? 0);
    } finally {
      setPendingReportsLoading(false);
    }
  }, []);

  // 5. Accurate Graduate Tracer Survey responses from public.graduate_tracer_survey
  const loadTracerStats = useCallback(async () => {
    setTracerLoading(true);
    try {
      const { count: alumniTotal } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumni');

      const { count: surveyCount } = await supabase
        .from('graduate_tracer_survey')
        .select('*', { count: 'exact', head: true });

      const responses = surveyCount ?? 0;
      setAlumniResponsesCount(responses);

      if (alumniTotal && alumniTotal > 0) {
        setTracerResponseRate(Math.round((responses / alumniTotal) * 100));
      } else {
        setTracerResponseRate(0);
      }
    } catch (err) {
      console.error('Failed to load tracer count:', err);
    } finally {
      setTracerLoading(false);
    }
  }, []);

  // Initial load & Realtime sync
  useEffect(() => {
    loadPendingReports();
    loadTracerStats();

    const channelName = `dashboard-metrics-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'graduate_tracer_survey' }, () => loadTracerStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accomplishment_reports' }, () => loadPendingReports())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadTracerStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPendingReports, loadTracerStats]);

  const mobileMetrics = [
    { label: 'Total Faculty', target: 'faculty', value: facultyLoading ? '...' : facultyCount.toLocaleString(), sub: 'Faculty members', color: '#1E3A8A', bg: '#DBEAFE' },
    { label: 'Total Students', target: 'users', value: studentLoading ? '...' : studentCount.toLocaleString(), sub: 'Active student accounts', color: '#065F46', bg: '#D1FAE5' },
    { label: 'Active Departments', target: 'departments_modal', value: departmentLoading ? '...' : departmentCount.toLocaleString(), sub: 'Click to view breakdown', color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Pending Reports', target: 'reports', value: pendingReportsLoading ? '...' : pendingReportsCount.toLocaleString(), sub: 'Awaiting Dean review', color: '#B45309', bg: '#FEF3C7' },
    { label: 'Alumni Responses', target: 'alumni', value: tracerLoading ? '...' : alumniResponsesCount.toLocaleString(), sub: `${tracerResponseRate}% response rate`, color: '#BE185D', bg: '#FCE7F3' },
    { label: 'Evaluation Rating', target: '', value: '4.6', sub: 'Out of 5.0 avg.', color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Research Submitted', target: 'research', value: '14', sub: '2 pending approval', color: '#065F46', bg: '#D1FAE5' },
    { label: 'Completion Rate', target: '', value: '94%', sub: 'Student evaluations', color: '#9D174D', bg: '#FCE7F3' },
  ];

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-4">
        {/* MOBILE */}
        <div className="flex gap-3 overflow-x-auto pb-4 sm:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {[
            { title: 'Total Faculty', target: 'faculty', value: facultyLoading ? '...' : facultyCount.toLocaleString(), icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE' },
            { title: 'Total Students', target: 'users', value: studentLoading ? '...' : studentCount.toLocaleString(), icon: Users, iconColor: '#10B981', iconBgColor: '#D1FAE5' },
            { title: 'Active Departments', target: 'departments_modal', value: departmentLoading ? '...' : departmentCount.toLocaleString(), icon: Building2, iconColor: '#8B5CF6', iconBgColor: '#EDE9FE' },
            { title: 'Pending Reports', target: 'reports', value: pendingReportsLoading ? '...' : pendingReportsCount.toLocaleString(), icon: FileText, iconColor: '#F59E0B', iconBgColor: '#FEF3C7', trend: String(pendingReportsCount), trendUp: false },
            { title: 'Alumni Responses', target: 'alumni', value: tracerLoading ? '...' : alumniResponsesCount.toLocaleString(), icon: UserCheck, iconColor: '#EF4444', iconBgColor: '#FEE2E2', trend: `${tracerResponseRate}%`, trendUp: true },
          ].map((card) => (
            <div 
              key={card.title} 
              className="flex-shrink-0 w-48 h-40 cursor-pointer transition-transform hover:scale-105 active:scale-95" 
              onClick={() => card.target === 'departments_modal' ? openDeptModal() : onNavigate(card.target)}
            >
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        {/* DESKTOP */}
        <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="min-h-[160px] cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => onNavigate('faculty')}>
            <SummaryCard title="Total Faculty" value={facultyLoading ? '...' : facultyCount.toLocaleString()} icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" />
          </div>
          <div className="min-h-[160px] cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => onNavigate('users')}>
            <SummaryCard title="Total Students" value={studentLoading ? '...' : studentCount.toLocaleString()} icon={Users} iconColor="#10B981" iconBgColor="#D1FAE5" />
          </div>
          {/* Active Departments Modal Trigger */}
          <div className="min-h-[160px] cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={openDeptModal}>
            <SummaryCard title="Active Departments" value={departmentLoading ? '...' : departmentCount.toLocaleString()} icon={Building2} iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
          </div>
          <div className="min-h-[160px] cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => onNavigate('reports')}>
            <SummaryCard title="Pending Reports" value={pendingReportsLoading ? '...' : pendingReportsCount.toLocaleString()} icon={FileText} iconColor="#F59E0B" iconBgColor="#FEF3C7" trend={String(pendingReportsCount)} trendUp={false} />
          </div>
          <div className="min-h-[160px] cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={() => onNavigate('alumni')}>
            <SummaryCard title="Alumni Responses" value={tracerLoading ? '...' : alumniResponsesCount.toLocaleString()} icon={UserCheck} iconColor="#EF4444" iconBgColor="#FEE2E2" trend={`${tracerResponseRate}%`} trendUp={true} />
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
            <div 
              key={m.label} 
              className={`rounded-2xl p-4 ${m.target ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''}`}
              style={{ backgroundColor: m.bg }}
              onClick={() => m.target === 'departments_modal' ? openDeptModal() : (m.target && onNavigate(m.target))}
            >
              <p className="text-xs font-medium mb-1" style={{ color: m.color, opacity: 0.75 }}>{m.label}</p>
              <p className="text-2xl font-bold leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs" style={{ color: m.color, opacity: 0.6 }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="min-h-0 lg:max-h-[calc(100vh-280px)] cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('alumni')}>
          <AlumniEmploymentCard />
        </div>
        <div className="min-h-0 lg:max-h-[calc(100vh-280px)]">
          <InquiriesSummaryCard onNavigateToInquiries={(tab) => onNavigate('inquiries', tab)} />
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4">
        <div className="h-80 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('alumni')}>
          <AlumniEmploymentCard />
        </div>
        <div className="h-80">
          <InquiriesSummaryCard onNavigateToInquiries={(tab) => onNavigate('inquiries', tab)} />
        </div>
      </div>

      {/* --- DEPARTMENT MODAL OVERLAY --- */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Departments Overview</h2>
                  <p className="text-[11px] text-gray-500">Live breakdown of registered accounts</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeptModalOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {loadingDeptStats ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium text-gray-500">Loading department statistics...</p>
                </div>
              ) : deptStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Building2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No official departments found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptStats.map(dept => (
                    <div 
                      key={dept.name} 
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-indigo-200 transition-colors shadow-sm"
                    >
                      <p className="font-semibold text-gray-800 text-sm truncate pr-4">{dept.name}</p>
                      
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Students stat */}
                        <div className="flex flex-col items-center" title="Total Students">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-sm font-bold text-gray-900 leading-none">{dept.students}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">Students</span>
                        </div>
                        
                        <div className="w-px h-6 bg-gray-200" />

                        {/* Faculty stat */}
                        <div className="flex flex-col items-center" title="Total Faculty">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-sm font-bold text-gray-900 leading-none">{dept.faculty}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">Faculty</span>
                        </div>

                        <div className="w-px h-6 bg-gray-200" />

                      
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="px-5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── User Management ──────────────────────────────────────────────────────────
const ID_LENGTH_CONFIG: Record<string, { length: number; label: string }> = {
  student: { length: 7, label: '7 digits' },
  faculty: { length: 6, label: '6 digits' },
  staff:   { length: 6, label: '6 digits' },
  admin:   { length: 6, label: '6 digits' },
  Admin:   { length: 6, label: '6 digits' },
  dean:    { length: 6, label: '6 digits' },
  Dean:    { length: 6, label: '6 digits' },
  department_chair: { length: 6, label: '6 digits' },
  'Department Chair': { length: 6, label: '6 digits' },
  alumni:  { length: 5, label: '5 digits' },
};

const PROGRAM_LABELS: Record<string, string> = {
  'BEED': 'Bachelor of Elementary Education',
  'BTLED': 'Bachelor of Technology and Livelihood Education',
  'BSED-MATH': 'Bachelor of Secondary Education - Major in Mathematics',
  'BSED-ENGLISH': 'Bachelor of Secondary Education - Major in English',
};

function UserManagement() {
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers]               = useState<any[]>([]);
  const [filtered, setFiltered]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const [activating, setActivating]     = useState<string | null>(null);

  const [modal, setModal]         = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected]   = useState<any | null>(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [form, setForm] = useState({
    username: '', full_name: '', email: '', role: 'student',
    id_number: '', program: '', status: 'active', password: '',
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

  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);

  useEffect(() => {
    let result = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.username || '').toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id_number.toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q) ||
        (u.program ?? '').toLowerCase().includes(q)
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
    setForm({ username: '', full_name: '', email: '', role: 'student', id_number: '', program: '', status: 'active', password: '' });
    setShowPassword(false);
    setFormError('');
    setModal('add');
  };
  
  const openEdit = (user: any) => {
    setSelected(user);
    setForm({
      username: user.username || '',
      full_name: user.full_name, email: user.email, role: user.role,
      id_number: user.id_number, 
      program: user.program || user.department || '',
      status: user.status, password: '',
    });
    setShowPassword(false);
    setFormError('');
    setModal('edit');
  };

  const handleAdd = async () => {
    setFormError('');
    if (!form.username.trim()) { setFormError('Username is required.'); return; }
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email address is required.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) { setFormError('Please enter a valid email address.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }

    const idConfig = ID_LENGTH_CONFIG[form.role];
    if (idConfig) {
      const digitRegex = new RegExp(`^\\d{${idConfig.length}}$`);
      if (!digitRegex.test(form.id_number.trim())) {
        setFormError(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} ID number must be exactly ${idConfig.length} digits.`);
        return;
      }
    }
    
    // Require program for students
    if (form.role === 'student' && !form.program) {
      setFormError('Please select a program for this student.');
      return;
    }

    if (!form.password) { setFormError('Password is required.'); return; }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // If program is empty/not assigned or role is alumni, send strictly null to backend
      const payloadProgram = form.role === 'alumni' || !form.program.trim() ? null : form.program.trim();

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          full_name: form.full_name.trim(),
          id_number: form.id_number.trim(),
          program: payloadProgram,
          department: payloadProgram, // Sent as department for strict backend validation
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
            case 409: errorMessage = 'A user with this username, email or ID number already exists.'; break;
            case 500: errorMessage = 'The server encountered an error while creating the account.'; break;
            default:  errorMessage = `Failed to create account. Server returned ${response.status}.`;
          }
        }
        setFormError(errorMessage);
        return;
      }

      setModal(null);
      setSelected(null);
      setForm({ username: '', full_name: '', email: '', role: 'student', id_number: '', program: '', status: 'active', password: '' });
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
    if (!form.username.trim()) { setFormError('Username is required.'); return; }
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }

    const idConfig = ID_LENGTH_CONFIG[form.role];
    if (idConfig) {
      const digitRegex = new RegExp(`^\\d{${idConfig.length}}$`);
      if (!digitRegex.test(form.id_number.trim())) {
        setFormError(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} ID number must be exactly ${idConfig.length} digits.`);
        return;
      }
    }
    
    // Require program for students
    if (form.role === 'student' && !form.program) {
      setFormError('Please select a program for this student.');
      return;
    }

    if (!selected) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payloadProgram = form.role === 'alumni' || !form.program.trim() ? null : form.program.trim();

      const response = await fetch(`http://localhost:5000/api/auth/users/${selected.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          id_number: form.id_number.trim(),
          program: payloadProgram,
          department: payloadProgram, // Sent as department for strict backend validation
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
      setForm({ username: '', full_name: '', email: '', role: 'student', id_number: '', program: '', status: 'active', password: '' });
      await fetchUsers();
    } catch (error: any) {
      setFormError(error.message || 'Unable to connect to the backend.');
    } finally {
      setSaving(false);
    }
  };

  const activatePending = async (user: any) => {
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
        const { data: existingUser } = await supabase.from('users').select('id').eq('username', profile.username || profile.email).single();
        if (!existingUser) {
          await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              username: profile.username || profile.email,
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

  const toggleStatus = async (user: any) => {
    if (user.status === 'pending') return;

    const nextStatus =
      user.status === 'active' ? 'inactive' : 'active';

    setStatusMessage(null);
    setActivating(user.id);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await fetch(
        `http://localhost:5000/api/auth/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          'Failed to update the account status.'
        );
      }

      await fetchUsers();

      setStatusMessage({
        type: 'success',
        text:
          `The account status for ${user.full_name} was changed to ` +
          `${nextStatus.toUpperCase()}. ` +
          (result.emailSent
            ? `An email notification was sent to ${user.email}.`
            : result.emailError
              ? `The status was saved, but the email could not be sent: ${result.emailError}`
              : 'Check the server response for email delivery status.'),
      });
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text: error.message ||
          'Unable to update the account status.',
      });
    } finally {
      setActivating(null);
    }
  };

  return (
<div className="flex h-[calc(100vh-100px)] min-h-[600px] flex-col gap-4 overflow-hidden">      
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
      
      {statusMessage && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border text-sm ${
            statusMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-start gap-2">
            {statusMessage.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{statusMessage.text}</p>
          </div>
        </div>
      )}

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
            <input type="text" placeholder="Search username, name, email, ID, or program..." value={search} onChange={e => setSearch(e.target.value)}
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
              {Object.entries(ROLE_CONFIG)
                .filter(([k]) => k !== 'admin')
                .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
           <div className="user-management-scroll min-h-0 flex-1 overflow-auto overscroll-contain">
    <table className="w-full min-w-[640px]">
             <thead className="sticky top-0 z-20 bg-gray-50">
  <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">Username</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Program</th>
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
                  const affiliation  = user.program || user.department;

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
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{user.username || '—'}</span>
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
                        <span className="text-sm text-gray-600 line-clamp-2" title={affiliation}>{affiliation ?? '—'}</span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 text-center">
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={isActivating || isPending}
                          title={
                            isPending
                              ? 'Activate this account using the Activate button'
                              : `Change account status from ${user.status}`
                          }
                          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: status.bg,
                            color: status.color,
                          }}
                        >
                          {isActivating ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: status.dot }}
                            />
                          )}
                          <span>{isActivating ? 'Updating...' : status.label}</span>
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
                          <button onClick={() => openEdit(user)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Edit User">
                            <Edit className="w-3.5 h-3.5" />
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

        
{!loading && !fetchError && total > 0 && (
  <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
    <div className="min-w-0">
      <p className="text-xs text-gray-500 sm:text-sm">
        Showing{" "}
        {((page - 1) * PAGE_SIZE) + 1}–
        {Math.min(page * PAGE_SIZE, total)} of {total} users
      </p>

      <p className="mt-1 text-xs font-medium text-gray-400">
        Page {page} of {Math.max(1, totalPages)}
      </p>
    </div>

    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() =>
          setPage((current) => Math.min(totalPages, current + 1))
        }
        disabled={page >= totalPages}
        aria-label="Next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
)}

      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 z-[99999] flex items-center justify-center bg-black/40 p-4" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: '1rem' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{formError}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                  <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
              </div>
              {modal === 'add' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className={form.role === 'alumni' ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    ID Number * ({ID_LENGTH_CONFIG[form.role]?.label || 'Digits only'})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={ID_LENGTH_CONFIG[form.role]?.length ?? 10}
                    placeholder={`e.g. ${'1'.repeat(ID_LENGTH_CONFIG[form.role]?.length ?? 6)}`}
                    value={form.id_number}
                    onChange={e => {
                      const maxLen = ID_LENGTH_CONFIG[form.role]?.length;
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setForm({
                        ...form,
                        id_number: maxLen ? cleaned.slice(0, maxLen) : cleaned,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm" 
                  />
                </div>
                
                {form.role !== 'alumni' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Program</label>
                    {form.role === 'student' ? (
                      <select 
                        value={form.program} 
                        onChange={e => setForm({ ...form, program: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      >
                        <option value="">-- Select Program --</option>
                        <option value="BEEd">Bachelor of Elementary Education</option>
                        <option value="BTLEd">Bachelor of Technology and Livelihood Education</option>
                        <option value="BSEd-Math">Bachelor of Secondary Education - Major in Mathematics</option>
                        <option value="BSEd-English">Bachelor of Secondary Education - Major in English</option>
                      </select>
                    ) : (
                      <select 
                        value={form.program} 
                        onChange={e => setForm({ ...form, program: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      >
                        <option value="">-- Not Assigned --</option>
                        <option value="BEEd">Bachelor of Elementary Education</option>
                        <option value="BTLEd">Bachelor of Technology and Livelihood Education</option>
                        <option value="BSEd">Bachelor of Secondary Education</option>
                      </select>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                  <select 
                    value={form.role} 
                    onChange={e => {
                      const nextRole = e.target.value;
                      const maxLen = ID_LENGTH_CONFIG[nextRole]?.length;
                      setForm(prev => ({
                        ...prev,
                        role: nextRole,
                        id_number: maxLen ? prev.id_number.slice(0, maxLen) : prev.id_number,
                        program: '', 
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    {Object.entries(ROLE_CONFIG)
                      .filter(([k]) => k !== 'admin')
                      .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border rounded-xl text-sm"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
    </div>
  );
}
// ─── Calendar & Activities (DEAN/ADMIN DASHBOARD) ─────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  end_date?: string | null;
  location: string | null;
  department_ids: string[] | null;
  event_type: string | null;
  audience?: string | null;
  status: string | null;
  posted_by_role: string | null;
  organizer_id?: string | null;
  created_at: string;
  updated_at: string;
  color?: string | null;
}

interface DeptOption {
  id: string;
  name: string;
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

const STANDARD_EVENT_TYPES = [
  { id: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { id: 'activity', label: 'Activity', color: '#10B981' },
  { id: 'holiday', label: 'Holiday', color: '#8B5CF6' },
  { id: 'deadline', label: 'Deadline', color: '#F59E0B' },
  { id: 'exam', label: 'Exam', color: '#EF4444' },
];

const ROLE_DISPLAY_LABEL: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  college_dean: 'Dean',
  department_chair: 'Dept. Chair',
  faculty: 'Faculty',
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'General College Community',
  alumni: 'Alumni Only',
  students: 'Students Only',
  faculty: 'Faculty Only',
};

const AUDIENCE_TO_ROLES: Record<string, string[]> = {
  all: ['student', 'alumni', 'faculty', 'department_chair', 'staff'],
  students: ['student'],
  alumni: ['alumni'],
  faculty: ['faculty', 'department_chair', 'staff'],
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function colorForCalendarEvent(ev: CalendarEvent): string {
  if (ev.color) return ev.color;
  const t = ev.event_type?.toLowerCase() || '';
  return TYPE_TO_COLOR[t] || DEFAULT_EVENT_COLOR;
}

function dateOnlyStr(isoLike: string): string {
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

export default function CalendarActivities() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [viewMode, setViewMode] = useState<'calendar' | 'archive'>('calendar');

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [inspectingEvent, setInspectingEvent] = useState<CalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyForm = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    event_type: 'activity',
    custom_event_type: '',
    event_color: '#10B981',
    audience: 'all',
    target_department_id: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYear, setArchiveYear] = useState<string>('all');
  const [archiveMonth, setArchiveMonth] = useState<string>('all');
  const [archiveType, setArchiveType] = useState<string>('all');
  const [archiveDept, setArchiveDept] = useState<string>('all');

  const getToken = () => localStorage.getItem('token');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const jumpToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

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
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (!error && data) {
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchDepartments();

    const channel = supabase
      .channel('dean-calendar-events-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...events].sort(sortEventsChronologically);
    sorted.forEach((ev) => {
      const d = dateOnlyStr(ev.event_date);
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
      .filter((e) => dateOnlyStr(e.event_date) >= todayStr)
      .sort(sortEventsChronologically);
  }, [events, todayStr]);

  const pastEvents = useMemo(() => {
    return events
      .filter((e) => dateOnlyStr(e.event_date) < todayStr)
      .sort((a, b) => sortEventsChronologically(b, a));
  }, [events, todayStr]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    pastEvents.forEach((ev) => {
      const d = dateOnlyStr(ev.event_date);
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
      const date = dateOnlyStr(ev.event_date);
      const [year, month] = date.split('-');

      if (archiveYear !== 'all' && year !== archiveYear) return false;
      if (archiveMonth !== 'all' && parseInt(month, 10) !== parseInt(archiveMonth, 10)) return false;
      if (archiveType !== 'all' && (ev.event_type || '').toLowerCase() !== archiveType) return false;
      if (archiveDept !== 'all') {
        const hasDept = ev.department_ids && ev.department_ids.includes(archiveDept);
        if (!hasDept) return false;
      }

      if (!query) return true;

      const titleMatch = ev.title?.toLowerCase().includes(query);
      const descMatch = ev.description?.toLowerCase().includes(query);
      const locMatch = ev.location?.toLowerCase().includes(query);
      const typeMatch = ev.event_type?.toLowerCase().includes(query);
      return titleMatch || descMatch || locMatch || typeMatch;
    });
  }, [pastEvents, archiveSearch, archiveYear, archiveMonth, archiveType, archiveDept]);

  const groupedArchiveEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    filteredArchiveEvents.forEach((ev) => {
      const d = dateOnlyStr(ev.event_date);
      if (!d) return;
      const dateObj = new Date(d + 'T00:00:00');
      const key = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [filteredArchiveEvents]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
    setEditingEventId(null);
  };

  const handleStartEdit = (ev: CalendarEvent) => {
    const isStandardType = STANDARD_EVENT_TYPES.some((t) => t.id === ev.event_type);
    const existingDept = ev.department_ids && ev.department_ids.length > 0 ? ev.department_ids[0] : '';

    setForm({
      title: ev.title || '',
      date: dateOnlyStr(ev.event_date) || '',
      start_time: ev.start_time ? ev.start_time.slice(0, 5) : '',
      end_time: ev.end_time ? ev.end_time.slice(0, 5) : '',
      location: ev.location || '',
      description: ev.description || '',
      event_type: isStandardType ? (ev.event_type as string) : 'other',
      custom_event_type: isStandardType ? '' : ev.event_type || '',
      event_color: ev.color || colorForCalendarEvent(ev),
      audience: ev.audience || 'all',
      target_department_id: existingDept,
    });
    setFormError('');
    setEditingEventId(ev.id);
    setShowModal(true);
    if (inspectingEvent?.id === ev.id) {
      setInspectingEvent(null);
    }
  };

  const handleSaveEvent = async () => {
    setFormError('');
    
    if (!form.title.trim() || !form.date || !form.location.trim() || !form.event_type || !form.audience) {
      setFormError('Please complete all required fields. Only the description is optional.');
      return;
    }

    // Prevent selecting a past date upon creation/edit
    if (form.date < todayStr) {
      setFormError('You cannot schedule an event on a past date.');
      return;
    }

    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setFormError('End time must be later than start time.');
      return;
    }

    let finalEventType = form.event_type;
    if (form.event_type === 'other') {
      if (!form.custom_event_type.trim()) {
        setFormError('Please specify the custom event type.');
        return;
      }
      finalEventType = form.custom_event_type.trim().toLowerCase();
    }

    setSubmitting(true);
    const isEditing = Boolean(editingEventId);
    const url = isEditing ? `${CALENDAR_API_URL}/${editingEventId}` : CALENDAR_API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          location: form.location.trim() || null,
          event_date: `${form.date}T08:00:00.000Z`,
          start_time: form.start_time ? form.start_time : null,
          end_time: form.end_time ? form.end_time : null,
          event_type: finalEventType,
          color: form.event_color,
          audience: form.audience,
          status: 'upcoming',
          target_department_id: form.target_department_id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(`Failed to ${isEditing ? 'update' : 'save'} event: ` + (err.error || res.statusText));
        return;
      }

            // Notify the audience only for NEW events (backend respects mute settings)
      if (!isEditing) {
        try {
          const when = new Date(`${form.date}T00:00:00`).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          const timeText = form.start_time ? ` at ${formatSingleTime(form.start_time)}` : '';
          const placeText = form.location.trim() ? ` · ${form.location.trim()}` : '';

          await sendBackendNotification({
            title: `New Event: ${form.title.trim()}`,
            message: `${when}${timeText}${placeText}`,
            type: 'system',
            roles: AUDIENCE_TO_ROLES[form.audience] ?? AUDIENCE_TO_ROLES.all,
            department_ids: form.target_department_id ? [form.target_department_id] : [],
          });
        } catch (notifErr) {
          console.error('Event saved but notification failed:', notifErr);
        }
      }

      await fetchEvents();
      resetForm();
      setShowModal(false);
    } catch {
      setFormError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
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
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (inspectingEvent?.id === id) {
        setInspectingEvent(null);
      }
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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

  const departmentLabel = (ev: CalendarEvent) => {
    if (!ev.department_ids || ev.department_ids.length === 0) return 'All Departments';
    const names = ev.department_ids.map((id) => departments.find((d) => d.id === id)?.name ?? 'Department');
    return names.join(', ');
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Calendar & Activities
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Schedule upcoming college activities, review event records, and browse past institutional archives.
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
              <Archive className="w-4 h-4" />
              <span>Event History</span>
              {pastEvents.length > 0 && (
                <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full">
                  {pastEvents.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-all font-medium text-sm shadow-sm active:scale-[0.99] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {loadError}
        </div>
      )}

      {/* ── Mode 1: Calendar View ── */}
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
                  className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
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
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-50 bg-gray-50/30"
                  />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayIndexInWeek = (firstDayOfMonth + day - 1) % 7;
                  const isRightmostCol = dayIndexInWeek >= 5;
                  const dateStr = `${currentMonth.getFullYear()}-${String(
                    currentMonth.getMonth() + 1
                  ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isToday = dateStr === todayStr;
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
                            isToday
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
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

                      {/* Desktop Event Pills */}
                      <div className="hidden sm:flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingEvent(ev);
                            }}
                            className="text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs hover:brightness-110 transition-all"
                            style={{ backgroundColor: colorForCalendarEvent(ev) }}
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

                      {/* Mobile Event Dots */}
                      {hasEvents && (
                        <div className="sm:hidden flex gap-1 flex-wrap px-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: colorForCalendarEvent(ev) }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                      )}

                      {/* Tooltip Hover Preview with Time Range */}
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
                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => setInspectingEvent(ev)}
                                  className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50/40 border-l-[3px] space-y-1 cursor-pointer transition-colors"
                                  style={{ borderLeftColor: colorForCalendarEvent(ev) }}
                                >
                                  <div className="text-xs font-semibold text-gray-900 leading-snug">
                                    {ev.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                    <span className="flex items-center gap-1 font-medium text-gray-700">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      {timeRangeStr}
                                    </span>
                                    {ev.event_type && (
                                      <span className="flex items-center gap-1 uppercase text-[9px] font-bold text-gray-600">
                                        <Tag className="w-2.5 h-2.5 text-gray-400" />
                                        {ev.event_type}
                                      </span>
                                    )}
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

          {/* Upcoming Agenda Panel */}
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
                <p className="text-xs font-medium">No upcoming events scheduled</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {upcomingEvents.map((ev) => {
                  const evDate = dateOnlyStr(ev.event_date);
                  const isDueToday = evDate === todayStr;
                  const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setInspectingEvent(ev)}
                      className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50/60 transition-all cursor-pointer group space-y-1.5"
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
                          style={{ backgroundColor: colorForCalendarEvent(ev) }}
                        />
                        <span className="truncate">{departmentLabel(ev)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mode 2: Event History / Archive ── */}
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
                  placeholder="Search past events by title, description, location, or type..."
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

              {(archiveSearch || archiveYear !== 'all' || archiveMonth !== 'all' || archiveType !== 'all' || archiveDept !== 'all') && (
                <button
                  onClick={() => {
                    setArchiveSearch('');
                    setArchiveYear('all');
                    setArchiveMonth('all');
                    setArchiveType('all');
                    setArchiveDept('all');
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

              <select
                aria-label="Filter by department"
                value={archiveDept}
                onChange={(e) => setArchiveDept(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredArchiveEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No events match your criteria</p>
              <p className="text-xs text-gray-400 mt-1">Try relaxing your search terms or filter constraints.</p>
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
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setInspectingEvent(ev)}
                          className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/40 hover:bg-white transition-all cursor-pointer group shadow-2xs space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                                {ev.title}
                              </h4>
                              {ev.event_type && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-600 flex-shrink-0">
                                  {ev.event_type}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">
                                {formatDate(dateOnlyStr(ev.event_date))}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {timeRangeStr}
                              </span>
                              <span>·</span>
                              <span className="truncate">{departmentLabel(ev)}</span>
                            </div>

                            {ev.location && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{ev.location}</span>
                              </div>
                            )}

                            {ev.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-gray-400">
                            <span>Posted by {ROLE_DISPLAY_LABEL[ev.posted_by_role ?? ''] ?? 'Dean'}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(ev);
                                }}
                                className="text-gray-600 hover:text-[#1E3A8A] font-semibold flex items-center gap-1 p-1 hover:bg-gray-100 rounded"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <span className="text-[#1E3A8A] font-semibold flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> View
                              </span>
                            </div>
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
      {inspectingEvent && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setInspectingEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 z-[10000] max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white mb-1"
                  style={{ backgroundColor: colorForCalendarEvent(inspectingEvent) }}
                >
                  {inspectingEvent.event_type || 'Activity'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                  {inspectingEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingEvent(null)}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-xs sm:text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Date:</span>
                <span>{formatLongDate(dateOnlyStr(inspectingEvent.event_date))}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Time:</span>
                <span>{formatEventTimeRange(inspectingEvent.start_time, inspectingEvent.end_time)}</span>
              </div>

              {inspectingEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">Location:</span>
                  <span>{inspectingEvent.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">Target Department:</span>
                <span>{departmentLabel(inspectingEvent)}</span>
              </div>

              {inspectingEvent.audience && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">Audience:</span>
                  <span>{AUDIENCE_LABELS[inspectingEvent.audience] || inspectingEvent.audience}</span>
                </div>
              )}
            </div>

            {inspectingEvent.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Agenda</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-100">
                  {inspectingEvent.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>Posted by: {ROLE_DISPLAY_LABEL[inspectingEvent.posted_by_role ?? ''] ?? 'Dean'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(inspectingEvent)}
                  className="px-3 py-1.5 text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors font-semibold flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteEvent(inspectingEvent.id)}
                  disabled={deletingId === inspectingEvent.id}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unified Add / Edit Event Modal ── */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => {
              resetForm();
              setShowModal(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-md z-[10000] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white shrink-0 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editingEventId ? 'Edit Event' : 'Add New Event'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Event Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Faculty Deliberation & Academic Planning"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
                <input
                  type="date"
                  min={todayStr} 
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. COED AVR / College Grounds"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional details or agenda..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Department *</label>
                <select
                  value={form.target_department_id}
                  onChange={(e) => setForm({ ...form, target_department_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Departments (Visible to All)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Type of Activity *</label>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_EVENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({ ...form, event_type: type.id, event_color: type.color })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        form.event_type === type.id
                          ? 'bg-white shadow-sm ring-1 ring-offset-1'
                          : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: form.event_type === type.id ? type.color : '#E5E7EB',
                        color: form.event_type === type.id ? '#111827' : '#4B5563',
                        boxShadow: form.event_type === type.id ? `0 0 0 1px ${type.color}` : 'none'
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                      {type.label}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, event_type: 'other', event_color: '#64748B' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      form.event_type === 'other'
                        ? 'bg-white shadow-sm ring-1 ring-offset-1 border-gray-400 text-gray-900'
                        : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-400 text-sm leading-none">+</span> Custom
                  </button>
                </div>

                {form.event_type === 'other' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={form.custom_event_type}
                      onChange={(e) => setForm({ ...form, custom_event_type: e.target.value })}
                      placeholder="Enter custom type... e.g. Seminar"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="relative group">
                      <input
                        type="color"
                        value={form.event_color}
                        onChange={(e) => setForm({ ...form, event_color: e.target.value })}
                        className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                        title="Choose custom color"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Audience *</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Everyone (General College Community)</option>
                  <option value="alumni">Alumni Only (Homecoming, Tracer, Career, Reunions)</option>
                  <option value="students">Students Only (Academic, Enrollment, Exams)</option>
                  <option value="faculty">Faculty Only (Meetings, Evaluations)</option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingEventId ? 'Save Changes' : 'Add Event'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
// ─── Academic Records (Dean/Admin) ──────────────────────────────────────────
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

interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface AcademicDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  category_id?: string | null;
  document_categories?: { id: string; name: string } | null;
  target_roles?: string[];
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';
const CATEGORIES_API_URL = 'http://localhost:5000/api/academic-records/categories';

function getDocsToken() {
  return localStorage.getItem('token');
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

function getFileIcon(filename: string, className = 'w-5 h-5') {
  const ext = getFileExtension(filename);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <FileImage className={className} />;
  }
  if (['txt', 'csv', 'json', 'log', 'js', 'ts', 'html'].includes(ext)) {
    return <FileCode className={className} />;
  }
  if (['pdf', 'docx', 'doc'].includes(ext)) {
    return <FileText className={className} />;
  }
  return <FileGenericIcon className={className} />;
}

export function AcademicRecords() {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Categories Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Popup Modal Alert State (Full-Viewport Blur)
  const [popupModal, setPopupModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ open: false, title: '', message: '', type: 'success' });

  const [categoryIdFilter, setCategoryIdFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AcademicDocument | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    target_roles: ['student', 'faculty', 'department_chair', 'alumni'],
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<AcademicDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingCategory, setDownloadingCategory] = useState(false);

  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    url: string | null;
    name: string;
    size?: number;
    isLocalBlob: boolean;
  }>({
    open: false,
    url: null,
    name: '',
    size: undefined,
    isLocalBlob: false,
  });

  // Fetch Categories from Backend
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(CATEGORIES_API_URL, {
        headers: { Authorization: `Bearer ${getDocsToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data ?? []);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  // Fetch Documents from Backend
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (categoryIdFilter !== 'all') params.set('category_id', categoryIdFilter);
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
  }, [categoryIdFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
    fetchDocuments();
  }, [fetchCategories, fetchDocuments]);

  // Handle ESC & lock scrolling when any modal is open
  useEffect(() => {
    if (previewModal.open || showCategoryModal || showUploadModal || deleteConfirm || popupModal.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreviewModal();
        setShowCategoryModal(false);
        setShowUploadModal(false);
        setDeleteConfirm(null);
        setPopupModal(prev => ({ ...prev, open: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewModal.open, showCategoryModal, showUploadModal, deleteConfirm, popupModal.open]);

  const closePreviewModal = () => {
    if (previewModal.url && previewModal.isLocalBlob) {
      URL.revokeObjectURL(previewModal.url);
    }
    setPreviewModal({ open: false, url: null, name: '', size: undefined, isLocalBlob: false });
  };

  // --- Category Management Handlers ---
  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) {
      setPopupModal({
        open: true,
        title: 'Validation Error',
        message: 'Category name is required.',
        type: 'error',
      });
      return;
    }

    try {
      const url = editingCategory ? `${CATEGORIES_API_URL}/${editingCategory.id}` : CATEGORIES_API_URL;
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getDocsToken()}`,
        },
        body: JSON.stringify(catForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save category');
      }

      setPopupModal({
        open: true,
        title: editingCategory ? 'Category Updated' : 'Category Created',
        message: `"${catForm.name}" was successfully ${editingCategory ? 'updated' : 'created'}.`,
        type: 'success',
      });

      setCatForm({ name: '', description: '' });
      setEditingCategory(null);
      await fetchCategories();
    } catch (err: any) {
      setPopupModal({
        open: true,
        title: 'Operation Failed',
        message: err.message || 'Unable to save category.',
        type: 'error',
      });
    }
  };

  const toggleCategoryStatus = async (cat: DocumentCategory) => {
    const nextStatus = !cat.is_active;
    try {
      const res = await fetch(`${CATEGORIES_API_URL}/${cat.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getDocsToken()}`,
        },
        body: JSON.stringify({ is_active: nextStatus }),
      });

      if (!res.ok) throw new Error('Failed to update category status.');
      await fetchCategories();
    } catch (err: any) {
      setPopupModal({
        open: true,
        title: 'Action Failed',
        message: err.message,
        type: 'error',
      });
    }
  };

  const resetForm = () => {
    const activeCategories = categories.filter((c) => c.is_active);
    setForm({
      title: '',
      description: '',
      category_id: activeCategories.length > 0 ? activeCategories[0].id : '',
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
      category_id: doc.category_id || '',
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

  // --- Duplicate File Check Helper ---
  const isDuplicateFile = (newFile: File, categoryId?: string, excludeDocId?: string) => {
    return documents.some((d) => {
      if (excludeDocId && d.id === excludeDocId) return false;
      const sameName = d.file_name.toLowerCase() === newFile.name.toLowerCase();
      const sameSize = d.file_size === newFile.size;
      const sameCategory = categoryId ? (d.category_id === categoryId) : true;
      return sameName && (sameSize || sameCategory);
    });
  };

  // --- Drag and Drop File Handlers ---
  const handleFileSelect = (selectedFile: File | undefined | null) => {
    if (!selectedFile) return;

    const validExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt', '.csv', '.xls', '.xlsx'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setFormError('Only PDF, Word, Excel, images, and text/csv files are supported.');
      return;
    }

    if (isDuplicateFile(selectedFile, form.category_id, editingDoc?.id)) {
      setFormError(`A document with the file "${selectedFile.name}" already exists.`);
      setFile(null);
      const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      return;
    }

    setFile(selectedFile);
    setFormError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePreview = async (doc: AcademicDocument) => {
    setDownloadingId(doc.id);
    setLoadError('');
    try {
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/preview`, {
        headers: { Authorization: `Bearer ${getDocsToken()}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        let errorMsg = 'Failed to retrieve document preview link.';
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.error || errJson.message || errorMsg;
        } catch {
          errorMsg = errText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (!data.url) throw new Error('Backend did not return a valid URL.');

      setPreviewModal({
        open: true,
        url: data.url,
        name: doc.file_name || doc.title,
        size: doc.file_size,
        isLocalBlob: false,
      });
    } catch (err: any) {
      console.error('Preview Error:', err);
      setLoadError(`Preview Error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLocalPreview = () => {
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewModal({
        open: true,
        url: localUrl,
        name: file.name,
        size: file.size,
        isLocalBlob: true,
      });
    } else if (editingDoc) {
      handlePreview(editingDoc);
    }
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!form.category_id) {
      setFormError('Please select a category.');
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

    if (file && isDuplicateFile(file, form.category_id, editingDoc?.id)) {
      setFormError(`A document with the file "${file.name}" already exists in this category.`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category_id', form.category_id);
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
      setPopupModal({
        open: true,
        title: 'Upload Successful',
        message: 'The document has been saved successfully.',
        type: 'success',
      });
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
    setLoadError('');
    try {
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getDocsToken()}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        let errorMsg = 'Failed to generate download link.';
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.error || errJson.message || errorMsg;
        } catch {
          errorMsg = errText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      if (data.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = doc.file_name || doc.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('Download Error:', err);
      setLoadError(`Download Error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Download All Documents in a Category ---
  const handleDownloadAllInCategory = async (targetCategoryId?: string) => {
    const catId = targetCategoryId || categoryIdFilter;
    if (!catId || catId === 'all') return;

    const targetDocs = documents.filter(d => (d.category_id === catId || d.document_categories?.id === catId));
    if (targetDocs.length === 0) {
      setPopupModal({
        open: true,
        title: 'No Documents',
        message: 'No documents found in this category to download.',
        type: 'error',
      });
      return;
    }

    setDownloadingCategory(true);
    try {
      for (const doc of targetDocs) {
        await handleDownload(doc);
        // Small delay to allow consecutive browser downloads
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch {
      setLoadError('Some files could not be downloaded.');
    } finally {
      setDownloadingCategory(false);
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4 relative z-10">
        <div className="flex flex-1 gap-2">
          <select
            value={categoryIdFilter}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {!cat.is_active ? '(Inactive)' : ''}
              </option>
            ))}
          </select>

          {/* Download All in Category button when filtered */}
          {categoryIdFilter !== 'all' && (
            <button
              onClick={() => handleDownloadAllInCategory()}
              disabled={downloadingCategory}
              className="px-3 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Download All Files in Selected Category"
            >
              {downloadingCategory ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Download All</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingCategory(null);
              setCatForm({ name: '', description: '' });
              setShowCategoryModal(true);
            }}
            className="px-3 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            title="Manage Categories"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Categories</span>
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full sm:w-48 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
          {loadError}
        </div>
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
              const categoryName = doc.document_categories?.name || doc.document_type || 'General';

              return (
                <div key={doc.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-3 border border-gray-100 hover:border-blue-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.title}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {categoryName}
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
                      onClick={() => handlePreview(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-40"
                      title="Preview Document"
                    >
                      {downloadingId === doc.id ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
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

      {/* --- CATEGORY MANAGEMENT MODAL (Full-Viewport Blur) --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Manage Document Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase">{editingCategory ? 'Edit Category' : 'Add New Category'}</h4>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Category Name e.g. Faculty Guidelines"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                />
                <div className="flex gap-2">
                  {editingCategory && (
                    <button
                      onClick={() => { setEditingCategory(null); setCatForm({ name: '', description: '' }); }}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSaveCategory}
                    className="flex-1 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E40AF]"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-xs">{cat.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {cat.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{cat.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadAllInCategory(cat.id)}
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                        title="Download all documents in this category"
                      >
                        Download All
                      </button>
                      <button
                        onClick={() => { setEditingCategory(cat); setCatForm({ name: cat.name, description: cat.description || '' }); }}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleCategoryStatus(cat)}
                        className="text-xs text-gray-500 font-medium hover:underline"
                      >
                        {cat.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPLOAD / EDIT MODAL (Full-Viewport Blur) --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
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
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Category --</option>
                  {categories.filter(c => c.is_active || c.id === form.category_id).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {!cat.is_active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Authorized Viewers *</label>
                  <button
                    type="button"
                    onClick={handleSelectAllRoles}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {form.target_roles.length === DOC_AUDIENCE_ROLES.length ? 'Deselect All' : 'Select Everyone'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5 mt-2">
                  {DOC_AUDIENCE_ROLES.map((role) => {
                    const isChecked = form.target_roles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full cursor-pointer border border-gray-200 hover:border-gray-300 shadow-2xs transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(role.id)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className={`text-xs font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                          {role.label}
                        </span>
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

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('hidden-file-input')?.click()}
                  className={`w-full py-4 px-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <input
                    id="hidden-file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />

                  {file ? (
                    <div
                      className="flex items-center justify-between w-full max-w-[320px] bg-white border border-blue-200 px-3 py-2 rounded-lg shadow-2xs hover:border-blue-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocalPreview();
                      }}
                      title="Click to preview file before upload"
                    >
                      <div className="flex items-center gap-2 text-[#1E3A8A] overflow-hidden">
                        <Eye className="w-4 h-4 flex-shrink-0 text-blue-500" />
                        <span className="text-xs font-semibold truncate hover:underline cursor-pointer">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="p-1 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-blue-500 mb-1.5" />
                      <p className="text-xs font-medium text-gray-700">
                        Drag & Drop or <span className="text-blue-600 font-semibold">Browse</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        .PDF, .DOC, .DOCX, .XLS, .PNG, .JPG up to 20MB
                      </p>
                    </>
                  )}
                </div>

                {editingDoc && !file && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Current file:
                    <button
                      type="button"
                      onClick={() => handleLocalPreview()}
                      className="font-medium text-blue-600 hover:underline truncate"
                      title="Click to preview current file"
                    >
                      {editingDoc.file_name}
                    </button>
                  </p>
                )}
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

      {/* --- DELETE CONFIRMATION MODAL (Full-Viewport Blur) --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Document?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove <span className="font-semibold text-gray-800">&ldquo;{deleteConfirm.title}&rdquo;</span>. This cannot be undone.
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

      {/* --- POPUP NOTIFICATION MODAL (Full-Viewport Blur) --- */}
      {popupModal.open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{popupModal.title}</h3>
              <button onClick={() => setPopupModal(prev => ({ ...prev, open: false }))} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-600">
              <p>{popupModal.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  if (popupModal.onConfirm) popupModal.onConfirm();
                  setPopupModal(prev => ({ ...prev, open: false }));
                }}
                className={`px-5 py-2 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs ${
                  popupModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1E3A8A] hover:bg-[#1E40AF]'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewModal.open && previewModal.url && (
        <AcademicPreviewModal
          url={previewModal.url}
          name={previewModal.name}
          size={previewModal.size}
          onClose={closePreviewModal}
        />
      )}
    </div>
  );
}

// ─── Document Preview Modal Component ─────────────────────────────────────────

function AcademicPreviewModal({
  url,
  name,
  size,
  onClose,
}: {
  url: string;
  name: string;
  size?: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const ext = getFileExtension(name);
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isDocx = ext === 'docx' || ext === 'doc';
  const isText = ['txt', 'csv', 'json', 'log'].includes(ext);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setLoadError(false);
    setTextContent(null);

    if (isDocx) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.blob();
        })
        .then((blob) => {
          if (isCancelled || !docxContainerRef.current) return;
          docxContainerRef.current.innerHTML = '';
          return renderAsync(blob, docxContainerRef.current, undefined, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        })
        .then(() => {
          if (!isCancelled) setLoading(false);
        })
        .catch((err) => {
          console.error('Docx rendering error:', err);
          if (!isCancelled) {
            setLoadError(true);
            setLoading(false);
          }
        });
    } else if (isText) {
      fetch(url)
        .then((res) => res.text())
        .then((txt) => {
          if (!isCancelled) {
            setTextContent(txt);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setLoadError(true);
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [url, isDocx, isText]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-b border-gray-700/60 text-white select-none shadow-md shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="text-blue-400 shrink-0">
            {getFileIcon(name, 'w-5 h-5')}
          </div>
          <span className="font-medium text-sm sm:text-base text-gray-100 truncate" title={name}>
            {name}
          </span>
          {size ? (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({formatFileSize(size)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            download={name}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Download File"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 w-full p-2 sm:p-6 flex items-center justify-center overflow-hidden"
        onClick={onClose}
      >
        <div
          className="w-full h-full max-w-5xl bg-white rounded-md shadow-2xl overflow-hidden relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 gap-2">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-600">Loading document...</span>
            </div>
          )}

          {loadError ? (
            <div className="m-auto text-center p-8 max-w-md">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">Unable to preview file</h4>
              <p className="text-xs text-gray-500 mb-4">
                The file &ldquo;{name}&rdquo; could not be rendered directly.
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href={url}
                  download={name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isImg ? (
            <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950 overflow-auto">
              <img
                src={url}
                alt={name}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${url}#toolbar=0`}
              title={name}
              className="w-full h-full border-0 bg-white"
            />
          ) : isText && textContent !== null ? (
            <div className="w-full h-full bg-gray-900 border border-gray-800 p-6 overflow-auto text-left select-text">
              <pre className="font-mono text-xs sm:text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {textContent}
              </pre>
            </div>
          ) : isDocx ? (
            <div className="w-full h-full overflow-y-auto bg-gray-100 p-4 sm:p-8 flex justify-center text-left select-text">
              <div ref={docxContainerRef} className="w-full max-w-3xl min-h-full" />
            </div>
          ) : (
            <div className="m-auto text-center p-8 max-w-md">
              <FileGenericIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">{name}</h4>
              <p className="text-xs text-gray-500 mb-4">
                This file format ({ext.toUpperCase()}) cannot be previewed directly in the browser.
              </p>
              <a
                href={url}
                download={name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Research & Achievements (Dean/Admin) ────────────────────────────────────

interface FileAttachment {
  name: string;
  url: string;
  path?: string;
  size?: number;
  type?: string;
}

interface ResearchSubmissionRow {
  id: string;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  category: string | null;
  description?: string | null;
  publication_link?: string | null;
  funding_source?: string | null;
  authors?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  partner_organization?: string | null;
  beneficiaries?: number | null;
  sdg_alignment?: string[] | string | null;
  file_name: string | null;
  file_url: string | null;
  file_path?: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
  submitter: { full_name: string; department: string | null } | null;
}

const RESEARCH_API_URL_DEAN = 'http://localhost:5000/api/research-submissions';
const RESEARCH_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending Review', color: '#92400E', bg: '#FEF3C7' },
  approved: { label: 'Approved', color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#991B1B', bg: '#FEE2E2' },
};

function getResearchTokenDean() {
  return localStorage.getItem('token');
}

export function ResearchAchievements() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'research' | 'extension' | 'achievement'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState<ResearchSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Action & Modal States
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<ResearchSubmissionRow | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [viewingItem, setViewingItem] = useState<ResearchSubmissionRow | null>(null);

  // In-Page Document Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  // Lock body scroll whenever any modal is active
  useEffect(() => {
    if (viewingItem || rejectFor || previewFile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [viewingItem, rejectFor, previewFile]);

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

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

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

      // Notify the submitter about the decision
      const recipientId = (submission as any).submitted_by ?? (submission as any).user_id;
      if (recipientId) {
        try {
          const label = typeLabel(submission.type);
          await (window as any).sendBackendNotification?.({
            title: status === 'approved'
              ? `${label} Approved`
              : `${label} Needs Revision`,
            message: status === 'approved'
              ? `Your ${label.toLowerCase()} submission "${submission.title}" has been approved.`
              : `Your ${label.toLowerCase()} submission "${submission.title}" was rejected.${
                  dean_remarks ? ` Remarks: ${dean_remarks}` : ''
                }`,
            type: 'system',
            user_ids: [recipientId],
          });
        } catch (notifErr) {
          console.error('Status updated but notification failed:', notifErr);
        }
      } else {
        console.warn('No submitter id on submission; notification skipped.', submission);
      }

      setSubmissions(prev =>
        prev.map(s => (s.id === submission.id ? { ...s, status, dean_remarks: dean_remarks || null } : s))
      );
      if (statusFilter !== 'all') {
        setSubmissions(prev => prev.filter(s => s.id !== submission.id));
      }

      setRejectFor(null);
      setRemarksInput('');
      if (viewingItem && viewingItem.id === submission.id) {
        setViewingItem(null);
      }
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const parseSdgs = (raw: string[] | string | null | undefined): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const getAllAttachments = (item: ResearchSubmissionRow): FileAttachment[] => {
    if (Array.isArray(item.files) && item.files.length > 0) {
      return item.files;
    }
    if (item.file_url) {
      return [{ name: item.file_name || 'Attached Document', url: item.file_url, path: item.file_path || undefined }];
    }
    return [];
  };

  // Resolves signed URLs through Supabase backend and opens in-modal viewer
  const handleViewFile = async (file: FileAttachment) => {
    if (file.path) {
      try {
        const res = await fetch(
          `${RESEARCH_API_URL_DEAN}/preview-url?path=${encodeURIComponent(file.path)}`,
          { headers: { Authorization: `Bearer ${getResearchTokenDean()}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPreviewFile({ url: data.url, name: file.name });
          return;
        }
      } catch {
        // Fall back to original file.url
      }
    }
    setPreviewFile({ url: file.url, name: file.name });
  };

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const typeLabel = (t: string) => (t === 'research' ? 'Research' : t === 'extension' ? 'Extension' : 'Achievement');

  const getTypeIcon = (t: string) => {
    if (t === 'research') return <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
    if (t === 'extension') return <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
    return <Award className="w-3.5 h-3.5 text-purple-700 shrink-0" />;
  };

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        s.title.toLowerCase().includes(term) ||
        (s.submitter?.full_name && s.submitter.full_name.toLowerCase().includes(term)) ||
        (s.submitter?.department && s.submitter.department.toLowerCase().includes(term)) ||
        (s.partner_organization && s.partner_organization.toLowerCase().includes(term)) ||
        (s.category && s.category.toLowerCase().includes(term));

      return matchesType && matchesSearch;
    });
  }, [submissions, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Research, Extension & Achievements</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review, inspect, and evaluate faculty scholarly and extension output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, faculty, dept..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="all">All Disciplines</option>
            <option value="research">Research</option>
            <option value="extension">Extension Activities</option>
            <option value="achievement">Faculty Achievements</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="pending">Pending Evaluation</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected / Revisions</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Main Submissions List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            {statusFilter === 'pending'
              ? 'Pending Endorsements'
              : statusFilter === 'approved'
              ? 'Approved Submissions'
              : statusFilter === 'rejected'
              ? 'Rejected Filings'
              : 'All Submissions'}
          </h2>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filtered.length} Record(s)
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-sm font-medium">Retrieving submissions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-600">No submissions found.</p>
            <p className="text-xs text-gray-400 mt-1">There are no records matching your current filter selection.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(item => {
              const cfg = RESEARCH_STATUS_LABEL[item.status] || RESEARCH_STATUS_LABEL.pending;
              const attachments = getAllAttachments(item);
              const sdgs = parseSdgs(item.sdg_alignment);

              return (
                <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Item Details */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {getTypeIcon(item.type)}
                          {typeLabel(item.type)}
                        </span>
                        <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                      </div>

                      {/* Submitter Info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {item.submitter?.full_name ?? 'Unknown Faculty'}
                        </span>
                        <span>·</span>
                        <span>{item.submitter?.department ?? 'No Department Specified'}</span>
                        <span>·</span>
                        <span>Submitted on {formatDate(item.created_at)}</span>
                      </div>

                      {/* Dynamic Field Summaries */}
                      <div className="flex flex-wrap gap-2 pt-1 text-xs">
                        {item.type === 'research' && (
                          <>
                            {item.authors && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                                Authors: {item.authors}
                              </span>
                            )}
                            {item.funding_source && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-400" />
                                Funding: {item.funding_source}
                              </span>
                            )}
                            {item.budget !== null && item.budget !== undefined && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                                ₱{Number(item.budget).toLocaleString()}
                              </span>
                            )}
                          </>
                        )}

                        {item.type === 'extension' && (
                          <>
                            {item.partner_organization && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                Partner: {item.partner_organization}
                              </span>
                            )}
                            {item.beneficiaries !== null && item.beneficiaries !== undefined && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                {Number(item.beneficiaries).toLocaleString()} Beneficiaries
                              </span>
                            )}
                            {sdgs.length > 0 && (
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Target className="w-3 h-3 text-blue-500" />
                                {sdgs.length} SDG(s) Aligned
                              </span>
                            )}
                          </>
                        )}

                        {item.type === 'achievement' && item.category && (
                          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium">
                            Category: {item.category}
                          </span>
                        )}

                        {(item.start_date || item.end_date) && (
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(item.start_date)} – {formatDate(item.end_date)}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 pt-1">{item.description}</p>
                      )}

                      {/* Attachments */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {item.publication_link && (
                          <a
                            href={item.publication_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold mr-2"
                          >
                            <ExternalLink size={12} />
                            <span>Journal / DOI Link</span>
                          </a>
                        )}

                        {attachments.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleViewFile(file)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title={`Inspect ${file.name}`}
                          >
                            <Eye className="w-3 h-3" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>

                      {item.dean_remarks && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs mt-2">
                          <span className="font-bold">Evaluation Remarks:</span> {item.dean_remarks}
                        </div>
                      )}
                    </div>

                    {/* Actions & Status Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2.5 shrink-0 self-start">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Review & Inspect
                        </button>

                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => decide(item, 'approved')}
                              disabled={actionId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
                            >
                              {actionId === item.id ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setRejectFor(item);
                                setRemarksInput('');
                              }}
                              disabled={actionId === item.id}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Inspect Modal — Rendered into document.body with full-page backdrop blur */}
      {viewingItem && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          {/* Full viewport blur overlay covering navbar, sidebar, content, and footer */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setViewingItem(null)}
          />

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative z-10 border border-gray-100">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                {getTypeIcon(viewingItem.type)}
                {typeLabel(viewingItem.type)}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase"
                style={{
                  background: (RESEARCH_STATUS_LABEL[viewingItem.status] || RESEARCH_STATUS_LABEL.pending).bg,
                  color: (RESEARCH_STATUS_LABEL[viewingItem.status] || RESEARCH_STATUS_LABEL.pending).color,
                }}
              >
                {viewingItem.status}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{viewingItem.title}</h2>
            <p className="text-xs text-gray-500 mb-4">
              Submitted by <span className="font-semibold text-gray-700">{viewingItem.submitter?.full_name}</span> (
              {viewingItem.submitter?.department || 'Department Unassigned'}) on {formatDate(viewingItem.created_at)}
            </p>

            <div className="space-y-4 border-t border-b border-gray-100 py-4 text-xs sm:text-sm text-gray-700">
              {viewingItem.description && (
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Project Description / Summary</span>
                  <p className="bg-gray-50 p-3 rounded-xl leading-relaxed text-gray-700">{viewingItem.description}</p>
                </div>
              )}

              {/* Research Detail */}
              {viewingItem.type === 'research' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-500 block">Authors / Researchers</span>
                    <span>{viewingItem.authors || 'None documented'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Funding Source</span>
                    <span>{viewingItem.funding_source || 'None / Institutional'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Allocated Budget</span>
                    <span>
                      {viewingItem.budget !== null && viewingItem.budget !== undefined
                        ? `₱${Number(viewingItem.budget).toLocaleString()}`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Implementation Period</span>
                    <span>{formatDate(viewingItem.start_date)} – {formatDate(viewingItem.end_date)}</span>
                  </div>
                </div>
              )}

              {/* Extension Detail */}
              {viewingItem.type === 'extension' && (
                <div className="space-y-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold text-gray-500 block">Partner Organization</span>
                      <span>{viewingItem.partner_organization || 'Not documented'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Target Beneficiaries</span>
                      <span>
                        {viewingItem.beneficiaries !== null && viewingItem.beneficiaries !== undefined
                          ? Number(viewingItem.beneficiaries).toLocaleString()
                          : 'Not documented'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Duration</span>
                      <span>{formatDate(viewingItem.start_date)} – {formatDate(viewingItem.end_date)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500 block mb-1.5">Aligned Sustainable Development Goals</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parseSdgs(viewingItem.sdg_alignment).map((sdg, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {sdg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Achievement Detail */}
              {viewingItem.type === 'achievement' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-500 block">Achievement Category</span>
                    <span>{viewingItem.category || 'General Recognition'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Date Conferred</span>
                    <span>{formatDate(viewingItem.start_date || viewingItem.created_at)}</span>
                  </div>
                </div>
              )}

              {viewingItem.publication_link && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">Publication / Evidence URL</span>
                  <a
                    href={viewingItem.publication_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{viewingItem.publication_link}</span>
                  </a>
                </div>
              )}

              {getAllAttachments(viewingItem).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-2">Attached Documents & Evidences</span>
                  <div className="flex flex-wrap gap-2">
                    {getAllAttachments(viewingItem).map((file, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleViewFile(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {viewingItem.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectFor(viewingItem);
                      setRemarksInput('');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decide(viewingItem, 'approved')}
                    disabled={actionId === viewingItem.id}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    {actionId === viewingItem.id ? 'Approving...' : 'Endorse & Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reject Modal — Rendered into document.body with full-page backdrop blur */}
      {rejectFor && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          {/* Full viewport blur overlay covering navbar, sidebar, content, and footer */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setRejectFor(null)}
          />

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 relative z-10">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Submission?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Providing reviewer remarks for <span className="font-semibold text-gray-800">{rejectFor.submitter?.full_name}</span>'s output.
            </p>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reviewer Feedback / Remarks</label>
            <textarea
              value={remarksInput}
              onChange={e => setRemarksInput(e.target.value)}
              rows={3}
              placeholder="State reasons or corrective items needed..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectFor(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-550"
              >
                Cancel
              </button>
              <button
                onClick={() => decide(rejectFor, 'rejected', remarksInput)}
                disabled={actionId === rejectFor.id}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
              >
                {actionId === rejectFor.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* In-Page Document Preview Modal */}
      {previewFile && (
        <DocxPreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

function DocxPreviewModal({
  file,
  onClose,
}: {
  file: { url: string; name: string };
  onClose: () => void;
}) {
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [renderingDocx, setRenderingDocx] = useState(false);
  const [renderError, setRenderError] = useState(false);

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isText = ['txt', 'csv', 'json', 'log'].includes(ext);
  const isDocx = ext === 'docx';
  const isOfficeDoc = ['doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);

  useEffect(() => {
    if (isDocx && docxContainerRef.current) {
      setRenderingDocx(true);
      setRenderError(false);
      docxContainerRef.current.innerHTML = '';

      fetch(file.url)
        .then(res => res.blob())
        .then(blob => {
          if (docxContainerRef.current) {
            return renderAsync(blob, docxContainerRef.current, undefined, {
              className: 'docx-preview-content',
              inWrapper: false,
            });
          }
        })
        .catch(err => {
          console.error('Docx render error:', err);
          setRenderError(true);
        })
        .finally(() => {
          setRenderingDocx(false);
        });
    }
  }, [file.url, isDocx]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Full viewport blur overlay covering navbar, sidebar, content, and footer */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 relative z-10">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm truncate">{file.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100/50 p-4 flex items-center justify-center min-h-[400px]">
          {isPdf && (
            <iframe
              src={`${file.url}#toolbar=0`}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white"
              title={file.name}
            />
          )}

          {isImg && (
            <div className="flex items-center justify-center w-full h-[68vh] bg-white rounded-xl border border-gray-200 p-2">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {isText && (
            <iframe
              src={file.url}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs"
              title={file.name}
            />
          )}

          {isDocx && (
            <div className="w-full h-[68vh] bg-white rounded-xl border border-gray-200 overflow-y-auto p-6 sm:p-10 shadow-inner">
              {renderingDocx && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-xs">Rendering Word document...</span>
                </div>
              )}
              {renderError && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  Could not parse this Word file preview. Use "Save a Copy" below to inspect.
                </div>
              )}
              <div ref={docxContainerRef} className="max-w-3xl mx-auto" />
            </div>
          )}

          {isOfficeDoc && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white"
              title={file.name}
            />
          )}

          {!isPdf && !isImg && !isText && !isDocx && !isOfficeDoc && (
            <div className="text-center py-12 px-4 max-w-md">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">{file.name}</h4>
              <p className="text-xs text-gray-500 mb-4">
                This file format cannot be rendered directly inside the browser.
              </p>
              <a
                href={file.url}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 flex justify-end gap-2 bg-white">
          <a
            href={file.url}
            download={file.name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save a Copy</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
// ─── Alumni Tracer (COLLEGE DEAN DASHBOARD — QPRO PRIVACY-COMPLIANT) ─────────

const TRACER_API_BASE = 'http://localhost:5000/api/tracer-survey';

interface GraduateRecord {
  id: string;
  alumni_id: string;
  program?: string | null;
  last_name: string;
  first_name: string;
  employment_status: string;
  job_title: string | null;
  employer: string | null;
  relevance: string | null;
  supporting_docs?: string | null;
  post_graduate_degree?: string | null;
  updated_at: string;
}

interface DeanTracerStats {
  totalResponses: number;
  employedCount: number;
  employmentRate: number;
  alignmentRate: number;
}

function AlumniTracer() {
  const [records, setRecords] = useState<GraduateRecord[]>([]);
  const [backendStats, setBackendStats] = useState<DeanTracerStats | null>(null);
  const [totalAlumniCount, setTotalAlumniCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [selectedGraduate, setSelectedGraduate] = useState<GraduateRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Fetch aggregate stats from backend
      const statsRes = await fetch(`${TRACER_API_BASE}/dashboard-stats`, { headers: authHeaders });
      if (statsRes.ok) {
        const statsData: DeanTracerStats = await statsRes.json();
        setBackendStats(statsData);
      }

      // 2. Fetch full records array from backend
      const recordsRes = await fetch(`${TRACER_API_BASE}/all`, { headers: authHeaders });
      if (recordsRes.ok) {
        const recordsData: any[] = await recordsRes.json();

        // Normalize raw entries into QPRO format with clean name split
        const normalized: GraduateRecord[] = (recordsData ?? []).map((r, idx) => {
          let lName = r.last_name;
          let fName = r.first_name;

          if (!lName || !fName) {
            const rawName = (r.full_name || r.alumni_id || `Graduate ${idx + 1}`).trim();
            const parts = rawName.split(' ');
            if (parts.length > 1) {
              lName = parts.pop()!;
              fName = parts.join(' ');
            } else {
              lName = rawName;
              fName = '—';
            }
          }

          return {
            id: r.id || String(idx + 1),
            alumni_id: r.alumni_id || r.id_number || '—',
            last_name: lName.toUpperCase(),
            first_name: fName.toUpperCase(),
            program: r.program || 'BACHELOR OF ELEMENTARY EDUCATION',
            employment_status: r.employment_status || 'not-tracked',
            employer: r.employer || null,
            job_title: r.job_title || null,
            relevance: r.relevance || null,
            supporting_docs: r.supporting_docs || `${r.program || 'COED'} Batch 2024`,
            post_graduate_degree: r.post_graduate_degree || (r.employment_status === 'further-study' ? 'Post-Graduate Studies' : '—'),
            updated_at: r.updated_at,
          };
        });

        setRecords(normalized);
      }

      // 3. Fetch registered alumni denominator
      const { count: alumniTotal } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumni');
      setTotalAlumniCount(alumniTotal ?? 0);
    } catch (err) {
      console.error('Failed to load tracer records from Express backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('dean-tracer-survey-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'graduate_tracer_survey' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const availablePrograms = Array.from(
    new Set(records.map((r) => r.program).filter(Boolean))
  ).sort() as string[];

  const formatQproStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'employed' || s === 'self-employed') return 'Employed';
    if (s === 'unemployed') return 'Unemployed';
    return 'Not Tracked';
  };

  const filtered = records.filter((r) => {
    const query = search.toLowerCase();
    const qStatus = formatQproStatus(r.employment_status).toLowerCase();
    const matchesSearch =
      (r.last_name || '').toLowerCase().includes(query) ||
      (r.first_name || '').toLowerCase().includes(query) ||
      (r.job_title || '').toLowerCase().includes(query) ||
      (r.employer || '').toLowerCase().includes(query) ||
      (r.alumni_id || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter.toLowerCase() === qStatus || statusFilter === r.employment_status;

    const matchesProgram =
      programFilter === 'all' ? true : r.program === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Metrics
  const responsesCount = backendStats?.totalResponses ?? records.length;
  const employedCount =
    backendStats?.employedCount ??
    records.filter((r) => formatQproStatus(r.employment_status) === 'Employed').length;
  const unemployedCount = records.filter((r) => formatQproStatus(r.employment_status) === 'Unemployed').length;
  const notTrackedCount = records.filter((r) => formatQproStatus(r.employment_status) === 'Not Tracked').length;

  const employmentRate =
    backendStats?.employmentRate ??
    (responsesCount > 0 ? Math.round((employedCount / responsesCount) * 100) : 0);
  const alignmentRate =
    backendStats?.alignmentRate ??
    (responsesCount > 0
      ? Math.round(
          (records.filter((r) => r.relevance === 'very-relevant' || r.relevance === 'relevant').length /
            responsesCount) *
            100
        )
      : 0);
  const responseRate = totalAlumniCount > 0 ? Math.round((responsesCount / totalAlumniCount) * 100) : 0;

  const escapePrintHtml = (value: unknown) =>
    String(value ?? '—').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char] as string));

  const openPrintWindow = (title: string, body: string) => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups for this site to print the masterlist.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html><head><title>${escapePrintHtml(title)}</title>
      <meta charset="utf-8" />
      <style>
        @page { size: landscape; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #111827; font-size: 10px; }
        h1 { font-size: 18px; text-align: center; margin: 0 0 5px; }
        h2 { font-size: 13px; text-align: center; margin: 0 0 16px; font-weight: normal; }
        .meta { margin: 12px 0; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #9ca3af; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #e5e7eb; font-weight: bold; }
        .status { font-weight: bold; }
        .detail { width: 100%; max-width: 760px; margin: 20px auto; }
        .detail td:first-child { width: 32%; font-weight: bold; background: #f3f4f6; }
        .footer { margin-top: 24px; display: flex; justify-content: space-between; }
        @media screen { body { padding: 24px; } }
      </style></head><body>${body}
      <script>window.onload = () => { window.focus(); window.print(); };</script>
      </body></html>`);
    printWindow.document.close();
  };

  const printMasterlist = () => {
    const rowsToPrint = filtered;
    if (!rowsToPrint.length) {
      alert('There are no graduate records to print.');
      return;
    }
    const rows = rowsToPrint.map((r, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapePrintHtml(r.program)}</td>
        <td>${escapePrintHtml(r.last_name)}</td>
        <td>${escapePrintHtml(r.first_name)}</td>
        <td class="status">${escapePrintHtml(formatQproStatus(r.employment_status))}</td>
        <td>${escapePrintHtml(r.employer || r.job_title || '—')}</td>
        <td>${escapePrintHtml(r.supporting_docs || `${r.program || 'COED'} Batch 2024`)}</td>
        <td>${escapePrintHtml(r.post_graduate_degree || '—')}</td>
      </tr>`).join('');

    openPrintWindow('COED Graduate Employment Masterlist', `
      <h1>CEBU TECHNOLOGICAL UNIVERSITY — ARGAO CAMPUS</h1>
      <h2>College of Education | Graduate Employment Masterlist</h2>
      <div class="meta">Outcome Indicator 2 · Records included: ${rowsToPrint.length} · Printed: ${new Date().toLocaleString()}</div>
      <table><thead><tr>
        <th>Item</th><th>Program Name</th><th>Last Name</th><th>First Name</th>
        <th>Employment Status</th><th>Name of Company / Type of Business</th>
        <th>Supporting Documents</th><th>Post Graduate Degree</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="footer"><span>Prepared by: ____________________</span><span>Verified by: ____________________</span></div>`);
  };

  const printIndividualGraduate = (graduate: GraduateRecord) => {
    openPrintWindow('Graduate Employment Record', `
      <h1>CEBU TECHNOLOGICAL UNIVERSITY — ARGAO CAMPUS</h1>
      <h2>College of Education | Individual Graduate Employment Record</h2>
      <table class="detail"><tbody>
        <tr><td>Graduate Name</td><td>${escapePrintHtml(`${graduate.first_name} ${graduate.last_name}`)}</td></tr>
        <tr><td>Alumni ID</td><td>${escapePrintHtml(graduate.alumni_id)}</td></tr>
        <tr><td>Program</td><td>${escapePrintHtml(graduate.program)}</td></tr>
        <tr><td>Employment Status</td><td>${escapePrintHtml(formatQproStatus(graduate.employment_status))}</td></tr>
        <tr><td>Company / Type of Business</td><td>${escapePrintHtml(graduate.employer || graduate.job_title || '—')}</td></tr>
        <tr><td>Job Title</td><td>${escapePrintHtml(graduate.job_title || '—')}</td></tr>
        <tr><td>Supporting Documents</td><td>${escapePrintHtml(graduate.supporting_docs || '—')}</td></tr>
        <tr><td>Post Graduate Degree</td><td>${escapePrintHtml(graduate.post_graduate_degree || '—')}</td></tr>
        <tr><td>Curriculum Relevance</td><td>${escapePrintHtml(graduate.relevance || '—')}</td></tr>
        <tr><td>Last Updated</td><td>${escapePrintHtml(graduate.updated_at ? new Date(graduate.updated_at).toLocaleString() : '—')}</td></tr>
      </tbody></table>
      <div class="footer"><span>Prepared by: ____________________</span><span>Verified by: ____________________</span></div>`);
  };

  // Export Privacy-Safe CSV (Excludes Individual Salaries)
  const exportToCSV = () => {
    if (records.length === 0) {
      alert('No survey records available to export.');
      return;
    }

    const headers = [
      'PROGRAM NAME',
      'Item No.',
      'LAST NAME',
      'FIRST NAME',
      'STATUS (Employed, Unemployed, Not tracked)',
      'NAME OF COMPANY / TYPE OF BUSINESS',
      'SUPPORTING DOCUMENTS',
      'POST GRADUATE DEGREE',
    ];

    const rows = filtered.map((r, i) => [
      `"${r.program || 'COED'}"`,
      i + 1,
      `"${r.last_name || '—'}"`,
      `"${r.first_name || '—'}"`,
      `"${formatQproStatus(r.employment_status)}"`,
      `"${r.employer || r.job_title || '—'}"`,
      `"${r.supporting_docs || 'Batch 2024'}"`,
      `"${r.post_graduate_degree || '—'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['HIGHER EDUCATION PROGRAM (Outcome Indicator 2 - AY 2024)', headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `COED_QPRO_Tracer_Batch_2024_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Alumni Tracer Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            CHED / AACCUP Institutional Graduate Career & Employment Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={printMasterlist}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
          >
            <span aria-hidden="true">🖨</span>
            Print Masterlist
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export QPRO Report
          </button>
        </div>
      </div>

      {/* ── Backend Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Alumni Registry</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1.5">
            {loading ? '...' : totalAlumniCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Verified alumni accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Responses Logged</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1.5">
            {loading ? '...' : responsesCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Completed tracer profiles</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Employment Rate</p>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1.5">
            {loading ? '...' : `${employmentRate}%`}
          </p>
          <p className="text-[11px] text-blue-600/80 mt-1">{employedCount} employed or self-employed</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Curriculum Alignment</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1.5">
            {loading ? '...' : `${alignmentRate}%`}
          </p>
          <p className="text-[11px] text-purple-600/80 mt-1">In education or related field</p>
        </div>
      </div>

      {/* ── Visual Distribution Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Employment Distribution Breakdown</h3>
            <p className="text-xs text-gray-500">Live proportional distribution of surveyed graduates</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg self-start sm:self-auto">
            {responseRate}% Global Response Rate
          </span>
        </div>

        {responsesCount > 0 ? (
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${(employedCount / responsesCount) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Employed: ${employedCount}`}
              />
              <div
                style={{ width: `${(notTrackedCount / responsesCount) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Not Tracked: ${notTrackedCount}`}
              />
              <div
                style={{ width: `${(unemployedCount / responsesCount) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Unemployed: ${unemployedCount}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-medium text-gray-700">
                  Employed: {employedCount} ({Math.round((employedCount / responsesCount) * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-medium text-gray-700">
                  Not Tracked: {notTrackedCount} ({Math.round((notTrackedCount / responsesCount) * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="font-medium text-gray-700">
                  Unemployed: {unemployedCount} ({Math.round((unemployedCount / responsesCount) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">
            No survey records logged yet to render analytics breakdown.
          </div>
        )}
      </div>

      {/* ── Table Toolbar & QPRO Masterlist (Higher Education Oc2 Without Salary) ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">
              Outcome Indicator 2: Graduate Employment Masterlist
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {filtered.length} entries
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search graduate name, company..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              />
            </div>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="all">All Programs</option>
              {availablePrograms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="all">All Statuses</option>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Not Tracked">Not Tracked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-[#1E3A8A] animate-spin mb-2" />
            <p className="text-xs text-gray-500">Loading survey records from Express server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-gray-700">No matching tracer entries found</p>
            <p className="text-xs text-gray-400 mt-0.5">Records will appear as alumni submit responses.</p>
          </div>
        ) : (
<div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead>
                {/* Excel Section Numbering Row */}
                <tr className="bg-gray-100/90 text-gray-500 font-bold border-b border-gray-200 text-[10px] text-center">
                  <th className="p-2 border border-gray-200 w-10">#</th>
                  <th className="p-2 border border-gray-200">1</th>
                  <th colSpan={2} className="p-2 border border-gray-200">2</th>
                  <th className="p-2 border border-gray-200">3</th>
                  <th className="p-2 border border-gray-200">4</th>
                  <th className="p-2 border border-gray-200">—</th>
                  <th className="p-2 border border-gray-200">5</th>
                </tr>

                {/* Primary Excel Headers */}
                <tr className="bg-gray-50 text-gray-800 font-bold border-b border-gray-300 text-[11px] uppercase">
                  <th className="p-2.5 border border-gray-300 text-center">Item</th>
                  <th className="p-2.5 border border-gray-300">Program Name</th>
                  <th className="p-2.5 border border-gray-300">Last Name</th>
                  <th className="p-2.5 border border-gray-300">First Name</th>
                  <th className="p-2.5 border border-gray-300 text-center">
                    Status <br />
                    <span className="text-[9px] font-normal text-gray-500 lowercase">(employed, unemployed, not tracked)</span>
                  </th>
                  <th className="p-2.5 border border-gray-300">
                    Name of Company / <br />Type of Business
                  </th>
                  <th className="p-2.5 border border-gray-300">Supporting Documents</th>
                  <th className="p-2.5 border border-gray-300">Post Graduate Degree</th>
                  <th className="p-2.5 border border-gray-300 no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {filtered.map((item, idx) => {
                  const qStatus = formatQproStatus(item.employment_status);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-2.5 border border-gray-200 text-center font-mono text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-medium text-gray-800">
                        {item.program || 'BACHELOR OF ELEMENTARY EDUCATION'}
                      </td>
                      <td className="p-2.5 border border-gray-200 font-bold text-gray-900">
                        {item.last_name || '—'}
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-800">
                        {item.first_name || '—'}
                      </td>
                      <td className="p-2.5 border border-gray-200 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            qStatus === 'Employed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : qStatus === 'Unemployed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {qStatus}
                        </span>
                      </td>
                      <td className="p-2.5 border border-gray-200 text-gray-700">
                        {item.employer || item.job_title || '—'}
                      </td>
                      <td className="p-2.5 border border-gray-200 text-[11px] text-gray-500">
                        {item.supporting_docs || `${item.program || 'COED'} Batch 2024`}
                      </td>
                      <td className="p-2.5 border border-gray-200 text-[11px] text-gray-600">
                        {item.post_graduate_degree || '—'}
                      </td>
                      <td className="p-2 border border-gray-200 no-print">
                        <button
                          type="button"
                          onClick={() => setSelectedGraduate(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 font-semibold whitespace-nowrap"
                        >
                          View Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedGraduate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="graduate-record-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedGraduate(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 id="graduate-record-title" className="text-lg font-bold text-gray-900">Graduate Employment Record</h2>
                <p className="text-xs text-gray-500">Individual submitted tracer information</p>
              </div>
              <button type="button" onClick={() => setSelectedGraduate(null)} className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100" aria-label="Close record">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {[
                ['Graduate Name', `${selectedGraduate.first_name} ${selectedGraduate.last_name}`],
                ['Alumni ID', selectedGraduate.alumni_id],
                ['Program', selectedGraduate.program],
                ['Employment Status', formatQproStatus(selectedGraduate.employment_status)],
                ['Company / Type of Business', selectedGraduate.employer || selectedGraduate.job_title || '—'],
                ['Job Title', selectedGraduate.job_title || '—'],
                ['Supporting Documents', selectedGraduate.supporting_docs || '—'],
                ['Post Graduate Degree', selectedGraduate.post_graduate_degree || '—'],
                ['Curriculum Relevance', selectedGraduate.relevance || '—'],
                ['Last Updated', selectedGraduate.updated_at ? new Date(selectedGraduate.updated_at).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedGraduate(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              <button type="button" onClick={() => printIndividualGraduate(selectedGraduate)} className="rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1E40AF]">Print Individual Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inquiries (Student & Alumni Q&A) ─────────────────────────────────────────
function InquiriesManagement({ initialTab = 'student' }: { initialTab?: 'student' | 'alumni' | 'contact' }) {
  const [studentInquiries, setStudentInquiries] = useState<Inquiry[]>([]);
  const [alumniInquiries, setAlumniInquiries] = useState<Inquiry[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

const [activeSection, setActiveSection] = useState<'student' | 'alumni' | 'contact'>(initialTab);

useEffect(() => {
    if (initialTab) {
      setActiveSection(initialTab);
    }
  }, [initialTab]);

  const [studentFilter, setStudentFilter] =
    useState<'all' | 'pending' | 'answered'>('all');

  const [alumniFilter, setAlumniFilter] =
    useState<'all' | 'pending' | 'answered'>('all');

  const [contactFilter, setContactFilter] =
    useState<'all' | 'pending' | 'answered'>('all');

  const [studentCategoryFilter, setStudentCategoryFilter] = useState('all');
  const [alumniCategoryFilter, setAlumniCategoryFilter] = useState('all');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all');

  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [activeContact, setActiveContact] =
    useState<ContactMessage | null>(null);

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  /*
   * ============================================================
   * CUSTOM MODALS
   * ============================================================
   */

  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    type: 'error' | 'success';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    item: Inquiry | ContactMessage | null;
    type: 'inquiry' | 'contact' | null;
  }>({
    open: false,
    item: null,
    type: null,
  });

  /*
   * ============================================================
   * NEW ITEMS MODAL
   * ============================================================
   */

  const [newItemsModal, setNewItemsModal] = useState<{
    open: boolean;
    type: 'student' | 'alumni' | 'contact' | null;
    items: (Inquiry | ContactMessage)[];
  }>({
    open: false,
    type: null,
    items: [],
  });

  /*
   * ============================================================
   * HELPER: SHOW MESSAGE MODAL
   * ============================================================
   */

  const showMessage = (
    type: 'error' | 'success',
    title: string,
    message: string
  ) => {
    setMessageModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeMessageModal = () => {
    setMessageModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  /*
   * ============================================================
   * FETCH DATA
   * ============================================================
   */

  const fetchInquiries = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: inquiryData,
        error: inquiryError,
      } = await supabase
        .from('inquiries')
        .select('*, profiles(full_name, id_number)')
        .order('created_at', { ascending: false });

      if (inquiryError) {
        console.error('Error fetching inquiries:', inquiryError);

        showMessage(
          'error',
          'Unable to Load Inquiries',
          inquiryError.message
        );
      } else if (inquiryData) {
        setStudentInquiries(
          inquiryData.filter(
            (i: Inquiry) => i.sender_role === 'student'
          )
        );

        setAlumniInquiries(
          inquiryData.filter(
            (i: Inquiry) => i.sender_role === 'alumni'
          )
        );
      }

      const {
        data: contactData,
        error: contactError,
      } = await supabase
        .from(CONTACT_API_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (contactError) {
        console.error(
          'Error fetching contact messages:',
          contactError
        );

        showMessage(
          'error',
          'Unable to Load Contact Messages',
          contactError.message
        );
      } else if (contactData) {
        setContactMessages(contactData);
      }
    } catch (error) {
      console.error('Unexpected fetch error:', error);

      showMessage(
        'error',
        'Something Went Wrong',
        'An unexpected error occurred while loading inquiries.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  /*
   * ============================================================
   * REALTIME
   * ============================================================
   */

  useEffect(() => {
    const channelName =
      `inquiries-channel-${Math.random()
        .toString(36)
        .slice(2)}`;

    const channel = supabase
      .channel(channelName)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiries',
        },
        () => {
          fetchInquiries();
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: CONTACT_API_TABLE,
        },
        () => {
          fetchInquiries();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInquiries]);

  /*
   * ============================================================
   * OPEN DETAIL
   * ============================================================
   */

  const openInquiry = async (inquiry: Inquiry) => {
  // Open the detail modal immediately
  setActiveInquiry({
    ...inquiry,
    is_read: true,
  });

  setActiveContact(null);
  setReplyText(inquiry.reply ?? '');

  // Mark as read
  if (!inquiry.is_read) {
    const { error } = await supabase
      .from('inquiries')
      .update({ is_read: true })
      .eq('id', inquiry.id);

    if (error) {
      console.error('Error marking inquiry as read:', error);
      return;
    }

    // Update local student list
    setStudentInquiries((prev) =>
      prev.map((item) =>
        item.id === inquiry.id
          ? { ...item, is_read: true }
          : item
      )
    );

    // Update local alumni list
    setAlumniInquiries((prev) =>
      prev.map((item) =>
        item.id === inquiry.id
          ? { ...item, is_read: true }
          : item
      )
    );
  }
};

const openContact = async (contact: ContactMessage) => {
  // Open detail modal immediately
  setActiveContact({
    ...contact,
    is_read: true,
  });

  setActiveInquiry(null);
  setReplyText(contact.reply ?? '');

  // Mark as read
  if (!contact.is_read) {
    const { error } = await supabase
      .from(CONTACT_API_TABLE)
      .update({ is_read: true })
      .eq('id', contact.id);

    if (error) {
      console.error(
        'Error marking contact message as read:',
        error
      );
      return;
    }

    setContactMessages((prev) =>
      prev.map((item) =>
        item.id === contact.id
          ? { ...item, is_read: true }
          : item
      )
    );
  }
};

  const closeDetailModal = () => {
    setActiveInquiry(null);
    setActiveContact(null);
    setReplyText('');
  };

  /*
   * ============================================================
   * MARK ITEM AS READ
   * ============================================================
   */

  const markItemAsRead = async (
    item: Inquiry | ContactMessage,
    type: 'inquiry' | 'contact'
  ) => {
    if (item.is_read) return;

    const table =
      type === 'inquiry'
        ? 'inquiries'
        : CONTACT_API_TABLE;

    const { error } = await supabase
      .from(table)
      .update({
        is_read: true,
      })
      .eq('id', item.id);

    if (error) {
      console.error(
        'Unable to mark item as read:',
        error
      );

      return;
    }

    if (type === 'inquiry') {
      setStudentInquiries((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_read: true }
            : i
        )
      );

      setAlumniInquiries((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_read: true }
            : i
        )
      );
    } else {
      setContactMessages((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_read: true }
            : i
        )
      );
    }
  };

  /*
   * ============================================================
   * OPEN NEW ITEMS MODAL
   * ============================================================
   */

  const openNewItems = async (
  type: 'student' | 'alumni' | 'contact'
) => {
  let items: (Inquiry | ContactMessage)[] = [];

  // Get unread pending items
  if (type === 'student') {
    items = studentInquiries.filter(
      (item) =>
        item.status === 'pending' &&
        item.is_read !== true
    );
  }

  if (type === 'alumni') {
    items = alumniInquiries.filter(
      (item) =>
        item.status === 'pending' &&
        item.is_read !== true
    );
  }

  if (type === 'contact') {
    items = contactMessages.filter(
      (item) =>
        item.status === 'pending' &&
        item.is_read !== true
    );
  }

  // Open modal first
  setNewItemsModal({
    open: true,
    type,
    items,
  });

  // Nothing to mark as read
  if (items.length === 0) {
    return;
  }

  const table =
    type === 'contact'
      ? CONTACT_API_TABLE
      : 'inquiries';

  const ids = items.map((item) => item.id);

  // Mark all displayed items as read
  const { error } = await supabase
    .from(table)
    .update({
      is_read: true,
    })
    .in('id', ids);

  if (error) {
    console.error(
      'Unable to mark new items as read:',
      error
    );

    showMessage(
      'error',
      'Unable to Mark as Read',
      error.message
    );

    return;
  }

  // Update the local state immediately
  if (type === 'student') {
    setStudentInquiries((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? { ...item, is_read: true }
          : item
      )
    );
  }

  if (type === 'alumni') {
    setAlumniInquiries((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? { ...item, is_read: true }
          : item
      )
    );
  }

  if (type === 'contact') {
    setContactMessages((prev) =>
      prev.map((item) =>
        ids.includes(item.id)
          ? { ...item, is_read: true }
          : item
      )
    );
  }
};

  const closeNewItemsModal = () => {
    setNewItemsModal({
      open: false,
      type: null,
      items: [],
    });
  };

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  const requestDelete = (
    item: Inquiry | ContactMessage,
    type: 'inquiry' | 'contact'
  ) => {
    setDeleteModal({
      open: true,
      item,
      type,
    });
  };

  const cancelDelete = () => {
    setDeleteModal({
      open: false,
      item: null,
      type: null,
    });
  };

  const confirmDelete = async () => {
    const item = deleteModal.item;
    const type = deleteModal.type;

    if (!item || !type) return;

    setDeletingId(item.id);

    try {
      const table =
        type === 'inquiry'
          ? 'inquiries'
          : CONTACT_API_TABLE;

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error(
          'Delete error:',
          error
        );

        setDeletingId(null);

        cancelDelete();

        showMessage(
          'error',
          'Delete Failed',
          error.message
        );

        return;
      }

      /*
       * Remove locally.
       */
      if (type === 'inquiry') {
        setStudentInquiries((prev) =>
          prev.filter(
            (i) => i.id !== item.id
          )
        );

        setAlumniInquiries((prev) =>
          prev.filter(
            (i) => i.id !== item.id
          )
        );
      } else {
        setContactMessages((prev) =>
          prev.filter(
            (i) => i.id !== item.id
          )
        );
      }

      /*
       * Remove from New Items modal too.
       */
      setNewItemsModal((prev) => ({
        ...prev,
        items: prev.items.filter(
          (i) => i.id !== item.id
        ),
      }));

      if (
        activeInquiry?.id === item.id ||
        activeContact?.id === item.id
      ) {
        closeDetailModal();
      }

      cancelDelete();

      setDeletingId(null);

      showMessage(
        'success',
        'Deleted Successfully',
        'The inquiry or message has been permanently deleted.'
      );

      await fetchInquiries();
    } catch (error) {
      console.error(
        'Unexpected delete error:',
        error
      );

      setDeletingId(null);
      cancelDelete();

      showMessage(
        'error',
        'Delete Failed',
        'An unexpected error occurred while deleting this item.'
      );
    }
  };
  /*
   * ============================================================
   * SEND REPLY
   * ============================================================
   */

 const sendReply = async () => {
  if (!replyText.trim()) {
    showMessage(
      'error',
      'Reply Required',
      'Please enter a reply before sending.'
    );
    return;
  }

  setSending(true);

  try {
    // =====================================================
    // STUDENT / ALUMNI INQUIRY
    // =====================================================
    if (activeInquiry) {
      const { error } = await supabase
        .from('inquiries')
        .update({
          reply: replyText.trim(),
          status: 'answered',
          replied_at: new Date().toISOString(),
          is_read: true,
        })
        .eq('id', activeInquiry.id);

      if (error) {
        console.error('Reply error:', error);

        showMessage(
          'error',
          'Reply Failed',
          error.message
        );

        return;
      }

      // Send notification
      try {
        await notifyRole(
          activeInquiry.sender_role,
          'Your inquiry has been answered',
          replyText.trim()
        );
      } catch (notificationError) {
        console.error(
          'Notification error:',
          notificationError
        );
      }

      closeDetailModal();

      await fetchInquiries();

      showMessage(
        'success',
        'Reply Sent',
        'Your reply has been successfully sent.'
      );

      return;
    }

    // =====================================================
    // CONTACT MESSAGE
    // =====================================================
    if (activeContact) {

      // -----------------------------------------------
      // Check email
      // -----------------------------------------------
      if (!activeContact.email) {
        showMessage(
          'error',
          'Email Not Available',
          'This contact message does not have an email address.'
        );

        return;
      }

      const recipientEmail =
        activeContact.email.trim();

      const recipientName =
        activeContact.full_name?.trim() ||
        'Website Visitor';

      const subject =
        activeContact.subject?.trim() ||
        'Reply from College of Education';

      const message =
        replyText.trim();

      console.log(
        'Sending contact reply to:',
        recipientEmail
      );

      // -----------------------------------------------
      // SEND EMAIL THROUGH BACKEND
      // -----------------------------------------------
      let emailResponse: Response;

      try {
        emailResponse = await fetch(
          'http://localhost:5000/api/contact/reply',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientEmail,
              recipientName,
              subject,
              message,
            }),
          }
        );
      } catch (fetchError) {
        console.error(
          'Backend connection error:',
          fetchError
        );

        showMessage(
          'error',
          'Email Server Unavailable',
          'The email server could not be reached. Please make sure your backend server is running on port 5000.'
        );

        return;
      }

      // -----------------------------------------------
      // READ BACKEND RESPONSE SAFELY
      // -----------------------------------------------
      const responseText =
        await emailResponse.text();

      let emailResult: any = {};

      try {
        emailResult = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          'Invalid backend response:',
          responseText
        );

        showMessage(
          'error',
          'Email Server Error',
          'The backend returned an invalid response. Please check your backend server.'
        );

        return;
      }

      // -----------------------------------------------
      // EMAIL FAILED
      // -----------------------------------------------
      if (
        !emailResponse.ok ||
        emailResult.success !== true
      ) {
        console.error(
          'Email sending failed:',
          emailResult
        );

        showMessage(
          'error',
          'Email Failed',
          emailResult.message ||
            `The reply could not be sent. Server status: ${emailResponse.status}`
        );

        return;
      }

      // -----------------------------------------------
      // SAVE REPLY TO SUPABASE
      // -----------------------------------------------
      const { error } = await supabase
        .from(CONTACT_API_TABLE)
        .update({
          reply: message,
          status: 'answered',
          replied_at: new Date().toISOString(),
          is_read: true,
        })
        .eq('id', activeContact.id);

      if (error) {
        console.error(
          'Contact database update error:',
          error
        );

        showMessage(
          'error',
          'Reply Saved Failed',
          `The email was sent successfully to ${recipientEmail}, but the reply could not be saved in the system. ${error.message}`
        );

        return;
      }

      // -----------------------------------------------
      // CLOSE MODAL
      // -----------------------------------------------
      closeDetailModal();

      // -----------------------------------------------
      // REFRESH
      // -----------------------------------------------
      await fetchInquiries();

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------
      showMessage(
        'success',
        'Reply Sent Successfully',
        `Your reply has been sent directly to ${recipientEmail}.`
      );

      return;
    }

  } catch (error: any) {
    console.error(
      'Unexpected reply error:',
      error
    );

    showMessage(
      'error',
      'Something Went Wrong',
      error?.message ||
        'An unexpected error occurred while sending the reply.'
    );

  } finally {
    setSending(false);
  }
};

  /*
   * ============================================================
   * DATE
   * ============================================================
   */

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      'en-PH',
      {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    );

  /*
   * ============================================================
   * FILTER
   * ============================================================
   */

  const filterList = <
    T extends {
      status: string;
      category?: string | null;
    }
  >(
    list: T[],
    statusF: 'all' | 'pending' | 'answered',
    categoryF: string
  ) => {
    let result = list;

    if (statusF !== 'all') {
      result = result.filter(
        (item) =>
          item.status === statusF
      );
    }

    if (categoryF !== 'all') {
      result = result.filter(
        (item) =>
          (item.category ?? 'Other') ===
          categoryF
      );
    }

    return result;
  };

  /*
   * ============================================================
   * NEW COUNTS
   *
   * IMPORTANT:
   * New = pending + unread
   * ============================================================
   */

  const pendingStudentCount =
  studentInquiries.filter(
    (i) =>
      i.status === 'pending' &&
      i.is_read !== true
  ).length;

const pendingAlumniCount =
  alumniInquiries.filter(
    (i) =>
      i.status === 'pending' &&
      i.is_read !== true
  ).length;

const pendingContactCount =
  contactMessages.filter(
    (i) =>
      i.status === 'pending' &&
      i.is_read !== true
  ).length;

  /*
   * ============================================================
   * SECTION TABS
   * ============================================================
   */

  const SECTION_TABS = [
    {
      id: 'student' as const,
      label: 'Student Inquiries',
      pending: pendingStudentCount,
      onNew: () =>
        openNewItems('student'),
    },
    {
      id: 'alumni' as const,
      label: 'Alumni Inquiries',
      pending: pendingAlumniCount,
      onNew: () =>
        openNewItems('alumni'),
    },
    {
      id: 'contact' as const,
      label: 'Contact Messages',
      pending: pendingContactCount,
      onNew: () =>
        openNewItems('contact'),
    },
  ];

  /*
   * ============================================================
   * COLUMN
   * ============================================================
   */

  const InquiryColumn = ({
    title,
    pendingCount,
    accentColor,
    accentBg,
    list,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    onOpen,
    onNew,
    type,
    emptyIcon: EmptyIcon,
  }: {
    title: string;
    pendingCount: number;
    accentColor: string;
    accentBg: string;
    list: (Inquiry | ContactMessage)[];
    statusFilter:
      | 'all'
      | 'pending'
      | 'answered';
    setStatusFilter: (
      f:
        | 'all'
        | 'pending'
        | 'answered'
    ) => void;
    categoryFilter: string;
    setCategoryFilter: (
      c: string
    ) => void;
    categories: string[];
    onOpen: (item: any) => void;
    onNew: () => void;
    type: 'inquiry' | 'contact';
    emptyIcon: React.ComponentType<{
      className?: string;
    }>;
  }) => {
    const shown = filterList(
      list as any,
      statusFilter,
      categoryFilter
    );

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">

        {/* HEADER */}
        <div
          className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3"
          style={{
            backgroundColor: accentBg,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">

            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  accentColor,
              }}
            />

            <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate">
              {title}
            </h2>

            <span className="text-xs font-semibold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
              {list.length}
            </span>
          </div>

          {/* NEW BUTTON */}
          {pendingCount > 0 && (
            <button
              onClick={onNew}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full text-white flex-shrink-0 hover:opacity-90 active:scale-95 transition-all"
              style={{
                backgroundColor:
                  accentColor,
              }}
            >
              <CircleDot className="w-3 h-3" />
              {pendingCount} new
            </button>
          )}
        </div>

        {/* FILTER */}
        <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-gray-50 space-y-2">

          <div className="flex gap-1">

            {(
              [
                'all',
                'pending',
                'answered',
              ] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() =>
                  setStatusFilter(f)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === f
                    ? 'text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={
                  statusFilter === f
                    ? {
                        backgroundColor:
                          accentColor,
                      }
                    : undefined
                }
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            className="w-full sm:w-64 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">

              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mb-2" />

              <p className="text-xs">
                Loading...
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">

              <EmptyIcon className="w-10 h-10 mb-2 opacity-40" />

              <p className="text-sm text-gray-400">
                {statusFilter ===
                'pending'
                  ? 'No pending items'
                  : 'No matching items'}
              </p>
            </div>
          ) : (
            shown.map((item: any) => {
              const isDeleting =
                deletingId ===
                item.id;

              return (
                <div
                  key={item.id}
                  className={`relative w-full p-3 sm:p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors ${
                    isDeleting
                      ? 'opacity-50'
                      : ''
                  }`}
                >

                  {/* CONTENT */}
                  <button
                    onClick={() =>
                      onOpen(item)
                    }
                    disabled={
                      isDeleting
                    }
                    className="w-full text-left pr-10"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">

                      <span className="font-semibold text-gray-900 text-sm truncate">
  {item.profiles?.full_name ??
    item.full_name ??
    item.sender_name ??
    'Unknown User'}
</span>

                      {item.status ===
                      'pending' ? (
                        <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Answered
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-0.5">

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {item.category ||
                          'Other'}
                      </span>

                      {item.profiles
                        ?.id_number && (
                        <span className="text-[10px] font-mono text-gray-400">
                          {
                            item
                              .profiles
                              .id_number
                          }
                        </span>
                      )}

                      {(item.email || item.sender_email) && (
  <span className="text-[10px] font-mono text-gray-400 truncate">
    {item.email || item.sender_email}
  </span>
)}
                    </div>

                    <p className="text-xs font-medium text-gray-700 truncate mb-0.5">
                      {item.subject}
                    </p>

                    <p className="text-xs text-gray-400 truncate">
                      {item.message}
                    </p>

                    <p className="text-[10px] text-gray-300 mt-1.5">
                      {formatDate(
                        item.created_at
                      )}
                    </p>
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      requestDelete(
                        item,
                        type
                      );
                    }}
                    disabled={
                      isDeleting
                    }
                    title="Delete"
                    className="absolute right-3 top-3 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };
  /*
   * ============================================================
   * RENDER
   * ============================================================
   */
const getSectionTheme = (
  type: 'student' | 'alumni' | 'contact' | null
) => {
  switch (type) {
    case 'student':
      return {
        header: '#1D4ED8',
        light: '#DBEAFE',
        text: '#1D4ED8',
        hover: '#1E40AF',
      };

    case 'alumni':
      return {
        header: '#BE185D',
        light: '#FCE7F3',
        text: '#BE185D',
        hover: '#9D174D',
      };

    case 'contact':
      return {
        header: '#059669',
        light: '#D1FAE5',
        text: '#059669',
        hover: '#047857',
      };

    default:
      return {
        header: '#1E3A8A',
        light: '#DBEAFE',
        text: '#1E3A8A',
        hover: '#1E40AF',
      };
  }
};
/* 
 * ============================================================
 * ACTIVE DETAIL MODAL THEME
 * ============================================================
 */

const activeItem =
  activeInquiry ?? activeContact;

const activeIsContact =
  !!activeContact;

const activeModalType: 'student' | 'alumni' | 'contact' =
  activeIsContact
    ? 'contact'
    : activeInquiry?.sender_role === 'alumni'
    ? 'alumni'
    : 'student';

const activeTheme =
  getSectionTheme(activeModalType);

/* 
 * ============================================================
 * NEW ITEMS MODAL THEME
 * ============================================================
 */

const newItemsTheme =
  getSectionTheme(newItemsModal.type);
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="mb-4 pb-4 border-b border-gray-200">

        <div className="flex items-center justify-between gap-3 mb-4">

          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">
              Inquiries
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Answer questions from students,
              alumni, and website visitors
            </p>
          </div>

          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 flex-wrap">

          {SECTION_TABS.map(
            (tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveSection(
                    tab.id
                  )
                }
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
  activeSection === tab.id
    ? 'text-white'
    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
}`}
style={
  activeSection === tab.id
    ? {
        backgroundColor:
          getSectionTheme(tab.id).header,
      }
    : undefined
}
              >
                <span>
                  {tab.label}
                </span>

                {tab.pending >
                  0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      tab.onNew();
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer ${
                      activeSection ===
                      tab.id
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {tab.pending}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 lg:max-h-[calc(100vh-220px)]">

        {activeSection ===
          'student' && (
          <InquiryColumn
            title="Student Inquiries"
            pendingCount={
              pendingStudentCount
            }
            accentColor="#1D4ED8"
            accentBg="#DBEAFE"
            list={
              studentInquiries
            }
            statusFilter={
              studentFilter
            }
            setStatusFilter={
              setStudentFilter
            }
            categoryFilter={
              studentCategoryFilter
            }
            setCategoryFilter={
              setStudentCategoryFilter
            }
            categories={
              STUDENT_INQUIRY_CATEGORIES
            }
            onOpen={
              openInquiry
            }
            onNew={() =>
              openNewItems(
                'student'
              )
            }
            type="inquiry"
            emptyIcon={Inbox}
          />
        )}

        {activeSection ===
          'alumni' && (
          <InquiryColumn
            title="Alumni Inquiries"
            pendingCount={
              pendingAlumniCount
            }
            accentColor="#BE185D"
            accentBg="#FCE7F3"
            list={
              alumniInquiries
            }
            statusFilter={
              alumniFilter
            }
            setStatusFilter={
              setAlumniFilter
            }
            categoryFilter={
              alumniCategoryFilter
            }
            setCategoryFilter={
              setAlumniCategoryFilter
            }
            categories={
              ALUMNI_INQUIRY_CATEGORIES
            }
            onOpen={
              openInquiry
            }
            onNew={() =>
              openNewItems(
                'alumni'
              )
            }
            type="inquiry"
            emptyIcon={Inbox}
          />
        )}

        {activeSection ===
          'contact' && (
          <InquiryColumn
            title="Contact Messages"
            pendingCount={
              pendingContactCount
            }
            accentColor="#059669"
            accentBg="#D1FAE5"
            list={
              contactMessages
            }
            statusFilter={
              contactFilter
            }
            setStatusFilter={
              setContactFilter
            }
            categoryFilter={
              contactCategoryFilter
            }
            setCategoryFilter={
              setContactCategoryFilter
            }
            categories={
              CONTACT_INQUIRY_CATEGORIES
            }
            onOpen={
              openContact
            }
            onNew={() =>
              openNewItems(
                'contact'
              )
            }
            type="contact"
            emptyIcon={
              MessageCircle
            }
          />
        )}
      </div>

      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={
              closeDetailModal
            }
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">

            <div className="flex items-start justify-between mb-4">

              <div className="min-w-0">

                <div className="flex items-center gap-2 mb-2">

                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={
                      activeIsContact
                        ? {
                            backgroundColor:
                              '#D1FAE5',
                            color:
                              '#059669',
                          }
                        : activeInquiry!
                            .sender_role ===
                          'alumni'
                        ? {
                            backgroundColor:
                              '#FCE7F3',
                            color:
                              '#BE185D',
                          }
                        : {
                            backgroundColor:
                              '#DBEAFE',
                            color:
                              '#1D4ED8',
                          }
                    }
                  >
                    {activeIsContact
                      ? 'Contact Form'
                      : activeInquiry!
                          .sender_role ===
                        'alumni'
                      ? 'Alumni'
                      : 'Student'}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                    {activeItem.category ||
                      'Other'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900">
                  {activeItem.subject}
                </h2>

                <p className="text-xs text-gray-400 mt-1">
  From{' '}
  {activeIsContact
    ? activeContact!.full_name
    : activeInquiry!.profiles?.full_name ??
      activeInquiry!.sender_name}
  {' '}·{' '}
  {formatDate(activeItem.created_at)}
</p>
              </div>

              <button
                onClick={
                  closeDetailModal
                }
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {activeItem.message}
              </p>
            </div>

            {activeItem.reply && (
              <div
  className="rounded-xl p-4 mb-4"
  style={{
    backgroundColor: activeTheme.light,
    border: `1px solid ${activeTheme.light}`,
  }}
>
                <p
  className="text-xs font-semibold mb-1"
  style={{
    color: activeTheme.text,
  }}
>
                  Previous Reply
                </p>

                <p
  className="text-sm whitespace-pre-wrap"
  style={{
    color: activeTheme.text,
  }}
>
                  {activeItem.reply}
                </p>
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Your Reply
            </label>

            <textarea
              value={replyText}
              onChange={(e) =>
                setReplyText(
                  e.target.value
                )
              }
              rows={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type your response here..."
            />

            <div className="flex gap-3 mt-5">

              <button
                onClick={
                  closeDetailModal
                }
                disabled={sending}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  sendReply
                }
                disabled={
                  sending ||
                  !replyText.trim()
                }
                className="flex-1 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
style={{
  backgroundColor: activeTheme.header,
}}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}

                {sending
                  ? 'Sending...'
                  : 'Send Reply'}
              </button>
            </div>

            <button
  onClick={() =>
    requestDelete(
      activeItem,
      activeIsContact
        ? 'contact'
        : 'inquiry'
    )
  }
  className="w-full mt-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
>
  <Trash2 className="w-4 h-4" />
  Delete
</button>
          </div>
        </div>
      )}

      {/* ======================================================
          NEW ITEMS MODAL
      ====================================================== */}

      {newItemsModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={
              closeNewItemsModal
            }
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">

            {/* HEADER */}
            <div
  className="px-5 py-4 flex items-center justify-between"
  style={{
    backgroundColor: newItemsTheme.header,
  }}
>

              <div>
                <h2 className="text-lg font-bold text-white">
                  {newItemsModal.type ===
                    'student' &&
                    'New Student Inquiries'}

                  {newItemsModal.type ===
                    'alumni' &&
                    'New Alumni Inquiries'}

                  {newItemsModal.type ===
                    'contact' &&
                    'New Contact Messages'}
                </h2>

             <p className="text-white/80 text-xs mt-1">
                  {newItemsModal.items.length}{' '}
                  new item
                  {newItemsModal.items
                    .length !== 1
                    ? 's'
                    : ''}{' '}
                  received
                </p>
              </div>

              <button
                onClick={
                  closeNewItemsModal
                }
                className="p-2 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* ITEMS */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[65vh]">

              {newItemsModal.items
                .length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">

                  <Inbox className="w-12 h-12 text-gray-300 mb-3" />

                  <h3 className="text-sm font-semibold text-gray-700">
                    No New Items
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    All new messages have
                    already been viewed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {newItemsModal.items.map(
                    (item: any) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2 mb-2">

                              <span
  className="text-[10px] font-semibold px-2 py-1 rounded-full"
  style={{
    backgroundColor: newItemsTheme.light,
    color: newItemsTheme.text,
  }}
>
  {item.category || 'Other'}
</span>

                              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                 Pending
                              </span>
                            </div>

                            <h3 className="font-semibold text-gray-900 text-sm">
                              {item.subject}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
  From{' '}
  {item.profiles?.full_name ??
    item.full_name ??
    item.sender_name ??
    'Unknown User'}
</p>

                            {(item.email || item.sender_email) && (
  <p className="text-xs text-gray-400 mt-0.5">
    {item.email || item.sender_email}
  </p>
)}

                            <p className="text-xs text-gray-600 mt-3 whitespace-pre-wrap">
                              {item.message}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-3">
                              {formatDate(
                                item.created_at
                              )}
                            </p>
                          </div>

                          {/* DELETE */}
                          <button
                            onClick={() =>
                              requestDelete(
                                item,
                                newItemsModal.type ===
                                  'contact'
                                  ? 'contact'
                                  : 'inquiry'
                              )
                            }
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* VIEW / REPLY */}
                        <button
                          onClick={() => {
                            closeNewItemsModal();

                            if (
                              newItemsModal.type ===
                              'contact'
                            ) {
                              openContact(
                                item
                              );
                            } else {
                              openInquiry(
                                item
                              );
                            }
                          }}
                          className="mt-3 w-full py-2 rounded-lg text-white text-xs font-semibold transition-colors"
style={{
  backgroundColor: newItemsTheme.header,
}}
                        >
                          View and Reply
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">

              <button
                onClick={
                  closeNewItemsModal
                }
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteModal.open &&
        deleteModal.item && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">

            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={
                cancelDelete
              }
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>

              <h2 className="text-lg font-bold text-gray-900 text-center">
                Delete Item?
              </h2>

              <p className="text-sm text-gray-500 text-center mt-2">
                Are you sure you want to permanently
                delete this{' '}
                {deleteModal.type ===
                'contact'
                  ? 'contact message'
                  : 'inquiry'}
                ?
              </p>

              <div className="bg-gray-50 rounded-xl p-3 mt-4">

                <p className="text-xs font-semibold text-gray-800 truncate">
                  {deleteModal.item.subject}
                </p>

                <p className="text-xs text-gray-400 mt-1">
  {'full_name' in deleteModal.item
    ? deleteModal.item.full_name
    : deleteModal.item.sender_name}
</p>
              </div>

              <p className="text-[11px] text-red-500 text-center mt-3">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-5">

                <button
                  onClick={
                    cancelDelete
                  }
                  disabled={
                    deletingId !==
                    null
                  }
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    confirmDelete
                  }
                  disabled={
                    deletingId !==
                    null
                  }
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deletingId !==
                  null ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ======================================================
          SUCCESS / ERROR MODAL
      ====================================================== */}

      {messageModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={
              closeMessageModal
            }
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">

            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                messageModal.type ===
                'success'
                  ? 'bg-blue-50'
                  : 'bg-red-50'
              }`}
            >
              {messageModal.type === 'success' ? (
  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
    ✓
  </div>
) : (
                <X className="w-6 h-6 text-red-600" />
              )}
            </div>

            <h2 className="text-lg font-bold text-gray-900 text-center">
              {messageModal.title}
            </h2>

            <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
              {messageModal.message}
            </p>

            <button
              onClick={closeMessageModal}
  className={`w-full mt-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors ${
    messageModal.type === 'success'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-red-600 hover:bg-red-700'
  }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


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
    try {
      // 1. Save Content
      const { error: contentError } = await saveHomepageContent(homeContent);
      if (contentError) throw contentError;

      // 2. Save Stats
      const { error: statsError } = await saveHomepageStats(stats);
      if (statsError) throw statsError;

      // 3. Save Features
      const { error: featuresError } = await saveHomepageFeatures(features);
      if (featuresError) throw featuresError;

      // 4. Save Announcements (with robust Supabase image upload handling)
      const processedAnnouncements = await Promise.all(
        announcements.map(async (announcement) => {
          let finalImageUrl = announcement.image_url;

          // If the image_url is a newly selected Base64 string
          if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
            try {
              // Convert Base64 data URL to a clean Blob file object
              const res = await fetch(finalImageUrl);
              const blob = await res.blob();
              const ext = blob.type.split('/')[1] || 'jpeg';
              const fileName = `announcements/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

              // Upload the blob file to the Supabase 'announcements' bucket
              const { error: uploadError } = await supabase.storage
                .from('announcements')
                .upload(fileName, blob, {
                  contentType: blob.type,
                  upsert: true,
                });

              if (uploadError) {
                console.error('Storage upload failed:', uploadError.message);
                throw new Error(`Image upload failed: ${uploadError.message}`);
              }

              // Fetch the final public URL from Supabase
              const { data: publicUrlData } = supabase.storage
                .from('announcements')
                .getPublicUrl(fileName);

              finalImageUrl = publicUrlData.publicUrl;
            } catch (imgErr) {
              console.error('Error processing announcement image:', imgErr);
              throw imgErr;
            }
          }

          return {
            id: announcement.id,
            title: announcement.title,
            description: announcement.description,
            color: announcement.color,
            image_url: finalImageUrl || null,
            announcement_date: announcement.announcement_date,
            sort_order: announcement.sort_order,
          };
        })
      );

      // Save processed announcements to database
      const { error: announcementsError } = await supabase
        .from('homepage_announcements')
        .upsert(processedAnnouncements);

      if (announcementsError) throw announcementsError;

      // Success notification
      setModalMessage('Homepage and announcements updated successfully!');
      setShowSuccessModal(true);

      // Reload announcements to reflect the newly saved public URLs instantly
      loadAnnouncements();

    } catch (error: any) {
      console.error('Save failed:', error);
      setModalMessage(`Error saving homepage: ${error.message || String(error)}`);
      setShowSuccessModal(true);
    }
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

      {/* Page nav — solid COED blue, no gradients */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
        {pages.map((page) => {
          const isActive = activePage === page.key;
          return (
            <button
              key={page.key}
              onClick={() => setActivePage(page.key as any)}
              className={`h-14 w-full rounded-2xl flex items-center justify-center font-semibold text-sm transition-colors border ${
                isActive
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                  : 'bg-white text-[#1E3A8A] border-gray-200 hover:bg-blue-50 hover:border-blue-200'
              }`}
            >
              {page.label}
            </button>
          );
        })}
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

      {/* Action bar — solid COED blue on Save, neutral on Preview */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setShowPreview(true)}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Preview {pageTitles[activePage]}
        </button>
        <button
          onClick={() => saveHandlers[activePage]()}
          className="px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          Save {pageTitles[activePage]}
        </button>
      </div>

      {/* Success/Error modal — Fixed viewport coverage and solid blue */}
      {showSuccessModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notification</h2>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal — Fixed viewport coverage */}
      {showPreview && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/50">
          <div className="bg-white h-full flex flex-col">
            <div className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
              <div>
                <h2 className="text-lg font-semibold text-[#1E3A8A]">Website Preview</h2>
                <p className="text-xs text-gray-500">Previewing: <span className="capitalize">{activePage}</span></p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-[#1E3A8A] text-white text-sm font-medium rounded-lg hover:bg-[#172554] transition-colors"
              >
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
  allowAll: true,
  inquiries: true,
  reports: true,
  announcements: true,
  staffUpdates: false,
  systemNotifs: true,
};

const SETTINGS_TABS = [
  { id: 'profile',       label: 'Profile Information', icon: User },
  { id: 'users',         label: 'User Management',     icon: Users },
  { id: 'landing',       label: 'Landing Page Management', icon: Edit },
  { id: 'security',      label: 'Password & Security', icon: KeyRound },
  { id: 'notifications', label: 'Notifications',       icon: Bell },
  { id: 'academic',      label: 'Academic Settings',   icon: GraduationCap },
] as const;

type SettingsTabId = typeof SETTINGS_TABS[number]['id'];

function ToggleCard({ 
  label, 
  description, 
  checked, 
  onChange,
  disabled = false
}: { 
  label: string; 
  description?: string; 
  checked: boolean; 
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 bg-blue-50/40 hover:bg-blue-50/70 border border-blue-100/60 rounded-2xl transition-colors mb-3 last:mb-0 w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="pr-4">
        <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#1E3A8A]' : 'bg-gray-300'} ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

interface SystemSettingsProps {
  profile?: { fullName: string; email: string };
  onProfileUpdate?: (profile: { fullName: string; email: string }) => void;
  onLogout?: () => void;
}

function SystemSettings({
  profile,
  onProfileUpdate,
  onLogout,
}: SystemSettingsProps) {
  const [activeTab, setActiveTab] =
    useState<SettingsTabId>('profile');

  // --- Profile State ---
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [positionRole] = useState('College Dean');

  // --- Security State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] =
    useState(false);

  // --- Notifications State ---
  const [notifs, setNotifs] = useState(NOTIF_DEFAULTS);

  // --- Academic Settings State ---
  const [academicYear, setAcademicYear] =
    useState('2025-2026');
  const [semester, setSemester] =
    useState('Second Semester');
  const [collegeDept, setCollegeDept] =
    useState('College of Education');

  // --- General UI State ---
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load Profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) return;

      try {
        const response = await fetch(
          'http://localhost:5000/api/auth/me',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.profile) {
          throw new Error(
            data.error || 'Failed to load profile.'
          );
        }

        const databaseUsername = String(
          data.user?.username ??
            data.username ??
            data.profile?.username ??
            ''
        ).trim();

        const databaseFullName = String(
          data.profile?.full_name ??
            ''
        ).trim();

        const databaseEmail = String(
          data.profile?.email ??
            ''
        ).trim();

        setUsername(databaseUsername);
        setFullName(databaseFullName);
        setEmail(databaseEmail);

        localStorage.setItem(
          'userUsername',
          databaseUsername
        );

        localStorage.setItem(
          'userFullName',
          databaseFullName
        );

        localStorage.setItem(
          'userEmail',
          databaseEmail
        );

        onProfileUpdate?.({
          fullName: databaseFullName,
          email: databaseEmail,
        });
      } catch (error) {
        console.error(
          'Failed to load profile:',
          error
        );

        if (profile) {
          setFullName(
            profile.fullName || ''
          );

          setEmail(
            profile.email || ''
          );
        }
      }
    };

    loadProfile();
  }, []);

  // Load Notification Preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const token = localStorage.getItem('token');

      if (!token) return;

      try {
        const response = await fetch(
          'http://localhost:5000/api/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.preferences) {
          setNotifs({
            allowAll:
              data.preferences.allow_all ?? true,
            inquiries:
              data.preferences.inquiries ?? true,
            reports:
              data.preferences.reports ?? true,
            announcements:
              data.preferences.announcements ?? true,
            staffUpdates:
              data.preferences.staff_updates ?? false,
            systemNotifs:
              data.preferences.system_notifs ?? true,
          });
        }
      } catch (error) {
        console.error(
          'Failed to load notification preferences:',
          error
        );
      }
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(
        () => setMessage(null),
        5000
      );

      return () => clearTimeout(timer);
    }
  }, [message]);

  const toggleNotif = (
    key: keyof typeof NOTIF_DEFAULTS
  ) => {
    if (key === 'allowAll') {
      const nextState = !notifs.allowAll;

      setNotifs((prev) => ({
        ...prev,
        allowAll: nextState,
      }));
    } else {
      setNotifs((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  // Save Profile
  const saveProfile = async () => {
    const trimmedName = fullName.trim();

    const trimmedUsername = username
      .trim()
      .toLowerCase();

    const trimmedEmail = email
      .trim()
      .toLowerCase();

    if (
      !trimmedName ||
      !trimmedUsername ||
      !trimmedEmail
    ) {
      setMessage({
        type: 'error',
        text:
          'Full Name, Username and Email are required.',
      });

      return;
    }

    const usernameRegex =
      /^[a-zA-Z0-9._]{3,20}$/;

    if (!usernameRegex.test(trimmedUsername)) {
      setMessage({
        type: 'error',
        text:
          'Username must be 3–20 characters and can only contain letters, numbers, periods, and underscores.',
      });

      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setMessage({
        type: 'error',
        text:
          'Your session has expired. Please sign in again.',
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
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
            email: trimmedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to update profile.'
        );
      }

      const updatedUsername = String(
        data.user?.username ??
          data.profile?.username ??
          data.username ??
          trimmedUsername
      ).trim();

      const updatedName = String(
        data.profile?.full_name ??
          trimmedName
      ).trim();

      const updatedEmail = String(
        data.profile?.email ??
          trimmedEmail
      ).trim();

      setUsername(updatedUsername);
      setFullName(updatedName);
      setEmail(updatedEmail);

      localStorage.setItem(
        'userUsername',
        updatedUsername
      );

      localStorage.setItem(
        'userFullName',
        updatedName
      );

      localStorage.setItem(
        'userEmail',
        updatedEmail
      );

      if (data.token) {
        localStorage.setItem(
          'token',
          data.token
        );
      }

      onProfileUpdate?.({
        fullName: updatedName,
        email: updatedEmail,
      });

      setMessage({
        type: 'success',
        text:
          'Profile updated successfully.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setMessage({
        type: 'error',
        text:
          'Please fill in all password fields.',
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text:
          'New passwords do not match.',
      });

      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setMessage({
        type: 'error',
        text:
          'Your session has expired. Please sign in again.',
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to update password.'
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setMessage({
        type: 'success',
        text:
          'Password updated successfully.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Failed to update password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setMessage({
        type: 'error',
        text:
          'Your session has expired. Please sign in again.',
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/preferences',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            allow_all: notifs.allowAll,
            inquiries: notifs.inquiries,
            reports: notifs.reports,
            announcements:
              notifs.announcements,
            staff_updates:
              notifs.staffUpdates,
            system_notifs:
              notifs.systemNotifs,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to save notification preferences.'
        );
      }

      setMessage({
        type: 'success',
        text:
          'Notification preferences saved successfully.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Error saving preferences.',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAcademicSettings = async () => {
    if (
      !academicYear.trim() ||
      !collegeDept.trim()
    ) {
      setMessage({
        type: 'error',
        text:
          'Academic Year and College/Department are required.',
      });

      return;
    }

    await new Promise((res) =>
      setTimeout(res, 400)
    );

    setMessage({
      type: 'success',
      text:
        'Academic settings updated.',
    });
  };

  const handleSaveChanges = async () => {
    setMessage(null);

    try {
      switch (activeTab) {
        case 'profile':
          await saveProfile();
          break;

        case 'security':
          await saveSecurity();
          break;

        case 'notifications':
          await saveNotifications();
          break;

        case 'academic':
          await saveAcademicSettings();
          break;

        default:
          setMessage({
            type: 'error',
            text:
              'Nothing to save on this tab.',
          });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          'An error occurred while saving.',
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    if (
      window.confirm(
        'Are you sure you want to log out of all devices?'
      )
    ) {
      if (onLogout) onLogout();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">
            Settings
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Manage your account and system preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {!['users', 'landing'].includes(
            activeTab
          ) && (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 sm:px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Container - items-start ensures the sticky sidebar can stretch down smoothly */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
        {/* Sidebar Tabs - Sticky on scroll */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:sticky md:top-6 md:self-start">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#1E3A8A] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />

                <span className="truncate">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div
          className={`flex-1 min-w-0 ${
            ['users', 'landing'].includes(
              activeTab
            )
              ? ''
              : 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6'
          }`}
        >
          {activeTab === 'users' && (
            <UserManagement />
          )}

          {activeTab === 'landing' && (
            <LandingPageManagement />
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Profile Information
              </h2>

              <p className="text-sm text-gray-500 mt-0.5 mb-6">
                Update your personal details.
              </p>

              <div className="space-y-4 max-w-md">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Username
                  </label>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      @
                    </span>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.replace(
                            /\s/g,
                            ''
                          )
                        )
                      }
                      maxLength={20}
                      autoComplete="username"
                      placeholder="your.username"
                      className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1.5">
                    3–20 characters: letters, numbers,
                    periods, and underscores.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Position/Role
                  </label>

                  <input
                    type="text"
                    value={positionRole}
                    disabled
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Password & Security
              </h2>

              <p className="text-sm text-gray-500 mt-0.5 mb-6">
                Manage your password and account access.
              </p>

              <div className="space-y-4 max-w-md mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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
                      onChange={(e) =>
                        setCurrentPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (v) => !v
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

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (v) => !v
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

                  <p className="text-[11px] text-gray-400 mt-1.5">
                    At least 8 characters with
                    uppercase, lowercase, number, and
                    special character.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
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
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (v) => !v
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
              </div>

              <div className="border-t border-gray-100 pt-5 max-w-lg">
                <ToggleCard
                  label="Two-Factor Authentication"
                  description="Enable two-factor authentication to add an extra layer of security to your account."
                  checked={twoFactorEnabled}
                  onChange={() =>
                    setTwoFactorEnabled(
                      (v) => !v
                    )
                  }
                />
              </div>

              <div className="border-t border-gray-100 pt-5 mt-4">
                <button
                  onClick={
                    handleLogoutAllDevices
                  }
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Log Out of All Devices
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Notifications
              </h2>

              <p className="text-sm text-gray-500 mt-0.5 mb-5">
                Choose what alerts you receive.
              </p>

              <div className="w-full">
                <ToggleCard
                  label="Allow Notifications"
                  description="Turn off to completely mute all notifications and reminders."
                  checked={notifs.allowAll}
                  onChange={() =>
                    toggleNotif(
                      'allowAll'
                    )
                  }
                />

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <ToggleCard
                    label="New Inquiries"
                    description="Get notified when new stakeholder inquiries come in."
                    checked={notifs.inquiries}
                    onChange={() =>
                      toggleNotif(
                        'inquiries'
                      )
                    }
                    disabled={
                      !notifs.allowAll
                    }
                  />

                  <ToggleCard
                    label="Pending Reports"
                    description="Get reminders for upcoming or pending department reports."
                    checked={notifs.reports}
                    onChange={() =>
                      toggleNotif(
                        'reports'
                      )
                    }
                    disabled={
                      !notifs.allowAll
                    }
                  />

                  <ToggleCard
                    label="New Announcements"
                    description="Get notified about important institutional updates."
                    checked={
                      notifs.announcements
                    }
                    onChange={() =>
                      toggleNotif(
                        'announcements'
                      )
                    }
                    disabled={
                      !notifs.allowAll
                    }
                  />

                  <ToggleCard
                    label="Faculty Updates"
                    description="Receive updates regarding faculty statuses or submissions."
                    checked={
                      notifs.staffUpdates
                    }
                    onChange={() =>
                      toggleNotif(
                        'staffUpdates'
                      )
                    }
                    disabled={
                      !notifs.allowAll
                    }
                  />

                  <ToggleCard
                    label="System Notifications"
                    description="Receive general application alerts and system notices."
                    checked={
                      notifs.systemNotifs
                    }
                    onChange={() =>
                      toggleNotif(
                        'systemNotifs'
                      )
                    }
                    disabled={
                      !notifs.allowAll
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Academic */}
          {activeTab === 'academic' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Academic Settings
              </h2>

              <p className="text-sm text-gray-500 mt-0.5 mb-6">
                Configure the current academic period.
              </p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Academic Year
                  </label>

                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) =>
                      setAcademicYear(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 2025-2026"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Current Semester
                  </label>

                  <select
                    value={semester}
                    onChange={(e) =>
                      setSemester(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="First Semester">
                      First Semester
                    </option>

                    <option value="Second Semester">
                      Second Semester
                    </option>

                    <option value="Summer">
                      Summer
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    College/Department Name
                  </label>

                  <input
                    type="text"
                    value={collegeDept}
                    onChange={(e) =>
                      setCollegeDept(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}