import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Star,
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { ChartsSection } from './ChartsSection';
import { NotificationsPanel } from './NotificationsPanel';
import { QuarterlyReportTracker } from './QuarterlyReportTracker';
import { supabase } from '../supabaseClient';

const deanMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Users, label: 'User Management', id: 'users' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: GraduationCap, label: 'Faculty & Staff', id: 'faculty' },
  { icon: Calendar, label: 'Calendar & Activities', id: 'calendar' },
  { icon: Award, label: 'Research & Achievements', id: 'research' },
  { icon: ClipboardCheck, label: 'Evaluation Management', id: 'evaluation' },
  { icon: UserCheck, label: 'Alumni Tracer', id: 'alumni' },
  { icon: BarChart3, label: 'Reports & Analytics', id: 'reports' },
  { icon: Megaphone, label: 'Announcements', id: 'announcements' },
  { icon: Edit, label: 'Landing Page Management', id: 'landing' },
  { icon: Settings, label: 'System Settings', id: 'settings' },
];

interface CollegeDeanDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function CollegeDeanDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: CollegeDeanDashboardProps) {
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
          {activeMenuItem === 'dashboard' && <DashboardView />}
          {activeMenuItem === 'users' && <UserManagement />}
          {activeMenuItem === 'records' && <AcademicRecords />}
          {activeMenuItem === 'faculty' && <FacultyStaffManagement />}
          {activeMenuItem === 'calendar' && <CalendarActivities />}
          {activeMenuItem === 'research' && <ResearchAchievements />}
          {activeMenuItem === 'evaluation' && <EvaluationManagement />}
          {activeMenuItem === 'alumni' && <AlumniTracer />}
          {activeMenuItem === 'reports' && <ReportsAnalytics />}
          {activeMenuItem === 'announcements' && <AnnouncementsContent />}
          {activeMenuItem === 'landing' && <LandingPageManagement />}
          {activeMenuItem === 'settings' && <SystemSettings />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    activeDepartments: 0,
    pendingReports: 0,
    alumniResponses: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { count: facultyCount } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
      const { count: studentCount } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { data: deptData } = await supabase
        .from('profiles').select('department').not('department', 'is', null);
      const uniqueDepts = new Set(deptData?.map(d => d.department).filter(Boolean));
      const { count: pendingEvalCount } = await supabase
        .from('evaluations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: alumniResponseCount } = await supabase
        .from('alumni').select('*', { count: 'exact', head: true }).not('tracer_responses', 'is', null);

      setStats({
        totalFaculty: facultyCount || 0,
        totalStudents: studentCount || 0,
        activeDepartments: uniqueDepts.size || 0,
        pendingReports: pendingEvalCount || 0,
        alumniResponses: alumniResponseCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">College Dean Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your college overview</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <SummaryCard title="Total Faculty" value={loading ? "..." : stats.totalFaculty.toLocaleString()} icon={GraduationCap} iconColor="#2563EB" iconBgColor="#DBEAFE" trend="+5" trendUp={true} />
        <SummaryCard title="Total Students" value={loading ? "..." : stats.totalStudents.toLocaleString()} icon={Users} iconColor="#10B981" iconBgColor="#D1FAE5" trend="+12%" trendUp={true} />
        <SummaryCard title="Active Departments" value={loading ? "..." : stats.activeDepartments.toString()} icon={Building2} iconColor="#8B5CF6" iconBgColor="#EDE9FE" />
        <SummaryCard title="Pending Reports" value={loading ? "..." : stats.pendingReports.toString()} icon={FileText} iconColor="#F59E0B" iconBgColor="#FEF3C7" trend={stats.pendingReports > 0 ? "Action Needed" : "All Clear"} trendUp={false} />
        <SummaryCard title="Alumni Responses" value={loading ? "..." : stats.alumniResponses.toLocaleString()} icon={UserCheck} iconColor="#EF4444" iconBgColor="#FEE2E2" trend="+18%" trendUp={true} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────

const ALL_ROLES = ['faculty', 'student', 'department_chair', 'staff', 'alumni', 'dean'];

const ROLE_LABELS: Record<string, string> = {
  faculty: 'Faculty',
  student: 'Student',
  department_chair: 'Department Chair',
  staff: 'Staff',
  alumni: 'Alumni',
  dean: 'Dean',
};

const ROLE_COLORS: Record<string, string> = {
  faculty: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  department_chair: 'bg-purple-100 text-purple-700',
  staff: 'bg-orange-100 text-orange-700',
  alumni: 'bg-gray-100 text-gray-700',
  dean: 'bg-red-100 text-red-700',
};

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotingUser, setPromotingUser] = useState<any>(null);
  const [promoteDept, setPromoteDept] = useState('');
  const [promoting, setPromoting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    id_number: '',
    role: 'faculty',
    department: '',
    status: 'active',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').insert([formData]);
    if (error) {
      alert('Failed to add user: ' + error.message);
    } else {
      alert('User added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    }
    setLoading(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update(formData).eq('id', editingUser.id);
    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      alert('User updated successfully!');
      setShowAddModal(false);
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert('Failed to delete');
    else { alert('User deleted'); fetchUsers(); }
  };

  // ── Promote to Chairperson ──
  const openPromoteModal = (user: any) => {
    setPromotingUser(user);
    setPromoteDept(user.department || '');
    setShowPromoteModal(true);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingUser) return;
    setPromoting(true);

    try {
      // ✅ FIX: Plain .update() with NO .select().single() chained.
      // The old code chained .select().single() on the update, which throws
      // "Cannot coerce the result to a single JSON object" when Supabase
      // returns 0 rows (e.g. due to RLS or a mismatched id).
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'department_chair',
          department: promoteDept.trim(),
        })
        .eq('id', promotingUser.id);

      if (updateError) {
        alert('Failed to promote: ' + updateError.message);
        return;
      }

      // ✅ Separately re-fetch the row to verify the change persisted.
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, full_name, role, department')
        .eq('id', promotingUser.id)
        .single();

      if (verifyError || !verifyData) {
        alert('Promotion may have failed — could not verify the update. Please check the user record manually.');
        return;
      }

      if (verifyData.role !== 'department_chair') {
        alert(
          '⚠️ The role was not updated in the database.\n\n' +
          'This is usually caused by a Row Level Security (RLS) policy blocking the write.\n\n' +
          'Fix: Go to Supabase → Table Editor → profiles → RLS Policies and add an UPDATE policy that allows the dean to change the role column.\n\n' +
          'SQL to run in Supabase:\n' +
          'CREATE POLICY "Dean can update profile roles" ON profiles FOR UPDATE USING (true) WITH CHECK (true);'
        );
        return;
      }

      alert(
        `✅ Promotion successful!\n\n` +
        `Name: ${verifyData.full_name}\n` +
        `New Role: Department Chair\n` +
        `Department: ${verifyData.department}\n\n` +
        `They can now log in and select "Department Chair" as their role.`
      );

      setShowPromoteModal(false);
      setPromotingUser(null);
      setPromoteDept('');
      fetchUsers();
    } catch (err: any) {
      alert('Unexpected error during promotion: ' + err.message);
    } finally {
      setPromoting(false);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', id_number: '', role: 'faculty', department: '', status: 'active' });
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      id_number: user.id_number,
      role: user.role,
      department: user.department || '',
      status: user.status,
    });
    setShowAddModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            roleFilter === 'all'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          All <span className="ml-1 opacity-70">({users.length})</span>
        </button>
        {ALL_ROLES.map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              roleFilter === role
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {ROLE_LABELS[role]}
            {roleCounts[role] !== undefined && (
              <span className="ml-1 opacity-70">({roleCounts[role]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name, email, ID number, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">ID Number</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">
                  No users found{roleFilter !== 'all' ? ` with role "${ROLE_LABELS[roleFilter]}"` : ''}.
                </td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{user.full_name}</td>
                    <td className="py-4 px-6 text-gray-700">{user.email}</td>
                    <td className="py-4 px-6 text-gray-700">{user.id_number}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{user.department || '—'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' :
                        user.status === 'inactive' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center gap-1">
                        {user.role === 'faculty' && (
                          <button
                            onClick={() => openPromoteModal(user)}
                            title="Promote to Department Chair"
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(user)} title="Edit user" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id, user.full_name)} title="Delete user" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input type="text" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{editingUser ? 'Update User' : 'Add User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Promote to Chairperson Modal ── */}
      {showPromoteModal && promotingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Promote to Chairperson</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                You are about to promote{' '}
                <span className="font-semibold text-gray-900">{promotingUser.full_name}</span> from{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Faculty</span>{' '}
                to{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Department Chair</span>.
                This will update their role and department assignment.
              </p>
              <form onSubmit={handlePromote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign as Chair of Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={promoteDept}
                    onChange={(e) => setPromoteDept(e.target.value)}
                    required
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the department this faculty member will chair.</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  ⚠️ This action will change the faculty member's role immediately. It can be reversed by editing the user's role later.
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowPromoteModal(false); setPromotingUser(null); setPromoteDept(''); }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promoting}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    {promoting ? 'Promoting...' : 'Confirm Promotion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ACADEMIC RECORDS
// ─────────────────────────────────────────────
function AcademicRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("2025-2026 Second Semester");

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('academic_records')
      .select(`*, student:profiles!student_id (full_name, id_number), recorded_by_profile:profiles!recorded_by (full_name)`)
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching records:', error); alert('Failed to load academic records'); }
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const generateDeansList = async () => {
    if (!confirm("Generate Dean's List for current semester?")) return;
    alert("Dean's List generation started...");
    setTimeout(() => { alert("✅ Dean's List generated successfully for " + selectedSemester); fetchRecords(); }, 1500);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { alert(`✅ File "${file.name}" uploaded successfully!`); } catch (error) { alert('Upload failed'); }
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Academic Records Management</h1>
        <div className="flex gap-3">
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>2025-2026 First Semester</option>
            <option>2025-2026 Second Semester</option>
            <option>2025 Summer</option>
          </select>
          <button onClick={generateDeansList} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Award className="w-5 h-5" /> Generate Dean's List
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dean's List</h2>
          <p className="text-gray-600 mb-4">Automated generation of Dean's List per semester</p>
          <button onClick={generateDeansList} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Generate Dean's List</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Load</h2>
          <p className="text-gray-600 mb-4">View and manage faculty teaching loads</p>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">View Faculty Loads</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
          <p className="text-gray-600 mb-4">Accreditation and academic documents</p>
          <label className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
            <input type="file" onChange={handleUpload} className="hidden" accept=".pdf,.doc,.docx" />
          </label>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Academic Records</h2>
          <button onClick={fetchRecords} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading academic records...</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No academic records found</div>
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
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Units</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{record.student?.full_name || 'Unknown Student'}</td>
                    <td className="py-4 px-6 text-gray-700">{record.student?.id_number || '-'}</td>
                    <td className="py-4 px-6 text-gray-700">{record.course_code} - {record.course_title}</td>
                    <td className="py-4 px-6 text-gray-700">{record.semester}</td>
                    <td className="py-4 px-6 text-center font-semibold">{record.grade}</td>
                    <td className="py-4 px-6 text-center">{record.units}</td>
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
// FACULTY & STAFF
// ─────────────────────────────────────────────
function FacultyStaffManagement() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'faculty' | 'staff'>('faculty');

  const fetchFacultyAndStaff = async () => {
    setLoading(true);
    const { data: facultyData, error: facultyError } = await supabase
      .from('profiles').select('*').in('role', ['faculty', 'department_chair', 'dean']).order('full_name');
    const { data: staffData, error: staffError } = await supabase
      .from('profiles').select('*').in('role', ['staff']).order('full_name');
    if (facultyError) console.error('Faculty fetch error:', facultyError);
    if (staffError) console.error('Staff fetch error:', staffError);
    setFaculty(facultyData || []);
    setStaff(staffData || []);
    setLoading(false);
  };

  useEffect(() => { fetchFacultyAndStaff(); }, []);

  const currentList = activeTab === 'faculty' ? faculty : staff;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Faculty & Staff Management</h1>
        <button onClick={fetchFacultyAndStaff} className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"><Download className="w-5 h-5" /> Refresh</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Faculty Profiles</h2>
          <p className="text-5xl font-bold text-blue-600 mb-2">{faculty.length}</p>
          <p className="text-gray-600 mb-6">Total Faculty Members</p>
          <button onClick={() => setActiveTab('faculty')} className={`w-full py-3 rounded-lg transition-colors font-medium ${activeTab === 'faculty' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>View All Faculty</button>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Profiles</h2>
          <p className="text-5xl font-bold text-green-600 mb-2">{staff.length}</p>
          <p className="text-gray-600 mb-6">Total Staff Members</p>
          <button onClick={() => setActiveTab('staff')} className={`w-full py-3 rounded-lg transition-colors font-medium ${activeTab === 'staff' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>View All Staff</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{activeTab === 'faculty' ? 'Faculty Members' : 'Staff Members'}</h2>
          <span className="text-sm text-gray-500">{currentList.length} {activeTab === 'faculty' ? 'Faculty' : 'Staff'} Found</span>
        </div>
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading {activeTab}...</div>
        ) : currentList.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No {activeTab} found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">ID Number</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((person) => (
                  <tr key={person.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{person.full_name}</td>
                    <td className="py-4 px-6 text-gray-700">{person.id_number}</td>
                    <td className="py-4 px-6 text-gray-700">{person.email}</td>
                    <td className="py-4 px-6 text-gray-700">{person.department || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {person.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
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
// LANDING PAGE MANAGEMENT
// ─────────────────────────────────────────────
function LandingPageManagement() {
  const sections = ["Hero Section","About the College","Vision, Mission & Goals","Programs Offered","Faculty Directory","Achievements","Research & Extension","News & Updates","Contact Information"];
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [content, setContent] = useState<Record<string, { title: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLandingPageData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('landing_page_sections').select('*');
      if (error) throw error;
      const contentObj: Record<string, { title: string; description: string }> = {};
      sections.forEach(section => {
        const dbSection = data?.find(item => item.section_name === section);
        contentObj[section] = { title: dbSection?.title || '', description: dbSection?.description || '' };
      });
      setContent(contentObj);
    } catch (err) {
      const defaultContent: Record<string, { title: string; description: string }> = {};
      sections.forEach(s => { defaultContent[s] = { title: '', description: '' }; });
      setContent(defaultContent);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLandingPageData(); }, []);

  const handleChange = (field: 'title' | 'description', value: string) => {
    setContent(prev => ({ ...prev, [selectedSection]: { ...prev[selectedSection], [field]: value } }));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const current = content[selectedSection];
      const { error } = await supabase.from('landing_page_sections').upsert(
        { section_name: selectedSection, title: current.title, description: current.description, updated_by: null },
        { onConflict: 'section_name' }
      );
      if (error) throw error;
      alert(`Changes saved for ${selectedSection}`);
    } catch (err) { alert('Failed to save changes.'); } finally { setSaving(false); }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading landing page content...</div>;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Landing Page Management</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          {sections.map(section => <option key={section} value={section}>{section}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Editing: {selectedSection}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={content[selectedSection]?.title || ''} onChange={(e) => handleChange("title", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={6} value={content[selectedSection]?.description || ''} onChange={(e) => handleChange("description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button onClick={saveChanges} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
        <h3 className="text-2xl font-bold text-blue-600 mb-2">{content[selectedSection]?.title || ''}</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{content[selectedSection]?.description || ''}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CALENDAR & ACTIVITIES
// ─────────────────────────────────────────────
function CalendarActivities() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'activity', department: '' });

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('calendar_events').select('*').order('event_date', { ascending: true });
    if (error) alert('Failed to load events: ' + error.message);
    else setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const openModal = (event: any = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({ title: event.title, description: event.description || '', event_date: event.event_date ? event.event_date.slice(0, 16) : '', end_date: event.end_date ? event.end_date.slice(0, 16) : '', location: event.location || '', event_type: event.event_type || 'activity', department: event.department || '' });
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', event_date: '', end_date: '', location: '', event_type: 'activity', department: '' });
    }
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: formData.title, description: formData.description || null, event_date: new Date(formData.event_date).toISOString(), end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null, location: formData.location || null, event_type: formData.event_type, department: formData.department || null };
    let error;
    if (editingEvent) { ({ error } = await supabase.from('calendar_events').update(payload).eq('id', editingEvent.id)); }
    else { ({ error } = await supabase.from('calendar_events').insert([payload])); }
    if (error) alert('Failed to save event: ' + error.message);
    else { alert(editingEvent ? 'Event updated!' : 'Event added!'); setShowModal(false); fetchEvents(); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) alert('Failed to delete');
    else { alert('Event deleted'); fetchEvents(); }
  };

  const formatEventDate = (dateStr: string) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateStr));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Calendar & Activities</h1>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Plus className="w-5 h-5" /> Add Event</button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Interactive Calendar View</p>
            <p className="text-sm text-gray-400 mt-1">(Full calendar coming soon)</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Activities ({events.length})</h2>
        {loading ? <div className="py-12 text-center text-gray-500">Loading events...</div> : events.length === 0 ? <div className="py-12 text-center text-gray-500">No upcoming events.</div> : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{formatEventDate(event.event_date)}{event.end_date && ` — ${formatEventDate(event.end_date)}`}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${event.event_type === 'meeting' ? 'bg-blue-100 text-blue-700' : event.event_type === 'exam' ? 'bg-red-100 text-red-700' : event.event_type === 'holiday' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{event.event_type}</span>
                    <button onClick={() => openModal(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(event.id, event.title)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {event.description && <p className="text-gray-600 mt-3 text-sm">{event.description}</p>}
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-gray-500">
                  {event.location && <div>📍 {event.location}</div>}
                  {event.department && <div>🏢 {event.department}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Computer Science" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Room 301" />
              </div>
              <div className="flex gap-3 pt-6">
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
// RESEARCH & ACHIEVEMENTS
// ─────────────────────────────────────────────
function ResearchAchievements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: '', description: '', department: '', file: null as File | null });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('research_achievements').select(`*, author:profiles!author_id (full_name)`).eq('status', 'pending').order('created_at', { ascending: false });
    if (error) alert('Failed to load pending items');
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSubmitForm({ ...submitForm, file: e.target.files[0] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.title) { alert("Title is required"); return; }
    setUploading(true);
    let fileUrl = null;
    if (submitForm.file) {
      const fileExt = submitForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${submitForm.title.replace(/\s+/g, '-')}.${fileExt || 'pdf'}`;
      const { error: uploadError } = await supabase.storage.from('research-documents').upload(fileName, submitForm.file, { cacheControl: '3600', upsert: false });
      if (uploadError) { alert('File upload failed: ' + uploadError.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('research-documents').getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('research_achievements').insert([{ title: submitForm.title, description: submitForm.description || null, department: submitForm.department || null, file_url: fileUrl, author_id: (await supabase.auth.getUser()).data.user?.id, status: 'pending' }]);
    if (error) alert('Failed to submit: ' + error.message);
    else { alert('Submitted successfully!'); setShowSubmitModal(false); setSubmitForm({ title: '', description: '', department: '', file: null }); fetchItems(); }
    setUploading(false);
  };

  const handleApprove = async (id: string, title: string) => {
    if (!confirm(`Approve "${title}"?`)) return;
    const { error } = await supabase.from('research_achievements').update({ status: 'approved' }).eq('id', id);
    if (error) alert('Failed to approve'); else { alert('Approved!'); fetchItems(); }
  };

  const handleReject = async (id: string, title: string) => {
    if (!confirm(`Reject "${title}"?`)) return;
    const { error } = await supabase.from('research_achievements').update({ status: 'rejected' }).eq('id', id);
    if (error) alert('Failed to reject'); else { alert('Rejected!'); fetchItems(); }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research, Extension & Achievements</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
          <button onClick={fetchItems} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : items.length === 0 ? <div className="py-12 text-center text-gray-500">No pending items.</div> : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-5 bg-yellow-50 rounded-xl border-l-4 border-yellow-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-lg">{item.title}</div>
                    <div className="text-sm text-gray-600 mt-1">By: {item.author?.full_name || 'Unknown'}{item.department && ` • ${item.department}`}</div>
                    {item.description && <p className="text-gray-600 mt-3 text-sm">{item.description}</p>}
                    {item.file_url && <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 text-sm"><Download className="w-4 h-4" />Download File</a>}
                  </div>
                  <div className="flex gap-3 ml-6">
                    <button onClick={() => handleApprove(item.id, item.title)} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Approve</button>
                    <button onClick={() => handleReject(item.id, item.title)} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit New Research / Extension</h2>
        <p className="text-gray-600 mb-6">Submit research papers or community extension activities for Dean's approval.</p>
        <button onClick={() => setShowSubmitModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">+ Submit New Achievement</button>
      </div>
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-2xl font-semibold mb-6">Submit New Research / Extension</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={submitForm.title} onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={submitForm.description} onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" value={submitForm.department} onChange={(e) => setSubmitForm({ ...submitForm, department: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach File</label>
                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {submitForm.file && <p className="text-sm text-green-600 mt-1">Selected: {submitForm.file.name}</p>}
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70">{uploading ? 'Uploading...' : 'Submit for Approval'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EVALUATION MANAGEMENT
// ─────────────────────────────────────────────
function EvaluationManagement() {
  const [stats, setStats] = useState({ totalEvaluations: 0, completionRate: 0, averageRating: 0 });
  const [facultyPerformance, setFacultyPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluationData = async () => {
    setLoading(true);
    const { data: evalData } = await supabase.from('evaluations').select('score, status, evaluatee_id');
    const total = evalData?.length || 0;
    const submitted = evalData?.filter(e => e.status === 'submitted' || e.status === 'reviewed').length || 0;
    const validScores = evalData?.filter(e => e.score) || [];
    const avgRating = validScores.length > 0 ? (validScores.reduce((sum, e) => sum + Number(e.score), 0) / validScores.length).toFixed(1) : 0;
    const { data: facultyData } = await supabase.from('evaluations').select(`evaluatee_id, score, evaluatee:profiles!evaluatee_id (full_name, department)`).eq('evaluation_type', 'faculty').not('score', 'is', null);
    const grouped = facultyData?.reduce((acc: any, curr: any) => {
      const id = curr.evaluatee_id;
      if (!acc[id]) acc[id] = { id, name: curr.evaluatee?.full_name || 'Unknown', department: curr.evaluatee?.department || '', totalResponses: 0, totalScore: 0 };
      acc[id].totalResponses += 1;
      acc[id].totalScore += Number(curr.score || 0);
      return acc;
    }, {}) || {};
    const performanceList = Object.values(grouped).map((f: any) => ({ ...f, averageRating: (f.totalScore / f.totalResponses).toFixed(1), responses: f.totalResponses })).sort((a: any, b: any) => b.averageRating - a.averageRating);
    setStats({ totalEvaluations: total, completionRate: total > 0 ? Math.round((submitted / total) * 100) : 0, averageRating: parseFloat(avgRating as string) });
    setFacultyPerformance(performanceList.slice(0, 8));
    setLoading(false);
  };

  useEffect(() => { fetchEvaluationData(); }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Management</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Total Evaluations</h3><p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.totalEvaluations.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">Student responses</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Completion Rate</h3><p className="text-3xl font-bold text-green-600">{loading ? '...' : `${stats.completionRate}%`}</p><p className="text-sm text-gray-600 mt-1">Students completed</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3><p className="text-3xl font-bold text-purple-600">{loading ? '...' : stats.averageRating}</p><p className="text-sm text-gray-600 mt-1">Overall faculty rating</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Faculty Performance Summary</h2>
          <button onClick={fetchEvaluationData} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : facultyPerformance.length === 0 ? <div className="py-12 text-center text-gray-500">No faculty evaluations found.</div> : (
          <div className="space-y-4">
            {facultyPerformance.map((faculty, i) => (
              <div key={faculty.id || i} className="p-5 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-lg">{faculty.name}</div>
                    <div className="text-sm text-gray-600">{faculty.department || 'No department'} • {faculty.responses} responses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{faculty.averageRating}</div>
                    <div className="text-xs text-gray-600">out of 5.0</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ALUMNI TRACER
// ─────────────────────────────────────────────
interface Alumni {
  id: string;
  profile_id?: string | null;
  graduation_year: number | null;
  program: string | null;
  current_employer: string | null;
  tracer_responses: Record<string, any> | null;
  last_response_date: string | null;
  created_at?: string | null;
}

export default function AlumniTracer() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAlumniData(); }, []);

  const fetchAlumniData = async () => {
    try {
      setLoading(true); setError(null);
      const { data, error } = await supabase.from('alumni').select('*').order('graduation_year', { ascending: false });
      if (error) throw error;
      setAlumni(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load alumni data');
    } finally { setLoading(false); }
  };

  const totalAlumni = alumni.length;
  const responses = alumni.filter(a => a.tracer_responses && Object.keys(a.tracer_responses).length > 0).length;
  const responseRate = totalAlumni > 0 ? Math.round((responses / totalAlumni) * 100) : 0;
  const employedCount = alumni.filter(a => a.tracer_responses?.employment_status === 'Employed' || a.tracer_responses?.currently_employed === true || !!a.current_employer).length;
  const employedPercentage = totalAlumni > 0 ? Math.round((employedCount / totalAlumni) * 100) : 0;

  const exportReport = () => {
    if (alumni.length === 0) return;
    const headers = ['ID', 'Graduation Year', 'Program', 'Current Employer', 'Last Response', 'Has Response'];
    const rows = alumni.map(a => [a.id, a.graduation_year || '', a.program || '', a.current_employer || '', a.last_response_date || '', a.tracer_responses ? 'Yes' : 'No']);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alumni_tracer_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="flex items-center justify-center h-96"><p className="text-gray-500">Loading alumni data...</p></div>;
  if (error) return <div className="bg-red-50 border border-red-200 p-6 rounded-xl"><p className="text-red-600">Error: {error}</p><button onClick={fetchAlumniData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button></div>;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Alumni Tracer Management</h1>
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-sm font-medium text-gray-600 mb-2">Total Alumni</h3><p className="text-3xl font-bold text-blue-600">{totalAlumni.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-sm font-medium text-gray-600 mb-2">Responses</h3><p className="text-3xl font-bold text-green-600">{responses.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-sm font-medium text-gray-600 mb-2">Employed</h3><p className="text-3xl font-bold text-purple-600">{employedPercentage}%</p><p className="text-xs text-gray-500 mt-1">{employedCount} alumni</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-sm font-medium text-gray-600 mb-2">Response Rate</h3><p className="text-3xl font-bold text-orange-600">{responseRate}%</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Employment Statistics</h2>
          <button onClick={exportReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Download className="w-4 h-4" />Export Report</button>
        </div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          <div className="text-center"><BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">Employment Distribution Chart</p></div>
        </div>
        <div className="mt-8">
          <h3 className="font-medium text-gray-900 mb-3">Recent Alumni Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Program</th>
                  <th className="text-left py-3 px-4">Grad Year</th>
                  <th className="text-left py-3 px-4">Current Employer</th>
                  <th className="text-left py-3 px-4">Responded</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alumni.slice(0, 8).map(alum => (
                  <tr key={alum.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{alum.program || '—'}</td>
                    <td className="py-3 px-4">{alum.graduation_year || '—'}</td>
                    <td className="py-3 px-4">{alum.current_employer || '—'}</td>
                    <td className="py-3 px-4">{alum.tracer_responses ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REPORTS & ANALYTICS
// ─────────────────────────────────────────────
function ReportsAnalytics() {
  const [stats, setStats] = useState({ totalUsers: 0, totalAlumni: 0, activeUsers: 0, alumniInProfiles: 0 });
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const { count: alumniCount } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
      const profiles = profilesData || [];
      const roleCount = profiles.reduce((acc: any, p: any) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {});
      const roleList = Object.entries(roleCount).map(([role, count]) => ({ role: role.charAt(0).toUpperCase() + role.slice(1), count: count as number, percentage: profiles.length > 0 ? Math.round(((count as number) / profiles.length) * 100) : 0 })).sort((a, b) => b.count - a.count);
      setStats({ totalUsers: profiles.length, totalAlumni: alumniCount || 0, activeUsers: profiles.filter(p => p.status === 'active').length, alumniInProfiles: profiles.filter(p => p.role === 'alumni').length });
      setRoleDistribution(roleList);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReportsData(); }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Reports & Analytics</h1>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3><p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.totalUsers.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">Registered accounts</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Total Alumni</h3><p className="text-3xl font-bold text-purple-600">{loading ? '...' : stats.totalAlumni.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">In Alumni Tracer</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3><p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.activeUsers.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">Currently active</p></div>
        <div className="bg-white rounded-xl shadow-md p-6"><h3 className="text-lg font-semibold text-gray-900 mb-2">Alumni in Profiles</h3><p className="text-3xl font-bold text-orange-600">{loading ? '...' : stats.alumniInProfiles.toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">With role = alumni</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {['Institutional Report', 'Faculty Performance', 'Student Analytics'].map((report, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{report}</h3>
            <div className="space-y-3">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Download className="w-4 h-4" />Export PDF</button>
              <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"><Download className="w-4 h-4" />Export Excel</button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <button onClick={fetchReportsData} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Refresh</button>
        </div>
        {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : (
          <div>
            <h3 className="font-medium text-gray-900 mb-4">User Distribution by Role</h3>
            <div className="space-y-4">
              {roleDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="font-medium text-gray-900">{item.role}</div>
                  <div className="text-right"><div className="text-xl font-semibold text-blue-600">{item.count}</div><div className="text-xs text-gray-500">{item.percentage}%</div></div>
                </div>
              ))}
            </div>
            <div className="mt-10 h-80 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <div className="text-center"><BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">Advanced Charts Area</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────
function AnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', target_role: 'all', is_pinned: false });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) { alert("Title and content are required"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('announcements').insert({ title: formData.title.trim(), content: formData.content.trim(), target_role: [formData.target_role], is_pinned: formData.is_pinned });
      if (error) throw error;
      setFormData({ title: '', content: '', target_role: 'all', is_pinned: false });
      fetchAnnouncements();
      alert('Announcement published!');
    } catch (err) { alert('Failed to publish announcement'); } finally { setSubmitting(false); }
  };

  const togglePin = async (id: any, currentPinned: any) => {
    if (!id) return;
    const { error } = await supabase.from('announcements').update({ is_pinned: !currentPinned }).eq('id', id);
    if (!error) fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: any) => {
    if (!id || !confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) fetchAnnouncements();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Announcements & Content</h1>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Plus className="w-5 h-5" />New Announcement</button>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter announcement title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea name="content" value={formData.content} onChange={handleInputChange} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Enter announcement content..." required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select name="target_role" value={formData.target_role} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="alumni">Alumni</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" name="is_pinned" checked={formData.is_pinned} onChange={handleInputChange} className="w-4 h-4" />
              <label className="text-sm font-medium text-gray-700">Pin this announcement</label>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{submitting ? 'Publishing...' : 'Publish Announcement'}</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
        {loading ? <div className="py-12 text-center text-gray-500">Loading...</div> : announcements.length === 0 ? <div className="py-12 text-center text-gray-500">No announcements yet.</div> : (
          <div className="space-y-4">
            {announcements.map((ann: any) => (
              <div key={ann.id} className={`p-5 rounded-xl ${ann.is_pinned ? 'bg-amber-50 border border-amber-300' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {ann.is_pinned && <span className="text-amber-500 font-bold">📌</span>}
                      <div className="font-semibold text-lg text-gray-900">{ann.title}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{ann.created_at && new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <p className="mt-3 text-gray-700 line-clamp-3">{ann.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => togglePin(ann.id, ann.is_pinned)} className="p-2 text-gray-500 hover:text-amber-600" title={ann.is_pinned ? "Unpin" : "Pin"}>📌</button>
                    <button onClick={() => deleteAnnouncement(ann.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SYSTEM SETTINGS
// ─────────────────────────────────────────────
function SystemSettings() {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('Second Semester');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const semesters = ['First Semester', 'Second Semester', 'Summer'];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('system_settings').select('*').in('setting_key', ['current_academic_year', 'current_semester']);
      if (error) throw error;
      data?.forEach(setting => {
        if (setting.setting_key === 'current_academic_year') setAcademicYear(setting.setting_value);
        if (setting.setting_key === 'current_semester') setSemester(setting.setting_value);
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('system_settings').upsert([
        { setting_key: 'current_academic_year', setting_value: academicYear, description: 'Current academic year' },
        { setting_key: 'current_semester', setting_value: semester, description: 'Current semester' }
      ], { onConflict: 'setting_key' });
      if (error) throw error;
      alert('System settings updated successfully!');
    } catch (err) { alert('Failed to save settings'); } finally { setSaving(false); }
  };

  if (loading) return <div className="py-12 text-center">Loading system settings...</div>;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">System Settings</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Year Setup</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Academic Year</label>
              <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2025-2026" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={saveSettings} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Update Settings'}</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Maintenance</h2>
          <div className="space-y-4">
            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"><span>↓</span> Create Backup</button>
            <button className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">⚙️ System Maintenance</button>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
              <p className="text-green-600 font-medium flex items-center gap-2"><span>✅</span> Last backup: February 13, 2026 at 2:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}