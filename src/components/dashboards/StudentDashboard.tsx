import { useState, useEffect } from 'react';
import {
  User,
  BookOpen,
  Award,
  FileText,
  MessageSquare,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Download,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { supabase } from '../../supabaseClient';

const studentMenuItems = [
  { icon: Bell, label: 'Dashboard', id: 'dashboard' },
  { icon: User, label: 'Faculty & Departments', id: 'faculty' },
  { icon: FileText, label: 'Evaluations & Feedback', id: 'evaluations' },
  { icon: BookOpen, label: 'Academic Resources', id: 'resources' },
  { icon: Award, label: 'Achievements & Activities', id: 'achievements' },
  { icon: MessageSquare, label: 'Inquiry / Contact', id: 'inquiry' },
];

interface StudentDashboardProps {
  onRoleChange: () => void;
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared hook: fetch logged-in student profile
// ─────────────────────────────────────────────────────────────────────────────
function useStudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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
        console.error('Error fetching student profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { profile, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    resolved:    { color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Resolved' },
    in_progress: { color: 'bg-blue-100 text-blue-700',    icon: <Clock className="w-3.5 h-3.5" />,       label: 'In Progress' },
    pending:     { color: 'bg-yellow-100 text-yellow-700',icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Pending' },
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
export function StudentDashboard({ onRoleChange, activeMenuItem, setActiveMenuItem }: StudentDashboardProps) {
  const { profile, loading } = useStudentProfile();
  const displayName = loading ? 'Loading...' : profile?.full_name || 'Student';

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <Sidebar
        menuItems={studentMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Student"
      />
      <div className="flex-1 ml-64">
        {/* No onRoleChange prop passed — switch role button is hidden by not passing it */}
        <DashboardHeader
          userRole="Student"
          userName={displayName}
          onRoleChange={onRoleChange}
          hideRoleSwitch
        />
        <main className="p-6 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'    && <StudentDashboardView profile={profile} profileLoading={loading} />}
          {activeMenuItem === 'faculty'      && <FacultyDepartments profile={profile} />}
          {activeMenuItem === 'evaluations'  && <EvaluationsFeedback profile={profile} />}
          {activeMenuItem === 'resources'    && <AcademicResources />}
          {activeMenuItem === 'achievements' && <AchievementsActivities profile={profile} />}
          {activeMenuItem === 'inquiry'      && <InquiryContact profile={profile} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboardView({ profile, profileLoading }: { profile: any; profileLoading: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {profileLoading ? '...' : profile?.full_name || 'Student'}
        </p>
      </div>

      {/* Student Info Card */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {profileLoading ? '...' : profile?.full_name || 'Student'}
            </h2>
            <p className="text-blue-100 mb-1">
              Student ID: {profileLoading ? '...' : profile?.id_number || '—'}
            </p>
            <p className="text-blue-100">
              {profileLoading ? '...' : profile?.program || profile?.department || '—'}
            </p>
            <p className="text-blue-100">
              {profileLoading ? '...' : profile?.year_level ? `${profile.year_level} Year` : '—'}
              {profile?.semester ? `, ${profile.semester}` : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">
              {profileLoading ? '...' : profile?.gpa || '—'}
            </div>
            <div className="text-blue-100">Current GPA</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">8</div>
          <div className="text-sm text-gray-600">Enrolled Subjects</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <FileText className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">5</div>
          <div className="text-sm text-gray-600">Evaluations Done</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Calendar className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Pending Evaluations</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Award className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">Dean's List</div>
          <div className="text-sm text-gray-600">Academic Standing</div>
        </div>
      </div>

      {/* Announcements & Notifications */}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="font-medium text-gray-900">Complete Faculty Evaluation</div>
              <div className="text-sm text-gray-600 mt-1">3 faculty evaluations pending — Due: Feb 20</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900">Upcoming Examinations</div>
              <div className="text-sm text-gray-600 mt-1">Midterm exams start March 1, 2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY & DEPARTMENTS
// ─────────────────────────────────────────────────────────────────────────────
function FacultyDepartments({ profile }: { profile: any }) {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.department) return;

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, role, specialization, status')
        .eq('department', profile.department)
        .in('role', ['faculty', 'department_chair'])
        .eq('status', 'active')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) console.error(error);
      else setFaculty(data || []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const chair = faculty.find((f) => f.role === 'department_chair');
  const members = faculty.filter((f) => f.role === 'faculty');

  const roleLabel: Record<string, string> = {
    faculty: 'Faculty',
    department_chair: 'Department Chair',
  };

  const roleColor: Record<string, string> = {
    faculty: 'bg-blue-100 text-blue-700',
    department_chair: 'bg-purple-100 text-purple-700',
  };

  if (!profile?.department) {
    return (
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Faculty & Departments</h1>
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          No department assigned to your profile yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Faculty & Departments</h1>

      {/* Department Info Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
        <h2 className="text-xl font-semibold mb-1">{profile.department} Department</h2>
        {chair && (
          <p className="text-blue-100 text-sm">
            Chair: {chair.full_name} &nbsp;•&nbsp; {chair.email}
          </p>
        )}
        <p className="text-blue-100 text-sm mt-1">
          {faculty.length} faculty member{faculty.length !== 1 ? 's' : ''} in your department
        </p>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Faculty Members</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading faculty...</div>
        ) : faculty.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No faculty found in the {profile.department} department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Specialization</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Email</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{f.full_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColor[f.role] || 'bg-gray-100 text-gray-700'}`}>
                        {roleLabel[f.role] || f.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {f.specialization || '—'}
                    </td>
                    <td className="py-4 px-6 text-blue-600 text-sm">
                      {f.email}
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
// EVALUATIONS & FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────
function EvaluationsFeedback({ profile }: { profile: any }) {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  const criteria = [
    'Teaching Effectiveness',
    'Course Content',
    'Communication Skills',
    'Student Engagement',
    'Punctuality & Attendance',
  ];

  useEffect(() => {
    if (!profile?.department) return;
    const fetch = async () => {
      setLoading(true);

      // Faculty in same department
      const { data: fData } = await supabase
        .from('profiles')
        .select('id, full_name, department, role')
        .eq('department', profile.department)
        .in('role', ['faculty', 'department_chair'])
        .eq('status', 'active');

      // Evaluations already submitted by this student
      const { data: eData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('evaluator_id', profile.id);

      setFacultyList(fData || []);
      setEvaluations(eData || []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const submittedIds = new Set(evaluations.map((e) => e.evaluatee_id));

  const pending = facultyList.filter((f) => !submittedIds.has(f.id));
  const completed = facultyList.filter((f) => submittedIds.has(f.id));

  const openModal = (faculty: any) => {
    setSelectedFaculty(faculty);
    const init: Record<string, number> = {};
    criteria.forEach((c) => { init[c] = 5; });
    setScores(init);
    setShowModal(true);
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedFaculty) return;
    setSubmitting(true);

    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / criteria.length;

    try {
      const { error } = await supabase.from('evaluations').insert({
        evaluator_id: profile.id,
        evaluatee_id: selectedFaculty.id,
        evaluation_type: 'faculty',
        score: parseFloat(avg.toFixed(2)),
        status: 'submitted',
        responses: scores,
      });
      if (error) throw error;

      alert(`✅ Evaluation for ${selectedFaculty.full_name} submitted!`);
      setShowModal(false);

      // Refresh evaluations
      const { data } = await supabase
        .from('evaluations')
        .select('*')
        .eq('evaluator_id', profile.id);
      setEvaluations(data || []);
    } catch (err: any) {
      alert('Failed to submit evaluation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile?.department) {
    return (
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluations & Feedback</h1>
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          No department assigned to your profile yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluations & Feedback</h1>

      {/* Pending */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Faculty Evaluations
          {pending.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
              {pending.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="py-8 text-center text-green-600 font-medium">
            ✅ All evaluations completed!
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((faculty) => (
              <div key={faculty.id} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{faculty.full_name}</div>
                    <div className="text-sm text-gray-600">{faculty.department}</div>
                  </div>
                  <button
                    onClick={() => openModal(faculty)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Evaluate Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Evaluations</h2>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : completed.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No completed evaluations yet.</div>
        ) : (
          <div className="space-y-3">
            {completed.map((faculty) => {
              const eval_ = evaluations.find((e) => e.evaluatee_id === faculty.id);
              return (
                <div key={faculty.id} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{faculty.full_name}</div>
                      <div className="text-sm text-gray-600">{faculty.department}</div>
                      {eval_ && (
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {eval_.score}/5.0 &nbsp;•&nbsp;
                          Submitted: {new Date(eval_.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Submitted
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {showModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Faculty Evaluation</h2>
              <p className="text-gray-600 text-sm mb-6">
                Evaluating: <span className="font-semibold">{selectedFaculty.full_name}</span>
              </p>

              <form onSubmit={handleSubmitEvaluation} className="space-y-5">
                {criteria.map((criterion) => (
                  <div key={criterion}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">{criterion}</label>
                      <span className="text-sm font-bold text-blue-600">{scores[criterion]}/5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={scores[criterion]}
                      onChange={(e) => setScores({ ...scores, [criterion]: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Poor (1)</span><span>Excellent (5)</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="font-medium text-gray-700">Average Score</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {(Object.values(scores).reduce((a, b) => a + b, 0) / criteria.length).toFixed(2)}/5.0
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit Evaluation'}
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

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC RESOURCES
// ─────────────────────────────────────────────────────────────────────────────
function AcademicResources() {
  const resources = [
    { title: 'Academic Calendar 2025-2026', type: 'PDF', size: '2.5 MB' },
    { title: 'Student Handbook', type: 'PDF', size: '5.8 MB' },
    { title: 'Code of Conduct', type: 'PDF', size: '1.2 MB' },
    { title: 'Registration Forms', type: 'PDF', size: '890 KB' },
    { title: 'Scholarship Application Form', type: 'PDF', size: '1.5 MB' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Resources</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Calendar</h2>
        <div className="p-6 bg-blue-50 rounded-lg">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Second Semester', value: 'January 6 - May 15, 2026' },
              { label: 'Midterm Examinations', value: 'March 1-7, 2026' },
              { label: 'Final Examinations', value: 'May 8-14, 2026' },
              { label: 'Summer Term', value: 'June 1 - July 31, 2026' },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className="font-medium text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Downloadable Resources</h2>
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{resource.title}</div>
                    <div className="text-sm text-gray-600">{resource.type} • {resource.size}</div>
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
// ACHIEVEMENTS & ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
function AchievementsActivities({ profile }: { profile: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Get events posted by dean or department_chair
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['dean', 'department_chair']);

      const adminIds = adminProfiles?.map((p) => p.id) || [];

      if (adminIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) console.error(error);
      else setEvents(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const eventTypeColor: Record<string, string> = {
    activity:  'bg-green-100 text-green-700',
    meeting:   'bg-blue-100 text-blue-700',
    exam:      'bg-red-100 text-red-700',
    deadline:  'bg-orange-100 text-orange-700',
    holiday:   'bg-purple-100 text-purple-700',
  };

  const collegePlacements = [
    { title: "Dean's List Recognition", date: 'First Semester 2025-2026', category: 'Academic' },
    { title: 'Math Quiz Bowl Champion', date: 'January 2026', category: 'Competition' },
    { title: 'Research Presentation Award', date: 'December 2025', category: 'Research' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Achievements & Activities</h1>

      {/* College Achievements */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Achievements</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {collegePlacements.map((achievement, index) => (
            <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.date}</div>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {achievement.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events from Dean / Department Chair */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming College Activities</h2>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No upcoming activities posted yet.</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}`}
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-500 mt-1">📍 {event.location}</div>
                      )}
                      {event.description && (
                        <div className="text-sm text-gray-600 mt-2">{event.description}</div>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize ${eventTypeColor[event.event_type] || 'bg-gray-100 text-gray-700'}`}>
                    {event.event_type}
                  </span>
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
// INQUIRY / CONTACT
// ─────────────────────────────────────────────────────────────────────────────
function InquiryContact({ profile }: { profile: any }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    category: 'Academic Concern',
    message: '',
  });

  const fetchInquiries = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('student_id', profile.id)
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
        subject: form.subject.trim(),
        category: form.category,
        message: form.message.trim(),
        status: 'pending',
      });
      if (error) throw error;

      alert('✅ Inquiry submitted successfully!');
      setForm({ subject: '', category: 'Academic Concern', message: '' });
      fetchInquiries();
    } catch (err: any) {
      alert('Failed to submit inquiry: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryColor: Record<string, string> = {
    'Academic Concern':   'bg-blue-100 text-blue-700',
    'Registration Issue': 'bg-orange-100 text-orange-700',
    'Faculty Inquiry':    'bg-purple-100 text-purple-700',
    'Facility Concern':   'bg-yellow-100 text-yellow-700',
    'Other':              'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      {/* Submit Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit a Concern or Question</h2>
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
                <option>Academic Concern</option>
                <option>Registration Issue</option>
                <option>Faculty Inquiry</option>
                <option>Facility Concern</option>
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
              placeholder="Describe your concern or question in detail..."
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
          <button
            onClick={fetchInquiries}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
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