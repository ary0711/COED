import { useState, useEffect } from 'react';
import {
  User,
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Bell,
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { supabase } from '../../supabaseClient';

const facultyMenuItems = [
  { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  { icon: User, label: 'My Profile', id: 'profile' },
  { icon: BookOpen, label: 'Teaching Load', id: 'teaching-load' },
  { icon: FileText, label: 'Research & Extension', id: 'research' },
  { icon: Award, label: 'Achievements', id: 'achievements' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: BarChart3, label: 'Evaluation Results', id: 'evaluation' },
  { icon: FileText, label: 'Reports', id: 'reports' },
];

interface FacultyDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared hook: fetch the logged-in faculty's profile
// ─────────────────────────────────────────────────────────────────────────────
function useFacultyProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  return { profile, loading, refetch: fetchProfile };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    approved: {
      color: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'Approved',
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Pending',
    },
    rejected: {
      color: 'bg-red-100 text-red-700',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Rejected',
    },
  };
  const cfg = map[status] ?? map['pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────
export function FacultyDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: FacultyDashboardProps) {
  const { profile, loading } = useFacultyProfile();
  const displayName = loading ? 'Loading...' : profile?.full_name || 'Faculty Member';

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={facultyMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Faculty Member"
      />
      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Faculty"
          userName={displayName}
          onRoleChange={onRoleChange}
        />
        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'     && <FacultyDashboardView profile={profile} profileLoading={loading} />}
          {activeMenuItem === 'profile'       && <FacultyProfile profile={profile} profileLoading={loading} />}
          {activeMenuItem === 'teaching-load' && <TeachingLoad />}
          {activeMenuItem === 'research'      && <ResearchExtension profile={profile} />}
          {activeMenuItem === 'achievements'  && <FacultyAchievements profile={profile} />}
          {activeMenuItem === 'records'       && <AcademicRecordsView />}
          {activeMenuItem === 'evaluation'    && <EvaluationResults />}
          {activeMenuItem === 'reports'       && <ReportsView profile={profile} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FacultyDashboardView({ profile, profileLoading }: { profile: any; profileLoading: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState({
    report_type: 'Monthly Report',
    period: '',
    file: null as File | null,
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { alert('Profile not loaded yet.'); return; }
    if (!reportForm.period.trim()) { alert('Please enter a reporting period.'); return; }

    setSubmitting(true);
    try {
      let file_url: string | null = null;

      if (reportForm.file) {
        const ext = reportForm.file.name.split('.').pop();
        const fileName = `${Date.now()}-${reportForm.period.replace(/\s+/g, '-')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(fileName, reportForm.file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('reports').insert({
        faculty_id: profile.id,
        report_type: reportForm.report_type,
        period: reportForm.period.trim(),
        file_url,
        status: 'pending',
      });
      if (error) throw error;

      alert('✅ Report submitted successfully!');
      setReportForm({ report_type: 'Monthly Report', period: '', file: null });

      const fileInput = document.getElementById('report-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      alert('Failed to submit report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {profileLoading ? '...' : profile?.full_name || 'Faculty Member'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-600">Teaching Units</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <User className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">156</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <FileText className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Pending Reports</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Award className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">4.8/5.0</div>
          <div className="text-sm text-gray-600">Evaluation Rating</div>
        </div>
      </div>

      {/* Announcements, Deadlines & Report Submission */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements at this time.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-lg border-l-4 ${ann.is_pinned ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}
                >
                  <div className="font-medium text-gray-900 text-sm">{ann.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(ann.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm">Q4 Report Submission</div>
                <div className="text-xs text-gray-600">Due: February 20, 2026</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <div className="font-medium text-gray-900 text-sm">Grade Submission</div>
                <div className="text-xs text-gray-600">Due: February 25, 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Report Submission */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Submit Report</h2>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportForm.report_type}
                onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option>Monthly Report</option>
                <option>Quarterly Report</option>
                <option>Special Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
              <input
                type="text"
                value={reportForm.period}
                onChange={(e) => setReportForm({ ...reportForm, period: e.target.value })}
                placeholder="e.g. Q1 2026 or January 2026"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
              <input
                id="report-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setReportForm({ ...reportForm, file: e.target.files?.[0] ?? null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {reportForm.file && (
                <p className="text-xs text-green-600 mt-1">Selected: {reportForm.file.name}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MY PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function FacultyProfile({ profile, profileLoading }: { profile: any; profileLoading: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    specialization: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        specialization: profile.specialization || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          specialization: form.specialization,
        })
        .eq('id', profile.id);
      if (error) throw error;
      alert('✅ Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) return <div className="py-12 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="py-12 text-center text-gray-500">Profile not found.</div>;

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setForm({
                  full_name: profile.full_name || '',
                  phone: profile.phone || '',
                  address: profile.address || '',
                  specialization: profile.specialization || '',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-gray-600">{profile.department || 'No department assigned'}</p>
            <p className="text-sm text-gray-500">ID: {profile.id_number || profile.id}</p>
            <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
              profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile.status || 'active'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={editing ? form.full_name : profile.full_name || ''}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              readOnly={!editing}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ${editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={editing ? form.phone : profile.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              readOnly={!editing}
              placeholder={editing ? 'Enter phone number' : 'Not set'}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ${editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
            <input
              type="text"
              value={editing ? form.specialization : profile.specialization || ''}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              readOnly={!editing}
              placeholder={editing ? 'Enter specialization' : 'Not set'}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ${editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={profile.role || 'faculty'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value={profile.department || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={editing ? form.address : profile.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            readOnly={!editing}
            rows={2}
            placeholder={editing ? 'Enter address' : 'Not set'}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none ${editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHING LOAD
// ─────────────────────────────────────────────────────────────────────────────
function TeachingLoad() {
  const subjects = [
    { code: 'CS101', name: 'Introduction to Computer Science', units: 3, students: 45, schedule: 'MWF 8:00-9:00 AM' },
    { code: 'CS201', name: 'Data Structures', units: 3, students: 38, schedule: 'TTH 10:00-11:30 AM' },
    { code: 'CS301', name: 'Software Engineering', units: 3, students: 42, schedule: 'MWF 1:00-2:00 PM' },
    { code: 'CS401', name: 'Capstone Project', units: 3, students: 31, schedule: 'TTH 2:00-3:30 PM' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Teaching Load</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Academic Year 2025-2026</h2>
              <p className="text-gray-600">Second Semester</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">12 Units</div>
              <div className="text-sm text-gray-600">Total Teaching Load</div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Course Code</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Course Name</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Units</th>
                <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Students</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{subject.code}</td>
                  <td className="py-4 px-6 text-gray-700">{subject.name}</td>
                  <td className="py-4 px-6 text-center text-gray-700">{subject.units}</td>
                  <td className="py-4 px-6 text-center text-gray-700">{subject.students}</td>
                  <td className="py-4 px-6 text-gray-700">{subject.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH & EXTENSION
// ─────────────────────────────────────────────────────────────────────────────
function ResearchExtension({ profile }: { profile: any }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    research_type: 'Research',
    file: null as File | null,
  });

  const fetchSubmissions = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('research_achievements')
      .select('*')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchSubmissions();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { alert('Profile not loaded.'); return; }
    if (!form.title.trim()) { alert('Title is required.'); return; }

    setUploading(true);
    try {
      let file_url: string | null = null;
      if (form.file) {
        const ext = form.file.name.split('.').pop();
        const fileName = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('research-documents')
          .upload(fileName, form.file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('research-documents').getPublicUrl(fileName);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('research_achievements').insert({
        author_id: profile.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        department: profile.department || null,
        research_type: form.research_type,
        file_url,
        status: 'pending',
      });
      if (error) throw error;

      alert('✅ Submitted successfully! Awaiting Dean approval.');
      setForm({ title: '', description: '', research_type: 'Research', file: null });
      fetchSubmissions();
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research & Extension</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Research Output</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter research or extension title"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={form.research_type}
                onChange={(e) => setForm({ ...form, research_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Research</option>
                <option>Extension</option>
                <option>Publication</option>
                <option>Conference Paper</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {form.file && <p className="text-xs text-green-600 mt-1">Selected: {form.file.name}</p>}
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {uploading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Research Submissions</h2>
          <button onClick={fetchSubmissions} className="text-blue-600 hover:text-blue-700 text-sm">↻ Refresh</button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Submitted</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">File</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900 max-w-xs">
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-700 text-sm">{item.research_type || '—'}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={item.status || 'pending'} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Download className="w-4 h-4" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function FacultyAchievements({ profile }: { profile: any }) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Award',
    description: '',
    file: null as File | null,
  });

  const fetchAchievements = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('faculty_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAchievements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchAchievements();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { alert('Profile not loaded.'); return; }
    if (!form.title.trim()) { alert('Title is required.'); return; }

    setUploading(true);
    try {
      let file_url: string | null = null;
      if (form.file) {
        const ext = form.file.name.split('.').pop();
        const fileName = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('achievement-documents')
          .upload(fileName, form.file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('achievement-documents').getPublicUrl(fileName);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('achievements').insert({
        faculty_id: profile.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
        file_url,
        status: 'pending',
      });
      if (error) throw error;

      alert('✅ Achievement submitted for approval!');
      setForm({ title: '', category: 'Award', description: '', file: null });
      fetchAchievements();
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Award: 'bg-yellow-100 text-yellow-700',
    Recognition: 'bg-blue-100 text-blue-700',
    Publication: 'bg-green-100 text-green-700',
    Certification: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Achievements</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Achievement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Best Research Award 2026"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Award</option>
                <option>Recognition</option>
                <option>Publication</option>
                <option>Certification</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Brief description (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {form.file && <p className="text-xs text-green-600 mt-1">Selected: {form.file.name}</p>}
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {uploading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Achievements</h2>
          <button onClick={fetchAchievements} className="text-blue-600 hover:text-blue-700 text-sm">↻ Refresh</button>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading achievements...</div>
        ) : achievements.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No achievements submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Submitted</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Document</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900 max-w-xs">
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={item.status || 'pending'} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Download className="w-4 h-4" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC RECORDS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AcademicRecordsView() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600 mb-4">View institutional documents and policies</p>
        <div className="space-y-3">
          {['Faculty Handbook 2025-2026', 'Academic Policies'].map((doc, i) => (
            <div
              key={i}
              className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">{doc}</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION RESULTS
// ─────────────────────────────────────────────────────────────────────────────
function EvaluationResults() {
  const categories = [
    { category: 'Teaching Effectiveness', rating: 4.9 },
    { category: 'Course Content', rating: 4.8 },
    { category: 'Communication Skills', rating: 4.7 },
    { category: 'Student Engagement', rating: 4.8 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Results</h1>
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">4.8</div>
          <div className="text-gray-600">Overall Rating (out of 5.0)</div>
          <div className="text-sm text-gray-500 mt-1">Based on 156 student evaluations</div>
        </div>
        <div className="space-y-4">
          {categories.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <span className="text-sm font-bold text-blue-600">{item.rating}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(item.rating / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ReportsView({ profile }: { profile: any }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchReports = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('faculty_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching reports:', error);
    else setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchReports();
  }, [profile]);

  const filtered = activeTab === 'all'
    ? reports
    : reports.filter((r) => r.status === activeTab);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
  };

  const tabStyle = (tab: typeof activeTab) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
      activeTab === tab
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
    }`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
        <button
          onClick={fetchReports}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
          <div className="text-sm text-gray-500 mt-1">Total Submitted</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
          <div className="text-sm text-gray-500 mt-1">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
          <div className="text-sm text-gray-500 mt-1">Approved</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
          <div className="text-sm text-gray-500 mt-1">Rejected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setActiveTab('all')} className={tabStyle('all')}>
          All <span className="ml-1 opacity-70">({counts.all})</span>
        </button>
        <button onClick={() => setActiveTab('pending')} className={tabStyle('pending')}>
          Pending <span className="ml-1 opacity-70">({counts.pending})</span>
        </button>
        <button onClick={() => setActiveTab('approved')} className={tabStyle('approved')}>
          Approved <span className="ml-1 opacity-70">({counts.approved})</span>
        </button>
        <button onClick={() => setActiveTab('rejected')} className={tabStyle('rejected')}>
          Rejected <span className="ml-1 opacity-70">({counts.rejected})</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Report Submissions</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No {activeTab !== 'all' ? activeTab : ''} reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Report Type</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Period</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Submitted</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Remarks</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">File</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{report.report_type}</td>
                    <td className="py-4 px-6 text-gray-700">{report.period}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={report.status || 'pending'} />
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {report.remarks || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {report.file_url ? (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Download className="w-4 h-4" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
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