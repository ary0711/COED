import React, { useState, useEffect, useCallback } from 'react';
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
  Filter,
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

// ─── Menu Items ───────────────────────────────────────────────────────────────
const deanMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',              id: 'dashboard' },
  { icon: Users,           label: 'User Management',        id: 'users' },
  { icon: FileText,        label: 'Academic Records',       id: 'records' },
  { icon: GraduationCap,   label: 'Faculty & Staff',        id: 'faculty' },
  { icon: Calendar,        label: 'Calendar & Activities',  id: 'calendar' },
  { icon: Award,           label: 'Research & Achievements',id: 'research' },
  { icon: ClipboardCheck,  label: 'Evaluation Management',  id: 'evaluation' },
  { icon: UserCheck,       label: 'Alumni Tracer',          id: 'alumni' },
  { icon: BarChart3,       label: 'Reports & Analytics',    id: 'reports' },
  { icon: Megaphone,       label: 'Announcements',          id: 'announcements' },
  { icon: Edit,            label: 'Landing Page Management',id: 'landing' },
  { icon: Settings,        label: 'System Settings',        id: 'settings' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface CollegeDeanDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function CollegeDeanDashboard({
  onRoleChange,
  activeMenuItem,
  setActiveMenuItem,
}: CollegeDeanDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={deanMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="College Dean - Full Access"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="College Dean"
          userName="Dr. Elizabeth Martinez"
          onRoleChange={onRoleChange}
        />

        <main className="p-8">
          {activeMenuItem === 'dashboard'     && <DashboardView />}
          {activeMenuItem === 'users'         && <UserManagement />}
          {activeMenuItem === 'records'       && <AcademicRecords />}
          {activeMenuItem === 'faculty'       && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar'      && <CalendarActivities />}
          {activeMenuItem === 'research'      && <ResearchAchievements />}
          {activeMenuItem === 'evaluation'    && <EvaluationManagement />}
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
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">College Dean Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your college overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
        <SummaryCard title="Total Faculty"      value="142"   icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="5.2%"  trendUp={true} />
        <SummaryCard title="Total Students"     value="3,847" icon={Users}         iconColor="#10B981" iconBgColor="#D1FAE5" trend="12.3%" trendUp={true} />
        <SummaryCard title="Active Departments" value="8"     icon={Building2}     iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
        <SummaryCard title="Pending Reports"    value="23"    icon={FileText}      iconColor="#F59E0B" iconBgColor="#FEF3C7" trend="8"     trendUp={false} />
        <SummaryCard title="Alumni Responses"   value="1,256" icon={UserCheck}     iconColor="#EF4444" iconBgColor="#FEE2E2" trend="18.7%" trendUp={true} />
      </div>

      <ChartsSection />
      <NotificationsPanel userType="dean" />
      <div className="mt-6">
        <QuarterlyReportTracker />
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

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Filter & search ────────────────────────────────────────────────────────
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

  // ── Open modals ────────────────────────────────────────────────────────────
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

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.email.trim())     { setFormError('Email is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!form.password || form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      if (authError) { setFormError(authError.message); return; }
      const userId = authData.user?.id;
      if (!userId) { setFormError('Failed to create user.'); return; }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        id_number: form.id_number.trim(),
        department: form.department.trim() || null,
        status: form.status,
      });
      if (insertError) { await supabase.auth.signOut(); setFormError(insertError.message); return; }
      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Full name is required.'); return; }
    if (!form.id_number.trim()) { setFormError('ID number is required.'); return; }
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        role: form.role,
        id_number: form.id_number.trim(),
        department: form.department.trim() || null,
        status: form.status,
      }).eq('id', selected.id);
      if (error) { setFormError(error.message); return; }
      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selected.id);
      if (error) { setFormError(error.message); return; }
      setModal(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // ── Activate pending account ───────────────────────────────────────────────
  const activatePending = async (user: Profile) => {
    setActivating(user.id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
    setActivating(null);
    fetchUsers();
  };

  // ── Toggle active ↔ inactive (skips pending) ──────────────────────────────
  const toggleStatus = async (user: Profile) => {
    if (user.status === 'pending') return;
    const next = user.status === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ status: next }).eq('id', user.id);
    fetchUsers();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1 text-sm">{total} user{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors font-medium text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Pending accounts banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{pendingCount} account{pendingCount !== 1 ? 's' : ''} pending activation.</span>
            {' '}Activate them below or filter by <span className="font-semibold">Pending</span> status.
          </p>
          <button
            onClick={() => setStatusFilter('pending')}
            className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="all">All Roles</option>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {(statusFilter !== 'all' || roleFilter !== 'all' || search) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-blue-600 border-t-transparent rounded-full animate-spin"
                style={{ borderWidth: 3, borderStyle: 'solid' }}
              />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-center py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center py-3.5 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((user) => {
                  const role         = ROLE_CONFIG[user.role]    ?? { label: user.role,   color: '#374151', bg: '#F3F4F6', icon: null };
                  const status       = STATUS_CONFIG[user.status] ?? { label: user.status, color: '#374151', bg: '#F3F4F6', dot: '#6B7280' };
                  const isPending    = user.status === 'pending';
                  const isActivating = activating === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-blue-50/30'}`}
                    >
                      {/* User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: role.bg, color: role.color }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{user.full_name}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-4 px-6">
                        <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                          {user.id_number}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: role.bg, color: role.color }}
                        >
                          {role.icon}
                          {role.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{user.department ?? '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {isPending ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: status.bg, color: status.color }}
                          >
                            <span className="relative flex h-1.5 w-1.5">
                              <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ background: status.dot }}
                              />
                              <span
                                className="relative inline-flex rounded-full h-1.5 w-1.5"
                                style={{ background: status.dot }}
                              />
                            </span>
                            {status.label}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleStatus(user)}
                            title="Click to toggle status"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                            style={{ background: status.bg, color: status.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: status.dot }}
                            />
                            {status.label}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <button
                              onClick={() => activatePending(user)}
                              disabled={isActivating}
                              title="Activate account"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-60"
                            >
                              {isActivating
                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Check className="w-3 h-3" />
                              }
                              {isActivating ? 'Activating…' : 'Activate'}
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(user)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
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
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === p ? 'bg-[#1E3A8A] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modal === 'add' ? 'Add New User' : 'Edit User'}
              </h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                {modal === 'add' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">ID Number *</label>
                  <input
                    type="text"
                    value={form.id_number}
                    onChange={e => setForm({ ...form, id_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2024-12345"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status *</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {modal === 'add' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modal === 'add' ? handleAdd : handleEdit}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl font-medium text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                {saving ? 'Saving...' : modal === 'add' ? 'Add User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
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
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
                {saving ? 'Deleting...' : 'Delete User'}
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
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records Management</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dean's List</h2>
          <p className="text-gray-600 mb-4">Automated generation of Dean's List per semester</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate Dean's List
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Load</h2>
          <p className="text-gray-600 mb-4">View and manage faculty teaching loads</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Loads
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          <p className="text-gray-600 mb-4">Accreditation and academic documents</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Documents</h2>
        <div className="space-y-3">
          {['Accreditation Report 2025', 'Faculty Handbook', 'Academic Calendar 2025-2026'].map((doc, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="w-5 h-5" />
              </button>
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
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Faculty & Staff Management</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Profiles</h2>
          <p className="text-3xl font-bold text-blue-600 mb-2">142</p>
          <p className="text-gray-600 mb-4">Total Faculty Members</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View All Faculty
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Profiles</h2>
          <p className="text-3xl font-bold text-green-600 mb-2">28</p>
          <p className="text-gray-600 mb-4">Total Staff Members</p>
          <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View All Staff
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar & Activities ────────────────────────────────────────────────────
function CalendarActivities() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-16 h-16 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Activities</h2>
        <div className="space-y-3">
          {[
            { title: 'Faculty Development Seminar', date: 'March 15, 2026', dept: 'All Departments' },
            { title: 'Department Meeting',          date: 'March 18, 2026', dept: 'Computer Science' },
            { title: 'College Foundation Day',      date: 'March 25, 2026', dept: 'All Departments' },
          ].map((event, i) => (
            <div key={i} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900">{event.title}</div>
              <div className="text-sm text-gray-600">{event.date} • {event.dept}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Research & Achievements ──────────────────────────────────────────────────
function ResearchAchievements() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research, Extension & Achievements</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {[
            { title: 'Machine Learning Research Paper', author: 'Dr. Sarah Johnson', type: 'Research' },
            { title: 'Community Literacy Extension',    author: 'Prof. Michael Chen', type: 'Extension' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.author} • {item.type}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Approve</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Evaluation Management ────────────────────────────────────────────────────
function EvaluationManagement() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Management</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Evaluations</h3>
          <p className="text-3xl font-bold text-blue-600">3,847</p>
          <p className="text-sm text-gray-600 mt-1">Student responses</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completion Rate</h3>
          <p className="text-3xl font-bold text-green-600">94%</p>
          <p className="text-sm text-gray-600 mt-1">Students completed</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
          <p className="text-3xl font-bold text-purple-600">4.6/5.0</p>
          <p className="text-sm text-gray-600 mt-1">Overall faculty rating</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Performance Summary</h2>
        <div className="space-y-3">
          {[
            { name: 'Dr. Sarah Johnson',     rating: 4.8, responses: 156 },
            { name: 'Prof. Michael Chen',    rating: 4.7, responses: 142 },
            { name: 'Dr. Patricia Williams', rating: 4.9, responses: 138 },
          ].map((faculty, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{faculty.name}</div>
                  <div className="text-sm text-gray-600">{faculty.responses} responses</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{faculty.rating}</div>
                  <div className="text-xs text-gray-600">out of 5.0</div>
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
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Alumni Tracer Management</h1>
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Alumni</h3>
          <p className="text-3xl font-bold text-blue-600">5,234</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Responses</h3>
          <p className="text-3xl font-bold text-green-600">1,256</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Employed</h3>
          <p className="text-3xl font-bold text-purple-600">98%</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Response Rate</h3>
          <p className="text-3xl font-bold text-orange-600">24%</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Employment Statistics</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-16 h-16 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Reports & Analytics ──────────────────────────────────────────────────────
function ReportsAnalytics() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports & Analytics</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {['Institutional Report', 'Faculty Performance', 'Student Analytics'].map((report, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{report}</h3>
            <div className="space-y-2">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-16 h-16 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function AnnouncementsContent() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Announcements & Content</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> New Announcement
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Announcement</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter announcement content"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Publish Announcement
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
        <div className="space-y-3">
          {[
            { title: 'Enrollment Period Extended', date: 'Feb 10, 2026', status: 'Published' },
            { title: 'Faculty Meeting Schedule',   date: 'Feb 8, 2026',  status: 'Published' },
          ].map((a, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{a.title}</div>
                  <div className="text-sm text-gray-600">{a.date}</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page Management ──────────────────────────────────────────────────
function LandingPageManagement() {
  const sections = [
    'Hero Section', 'About the College', 'Vision, Mission & Goals',
    'Programs Offered', 'Faculty Directory', 'Achievements',
    'Research & Extension', 'News & Updates', 'Contact Information',
  ];

  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [content, setContent] = useState<Record<string, { title: string; description: string }>>({
    'Hero Section':            { title: 'Welcome to the College of Education',           description: 'Empowering future educators through excellence and innovation.' },
    'About the College':       { title: 'About COED',                                    description: 'The College of Education provides high-quality teacher education programs.' },
    'Vision, Mission & Goals': { title: 'Our Vision & Mission',                          description: 'To be a center of excellence in teacher education.' },
    'Programs Offered':        { title: 'Our Programs',                                  description: 'Bachelor of Elementary Education, Bachelor of Secondary Education, and more.' },
    'Faculty Directory':       { title: 'Meet Our Faculty',                              description: 'Highly qualified and experienced educators.' },
    'Achievements':            { title: 'Our Achievements',                              description: 'Top performing graduates and award-winning faculty.' },
    'Research & Extension':    { title: 'Research & Community Engagement',               description: 'Active research and community extension programs.' },
    'News & Updates':          { title: 'Latest News',                                   description: 'Stay updated with announcements and events.' },
    'Contact Information':     { title: 'Contact Us',                                    description: 'Email: coed@university.edu | Phone: (123) 456-7890' },
  });

  const handleChange = (field: string, value: string) => {
    setContent({ ...content, [selectedSection]: { ...content[selectedSection], [field]: value } });
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Landing Page Management</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {sections.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Editing: {selectedSection}</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={content[selectedSection].title}
            onChange={e => handleChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            rows={5}
            value={content[selectedSection].description}
            onChange={e => handleChange('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
        <h3 className="text-2xl font-bold text-blue-600">{content[selectedSection].title}</h3>
        <p className="text-gray-700 mt-2">{content[selectedSection].description}</p>
      </div>
    </div>
  );
}

// ─── System Settings ──────────────────────────────────────────────────────────
function SystemSettings() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">System Settings</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Year Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Academic Year</label>
              <input
                type="text"
                defaultValue="2025-2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Second Semester</option>
                <option>First Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Update Settings
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Maintenance</h2>
          <div className="space-y-3">
            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Create Backup
            </button>
            <button className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" /> System Maintenance
            </button>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Last backup: February 13, 2026 at 2:00 AM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}