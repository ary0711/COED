
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  X,
  RefreshCw,
  Users,
  PartyPopper,
} from 'lucide-react';

type StudentProfile = {
  student_no?: string | null;
  program?: string | null;
  department_id?: string | null;
  graduation_eligible?: boolean | null;
  graduation_status?: string | null;
  graduation_year?: number | null;
};

type Evaluation = {
  id?: string;
  student_id: string;
  standing: 'regular' | 'irregular';
  updated_at?: string;
};

type Student = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  id_number?: string | null;
  year_level?: number | string | null;
  program?: string | null;
  department?: string | null;
  status?: string | null;
  student_profiles?: StudentProfile | StudentProfile[] | null;
  evaluation?: Evaluation | null;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  studentNo: string;
  program: string;
  yearLevel: number;
  graduationEligible: boolean;
  graduationStatus: string | null;
  graduationYear: number | null;
  evaluation: Evaluation | null;
};

type Standing = 'regular' | 'irregular';
type StandingFilter = 'all' | Standing;
type EligibilityFilter = 'all' | 'eligible' | 'not_eligible';

type BatchResult = {
  succeeded: number;
  failed: number;
  message: string;
  results?: Array<{
    studentId?: string;
    name?: string;
    success: boolean;
    error?: string;
  }>;
};

const API_BASE_URL = 'https://coed.onrender.com/api';

function getStudentProfile(student: Student): StudentProfile | null {
  if (Array.isArray(student.student_profiles)) {
    return student.student_profiles[0] ?? null;
  }

  return student.student_profiles ?? null;
}

function isFourthYear(
  value: number | string | null | undefined
): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return [
    '4',
    '4th',
    'fourth',
    'fourth year',
    '4th year',
  ].includes(normalized);
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error ? error.message : fallback;
}

