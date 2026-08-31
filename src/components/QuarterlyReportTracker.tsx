import { FileText, AlertCircle, Clock, Mail, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  daysOverdue: number;
  lastReminder: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

const QUARTER_OPTIONS = ['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'];

export function QuarterlyReportTracker() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q1 2026');
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      // 1. All faculty profiles
      const { data: faculty, error: facultyError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'faculty');

      if (facultyError) throw facultyError;

      // 2. Department names via faculty_profiles -> departments
      const facultyIds = (faculty ?? []).map((f: Profile) => f.id);
      const { data: facultyProfiles } = await supabase
        .from('faculty_profiles')
        .select('user_id, department_id')
        .in('user_id', facultyIds);

      const deptIdByUser = new Map((facultyProfiles ?? []).map(fp => [fp.user_id, fp.department_id]));
      const deptIds = [...new Set([...deptIdByUser.values()].filter(Boolean))];

      let deptNameById = new Map<string, string>();
      if (deptIds.length > 0) {
        const { data: depts } = await supabase.from('departments').select('id, name').in('id', deptIds);
        deptNameById = new Map((depts ?? []).map(d => [d.id, d.name]));
      }

      // 3. This quarter's submitted reports
      const { data: reports } = await supabase
        .from('quarterly_reports')
        .select('faculty_id, status')
        .eq('quarter', selectedQuarter);

      const statusByFaculty = new Map((reports ?? []).map(r => [r.faculty_id, r.status]));

      // 4. This quarter's deadline
      const { data: deadline } = await supabase
        .from('report_deadlines')
        .select('due_date')
        .eq('title', `Quarterly Report – ${selectedQuarter}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setDeadlineDate(deadline?.due_date ?? null);

      // 5. Most recent reminder sent per faculty member, for this quarter
      const { data: reminders } = await supabase
        .from('notifications')
        .select('user_id, created_at')
        .eq('title', `Reminder: ${selectedQuarter} Quarterly Report`)
        .in('user_id', facultyIds)
        .order('created_at', { ascending: false });

      const lastReminderByUser = new Map<string, string>();
      (reminders ?? []).forEach(r => {
        if (!lastReminderByUser.has(r.user_id)) lastReminderByUser.set(r.user_id, r.created_at);
      });

      const formatRelative = (iso: string | undefined) => {
        if (!iso) return 'Never';
        const diffMs = Date.now() - new Date(iso).getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days <= 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 7) return `${days} days ago`;
        const weeks = Math.floor(days / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      };

      const today = new Date();
      const dueDate = deadline?.due_date ? new Date(deadline.due_date) : null;

      const pending: Teacher[] = (faculty ?? [])
        .filter((f: Profile) => statusByFaculty.get(f.id) !== 'submitted')
        .map((f: Profile) => {
          const deptId = deptIdByUser.get(f.id);
          const daysOverdue = dueDate
            ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
          return {
            id: f.id,
            name: f.full_name,
            department: deptId ? (deptNameById.get(deptId) ?? '—') : '—',
            email: f.email,
            daysOverdue,
            lastReminder: formatRelative(lastReminderByUser.get(f.id)),
          };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      setPendingTeachers(pending);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load quarterly report data.');
      setPendingTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedQuarter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendReminder = async (teacherId: string, teacherName: string) => {
    setSendingId(teacherId);
    try {
      const dueText = deadlineDate
        ? ` The deadline is ${new Date(deadlineDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        : '';
      const { error } = await supabase.from('notifications').insert({
        user_id: teacherId,
        title: `Reminder: ${selectedQuarter} Quarterly Report`,
        message: `Hi ${teacherName}, please complete and submit your ${selectedQuarter} quarterly report.${dueText}`,
        type: 'announcement',
        is_read: false,
      });
      if (error) throw error;
      await fetchData();
    } catch {
      setLoadError('Failed to send reminder. Please try again.');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendBulkReminder = async () => {
    if (pendingTeachers.length === 0) return;
    setSendingBulk(true);
    try {
      const dueText = deadlineDate
        ? ` The deadline is ${new Date(deadlineDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        : '';
      const notifications = pendingTeachers.map(t => ({
        user_id: t.id,
        title: `Reminder: ${selectedQuarter} Quarterly Report`,
        message: `Hi ${t.name}, please complete and submit your ${selectedQuarter} quarterly report.${dueText}`,
        type: 'announcement',
        is_read: false,
      }));
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      await fetchData();
    } catch {
      setLoadError('Failed to send bulk reminder. Please try again.');
    } finally {
      setSendingBulk(false);
    }
  };

  const getOverdueColor = (days: number) => {
    if (days >= 15) return 'text-red-600 bg-red-100';
    if (days >= 7) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const deadlineText = deadlineDate
    ? new Date(deadlineDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'not yet set';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Quarterly Report Tracking
            </h2>
            <p className="text-sm text-gray-600">
              Teachers pending submission: <span className="font-semibold text-red-600">{pendingTeachers.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            {QUARTER_OPTIONS.map(q => <option key={q}>{q}</option>)}
          </select>

          <button
            onClick={handleSendBulkReminder}
            disabled={sendingBulk || pendingTeachers.length === 0}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60"
          >
            {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sendingBulk ? 'Sending...' : 'Send Bulk Reminder'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {loadError}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Critical (15+ days)</p>
              <p className="text-2xl font-semibold text-red-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue >= 15).length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Warning (7-14 days)</p>
              <p className="text-2xl font-semibold text-orange-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue >= 7 && t.daysOverdue < 15).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Recent (&lt;7 days)</p>
              <p className="text-2xl font-semibold text-yellow-800 mt-1">
                {pendingTeachers.filter(t => t.daysOverdue < 7).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading faculty data...</span>
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            All faculty have submitted their {selectedQuarter} report.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teacher Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Days Overdue</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Reminder</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTeachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{teacher.name}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{teacher.department}</td>
                  <td className="py-4 px-4 text-gray-600 text-sm">{teacher.email}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOverdueColor(teacher.daysOverdue)}`}>
                      {teacher.daysOverdue} days
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">{teacher.lastReminder}</td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleSendReminder(teacher.id, teacher.name)}
                      disabled={sendingId === teacher.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {sendingId === teacher.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      {sendingId === teacher.id ? 'Sending...' : 'Remind'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          Deadline for {selectedQuarter} quarterly reports is {deadlineText}.
        </p>
      </div>
    </div>
  );
}