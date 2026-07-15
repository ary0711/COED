import React, { useState, useEffect, useCallback } from 'react';
import { notifyRole, } from '../notificationService';
import { HomePage } from './coed/HomePage';
import { AboutPage } from './coed/AboutPage';
import { ClubsPage } from './coed/ClubsPage';
import { ResearchPage } from './coed/ResearchPage';
import { DepartmentsPage } from './coed/DepartmentsPage';
import { AchievementsPage } from './coed/AchievementsPage';
import { AccreditationPage } from './coed/AccreditationPage';
import { ContactPage } from './coed/ContactPage';
import { Footer } from './coed/Footer';
import {HeroSectionEditor} from './HomePageSectors/HeroSectionEditor';
import {AboutSectionEditor} from './HomePageSectors/AboutSectionEditor';
import {FeaturesEditor} from './HomePageSectors/FeaturesEditor';
import {StatsEditor} from './HomePageSectors/StatsEditor';
import {AnnouncementsEditor} from './HomePageSectors/AnnouncementsEditor';
import {CTASectionEditor} from './HomePageSectors/CTASectionEditor';
import  AboutHeaderEditor  from './AboutPageSectors/AboutHeaderEditor';
import  HistoryEditor  from './AboutPageSectors/HistoryEditor';
import  VisionMissionGoalsEditor  from './AboutPageSectors/VisionMissionGoalsEditor';
import  TeamStructureEditor  from './AboutPageSectors/TeamStructureEditor';
import  AboutStatsEditor from './AboutPageSectors/AboutStatsEditor';
import  CoreValuesEditor  from './AboutPageSectors/CoreValuesEditor';
import  AboutOurCoreValuesEditor  from './AboutPageSectors/AboutOurCoreValuesEditor';
import  {DepartmentHeaderEditor}  from './DepartmentSectors/DepartmentHeaderEditor';
import  {CollegeEditor} from './DepartmentSectors/CollegeEditor';
import  {DepartmentCTAEditor} from './DepartmentSectors/DepartmentCTAEditor';
import  {ProgramEditor} from './DepartmentSectors/ProgramEditor';
import  {ProgramFacultyEditor} from './DepartmentSectors/ProgramFacultyEditor';
import  {ClubsCTAEditor} from './ClubSectors/ClubsCTAEditor';
import  {ClubsHeaderEditor} from './ClubSectors/ClubsHeaderEditor';
import  {ClubsStatisticsEditor} from './ClubSectors/ClubsStatisticsEditor';
import  {CommitteeEditor} from './ClubSectors/CommitteeEditor';
import  {OrganizationEditor} from './ClubSectors/OrganizationEditor';
import { ResearchHeaderEditor } from './ResearchSectors/ResearchHeaderEditor';
import { ResearchPublicationsEditor } from './ResearchSectors/ResearchPublicationsEditor';
import { ResearchAwardsEditor } from './ResearchSectors/ResearchAwardsEditor';
import { FeaturedAlumniEditor } from './ResearchSectors/FeaturedAlumniEditor';
import { ResearchCTAEditor } from './ResearchSectors/ResearchCTAEditor';
import { AchievementsBannerEditor } from './AchievementSectors/AchievementsBannerEditor';
import { AchievementsBannerStatsEditor } from './AchievementSectors/AchievementsBannerStatsEditor';
import { AchievementsCollegeEditor } from './AchievementSectors/AchievementsCollegeEditor';
import { AchievementsPageContentEditor } from './AchievementSectors/AchievementsPageContentEditor';
import { AchievementsStatisticsEditor } from './AchievementSectors/AchievementsStatisticsEditor';
import { AchievementsTopnotchersEditor } from './AchievementSectors/AchievementsTopnotchersEditor';
import { AccreditationCertificationsEditor } from './AccreditationSectors/AccreditationCertificationsEditor';
import { AccreditationContentEditor } from './AccreditationSectors/AccreditationContentEditor';
import { AccreditationLevelsEditor } from './AccreditationSectors/AccreditationLevelsEditor';
import { AccreditationOverviewEditor } from './AccreditationSectors/AccreditationOverviewEditor';
import { AccreditationProgramsEditor } from  './AccreditationSectors/AccreditationProgramsEditor'
import { ContactContentEditor } from './ContactSectors/ContactContentEditor';
import { ContactOfficeHoursEditor } from './ContactSectors/ContactOfficeHoursEditor';
import { ContactSocialLinksEditor } from './ContactSectors/ContactSocialLinksEditor';
import { FooterContentEditor } from './FooterSectors/FooterContentEditor';
import { FooterQuickLinksEditor } from './FooterSectors/FooterQuickLinksEditor';
import { FooterSocialLinksEditor } from './FooterSectors/FooterSocialLinksEditor';

import {
  getHomepageContent,getHomepageStats,getHomepageFeatures,getHomepageAnnouncements,saveHomepageContent}from '../landing-page/services/homepageService';

import {
  getAboutContent,getAboutStats,getCoreValues,getCoreValueCards,getFacultyMembers,saveAboutContent,saveAboutStats,saveCoreValues,saveCoreValueCards,saveFacultyMembers} from '../landing-page/services/aboutService';

import {
  getDepartmentContent,getColleges,saveDepartmentContent,saveColleges} from '../landing-page/services/departmentService';

import {
  getClubsContent,getClubStatistics,getOrganizations,getCommittees,saveClubsContent,saveClubStatistics,saveOrganizations,saveCommittees} from '../landing-page/services/clubsService';
import type {
  CoreValue,FacultyMember,AboutStat,CoreValueCard,ClubStatistic,Organization,Committee,} from '../landing-page/services/landingPageTypes';
import {
  loadResearchContent,loadResearchPublications,loadAwards,loadFeaturedAlumni,saveResearchPage} from '../landing-page/services/researchService';
import { achievementsService} from '../landing-page/services/achievementsService';
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
  Bell,
} from 'lucide-react';

import { supabase } from '../supabaseClient';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { ChartsSection } from './ChartsSection';
import { NotificationsPanel } from './NotificationsPanel';
import { QuarterlyReportTracker } from './QuarterlyReportTracker';

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

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  program: string;
  description: string;
  color: string;
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

