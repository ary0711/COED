import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock3, Download, Eye, FileText, GraduationCap,
  Loader2, Search, Upload, X, RefreshCw, UserRound, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';

type Student = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  id_number?: string | null;
  program?: string | null;
  department?: string | null;
  status?: string | null;
  student_profiles?: {
    student_no?: string | null;
    program?: string | null;
    year_level?: number | string | null;
    department?: string | null;
  } | Array<{
    student_no?: string | null;
    program?: string | null;
    year_level?: number | string | null;
    department?: string | null;
  }> | null;
};

type Evaluation = {
  id: string;
  student_id: string;
  standing: 'regular' | 'irregular';
  curriculum_complete: boolean;
  clearance_complete: boolean;
  academic_requirements_complete: boolean;
  notes: string | null;
  updated_at: string;
};

type GraduationDocument = {
  id: string;
  student_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  studentNo: string;
  program: string;
  yearLevel: number;
  evaluation?: Evaluation;
  documents: GraduationDocument[];
};

const BUCKET = 'graduation-documents';
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

function getStudentProfile(student: Student) {
  return Array.isArray(student.student_profiles)
    ? student.student_profiles[0]
    : student.student_profiles;
}

function matchesDepartment(program: string, departments: string[]) {
  if (!departments.length) return true;
  const p = (program || '').trim().toLowerCase();
  if (!p) return false;
  return departments.some((value) => {
    const d = value.trim().toLowerCase();
    return p === d || p.includes(d) || d.includes(p);
  });
}