async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error(
      'Your session has expired. Please log in again.'
    );
  }

  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${token}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export function GraduationSection({
  departmentNames = [],
}: {
  departmentNames?: string[];
}) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [standingFilter, setStandingFilter] =
    useState<StandingFilter>('all');

  const [eligibilityFilter, setEligibilityFilter] =
    useState<EligibilityFilter>('all');

  const [selected, setSelected] =
    useState<StudentRow | null>(null);

  const [standing, setStanding] =
    useState<Standing>('regular');

  const [saving, setSaving] = useState(false);

  const [updatingEligibility, setUpdatingEligibility] =
    useState(false);

  const [batchGraduating, setBatchGraduating] =
    useState(false);

  const [actionError, setActionError] = useState('');

  const [showSuccessModal, setShowSuccessModal] =
    useState(false);

  const [showBatchConfirm, setShowBatchConfirm] =
    useState(false);

  const [batchResult, setBatchResult] =
    useState<BatchResult | null>(null);

  // Load fourth-year students from the authenticated backend.
  const loadStudents = useCallback(
    async (quiet = false) => {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response = await authenticatedFetch(
          '/students/graduation'
        );

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            body?.error ||
              `Unable to load graduation students (${response.status}).`
          );
        }

        if (!Array.isArray(body)) {
          throw new Error(
            'The graduation endpoint returned an unexpected response.'
          );
        }

        const rows: StudentRow[] = (body as Student[])
          .filter((student) => {
            if (
              student.status &&
              student.status.toLowerCase() !== 'active'
            ) {
              return false;
            }

            return isFourthYear(student.year_level);
          })
          .map((student) => {
            const profile = getStudentProfile(student);

            return {
              id: student.id,
              name: student.full_name || 'Unnamed student',
              email: student.email || '—',
              studentNo:
                profile?.student_no ||
                student.id_number ||
                '—',
              program:
                profile?.program ||
                student.program ||
                student.department ||
                'Unspecified',
              yearLevel: 4,

              // Only explicitly approved students are eligible.
              // Null is treated as Not eligible.
              graduationEligible:
                profile?.graduation_eligible === true,

              graduationStatus:
                profile?.graduation_status ?? null,

              graduationYear:
                profile?.graduation_year ?? null,

              evaluation: student.evaluation ?? null,
            };
          });

        setStudents(rows);

        setSelected((current) => {
          if (!current) return null;

          return (
            rows.find(
              (student) => student.id === current.id
            ) ?? null
          );
        });
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            'Unable to load graduation records.'
          )
        );

        if (!quiet) {
          setStudents([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  // Only eligible students with Regular standing can be graduated.
  const eligibleStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.graduationEligible === true &&
          student.graduationStatus !== 'graduated' &&
          student.evaluation?.standing !== 'irregular'
      ),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.email,
          student.studentNo,
          student.program,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStanding =
        standingFilter === 'all' ||
        student.evaluation?.standing === standingFilter;

      const matchesEligibility =
        eligibilityFilter === 'all' ||
        (
          eligibilityFilter === 'eligible' &&
          student.graduationEligible === true
        ) ||
        (
          eligibilityFilter === 'not_eligible' &&
          student.graduationEligible === false
        );

      return (
        matchesSearch &&
        matchesStanding &&
        matchesEligibility
      );
    });
  }, [
    students,
    search,
    standingFilter,
    eligibilityFilter,
  ]);

  const eligibleCount = eligibleStudents.length;

  const regularCount = students.filter(
    (student) =>
      student.evaluation?.standing === 'regular'
  ).length;

  const irregularCount = students.filter(
    (student) =>
      student.evaluation?.standing === 'irregular'
  ).length;

  const openStudent = (student: StudentRow) => {
    setSelected(student);

    setStanding(
      student.evaluation?.standing || 'regular'
    );

    setActionError('');
  };

  // Manually update eligibility.
  const updateEligibility = async (eligible: boolean) => {
    if (!selected) return;

    // Irregular students cannot be approved.
    // Save Regular standing first before manually approving them.
    if (
      eligible &&
      (
        standing === 'irregular' ||
        selected.evaluation?.standing === 'irregular'
      )
    ) {
      setActionError(
        'This student has Irregular academic standing and cannot be marked eligible. Save Regular standing first.'
      );
      return;
    }

    setUpdatingEligibility(true);
    setActionError('');

    try {
      const response = await authenticatedFetch(
        `/students/${encodeURIComponent(
          selected.id
        )}/graduation-eligibility`,
        {
          method: 'PATCH',
          body: JSON.stringify({ eligible }),
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error ||
            'Unable to update graduation eligibility.'
        );
      }

      setStudents((current) =>
        current.map((student) =>
          student.id === selected.id
            ? {
                ...student,
                graduationEligible: eligible,
              }
            : student
        )
      );

      setSelected((current) =>
        current && current.id === selected.id
          ? {
              ...current,
              graduationEligible: eligible,
            }
          : current
      );
    } catch (updateError) {
      setActionError(
        getErrorMessage(
          updateError,
          'Could not update graduation eligibility.'
        )
      );
    } finally {
      setUpdatingEligibility(false);
    }
  };

  // Save academic standing.
  // If standing is Irregular, automatically revoke eligibility first.
  const saveStanding = async () => {
    if (!selected) return;

    const studentId = selected.id;
    const selectedStanding = standing;

    let eligibilityRevoked = false;

    setSaving(true);
    setActionError('');

    try {
      // Automatically mark the student Not eligible
      // whenever the chair saves Irregular standing.
      if (selectedStanding === 'irregular') {
        const eligibilityResponse = await authenticatedFetch(
          `/students/${encodeURIComponent(
            studentId
          )}/graduation-eligibility`,
          {
            method: 'PATCH',
            body: JSON.stringify({ eligible: false }),
          }
        );

        const eligibilityBody =
          await eligibilityResponse.json().catch(() => ({}));

        if (!eligibilityResponse.ok) {
          throw new Error(
            eligibilityBody.error ||
              'Unable to automatically mark the student as not eligible.'
          );
        }

        eligibilityRevoked = true;

        // Update the local state immediately after eligibility is revoked.
        setStudents((current) =>
          current.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  graduationEligible: false,
                }
              : student
          )
        );

        setSelected((current) =>
          current && current.id === studentId
            ? {
                ...current,
                graduationEligible: false,
              }
            : current
        );
      }

      // Save Regular / Irregular standing.
      const response = await authenticatedFetch(
        `/students/${encodeURIComponent(
          studentId
        )}/graduation-evaluation`,
        {
          method: 'PUT',

          // These values maintain compatibility with the
          // older backend validator. They are not used as
          // graduation eligibility criteria.
          body: JSON.stringify({
            standing: selectedStanding,
            curriculum_complete: false,
            clearance_complete: false,
            academic_requirements_complete: false,
            notes: null,
          }),
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error ||
            'Unable to save academic standing.'
        );
      }

      const savedEvaluation: Evaluation =
        body.evaluation || {
          student_id: studentId,
          standing: selectedStanding,
          updated_at: new Date().toISOString(),
        };

      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? {
                ...student,
                evaluation: savedEvaluation,

                // Irregular always means Not eligible.
                // Saving Regular does not automatically approve.
                graduationEligible:
                  selectedStanding === 'irregular'
                    ? false
                    : student.graduationEligible,
              }
            : student
        )
      );

      setSelected(null);
      setShowSuccessModal(true);
    } catch (saveError) {
      const message = getErrorMessage(
        saveError,
        'Could not save academic standing.'
      );

      setActionError(
        eligibilityRevoked
          ? `The student is now marked Not eligible, but academic standing could not be saved. ${message}`
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  // Graduate all students currently approved and with Regular standing.
  const graduateEligibleStudents = async () => {
    if (eligibleStudents.length === 0) return;

    setBatchGraduating(true);
    setError('');

    try {
      const response = await authenticatedFetch(
        '/students/batch-graduate',
        {
          method: 'POST',
          body: JSON.stringify({
            confirm: true,
          }),
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error ||
            'Unable to graduate eligible students.'
        );
      }

      const succeeded = Number(
        body.succeeded ??
          body.results?.filter(
            (item: { success: boolean }) => item.success
          ).length ??
          0
      );

      const failed = Number(
        body.failed ??
          Math.max(0, eligibleStudents.length - succeeded)
      );

      setBatchResult({
        succeeded,
        failed,
        message:
          body.message ||
          `${succeeded} student(s) graduated successfully; ${failed} failed.`,
        results: body.results || [],
      });

      setShowBatchConfirm(false);

      await loadStudents(true);
    } catch (batchError) {
      setError(
        getErrorMessage(
          batchError,
          'Batch graduation failed.'
        )
      );

      setShowBatchConfirm(false);
    } finally {
      setBatchGraduating(false);
    }
  };

  const eligibilityLabel = (eligible: boolean) => {
    return eligible ? 'Eligible' : 'Not eligible';
  };

  const standingLabel = (student: StudentRow) => {
    if (!student.evaluation?.standing) {
      return 'Not set';
    }

    return student.evaluation.standing === 'regular'
      ? 'Regular'
      : 'Irregular';
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Graduation Monitoring
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage fourth-year students, academic standing,
            and graduation eligibility.
          </p>

          {departmentNames.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Managing: {departmentNames.join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadStudents(true)}
            disabled={refreshing || batchGraduating}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowBatchConfirm(true)}
            disabled={
              loading ||
              refreshing ||
              batchGraduating ||
              eligibleCount === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GraduationCap className="h-5 w-5" />
            Graduate Eligible ({eligibleCount})
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Fourth-year students
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? '—' : students.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Eligible to graduate
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {loading ? '—' : eligibleCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Academic standing
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {loading ? '—' : regularCount}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {loading ? '—' : `${irregularCount} irregular`}
          </p>
        </div>

      </div>

      {/* STUDENT TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="space-y-3 border-b border-gray-100 p-4 sm:p-5">

          <div className="flex flex-col gap-3 xl:flex-row">

            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, student number, email, or program"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={standingFilter}
              onChange={(event) =>
                setStandingFilter(
                  event.target.value as StandingFilter
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
              aria-label="Filter by academic standing"
            >
              <option value="all">All standings</option>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>

            <select
              value={eligibilityFilter}
              onChange={(event) =>
                setEligibilityFilter(
                  event.target.value as EligibilityFilter
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
              aria-label="Filter by graduation eligibility"
            >
              <option value="all">All eligibility statuses</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not eligible</option>
            </select>

          </div>

          <p className="text-xs text-gray-400">
            Showing {filteredStudents.length} of {students.length} fourth-year students
          </p>

        </div>

        {error && (
          <div className="m-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <GraduationCap className="mx-auto mb-2 h-9 w-9 text-gray-300" />

            {error
              ? 'Students could not be loaded. Check the error message above.'
              : 'No fourth-year students match the selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left">

              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Student
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Student No.
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Program
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Standing
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Eligibility
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50/70"
                  >

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {student.name}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {student.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {student.studentNo}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {student.program}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          student.evaluation?.standing === 'irregular'
                            ? 'bg-amber-50 text-amber-700'
                            : student.evaluation?.standing === 'regular'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {standingLabel(student)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          student.graduationEligible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {student.graduationEligible ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" />
                        )}

                        {eligibilityLabel(student.graduationEligible)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openStudent(student)}
                        className="rounded-lg bg-[#1E3A8A]/5 px-3 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
                      >
                        Review
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        )}

      </div>

      {/* STUDENT REVIEW MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-5">

          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-gray-100 p-5">

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selected.name}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {selected.studentNo} · {selected.program} · Fourth Year
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setActionError('');
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Close student review"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-6 p-5">

              {/* MANUAL ELIGIBILITY */}
              <section>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  Graduation eligibility
                </h3>

                <p className="mb-3 text-xs text-gray-500">
                  The Department Chair makes this decision manually.
                  Students with Irregular standing cannot be approved.
                </p>

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                    Current decision: {eligibilityLabel(selected.graduationEligible)}
                  </span>

                  <button
                    type="button"
                    onClick={() => void updateEligibility(true)}
                    disabled={
                      updatingEligibility ||
                      selected.graduationEligible ||
                      standing === 'irregular' ||
                      selected.evaluation?.standing === 'irregular'
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingEligibility ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    Mark eligible
                  </button>

                  <button
                    type="button"
                    onClick={() => void updateEligibility(false)}
                    disabled={
                      updatingEligibility ||
                      !selected.graduationEligible
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark not eligible
                  </button>

                </div>

                {(standing === 'irregular' ||
                  selected.evaluation?.standing === 'irregular') && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    This student has Irregular standing and cannot be
                    marked eligible. Save Regular standing first.
                  </p>
                )}

                {selected.graduationStatus === 'graduated' && (
                  <p className="mt-3 text-xs font-medium text-emerald-700">
                    This student is already recorded as graduated
                    {selected.graduationYear
                      ? ` in ${selected.graduationYear}`
                      : ''}
                    .
                  </p>
                )}

              </section>

              {/* ACADEMIC STANDING */}
              <section className="border-t border-gray-100 pt-5">

                <h3 className="mb-2 text-sm font-bold text-gray-900">
                  Academic standing
                </h3>

                <p className="mb-3 text-xs text-gray-500">
                  Select whether the student's academic standing is
                  Regular or Irregular.
                </p>

                <select
                  value={standing}
                  onChange={(event) =>
                    setStanding(event.target.value as Standing)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="regular">Regular</option>
                  <option value="irregular">Irregular</option>
                </select>

                {standing === 'irregular' && (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">
                    Saving Irregular standing will automatically mark
                    this student as Not eligible to graduate.
                  </p>
                )}

                {standing === 'regular' &&
                  selected.evaluation?.standing === 'irregular' && (
                    <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                      After saving Regular standing, you can manually
                      mark this student as eligible again.
                    </p>
                  )}

                {actionError && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      setActionError('');
                    }}
                    disabled={saving}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void saveStanding()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    Save standing
                  </button>

                </div>

              </section>

            </div>
          </div>
        </div>
      )}

      {/* SAVE SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="standing-success-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>

            <h2
              id="standing-success-title"
              className="mt-4 text-lg font-bold text-gray-900"
            >
              Successfully Saved!
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The student's academic standing has been saved successfully.
              {standing === 'irregular'
                ? ' The student is now marked Not eligible to graduate.'
                : ''}
            </p>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-5 w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
            >
              OK
            </button>

          </div>
        </div>
      )}

      {/* BATCH GRADUATION CONFIRMATION MODAL */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-graduate-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>

            <h2
              id="batch-graduate-title"
              className="mt-4 text-center text-xl font-bold text-gray-900"
            >
              Confirm Batch Graduation
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-500">
              You are about to graduate all students who have been
              manually marked as eligible and have Regular academic
              standing in your department.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-emerald-50 p-4">

              <Users className="h-6 w-6 text-emerald-700" />

              <div>
                <p className="text-2xl font-bold text-emerald-800">
                  {eligibleCount}
                </p>

                <p className="text-xs font-medium text-emerald-700">
                  Eligible students
                </p>
              </div>

            </div>

            <p className="mt-4 text-center text-xs text-red-600">
              This action will change their account roles to Alumni.
              Please review the eligible list before confirming.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">

              <button
                type="button"
                onClick={() => setShowBatchConfirm(false)}
                disabled={batchGraduating}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void graduateEligibleStudents()}
                disabled={batchGraduating || eligibleCount === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {batchGraduating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}

                {batchGraduating
                  ? 'Graduating...'
                  : 'Confirm and Graduate'}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* BATCH GRADUATION RESULT MODAL */}
      {batchResult && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-result-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <PartyPopper className="h-8 w-8 text-emerald-600" />
            </div>

            <h2
              id="batch-result-title"
              className="mt-4 text-center text-xl font-bold text-gray-900"
            >
              Batch Graduation Result
            </h2>

            <p className="mt-2 text-center text-sm text-gray-500">
              {batchResult.message}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {batchResult.succeeded}
                </p>

                <p className="text-xs text-emerald-700">
                  Successfully graduated
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {batchResult.failed}
                </p>

                <p className="text-xs text-red-700">
                  Failed
                </p>
              </div>

            </div>

            {batchResult.results?.some(
              (item) => !item.success
            ) && (
              <div className="mt-4 max-h-36 overflow-y-auto rounded-xl border border-red-100 p-3">

                <p className="mb-2 text-xs font-bold text-red-700">
                  Students not processed
                </p>

                {batchResult.results
                  .filter((item) => !item.success)
                  .map((item, index) => (
                    <p
                      key={item.studentId || index}
                      className="mb-1 text-xs text-red-600"
                    >
                      {item.name || item.studentId || 'Student'}:
                      {' '}
                      {item.error || 'Unable to graduate.'}
                    </p>
                  ))}

              </div>
            )}

            <button
              type="button"
              onClick={() => setBatchResult(null)}
              className="mt-5 w-full rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900"
            >
              Done
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default GraduationSection;