const EVENT_COLORS = [
  { label: 'Blue',   value: '#3B82F6' },
  { label: 'Green',  value: '#10B981' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Orange', value: '#F59E0B' },
  { label: 'Red',    value: '#EF4444' },
  { label: 'Teal',   value: '#14B8A6' },
];

const PAGE_SIZE = 10;
const DEFAULT_PROGRAMS = ['BEED', 'BSED-MATH', 'BSED-ENGLISH', 'BTLED'];

// ─── Menu Items ───────────────────────────────────────────────────────────────
const deanMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',               id: 'dashboard' },
  { icon: Users,           label: 'User Management',         id: 'users' },
  { icon: FileText,        label: 'Academic Records',        id: 'records' },
  { icon: GraduationCap,   label: 'Faculty & Staff',         id: 'faculty' },
  { icon: Calendar,        label: 'Calendar & Activities',   id: 'calendar' },
  { icon: Award,           label: 'Research & Achievements', id: 'research' },
  { icon: ClipboardCheck,  label: 'Evaluation Management',   id: 'evaluation' },
  { icon: UserCheck,       label: 'Alumni Tracer',           id: 'alumni' },
  { icon: BarChart3,       label: 'Reports & Analytics',     id: 'reports' },
  { icon: Megaphone,       label: 'Announcements',           id: 'announcements' },
  { icon: Edit,            label: 'Landing Page Management', id: 'landing' },
  { icon: Settings,        label: 'System Settings',         id: 'settings' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
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

  // Close sidebar on route change (mobile)
  const handleMenuItemClick = (id: string) => {
    setActiveMenuItem(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
     {/* ── Sidebar — handles its own overlay & slide via isOpen/onClose ── */}
      <Sidebar
        menuItems={deanMenuItems}
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
        userRole="College Dean"
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Desktop spacer so content clears the fixed sidebar ── */}
      <div className="hidden lg:block w-64 shrink-0" />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar: hamburger + DashboardHeader side by side ── */}
        <div className="sticky top-0 z-20 flex items-stretch bg-white border-b border-gray-200 shadow-sm">
          {/* Hamburger — only on mobile/tablet, same height as header */}
          <button
            className="lg:hidden flex items-center justify-center px-4 text-gray-600 hover:bg-gray-100 border-r border-gray-200 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* DashboardHeader fills the rest */}
          <div className="flex-1 min-w-0">
            <DashboardHeader
              userRole="College Dean"
              userName="Dr. Elizabeth Martinez"
            />
          </div>
        </div>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeMenuItem === 'dashboard'     && <DashboardView />}
          {activeMenuItem === 'users'         && <UserManagement />}
          {activeMenuItem === 'records'       && <AcademicRecords />}
          {activeMenuItem === 'faculty'       && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar'      && <CalendarActivities />}
          {activeMenuItem === 'research'      && <ResearchAchievements />}
          {activeMenuItem === 'alumni'        && <AlumniTracer />}
          {activeMenuItem === 'reports'       && <ReportsAnalytics />}
          {activeMenuItem === 'announcements' && <AnnouncementsContent />}
          {activeMenuItem === 'landing'       && <LandingPageManagement />}
          {activeMenuItem === 'settings'      && <SystemSettings />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView() {

  // Mobile-only metric cards (charts replaced on small screens)
  const mobileMetrics = [
    { label: 'Total Faculty',       value: '142',   sub: '+5.2% this semester',  color: '#1E3A8A', bg: '#DBEAFE' },
    { label: 'Total Students',      value: '3,847', sub: '+12.3% this semester', color: '#065F46', bg: '#D1FAE5' },
    { label: 'Active Departments',  value: '8',     sub: 'All operational',      color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Pending Reports',     value: '23',    sub: '8 newly added',        color: '#B45309', bg: '#FEF3C7' },
    { label: 'Alumni Responses',    value: '1,256', sub: '+18.7% response rate', color: '#BE185D', bg: '#FCE7F3' },
    { label: 'Evaluation Rating',   value: '4.6',   sub: 'Out of 5.0 avg.',      color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Research Submitted',  value: '14',    sub: '2 pending approval',   color: '#065F46', bg: '#D1FAE5' },
    { label: 'Completion Rate',     value: '94%',   sub: 'Student evaluations',  color: '#9D174D', bg: '#FCE7F3' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 pb-4 border-b border-gray-200">
         <p className="text-gray-500 text-sm">Welcome back! Here's your college overview</p>
      </div>

      {/* ── Summary cards (all screen sizes) ── */}
      <div className="mb-4">
        <div
          className="flex gap-3 overflow-x-auto pb-4 sm:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {[
            { title: 'Total Faculty',      value: '142',   icon: GraduationCap, iconColor: '#2563EB', iconBgColor: '#DBEAFE', trend: '5.2%',  trendUp: true  },
            { title: 'Total Students',     value: '3,847', icon: Users,         iconColor: '#10B981', iconBgColor: '#D1FAE5', trend: '12.3%', trendUp: true  },
            { title: 'Active Departments', value: '8',     icon: Building2,     iconColor: '#8B5CF6', iconBgColor: '#EDE9FE' },
            { title: 'Pending Reports',    value: '23',    icon: FileText,      iconColor: '#F59E0B', iconBgColor: '#FEF3C7', trend: '8',     trendUp: false },
            { title: 'Alumni Responses',   value: '1,256', icon: UserCheck,     iconColor: '#EF4444', iconBgColor: '#FEE2E2', trend: '18.7%', trendUp: true  },
          ].map((card) => (
            <div key={card.title} className="flex-shrink-0 w-48 h-40">
              <SummaryCard {...card} />
            </div>
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="min-h-[160px]"><SummaryCard title="Total Faculty"      value="142"   icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="5.2%"  trendUp={true} /></div>
          <div className="min-h-[160px]"><SummaryCard title="Total Students"     value="3,847" icon={Users}         iconColor="#10B981" iconBgColor="#D1FAE5" trend="12.3%" trendUp={true} /></div>
          <div className="min-h-[160px]"><SummaryCard title="Active Departments" value="8"     icon={Building2}     iconColor="#8B5CF6" iconBgColor="#EDE9FE" /></div>
          <div className="min-h-[160px]"><SummaryCard title="Pending Reports"    value="23"    icon={FileText}      iconColor="#F59E0B" iconBgColor="#FEF3C7" trend="8"     trendUp={false} /></div>
          <div className="min-h-[160px]"><SummaryCard title="Alumni Responses"   value="1,256" icon={UserCheck}     iconColor="#EF4444" iconBgColor="#FEE2E2" trend="18.7%" trendUp={true} /></div>
        </div>
      </div>

      {/* ── MOBILE ONLY: metric cards grid (replaces charts) ── */}
      <div className="lg:hidden mb-4">
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          Key Metrics · Use the web version for full charts &amp; analytics
        </p>
        <div className="grid grid-cols-2 gap-3">
          {mobileMetrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-4"
              style={{ backgroundColor: m.bg }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: m.color, opacity: 0.75 }}>
                {m.label}
              </p>
              <p className="text-2xl font-bold leading-none mb-1" style={{ color: m.color }}>
                {m.value}
              </p>
              <p className="text-xs" style={{ color: m.color, opacity: 0.6 }}>
                {m.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

{/* ── DESKTOP ONLY: Charts + side panel ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-0 overflow-auto">
          <ChartsSection />
        </div>

        <div className="flex flex-col min-h-0 lg:max-h-[calc(100vh-280px)]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
<NotificationsPanel userType="dean" />
<QuarterlyReportTracker />
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Notifications + Quarterly stacked separately ── */}
      <div className="lg:hidden flex flex-col gap-4">
        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Bell className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
          </div>
          <NotificationsPanel userType="dean" />
        </div>

        {/* Quarterly Report */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <BarChart3 className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-sm font-semibold text-gray-800">Quarterly Report</span>
          </div>
          <QuarterlyReportTracker />
        </div>
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement() {
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

  const [form, setForm] = useState({
    full_name: '', email: '', role: 'student',
    id_number: '', department: '', status: 'active', password: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
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
    if (!form.email.trim())     { setFormError('Email is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!form.password || form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password });
      if (authError) { setFormError(authError.message); return; }
      const userId = authData.user?.id;
      if (!userId) { setFormError('Failed to create user.'); return; }
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId, full_name: form.full_name.trim(), email: form.email.trim(),
        role: form.role, id_number: form.id_number.trim(),
        department: form.department.trim() || null, status: form.status,
      });
      if (insertError) { await supabase.auth.signOut(); setFormError(insertError.message); return; }
      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(), role: form.role,
        id_number: form.id_number.trim(),
        department: form.department.trim() || null, status: form.status,
      }).eq('id', selected.id);
      if (error) { setFormError(error.message); return; }
      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Step 1: I-delete sa users table gamit email as username
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('username', selected.email)
        .single();

      if (userRecord) {
        await supabase.from('users').delete().eq('username', selected.email);
      }

      // Step 2: I-delete sa profiles
      const { error } = await supabase.from('profiles').delete().eq('id', selected.id);
      if (error) { setFormError(error.message); return; }

      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  const activatePending = async (user: Profile) => {
    setActivating(user.id);
    try {
      // Step 1: I-activate ang profile
      await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);

      // Step 2: I-add sa users table para maka-login via JWT
      // Pangitaa ang username sa profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check kung naa na sa users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', profile.email)
          .single();

        // Kung wala pa, i-add gamit email as username
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
    await supabase.from('profiles').update({ status: next }).eq('id', user.id);
    fetchUsers();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
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

      {/* Pending banner */}
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

      {/* Filters */}
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
            {(statusFilter !== 'all' || roleFilter !== 'all' || search) && (
              <button onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderStyle: 'solid' }} />
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dept.</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3.5 px-4 sm:px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: status.bg, color: status.color }}>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: status.dot }} />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: status.dot }} />
                            </span>
                            <span className="hidden sm:inline">{status.label}</span>
                          </span>
                        ) : (
                          <button onClick={() => toggleStatus(user)} title="Click to toggle status"
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                            style={{ background: status.bg, color: status.color }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: status.dot }} />
                            <span className="hidden sm:inline">{status.label}</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <button onClick={() => activatePending(user)} disabled={isActivating} title="Activate account"
                              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-60">
                              {isActivating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                              <span className="hidden sm:inline">{isActivating ? 'Activating…' : 'Activate'}</span>
                            </button>
                          )}
                          <button onClick={() => openEdit(user)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit user"><Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" /></button>
                          <button onClick={() => openDelete(user)} className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete user"><Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors ${page === p ? 'bg-[#1E3A8A] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 sm:p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {formError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{formError}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Juan Dela Cruz" />
                </div>
                {modal === 'add' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="user@example.com" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">ID Number *</label>
                  <input type="text" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2024-12345" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Computer Science" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                {modal === 'add' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={modal === 'add' ? handleAdd : handleEdit} disabled={saving}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : modal === 'add' ? 'Add User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-5 sm:p-6 z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete User</h2>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-gray-900">{selected.full_name}</p>
              <p className="text-sm text-gray-500">{selected.email}</p>
              <p className="text-xs text-gray-400 mt-1">{selected.id_number}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {saving ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar & Activities ────────────────────────────────────────────────────
function CalendarActivities() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Faculty Development Seminar', date: '2026-05-15', program: 'All Programs', description: 'Annual faculty upskilling seminar.', color: '#3B82F6' },
    { id: '2', title: 'Department Meeting', date: '2026-05-18', program: 'BSED-MATH', description: 'Monthly department coordination.', color: '#10B981' },
    { id: '3', title: 'College Foundation Day', date: '2026-05-25', program: 'All Programs', description: 'Celebration of college founding.', color: '#8B5CF6' },
    { id: '4', title: 'Graduation Rehearsal', date: '2026-03-10', program: 'BEED', description: 'Practice run for graduation ceremony.', color: '#F59E0B' },
    { id: '5', title: 'Alumni Homecoming', date: '2026-04-05', program: 'All Programs', description: 'Annual alumni gathering.', color: '#EF4444' },
  ]);

  const [programs] = useState(['All Programs', ...DEFAULT_PROGRAMS]);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const [form, setForm] = useState({ title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' });
  const [formError, setFormError] = useState('');

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

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
    if (!form.date)         { setFormError('Please select a date.'); return; }
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
          onClick={() => { setForm({ title: '', date: '', program: 'All Programs', description: '', color: '#3B82F6' }); setFormError(''); setShowModal(true); }}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Calendar */}
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
                    <div key={ev.id} className="text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded truncate text-white hidden sm:block" style={{ backgroundColor: ev.color }} title={ev.title}>
                      {ev.title}
                    </div>
                  ))}
                  {/* Mobile: just a dot */}
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

      {/* Tabs */}
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
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(ev.date)} · {ev.program}</div>
                    {ev.description && <div className="text-xs text-gray-400 mt-1">{ev.description}</div>}
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
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
                  <div className="w-2 mt-1.5 h-10 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 text-sm">{ev.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(ev.date)} · {ev.program}</div>
                    {ev.description && <div className="text-xs text-gray-300 mt-1">{ev.description}</div>}
                  </div>
                  <span className="text-xs text-gray-400 italic flex-shrink-0 mt-1">Past</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Program</label>
                <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setForm({ ...form, color: c.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c.value ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }} title={c.label} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAddEvent} className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Academic Records ─────────────────────────────────────────────────────────
function AcademicRecords() {
  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Records Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Dean's List</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Automated generation of Dean's List per semester</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">Generate Dean's List</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Faculty Load</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">View and manage faculty teaching loads</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">View Loads</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Accreditation and academic documents</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Documents</h2>
        <div className="space-y-3">
          {['Accreditation Report 2025', 'Faculty Handbook', 'Academic Calendar 2025-2026'].map((doc, i) => (
            <div key={i} className="p-3 sm:p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 flex-shrink-0 ml-2"><Download className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Faculty & Staff ──────────────────────────────────────────────────────────
function FacultyStaffManagement() {
  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Faculty & Staff Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Faculty Profiles</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">142</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Total Faculty Members</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">View All Faculty</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Staff Profiles</h2>
          <p className="text-3xl font-bold text-green-600 mb-2">28</p>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Total Staff Members</p>
          <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">View All Staff</button>
        </div>
      </div>
    </div>
  );
}

// ─── Research & Achievements ──────────────────────────────────────────────────
function ResearchAchievements() {
  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Research, Extension & Achievements</h1>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {[
            { title: 'Machine Learning Research Paper', author: 'Dr. Sarah Johnson', type: 'Research' },
            { title: 'Community Literacy Extension',    author: 'Prof. Michael Chen', type: 'Extension' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.author} • {item.type}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Approve</button>
                  <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

// ─── Reports & Analytics ──────────────────────────────────────────────────────
function ReportsAnalytics() {
  const [deadlineTitle, setDeadlineTitle] =
  useState('');

const [deadlineDescription, setDeadlineDescription] =
  useState('');

const [deadlineDate, setDeadlineDate] =
  useState('');

const [showModal, setShowModal] =
  useState(false);

const [modalTitle, setModalTitle] =
  useState('');

const [modalMessage, setModalMessage] =
  useState('');

  async function createDeadline() {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setModalTitle('Error');
      setModalMessage('User not found.');
      setShowModal(true);
      return;
    }

    const { data, error } = await supabase
      .from('report_deadlines')
      .insert([
        {
          title: deadlineTitle,
          description: deadlineDescription,
          due_date: deadlineDate,
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await notifyRole(
      'faculty',
      deadlineTitle,
      `Report Deadline: ${deadlineDescription}`
    );

    await notifyRole(
      'department_chair',
      deadlineTitle,
      `Report Deadline: ${deadlineDescription}`
    );

    setDeadlineTitle('');
    setDeadlineDescription('');
    setDeadlineDate('');

    setModalTitle('Success');
    setModalMessage(
      'Deadline posted successfully.'
    );
    setShowModal(true);

  } catch (error: any) {

    setModalTitle('Error');
    setModalMessage(
      error.message
    );
    setShowModal(true);

  }
}
  return (
    
    <div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">

  <h2 className="text-xl font-semibold mb-4">
    Create Report Deadline
  </h2>

  <div className="space-y-4">

    <input
      type="text"
      value={deadlineTitle}
      onChange={(e) =>
        setDeadlineTitle(e.target.value)
      }
      placeholder="Deadline Title"
      className="w-full border rounded-lg p-3"
    />

    <textarea
      value={deadlineDescription}
      onChange={(e) =>
        setDeadlineDescription(
          e.target.value
        )
      }
      placeholder="Deadline Description"
      className="w-full border rounded-lg p-3"
    />

    <input
      type="datetime-local"
      value={deadlineDate}
      onChange={(e) =>
        setDeadlineDate(e.target.value)
      }
      className="w-full border rounded-lg p-3"
    />

    <button
      onClick={createDeadline}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg"
    >
      Post Deadline
    </button>

  </div>

</div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports & Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {['Institutional Report', 'Faculty Performance', 'Student Analytics'].map((report, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{report}</h3>
            <div className="space-y-2">
              <button
  onClick={() => window.open('http://localhost:5000/api/reports/pdf', '_blank')}
  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm">
  <Download className="w-4 h-4" /> Export PDF
</button>
<button
  onClick={() => window.open('http://localhost:5000/api/reports/excel', '_blank')}
  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm">
  <Download className="w-4 h-4" /> Export Excel
</button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <div className="h-64 sm:h-96 bg-gray-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400" /></div>
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

      <div className="p-6">

        <h3 className="text-xl font-semibold">
          {modalTitle}
        </h3>

        <p className="mt-2 text-gray-600">
          {modalMessage}
        </p>

      </div>

      <div className="border-t p-4 flex justify-end">

        <button
          onClick={() =>
            setShowModal(false)
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          OK
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function AnnouncementsContent() {
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  function formatManilaTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
  
  
  useEffect(() => {
     loadAnnouncements();
  const channel = supabase
    .channel('announcements-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements'
      },
      (payload) => {
        setAnnouncements((prev) => [
          payload.new,
          ...prev
        ]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function loadAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data) {
    setAnnouncements(data);
  }
}
  async function publishAnnouncement() {
  try {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setModalTitle('Error');
    setModalMessage('User not found');
      setShowModal(true);
      return;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([
        {
          title,
          content,
          author_id: user.id,
          target_role: [
            'admin',
            'dean',
            'department_chair',
            'faculty',
            'student',
            'alumni'
          ]
        }
      ])
      .select()
      .single();
      

    if (error) throw error;
    const announcementId = data.id;
    setAnnouncements(prev => [
  data,
  ...prev
]);
async function notifyRole(
  role: string,
  title: string,
  message: string,
  announcementId: string
) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', role);

  if (error) {
    console.error(error);
    return;
  }

  if (!users?.length) return;

  const notifications = users.map(user => ({
    user_id: user.id,
    title,
    message,
    type: 'announcement',
    reference_id: announcementId,
    reference_table: 'announcements',
    is_read: false
  }));

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (insertError) {
    console.error(insertError);
  }
}
    // Notifications

    await notifyRole(
      'admin',
      title,
      content,
      announcementId,
    );

    await notifyRole(
      'dean',
      title,
      content,
      announcementId,
    );

    await notifyRole(
      'department_chair',
      title,
      content,
      announcementId,
    );

    await notifyRole(
      'faculty',
      title,
      content,
      announcementId,
    );

    await notifyRole(
      'student',
      title,
      content,
      announcementId,
    );

    await notifyRole(
      'alumni',
      title,
      content,
      announcementId,
    );

    setTitle('');
    setContent('');

    setModalTitle('Success');
    setModalMessage('Announcement published successfully.');
    setShowModal(true);

  } catch (err: any) {
  console.error(err);

  setModalTitle('Error');
  setModalMessage(
    err?.message ||
    JSON.stringify(err) ||
    'Failed to publish announcement.'
  );

  setShowModal(true);
}
}
async function deleteAnnouncement(
  announcementId: string
) {
  const confirmed = window.confirm(
    'Delete this announcement?'
  );

  if (!confirmed) return;

  try {
    const { error: announcementError } =
      await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

    if (announcementError)
      throw announcementError;

    const { error: notificationError } =
  await supabase
    .from('notifications')
    .delete()
    .eq('reference_id', announcementId)
    .eq('reference_table', 'announcements');

if (notificationError)
  throw notificationError;

    setAnnouncements(prev =>
      prev.filter(
        a => a.id !== announcementId
      )
    );

    setModalTitle('Success');
    setModalMessage(
      'Announcement deleted successfully.'
    );
    setShowModal(true);
  } catch (err) {
    console.error(err);

    setModalTitle('Error');
    setModalMessage(
      'Failed to delete announcement.'
    );
    setShowModal(true);
  }
}

if (!confirm) return;
  return (
    
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Announcements</h1>
        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Announcement</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Create Announcement</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Enter announcement title"
/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
  rows={4}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
  placeholder="Enter announcement content"
/>
          </div>
          <button
  onClick={publishAnnouncement}
  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
>
  Publish Announcement
</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
    Recent Announcements
  </h2>

  <div className="space-y-3">
    {announcements.length === 0 ? (
      <div className="text-gray-500 text-center py-6">
        No announcements found.
      </div>
    ) : (
      announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm sm:text-base">
                {announcement.title}
              </div>

              <div className="text-xs sm:text-sm text-gray-600">
  {formatManilaTime(announcement.created_at)}
</div>

              <div className="text-sm text-gray-500 mt-2">
                {announcement.content}
              </div>
            </div>

            <div className="flex gap-2">
  <span
    className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm"
  >
    Published
  </span>

  <button
    onClick={() =>
      deleteAnnouncement(
        announcement.id
      )
    }
    className="
      px-3
      py-1
      bg-red-500
      text-white
      rounded-lg
      text-xs
      hover:bg-red-600
    "
  >
    Delete
  </button>
</div>
          </div>
        </div>
      ))
    )}
  </div>
</div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {modalTitle}
        </h3>

        <p className="text-gray-600">
          {modalMessage}
        </p>
      </div>

      <div className="flex justify-end border-t p-4">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          OK
        </button>
      </div>

    </div>
  </div>
)}
    </div>
    
  );
  
}

interface SectionEditorProps {
  section: string;
  content: any;
  updateField: (
    section: string,
    field: string,
    value: string
  ) => void;
}

function SectionEditor({
  section,
  content,
  updateField,
}: SectionEditorProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">

      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {section}
      </h2>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>

          <input
            type="text"
            value={content[section]?.title || ''}
            onChange={(e) =>
              updateField(
                section,
                'title',
                e.target.value
              )
            }
            placeholder="Enter title"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>

          <textarea
            rows={4}
            value={content[section]?.description || ''}
            onChange={(e) =>
              updateField(
                section,
                'description',
                e.target.value
              )
            }
            placeholder="Enter description"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

      </div>

    </div>
  );
}
// ─── Landing Page Management ──────────────────────────────────────────────────
function LandingPageManagement() {
function updateClubsField(
  section: string,
  field: string,
  value: string
) {
  setClubsContent((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
}
const [footerContent, setFooterContent] =
  useState<any>({});

const [footerQuickLinks, setFooterQuickLinks] =
  useState<any[]>([]);

const [footerSocialLinks, setFooterSocialLinks] =
  useState<any[]>([]);
const [contactContent, setContactContent] =
  useState<any>({});

const [officeHours, setOfficeHours] =
  useState<any[]>([]);

const [socialLinks, setSocialLinks] =
  useState<any[]>([]);
const [accreditationContent, setAccreditationContent] =
  useState<any>(null);

const [overviewItems, setOverviewItems] =
  useState<any[]>([]);

const [levels, setLevels] =
  useState<any[]>([]);

const [programs, setPrograms] =
  useState<any[]>([]);

const [certifications, setCertifications] =
  useState<any[]>([]);
const [achievementPageContent, setAchievementPageContent] =
  useState<any>(null);

const [achievementBanner, setAchievementBanner] =
  useState<any>(null);

const [achievementBannerStats, setAchievementBannerStats] =
  useState<any[]>([]);

const [achievementStatistics, setAchievementStatistics] =
  useState<any[]>([]);

const [achievementTopnotchers, setAchievementTopnotchers] =
  useState<any[]>([]);

const [achievementCollegeAchievements, setAchievementCollegeAchievements] =
  useState<any[]>([]);
const [clubsContent, setClubsContent] =
  useState<any>({});

const [clubsStatistics, setClubsStatistics] =
  useState<ClubStatistic[]>([]);

const [organizations, setOrganizations] =
  useState<Organization[]>([]);

const [committees, setCommittees] =
  useState<Committee[]>([]);
const [coreValueCards, setCoreValueCards] =
  useState<CoreValueCard[]>([]);
const [aboutStats, setAboutStats] =
  useState<AboutStat[]>([]);
  const [homeContent, setHomeContent] =
  useState<any>({});
  const [facultyMembers, setFacultyMembers] =
  useState<FacultyMember[]>([]);
  const [departmentContent, setDepartmentContent] =
  useState<any>({});

  const [colleges, setColleges] =
  useState<any[]>([]);
  const [departments, setDepartments] =
  useState<any[]>([]);
  const [aboutContent, setAboutContent] =
  useState<any>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] =
  useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [coreValues, setCoreValues] =
  useState<CoreValue[]>([]);
  const [researchContent, setResearchContent] =
  useState<any>({});
  const [researchPublications, setResearchPublications] =
  useState<any[]>([]);
  const [researchAwards, setResearchAwards] =
  useState<any[]>([]);
  const [featuredAlumni, setFeaturedAlumni] =
  useState<any[]>([]);
  const [activePage, setActivePage] =
useState<
  'homepage' |
  'about' |
  'departments' |
  'clubs' |
  'research' |
    'achievements' |
    'accreditation' |
    'contact' |
    'footer'
>('homepage');
  const [modalMessage, setModalMessage] =
  useState('');
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
  {
    key: 'homepage',
    label: 'Homepage',
  },
  {
    key: 'about',
    label: 'About Page',
  },
  {
    key: 'departments',
    label: 'Departments Page',
  },
  {
    key: 'clubs',
    label: 'Clubs Page',
  },
  {
    key: 'research',
    label: 'Research Page',
  },
  {
  key: 'achievements',
  label: 'Achievements Page',
},
{
  key: 'accreditation',
  label: 'Accreditation Page',
},
{
  key: 'contact',
  label: 'Contact Page',
},
{
  key: 'footer',
  label: 'Footer'
},
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
  accreditation : saveAccreditationPage,
  contact: saveContactPage,
  footer: saveFooterPage,
};
async function loadFooterData() {

  const [
    content,
    quickLinks,
    socialLinks
  ] = await Promise.all([

    footerService.getFooterContent(),

    footerService.getQuickLinks(),

    footerService.getSocialLinks()

  ]);

  setFooterContent(content || {});

  setFooterQuickLinks(quickLinks || []);

  setFooterSocialLinks(socialLinks || []);
}
async function saveFooterPage() {

  try {

    await footerService.saveFooterContent(
      footerContent
    );

    await footerService.saveQuickLinks(
      footerQuickLinks
    );

    await footerService.saveSocialLinks(
      footerSocialLinks
    );

    setModalMessage(
      'Footer Updated Successfully!'
    );

    setShowSuccessModal(true);

  } catch (error) {

    console.error(error);

    setModalMessage(
      'Failed to save footer'
    );

    setShowSuccessModal(true);
  }
}
async function loadContactData() {

  const [
    content,
    hours,
    socials
  ] = await Promise.all([

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

    await contactService.savePageContent(
      contactContent
    );

    await contactService.saveOfficeHours(
      officeHours
    );

    await contactService.saveSocialLinks(
      socialLinks
    );

    setModalMessage(
      'Contact Page Updated Successfully!'
    );

    setShowSuccessModal(true);

  } catch (error) {

    console.error(error);

    setModalMessage(
      'Failed to save contact page'
    );

    setShowSuccessModal(true);
  }
}
async function saveAccreditationPage() {
  try {

    await accreditationService.savePageContent(
      accreditationContent
    );

    await accreditationService.saveOverview(
      overviewItems
    );

    await accreditationService.saveLevels(
      levels
    );

    await accreditationService.savePrograms(
      programs
    );

    await accreditationService.saveCertifications(
      certifications
    );

    setModalMessage(
      'Accreditation Page Updated Successfully!'
    );

    setShowSuccessModal(true);

  } catch (error) {

    console.error(error);

    setModalMessage(
      'Failed to save accreditation page'
    );

    setShowSuccessModal(true);
  }
}
async function saveAchievementsPage() {
  try {
    await achievementsService.savePageContent(
      achievementPageContent
    );

    await achievementsService.saveBanner(
      achievementBanner
    );

    await achievementsService.saveBannerStats(
      achievementBannerStats
    );

    await achievementsService.saveStatistics(
      achievementStatistics
    );

    await achievementsService.saveTopnotchers(
      achievementTopnotchers
    );

    await achievementsService.saveCollegeAchievements(
      achievementCollegeAchievements
    );

    setModalMessage(
      'Achievements Page Updated Successfully!'
    );

    setShowSuccessModal(true);

  } catch (error) {
    console.error(error);

    setModalMessage(
      'Failed to save achievements page'
    );

    setShowSuccessModal(true);
  }
}
async function loadAccreditationData() {
  const [
    content,
    overview,
    levelData,
    programData,
    certificationData
  ] = await Promise.all([
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
  const content =
    await loadResearchContent();

  const publications =
    await loadResearchPublications();

  const achievements =
    await loadAwards();

  const alumni =
    await loadFeaturedAlumni();

  setResearchContent(content);

  setResearchPublications(publications);

  setResearchAwards(achievements);
  
  setFeaturedAlumni(alumni);
}

async function handleSaveResearchPage() {

  await saveResearchPage(
    researchContent,
    researchPublications,
    researchAwards,
    featuredAlumni
  );

  setModalMessage(
    'Research Page Updated Successfully!'
  );

  setShowSuccessModal(true);
}
  function updateResearchField(
  section: string,
  field: string,
  value: string
) {
  setResearchContent((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
}
async function saveClubsPage() {

  await saveClubsContent(
    clubsContent
  );

  await saveClubStatistics(
    clubsStatistics
  );

  await saveOrganizations(
    organizations
  );

  await saveCommittees(
    committees
  );

  setModalMessage(
    'Clubs Page Updated Successfully!'
  );

  setShowSuccessModal(true);
}

function updateDepartmentField(
  section: string,
  field: string,
  value: string
) {
  setDepartmentContent((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
}

async function loadClubsContent() {

  const { data } =
    await getClubsContent();

  const formatted:any = {};

  data?.forEach(item => {
    formatted[item.section_name] =
      item;
  });

  setClubsContent(formatted);
}

async function loadClubsStatistics() {

  const { data } =
    await getClubStatistics();

  setClubsStatistics(data || []);
}

async function loadOrganizations() {

  const { data } =
    await getOrganizations();

  setOrganizations(data || []);
}
async function loadCommittees() {

  const { data } =
    await getCommittees();

  setCommittees(data || []);
}
async function loadColleges() {

  const { data } =
    await getColleges();

  setColleges(data || []);
}
  async function loadDepartmentContent() {

  const { data } =
    await getDepartmentContent();

  const formatted:any = {};

  data?.forEach(item => {
    formatted[item.section_name] =
      item;
  });

  setDepartmentContent(formatted);
}
  async function loadAboutStats() {

  const { data } =
    await getAboutStats();

  setAboutStats(data || []);
}
  async function loadFeatures() {
  const { data } = await getHomepageFeatures();

  setFeatures(data || []);
}
async function loadCoreValues() {

  const { data } =
    await getCoreValues();

  setCoreValues(data || []);
}
async function loadFacultyMembers() {

  const { data } =
    await getFacultyMembers();

  setFacultyMembers(data || []);
}

async function loadDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) {
    console.error(error);
    return;
  }

  setDepartments(data || []);
}
async function loadStats() {
  const { data } = await getHomepageStats();

  setStats(data || []);
}
async function loadCoreValueCards() {

  const { data } =
    await getCoreValueCards();

  setCoreValueCards(data || []);
}
async function loadAnnouncements() {
  const { data } = await getHomepageAnnouncements();

  setAnnouncements(data || []);
}
  async function loadHomepageContent() {
  const { data } = await getHomepageContent();

  const formatted: any = {};

  data?.forEach(item => {
    formatted[item.section_name] = item;
  });

  setHomeContent(formatted);
}

async function loadAboutContent() {

  const { data } =
    await getAboutContent();

  const formatted:any = {};

  data?.forEach(item => {
    formatted[item.section_name] = {
      title: item.title,
      description: item.description,
      content: item.content,
    };
  });

  setAboutContent(formatted);
}

async function saveAboutPage() {

  await saveCoreValues(
    coreValues
  );

  await saveAboutStats(
    aboutStats
  );

  await saveFacultyMembers(
    facultyMembers
  );

  await saveCoreValueCards(
    coreValueCards
  );

  const { error } =
    await saveAboutContent(
      aboutContent
    );

  if (error) {
    setModalMessage(
      error.message
    );

    setShowSuccessModal(true);

    return;
  }

  setModalMessage(
    'About Page Updated Successfully!'
  );

  setShowSuccessModal(true);
}
async function saveHomePage() {
  const { error } =
    await saveHomepageContent(homeContent);

  if (error) {
    setModalMessage(
      `Error: ${error.message}`
    );

    setShowSuccessModal(true);
    return;
  }

  setModalMessage(
    'Homepage updated successfully!'
  );

  setShowSuccessModal(true);
}
async function saveDepartmentsPage() {

  await saveColleges(
    colleges
  );

  await saveDepartmentContent(
    departmentContent
  );

  setModalMessage(
    'Departments Page Updated Successfully!'
  );

  setShowSuccessModal(true);
}
  function updateHomepageField(
  section: string,
  field: string,
  value: string
) {
  setHomeContent((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
}

function updateAboutField(
  section: string,
  field: string,
  value: string
) {
  setAboutContent((prev: any) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value,
    },
  }));
}
  
async function loadAchievementsPage() {
  try {
    const [
      pageContent,
      banner,
      bannerStats,
      statistics,
      topnotchers,
      collegeAchievements
    ] = await Promise.all([
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
    setAchievementCollegeAchievements(
      collegeAchievements || []
    );

  } catch (error) {
    console.error(
      'Failed loading achievements',
      error
    );
  }
}
  return (
    
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">
        Landing Page Management
      </h1>
    <div className="flex flex-wrap gap-3 mb-8">
  {pages.map((page) => (
    <button
      key={page.key}
      onClick={() =>
        setActivePage(
          page.key as any
        )
      }
      className={`px-6 py-3 rounded-lg ${
        activePage === page.key
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200'
      }`}
    >
      {page.label}
    </button>
  ))}
</div>
      {activePage === 'homepage' && (
  <>
    <HeroSectionEditor
      content={homeContent}
      updateField={updateHomepageField}
    />

    <AboutSectionEditor
      content={homeContent}
      updateField={updateHomepageField}
    />

    <FeaturesEditor
      features={features}
      setFeatures={setFeatures}
    />

    <StatsEditor
      stats={stats}
      setStats={setStats}
    />

    <AnnouncementsEditor
      announcements={announcements}
      setAnnouncements={setAnnouncements}
    />


    <CTASectionEditor
      content={homeContent}
      updateField={updateHomepageField}
    />
  </>
)}
{activePage === 'about' && (
  <>
    <AboutHeaderEditor
  content={aboutContent}
  updateField={updateAboutField}
/>

<HistoryEditor
  content={aboutContent}
  updateField={updateAboutField}
/>

<VisionMissionGoalsEditor
  content={aboutContent}
  updateField={updateAboutField}
/>

 <CoreValuesEditor
  values={coreValues}
  setValues={setCoreValues}
/>

<TeamStructureEditor
  content={aboutContent}
  updateField={updateAboutField}
  facultyMembers={facultyMembers}
  setFacultyMembers={setFacultyMembers}
  departments={departments}
/>

<AboutStatsEditor
  stats={aboutStats}
  setStats={setAboutStats}
/>
<AboutOurCoreValuesEditor
  values={coreValueCards}
  setValues={setCoreValueCards}
/>
  </>
)}
  {activePage === 'departments' && (
  <>
    <DepartmentHeaderEditor
      content={departmentContent}
      updateField={updateDepartmentField}
    />

    <CollegeEditor
      colleges={colleges}
      setColleges={setColleges}
    />

    <ProgramEditor
  colleges={colleges}
  setColleges={setColleges}
/>

    <ProgramFacultyEditor
      colleges={colleges}
      setColleges={setColleges}
    />

    <DepartmentCTAEditor
      content={departmentContent}
      updateField={updateDepartmentField}
    />
  </>
)}
{activePage === 'clubs' && (
  <>
    <ClubsHeaderEditor
      content={clubsContent}
      updateField={updateClubsField}
    />

    <ClubsStatisticsEditor
      statistics={clubsStatistics}
      setStatistics={setClubsStatistics}
    />

    <OrganizationEditor
      organizations={organizations}
      setOrganizations={setOrganizations}
    />

    <CommitteeEditor
      committees={committees}
      setCommittees={setCommittees}
    />

    <ClubsCTAEditor
      content={clubsContent}
      updateField={updateClubsField}
    />
  </>
)}
{
  activePage === 'research' && (
    <>
      <ResearchHeaderEditor
        content={researchContent}
        updateField={updateResearchField}
      />

      <ResearchPublicationsEditor
        publications={researchPublications}
        setPublications={setResearchPublications}
      />

      <ResearchAwardsEditor
  awards={researchAwards}
  setAwards={setResearchAwards}
/>

      <FeaturedAlumniEditor
        alumni={featuredAlumni}
        setAlumni={setFeaturedAlumni}
      />

      <ResearchCTAEditor
        content={researchContent}
        updateField={updateResearchField}
      />
    </>
  )
}{activePage === 'achievements' && (
  <>
    <AchievementsPageContentEditor
      content={achievementPageContent}
      setContent={setAchievementPageContent}
    />

    <AchievementsStatisticsEditor
      statistics={achievementStatistics}
      setStatistics={setAchievementStatistics}
    />

    <AchievementsTopnotchersEditor
      topnotchers={achievementTopnotchers}
      setTopnotchers={setAchievementTopnotchers}
    />

    <AchievementsCollegeEditor
      achievements={achievementCollegeAchievements}
      setAchievements={setAchievementCollegeAchievements}
    />

    <AchievementsBannerEditor
      banner={achievementBanner}
      setBanner={setAchievementBanner}
    />

    <AchievementsBannerStatsEditor
      stats={achievementBannerStats}
      setStats={setAchievementBannerStats}
    />
  </>
)}{activePage === 'accreditation' && (
  <>
    <AccreditationContentEditor
      content={accreditationContent}
      setContent={setAccreditationContent}
    />

    <AccreditationOverviewEditor
      overview={overviewItems}
      setOverview={setOverviewItems}
    />

    <AccreditationLevelsEditor
      levels={levels}
      setLevels={setLevels}
    />

    <AccreditationProgramsEditor
      programs={programs}
      setPrograms={setPrograms}
    />

    <AccreditationCertificationsEditor
      certifications={certifications}
      setCertifications={setCertifications}
    />
  </>
)}
{activePage === 'contact' && (
  <>
   <ContactContentEditor
  content={contactContent}
  setContent={setContactContent}
/>

<ContactOfficeHoursEditor
  officeHours={officeHours}
  setOfficeHours={setOfficeHours}
/>

<ContactSocialLinksEditor
  socialLinks={socialLinks}
  setSocialLinks={setSocialLinks}
/>
  </>
)}
{activePage === 'footer' && (
  <>
    <FooterContentEditor
      content={footerContent}
      setContent={setFooterContent}
    />

    <FooterQuickLinksEditor
      links={footerQuickLinks}
      setLinks={setFooterQuickLinks}
    />

    <FooterSocialLinksEditor
      socials={footerSocialLinks}
      setSocials={setFooterSocialLinks}
    />
  </>
)}

      <div className="flex gap-4">

        <div className="flex gap-4">

  <button
  onClick={() => setShowPreview(true)}
  className="px-6 py-3 bg-gray-700 text-white rounded-lg"
>
  Preview {pageTitles[activePage]}
</button>

  <button
  onClick={() =>
    saveHandlers[activePage]()
  }
  className="px-6 py-3 bg-blue-600 text-white rounded-lg"
>
  Save {pageTitles[activePage]}
</button>

</div>

      </div>
      {showSuccessModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">

      <h2 className="text-xl font-bold mb-4">
        Success
      </h2>

      <p className="text-gray-600 mb-6">
        {modalMessage}
      </p>

      <div className="flex justify-end">
        <button
          onClick={() => setShowSuccessModal(false)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg"
        >
          OK
        </button>
      </div>

    </div>
  </div>
)}
{showPreview && (
  <div className="fixed inset-0 z-50 bg-black/50 overflow-auto">
    <div className="bg-white min-h-screen">

      <div className="sticky top-0 bg-white border-b p-4 flex justify-end">
        <button
          onClick={() => setShowPreview(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Close Preview
        </button>
      </div>

      {activePage === 'homepage' ? (
        <HomePage
          previewMode
          previewContent={homeContent}
          previewFeatures={features}
          previewStats={stats}
          previewAnnouncements={announcements}
        />
      ) : activePage === 'about' ? (
        <AboutPage
          previewMode
          previewContent={aboutContent}
          previewStats={aboutStats}
        />
      ) : activePage === 'departments' ? (
        <DepartmentsPage
          previewMode
          previewContent={departmentContent}
          previewColleges={colleges}
        />
      ) : activePage === 'clubs' ? (
        <ClubsPage
          previewMode
          previewContent={clubsContent}
          previewStatistics={clubsStatistics}
          previewOrganizations={organizations}
          previewCommittees={committees}
        />
      ) : activePage === 'research' ? (
        <ResearchPage
          previewMode
          previewContent={researchContent}
          previewPublications={researchPublications}
          previewAchievements={researchAwards}
          previewAlumni={featuredAlumni}
        />
      ) : activePage === 'achievements' ? (
  <AchievementsPage
    previewMode
    previewContent={achievementPageContent}
    previewBanner={achievementBanner}
    previewBannerStats={achievementBannerStats}
    previewStatistics={achievementStatistics}
    previewTopnotchers={achievementTopnotchers}
    previewCollegeAchievements={
      achievementCollegeAchievements
    }
  />
) : activePage === 'accreditation' ? (
  <AccreditationPage
    previewMode
    previewContent={accreditationContent}
    previewOverview={overviewItems}
    previewLevels={levels}
    previewPrograms={programs}
    previewCertifications={certifications}
  />
)  : activePage === 'footer' ? (
<Footer
    previewMode
    previewContent={footerContent}
    previewQuickLinks={footerQuickLinks}
    previewSocialLinks={footerSocialLinks}
  />
) : activePage === 'contact' ? (
  <ContactPage
    previewMode
  previewContent={contactContent}
  previewOfficeHours={officeHours}
  previewSocialLinks={socialLinks}
  />
) : null}


    </div>
  </div>
)}
    </div>
  );
}

// ─── System Settings ──────────────────────────────────────────────────────────
function SystemSettings() {
  const [programs, setPrograms] = useState<string[]>([...DEFAULT_PROGRAMS]);
  const [newProgram, setNewProgram] = useState('');
  const [editIdx, setEditIdx]       = useState<number | null>(null);
  const [editVal, setEditVal]       = useState('');

  const addProgram = () => {
    const trimmed = newProgram.trim().toUpperCase();
    if (!trimmed || programs.includes(trimmed)) return;
    setPrograms(prev => [...prev, trimmed]);
    setNewProgram('');
  };

  const deleteProgram = (idx: number) => setPrograms(prev => prev.filter((_, i) => i !== idx));

  const startEdit = (idx: number) => { setEditIdx(idx); setEditVal(programs[idx]); };
  const saveEdit  = () => {
    if (editIdx === null) return;
    const trimmed = editVal.trim().toUpperCase();
    if (!trimmed) return;
    setPrograms(prev => prev.map((p, i) => i === editIdx ? trimmed : p));
    setEditIdx(null);
  };

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