function getExtension(name: string) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return 'Unknown size';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function GraduationSection({ departmentNames = [] }: { departmentNames?: string[] }) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [form, setForm] = useState({
    standing: 'regular' as 'regular' | 'irregular',
    curriculum_complete: false,
    clearance_complete: false,
    academic_requirements_complete: false,
    notes: '',
  });

  const loadStudents = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/accounts/student', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Unable to load students (${response.status})`);
      }

      const rawStudents: Student[] = await response.json();
      const fourthYear = (rawStudents || []).filter((student) => {
        if (student.status && student.status !== 'active') return false;
        const profile = getStudentProfile(student);
        const year = Number(profile?.year_level);
        const program = profile?.program || profile?.department || student.program || student.department || '';
        return year === 4 && matchesDepartment(program, departmentNames);
      });

      const ids = fourthYear.map((student) => student.id);
      let evaluations: Evaluation[] = [];
      let documents: GraduationDocument[] = [];

      if (ids.length) {
        const [evaluationResult, documentResult] = await Promise.all([
          supabase.from('graduation_evaluations').select('*').in('student_id', ids),
          supabase.from('graduation_documents').select('*').in('student_id', ids).order('created_at', { ascending: false }),
        ]);
        if (evaluationResult.error) throw evaluationResult.error;
        if (documentResult.error) throw documentResult.error;
        evaluations = evaluationResult.data || [];
        documents = documentResult.data || [];
      }

      const rows: StudentRow[] = fourthYear.map((student) => {
        const profile = getStudentProfile(student);
        const program = profile?.program || profile?.department || student.program || student.department || 'Unspecified';
        return {
          id: student.id,
          name: student.full_name || 'Unnamed student',
          email: student.email || '—',
          studentNo: profile?.student_no || student.id_number || '—',
          program,
          yearLevel: Number(profile?.year_level) || 4,
          evaluation: evaluations.find((item) => item.student_id === student.id),
          documents: documents.filter((item) => item.student_id === student.id),
        };
      });
      setStudents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load graduation records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentNames]);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const programs = useMemo(
    () => Array.from(new Set(students.map((student) => student.program))).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      const eligible = Boolean(
        student.evaluation?.curriculum_complete &&
        student.evaluation?.clearance_complete &&
        student.evaluation?.academic_requirements_complete
      );
      const matchesQuery = !q || [
        student.name, student.email, student.studentNo, student.program,
      ].some((value) => value.toLowerCase().includes(q));
      const matchesProgram = programFilter === 'all' || student.program === programFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'eligible' && eligible) ||
        (statusFilter === 'not_eligible' && !eligible);
      return matchesQuery && matchesProgram && matchesStatus;
    });
  }, [students, search, programFilter, statusFilter]);

  const eligibleCount = students.filter((student) =>
    student.evaluation?.curriculum_complete &&
    student.evaluation?.clearance_complete &&
    student.evaluation?.academic_requirements_complete
  ).length;
  const irregularCount = students.filter((student) => student.evaluation?.standing === 'irregular').length;

  const openStudent = (student: StudentRow) => {
    setSelected(student);
    setForm({
      standing: student.evaluation?.standing || 'regular',
      curriculum_complete: student.evaluation?.curriculum_complete || false,
      clearance_complete: student.evaluation?.clearance_complete || false,
      academic_requirements_complete: student.evaluation?.academic_requirements_complete || false,
      notes: student.evaluation?.notes || '',
    });
    setMessage('');
  };

  const saveEvaluation = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    const payload = {
      student_id: selected.id,
      ...form,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    try {
      const { error: saveError } = await supabase
        .from('graduation_evaluations')
        .upsert(payload, { onConflict: 'student_id' });
      if (saveError) throw saveError;
      setMessage('Graduation evaluation saved.');
      await loadStudents(true);
      const refreshed = students.find((student) => student.id === selected.id);
      if (refreshed) setSelected({ ...refreshed, evaluation: { ...payload, id: refreshed.evaluation?.id || '', student_id: selected.id } as Evaluation });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save the evaluation.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (file?: File) => {
    if (!selected || !file) return;
    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setMessage('Unsupported file. Upload PDF, image, Word, Excel, or CSV files.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage('File is too large. Maximum size is 15 MB.');
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${selected.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (uploadError) throw uploadError;

      const { error: metadataError } = await supabase.from('graduation_documents').insert({
        student_id: selected.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type || null,
        file_size: file.size,
      });
      if (metadataError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw metadataError;
      }
      setMessage('File uploaded successfully.');
      await loadStudents(true);
      const { data: latest } = await supabase.from('graduation_documents')
        .select('*').eq('student_id', selected.id).order('created_at', { ascending: false });
      setSelected({ ...selected, documents: latest || [] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (doc: GraduationDocument) => {
    setMessage('');
    const { data, error: urlError } = await supabase.storage
      .from(BUCKET).createSignedUrl(doc.storage_path, 60 * 10);
    if (urlError || !data?.signedUrl) {
      setMessage(urlError?.message || 'Unable to open this file.');
      return;
    }
    setPreviewName(doc.file_name);
    setPreviewUrl(data.signedUrl);
  };

  const isEligible = (student: StudentRow) => Boolean(
    student.evaluation?.curriculum_complete &&
    student.evaluation?.clearance_complete &&
    student.evaluation?.academic_requirements_complete
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Graduation Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review fourth-year students, academic standing, graduation requirements, and supporting documents.
          </p>
          {departmentNames.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">Managing: {departmentNames.join(', ')}</p>
          )}
        </div>
        <button onClick={() => void loadStudents(true)} disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Fourth-year students</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{loading ? '—' : students.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Marked eligible</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{loading ? '—' : eligibleCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Irregular standing</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{loading ? '—' : irregularCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, student number, email, or program"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
              <option value="all">All programs</option>
              {programs.map((program) => <option key={program} value={program}>{program}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
              <option value="all">All eligibility statuses</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not yet eligible</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">Showing {filteredStudents.length} of {students.length} fourth-year students</p>
        </div>

        {error && <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {loading ? (
          <div className="py-16 flex justify-center text-gray-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400"><GraduationCap className="h-9 w-9 mx-auto mb-2 text-gray-300" />No fourth-year students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Student No.</th>
                  <th className="px-5 py-3 font-semibold">Program</th>
                  <th className="px-5 py-3 font-semibold">Standing</th>
                  <th className="px-5 py-3 font-semibold">Graduation status</th>
                  <th className="px-5 py-3 font-semibold">Files</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{student.studentNo}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{student.program}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.evaluation?.standing === 'irregular' ? 'bg-amber-50 text-amber-700' : student.evaluation ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {student.evaluation?.standing ? student.evaluation.standing[0].toUpperCase() + student.evaluation.standing.slice(1) : 'Not assessed'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isEligible(student) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {isEligible(student) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        {isEligible(student) ? 'Eligible' : 'Not yet eligible'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{student.documents.length}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => openStudent(student)} className="rounded-lg bg-[#1E3A8A]/5 px-3 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-1">{selected.studentNo} · {selected.program}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-6">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900"><ShieldCheck className="h-4 w-4 text-blue-700" />Academic evaluation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-xs font-semibold text-gray-600">Academic standing
                    <select value={form.standing} onChange={(e) => setForm({ ...form, standing: e.target.value as 'regular' | 'irregular' })}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal">
                      <option value="regular">Regular</option><option value="irregular">Irregular</option>
                    </select>
                  </label>
                  <div className="rounded-xl border border-gray-200 p-3 text-xs text-gray-500">
                    Eligibility is calculated from the three checklist items below. Confirm each item against your institution's official graduation policy before marking it complete.
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['curriculum_complete', 'Curriculum / required subjects completed'],
                    ['clearance_complete', 'All required clearances completed'],
                    ['academic_requirements_complete', 'Other academic and program requirements completed'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm text-gray-700">
                      <input type="checkbox" checked={Boolean(form[key as keyof typeof form])}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4 accent-[#1E3A8A]" />
                      {label}
                    </label>
                  ))}
                </div>
                <label className="mt-4 block text-xs font-semibold text-gray-600">Remarks
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Add deficiencies, follow-ups, or evaluation notes..."
                    className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <button onClick={() => void saveEvaluation()} disabled={saving}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save evaluation
                </button>
              </section>

              <section className="border-t border-gray-100 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900"><FileText className="h-4 w-4 text-blue-700" />Supporting documents</h3>
                    <p className="mt-1 text-xs text-gray-500">Upload and open this student's graduation documents.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload file
                    <input type="file" className="hidden" disabled={uploading}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                      onChange={(e) => { const file = e.target.files?.[0]; void uploadDocument(file); e.currentTarget.value = ''; }} />
                  </label>
                </div>
                <div className="mt-3 space-y-2">
                  {selected.documents.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-400">No documents uploaded yet.</p>
                  ) : selected.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{doc.file_name}</p>
                        <p className="text-xs text-gray-400">{formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => void openDocument(doc)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </div>
                  ))}
                </div>
              </section>
              {message && <p className={`rounded-xl p-3 text-sm ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable') || message.toLowerCase().includes('unsupported') || message.toLowerCase().includes('large') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{message}</p>}
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 sm:p-6">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
              <p className="truncate text-sm font-semibold text-gray-800">{previewName}</p>
              <div className="flex items-center gap-2">
                <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"><Download className="h-3.5 w-3.5" /> Open / download</a>
                <button onClick={() => { setPreviewUrl(''); setPreviewName(''); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {previewName.toLowerCase().endsWith('.pdf') || /\.(png|jpe?g)$/i.test(previewName) ? (
              <iframe title={previewName} src={previewUrl} className="h-full w-full bg-gray-100" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-700">This file type may not preview in the browser.</p>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white">Open file</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraduationSection;
