import { User, FileText, Award, BookOpen, MessageSquare, Bell, CheckCircle, Edit2, Save, X, Send, Download, Clock, AlertCircle } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const alumniMenuItems = [
  { icon: Bell,         label: 'Dashboard',             id: 'dashboard'    },
  { icon: FileText,     label: 'Graduate Tracer Survey', id: 'tracer'       },
  { icon: Bell,         label: 'Alumni News',            id: 'news'         },
  { icon: BookOpen,     label: 'College Information',    id: 'college-info' },
  { icon: Award,        label: 'Achievements',           id: 'achievements' },
  { icon: FileText,     label: 'Documents & Resources',  id: 'documents'    },
  { icon: MessageSquare,label: 'Inquiry / Contact',      id: 'inquiry'      },
];

interface AlumniDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared hook — fetch logged-in alumni profile + alumni table row
// ─────────────────────────────────────────────────────────────────────────────
function useAlumniProfile() {
  const [profile, setProfile]   = useState<any>(null);
  const [alumniRow, setAlumniRow] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Main profile record
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      // Alumni-specific row (tracer info)
      const { data: alumniData } = await supabase
        .from('alumni')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      setAlumniRow(alumniData ?? null);
    } catch (err) {
      console.error('Error fetching alumni profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  return { profile, alumniRow, loading, refetch: fetchProfile };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    resolved:    { color: 'bg-green-100 text-green-700',  icon: <CheckCircle  className="w-3.5 h-3.5" />, label: 'Resolved'    },
    in_progress: { color: 'bg-blue-100 text-blue-700',    icon: <Clock        className="w-3.5 h-3.5" />, label: 'In Progress' },
    pending:     { color: 'bg-yellow-100 text-yellow-700',icon: <AlertCircle  className="w-3.5 h-3.5" />, label: 'Pending'     },
  };
  const cfg = map[status] ?? map['pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export function AlumniDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: AlumniDashboardProps) {
  const { profile, alumniRow, loading, refetch } = useAlumniProfile();
  const displayName = loading ? 'Loading...' : profile?.full_name || 'Alumni';

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <Sidebar
        menuItems={alumniMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Alumni"
      />
      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Alumni"
          userName={displayName}
          onRoleChange={onRoleChange}
          hideRoleSwitch
        />
        <main className="p-6 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'    && <AlumniDashboardView   profile={profile} alumniRow={alumniRow} loading={loading} setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'tracer'       && <TracerSurvey           profile={profile} alumniRow={alumniRow} refetch={refetch} />}
          {activeMenuItem === 'news'         && <AlumniNews />}
          {activeMenuItem === 'college-info' && <CollegeInformation />}
          {activeMenuItem === 'achievements' && <AlumniAchievements />}
          {activeMenuItem === 'documents'    && <DocumentsResources />}
          {activeMenuItem === 'inquiry'      && <AlumniInquiry          profile={profile} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function AlumniDashboardView({
  profile, alumniRow, loading, setActiveMenuItem,
}: {
  profile: any; alumniRow: any; loading: boolean;
  setActiveMenuItem: (id: string) => void;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at',  { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    };
    fetch();
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const tracerDone = alumniRow?.tracer_responses &&
    Object.keys(alumniRow.tracer_responses).length > 0;

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Alumni Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {loading ? '...' : profile?.full_name || 'Alumni'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {loading ? '...' : profile?.full_name || '—'}
            </h2>
            <p className="text-blue-100 mb-1">
              Alumni ID: {loading ? '...' : profile?.id_number || '—'}
            </p>
            <p className="text-blue-100">
              {loading ? '...' : alumniRow?.program || profile?.department || '—'}
            </p>
            <p className="text-blue-100">
              Graduated:{' '}
              {loading ? '...' : alumniRow?.graduation_year ? `${alumniRow.graduation_year}` : '—'}
            </p>
            {alumniRow?.current_employer && (
              <p className="text-blue-100 mt-2">
                Current Employer: {alumniRow.current_employer}
              </p>
            )}
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold mb-2">
              {loading ? '?' : initials}
            </div>
            <div className="text-sm text-blue-100">
              {alumniRow?.graduation_year ? `Class of ${alumniRow.graduation_year}` : 'Alumni'}
            </div>
          </div>
        </div>
      </div>

      {/* Tracer Status Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          {tracerDone
            ? <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            : <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />}
          <div className="text-2xl font-bold text-gray-900">
            {loading ? '...' : tracerDone ? 'Completed' : 'Incomplete'}
          </div>
          <div className="text-sm text-gray-600">Tracer Survey Status</div>
          {alumniRow?.last_response_date && (
            <div className="text-xs text-gray-500 mt-2">
              Last updated:{' '}
              {new Date(alumniRow.last_response_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <User className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {loading ? '...'
              : alumniRow?.tracer_responses?.employment_status
              || (alumniRow?.current_employer ? 'Employed' : '—')}
          </div>
          <div className="text-sm text-gray-600">Employment Status</div>
          {alumniRow?.tracer_responses?.job_title && (
            <div className="text-xs text-gray-500 mt-2">
              {alumniRow.tracer_responses.job_title}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <Award className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {loading ? '...' : profile?.status === 'active' ? 'Active' : profile?.status || 'Active'}
          </div>
          <div className="text-sm text-gray-600">Alumni Status</div>
          {alumniRow?.graduation_year && (
            <div className="text-xs text-gray-500 mt-2">
              Member since {alumniRow.graduation_year}
            </div>
          )}
        </div>
      </div>

      {/* Announcements & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Announcements
          </h2>
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

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveMenuItem('tracer')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Update Tracer Information</div>
              <div className="text-sm text-gray-600">Keep your employment info current</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('news')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">View Alumni News</div>
              <div className="text-sm text-gray-600">Latest updates and events</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('inquiry')}
              className="w-full p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Submit an Inquiry</div>
              <div className="text-sm text-gray-600">Contact the college office</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRACER SURVEY — reads & writes to the `alumni` table
// ─────────────────────────────────────────────────────────────────────────────
function TracerSurvey({
  profile, alumniRow, refetch,
}: {
  profile: any; alumniRow: any; refetch: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);

  const defaultForm = {
    employment_status: 'Employed',
    job_title:         '',
    employer:          '',
    years_employed:    '',
    monthly_salary:    '25000-30000',
    relevance:         'Very Relevant',
  };

  const [form, setForm] = useState(defaultForm);

  // Populate form from existing tracer_responses when alumniRow loads
  useEffect(() => {
    if (alumniRow?.tracer_responses) {
      setForm({
        employment_status: alumniRow.tracer_responses.employment_status || defaultForm.employment_status,
        job_title:         alumniRow.tracer_responses.job_title         || alumniRow.tracer_responses.jobTitle || '',
        employer:          alumniRow.tracer_responses.employer          || alumniRow.current_employer          || '',
        years_employed:    alumniRow.tracer_responses.years_employed    || '',
        monthly_salary:    alumniRow.tracer_responses.monthly_salary    || defaultForm.monthly_salary,
        relevance:         alumniRow.tracer_responses.relevance         || defaultForm.relevance,
      });
    } else if (alumniRow) {
      setForm((prev) => ({ ...prev, employer: alumniRow.current_employer || '' }));
    }
  }, [alumniRow]);

  const handleSave = async () => {
    if (!profile) { alert('Profile not loaded.'); return; }
    setSaving(true);
    try {
      const payload = {
        profile_id:         profile.id,
        current_employer:   form.employer,
        last_response_date: new Date().toISOString(),
        tracer_responses: {
          employment_status: form.employment_status,
          job_title:         form.job_title,
          employer:          form.employer,
          years_employed:    form.years_employed,
          monthly_salary:    form.monthly_salary,
          relevance:         form.relevance,
        },
      };

      if (alumniRow) {
        // Update existing row
        const { error } = await supabase
          .from('alumni')
          .update(payload)
          .eq('id', alumniRow.id);
        if (error) throw error;
      } else {
        // Insert new row
        const { error } = await supabase
          .from('alumni')
          .insert({ ...payload, program: profile.department || null });
        if (error) throw error;
      }

      alert('✅ Tracer information saved successfully!');
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tracerDone = alumniRow?.tracer_responses &&
    Object.keys(alumniRow.tracer_responses).length > 0;

  const inputClass = (editing: boolean) =>
    `w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none ${
      editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
    }`;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Graduate Tracer Survey</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Tracer Information</h2>
            {alumniRow?.last_response_date && (
              <p className="text-sm text-gray-500 mt-0.5">
                Last updated:{' '}
                {new Date(alumniRow.last_response_date).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              {tracerDone ? 'Edit Information' : 'Fill Out Survey'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
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

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
            <select
              value={form.employment_status}
              onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            >
              <option>Employed</option>
              <option>Self-Employed</option>
              <option>Unemployed but looking</option>
              <option>Pursuing further studies</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title / Position</label>
            <input
              type="text"
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              disabled={!isEditing}
              placeholder={isEditing ? 'e.g. Elementary School Teacher' : 'Not set'}
              className={inputClass(isEditing)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employer / Company</label>
            <input
              type="text"
              value={form.employer}
              onChange={(e) => setForm({ ...form, employer: e.target.value })}
              disabled={!isEditing}
              placeholder={isEditing ? 'e.g. DepEd / Private School' : 'Not set'}
              className={inputClass(isEditing)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years in Current Position</label>
            <input
              type="number"
              value={form.years_employed}
              onChange={(e) => setForm({ ...form, years_employed: e.target.value })}
              disabled={!isEditing}
              placeholder={isEditing ? 'e.g. 3' : 'Not set'}
              min={0}
              className={inputClass(isEditing)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary Range</label>
            <select
              value={form.monthly_salary}
              onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            >
              <option value="below-20000">Below ₱20,000</option>
              <option value="20000-25000">₱20,000 – ₱25,000</option>
              <option value="25000-30000">₱25,000 – ₱30,000</option>
              <option value="30000-40000">₱30,000 – ₱40,000</option>
              <option value="above-40000">Above ₱40,000</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Relevance to Degree</label>
            <select
              value={form.relevance}
              onChange={(e) => setForm({ ...form, relevance: e.target.value })}
              disabled={!isEditing}
              className={inputClass(isEditing)}
            >
              <option>Very Relevant</option>
              <option>Relevant</option>
              <option>Somewhat Relevant</option>
              <option>Not Relevant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status notice */}
      <div className={`border rounded-xl p-6 flex items-start gap-3 ${
        tracerDone ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        {tracerDone
          ? <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 shrink-0" />
          : <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 shrink-0" />}
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {tracerDone ? 'Survey Completed' : 'Survey Not Yet Completed'}
          </h3>
          <p className="text-sm text-gray-700">
            {tracerDone
              ? 'Thank you for keeping your information updated. Your responses help us improve our programs and track alumni success. You can edit your responses at any time.'
              : 'Please fill out your tracer information. Click "Fill Out Survey" above to get started. Your data helps the college improve its programs.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALUMNI NEWS — fetches from announcements table
// ─────────────────────────────────────────────────────────────────────────────
function AlumniNews() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at',  { ascending: false });
      if (error) console.error(error);
      else setNews(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Fallback static news if no DB records
  const staticNews = [
    {
      id: 'static-1',
      title: 'Alumni Homecoming 2026 Registration Now Open',
      created_at: '2026-02-10',
      content: 'Join us for a memorable reunion with your batchmates and faculty. Early bird registration until March 1st.',
    },
    {
      id: 'static-2',
      title: 'Career Mentorship Program Launches',
      created_at: '2026-02-05',
      content: 'Experienced alumni are invited to mentor current students. Share your expertise and give back to COED.',
    },
  ];

  const items = news.length > 0 ? news : staticNews;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Alumni News</h1>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading news...</div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="text-sm text-blue-600 font-medium mb-2">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                  {item.is_pinned && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h2>
                <p className="text-gray-600">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLEGE INFORMATION (static)
// ─────────────────────────────────────────────────────────────────────────────
function CollegeInformation() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">College Information</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About COED</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          The College of Education has been at the forefront of teacher education and professional
          development for over 32 years. Our commitment to excellence has produced thousands of
          passionate educators who are making a difference in classrooms across the nation.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {[
            { value: '32+',   label: 'Years of Excellence', color: 'blue'   },
            { value: '5,000+',label: 'Alumni Graduates',    color: 'green'  },
            { value: '98%',   label: 'Employment Rate',     color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 bg-${stat.color}-50 rounded-lg text-center`}>
              <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Programs</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Elementary Education',   desc: 'BEEd, Master\'s Programs'                          },
            { name: 'Secondary Education',    desc: 'BSEd (English, Math, Science, Social Studies)'     },
            { name: 'Special Education',      desc: 'BSNEd, Master\'s Programs'                         },
            { name: 'Educational Leadership', desc: 'Master\'s, PhD Programs'                           },
          ].map((prog, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{prog.name}</h3>
              <p className="text-sm text-gray-600">{prog.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS — fetches approved research_achievements from DB
// ─────────────────────────────────────────────────────────────────────────────
function AlumniAchievements() {
  const [collegeAchievements, setCollegeAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('research_achievements')
        .select('title, description, department, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) console.error(error);
      else setCollegeAchievements(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">College Achievements</h1>

      {/* Awards (static) */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Awards</h2>
          <div className="space-y-3">
            {[
              { title: 'Excellence in Teacher Education Award', org: 'National Commission - 2025', color: 'yellow' },
              { title: 'Level III Accreditation Status',        org: 'AACCUP - 2025',              color: 'blue'   },
            ].map((award, i) => (
              <div key={i} className={`p-4 bg-${award.color}-50 border-l-4 border-${award.color}-500 rounded-lg`}>
                <div className="flex items-start gap-3">
                  <Award className={`w-5 h-5 text-${award.color}-600 mt-1 shrink-0`} />
                  <div>
                    <div className="font-medium text-gray-900">{award.title}</div>
                    <div className="text-sm text-gray-600">{award.org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Highlights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">285 Publications</div>
              <div className="text-sm text-gray-600">Since 2020</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">International Partnerships</div>
              <div className="text-sm text-gray-600">5 countries collaboration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Approved research from DB */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          College Research & Extension (Approved)
        </h2>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : collegeAchievements.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No approved research yet.</div>
        ) : (
          <div className="space-y-3">
            {collegeAchievements.map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-medium text-gray-900">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {item.department && <span>🏢 {item.department}</span>}
                  <span>📅 {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS & RESOURCES (static)
// ─────────────────────────────────────────────────────────────────────────────
function DocumentsResources() {
  const documents = [
    { title: 'Alumni Directory 2026',          type: 'PDF', size: '3.2 MB' },
    { title: 'Career Development Guide',       type: 'PDF', size: '2.8 MB' },
    { title: 'Alumni Benefits and Privileges', type: 'PDF', size: '1.5 MB' },
    { title: 'Transcript Request Form',        type: 'PDF', size: '890 KB' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Documents & Resources</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Downloadable Resources</h2>
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-600">{doc.type} • {doc.size}</div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INQUIRY / CONTACT — reuses the same `inquiries` table as students
// ─────────────────────────────────────────────────────────────────────────────
function AlumniInquiry({ profile }: { profile: any }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject:  '',
    category: 'Transcript Request',
    message:  '',
  });

  const fetchInquiries = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('student_id', profile.id)   // alumni use the same column (student_id = submitter_id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setInquiries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchInquiries();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { alert('Profile not loaded.'); return; }
    if (!form.subject.trim() || !form.message.trim()) {
      alert('Subject and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        student_id: profile.id,
        subject:    form.subject.trim(),
        category:   form.category,
        message:    form.message.trim(),
        status:     'pending',
      });
      if (error) throw error;

      alert('✅ Inquiry submitted successfully!');
      setForm({ subject: '', category: 'Transcript Request', message: '' });
      fetchInquiries();
    } catch (err: any) {
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryColor: Record<string, string> = {
    'Transcript Request':   'bg-blue-100 text-blue-700',
    'Certificate Request':  'bg-green-100 text-green-700',
    'Alumni Card':          'bg-purple-100 text-purple-700',
    'Event Inquiry':        'bg-orange-100 text-orange-700',
    'Other':                'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Alumni Concern</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Enter subject"
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
                <option>Transcript Request</option>
                <option>Certificate Request</option>
                <option>Alumni Card</option>
                <option>Event Inquiry</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your concern or request in detail..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Inquiries</h2>
          <button onClick={fetchInquiries} className="text-blue-600 hover:text-blue-700 text-sm">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No inquiries submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Subject</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Submitted</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Response</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900 max-w-xs">
                      <div>{item.subject}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.message}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColor[item.category] || 'bg-gray-100 text-gray-700'}`}>
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
                    <td className="py-4 px-6 text-gray-600 text-sm max-w-xs">
                      {item.response || <span className="text-gray-400">Awaiting response</span>}
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