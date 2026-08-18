import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Send, Printer, X, ChevronDown, ChevronUp, Upload, ImageIcon, Loader2 } from 'lucide-react';

interface AccomplishmentReportProps {
  userId: string;
  userName: string;
  readOnly?: boolean;
}

interface GenericRow { [key: string]: string; }

interface PhotoItem {
  path: string;
  url: string;
  caption: string;
}

interface DocEntry {
  id: string;
  category: string;
  title: string;
  venue: string;
  date: string;
  description: string;
  photos: PhotoItem[];
}

const MAX_PHOTOS_PER_ENTRY = 8;

// All reads/writes go through the Express API (JWT-authenticated),
// not straight to Supabase — mirrors the calendar_events/announcements
// setup. Photo uploads/deletes are also routed through here now instead
// of hitting Supabase Storage directly from the browser.
const REPORTS_API_URL = 'http://localhost:5000/api/accomplishment-reports';

function getToken() {
  return localStorage.getItem('token');
}

const DOC_CATEGORIES = [
  { key: 'instruction', label: 'A. Instruction-Related Engagements' },
  { key: 'research', label: 'B. Research' },
  { key: 'research_utilization', label: 'C. Research Utilization' },
  { key: 'extension', label: 'D. Extension' },
  { key: 'other', label: 'E. Other Engagements' },
];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 bg-[#1E3A8A] text-white font-semibold text-sm hover:bg-[#1E40AF] transition-colors">
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function EditableTable({ columns, rows, onChange, readOnly }: { columns: { key: string; label: string; width?: string }[]; rows: GenericRow[]; onChange: (rows: GenericRow[]) => void; readOnly?: boolean; }) {
  const emptyRow = () => columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
  const updateCell = (rowIdx: number, key: string, value: string) => onChange(rows.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
  const addRow = () => onChange([...rows, emptyRow()]);
  const deleteRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map(col => <th key={col.key} className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700" style={{ minWidth: col.width || '120px' }}>{col.label}</th>)}
            {!readOnly && <th className="border border-gray-300 px-2 py-2 w-8" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map(col => (
                <td key={col.key} className="border border-gray-300 px-1 py-1">
                  <textarea value={row[col.key] ?? ''} onChange={e => updateCell(idx, col.key, e.target.value)} disabled={readOnly} rows={2}
                    className="w-full px-1.5 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded resize-none disabled:bg-transparent"
                    style={{ minWidth: col.width || '120px' }} />
                </td>
              ))}
              {!readOnly && <td className="border border-gray-300 px-1 py-1 text-center"><button onClick={() => deleteRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && <button onClick={addRow} className="mt-2 flex items-center gap-1 text-xs text-[#1E3A8A] hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors font-medium"><Plus className="w-3.5 h-3.5" /> Add Row</button>}
    </div>
  );
}

export function AccomplishmentReport({ userId, userName, readOnly = false }: AccomplishmentReportProps) {
  const [quarter, setQuarter] = useState('1st');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [programChair, setProgramChair] = useState(userName);
  const [program, setProgram] = useState('');
  const [otherAccomplishments, setOtherAccomplishments] = useState('');
  const [dateSubmitted, setDateSubmitted] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [draftStatus, setDraftStatus] = useState<'loading' | 'loaded' | 'none' | 'error'>('loading');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // ── Documentation (categorized activity entries with photos) ──
  const [docEntries, setDocEntries] = useState<DocEntry[]>([]);
  const [uploadingEntryId, setUploadingEntryId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

  const emptyRow = (keys: string[]) => keys.reduce((acc, k) => ({ ...acc, [k]: '' }), {});

  const [pi1, setPi1] = useState<GenericRow[]>([emptyRow(['date_exam','no_first_time','no_passers','passing_pct_first','total_takers','total_passers','overall_pct'])]);
  const [pi2, setPi2] = useState<GenericRow[]>([emptyRow(['no_graduates','no_employed','percentage'])]);
  const [pi3, setPi3] = useState<GenericRow[]>([emptyRow(['class_section','no_enrolled','name_adviser'])]);
  const [pi4, setPi4] = useState<GenericRow[]>([emptyRow(['name_faculty','courses_taught','status_syllabus','remarks'])]);
  const [pi5, setPi5] = useState<GenericRow[]>([emptyRow(['name_faculty','nature_cert','granting_agency','date_granted'])]);
  const [pi6, setPi6] = useState<GenericRow[]>([emptyRow(['name_faculty','program_enrolled','total_units','units_this_sem','institution'])]);
  const [pi7, setPi7] = useState<GenericRow[]>([emptyRow(['name_faculty','title_training','date','venue','sponsoring_agency','role'])]);
  const [pi8, setPi8] = useState<GenericRow[]>([emptyRow(['name_faculty','title_im','type_im','courses_utilizing','ip_protection'])]);
  const [mfo3pi1, setMfo3pi1] = useState<GenericRow[]>([emptyRow(['title_research','proponents','nature_utilization','partner_community','address'])]);
  const [mfo3pi2, setMfo3pi2] = useState<GenericRow[]>([emptyRow(['title_research','proponents','date_completed','funding_source'])]);
  const [mfo3pi3, setMfo3pi3] = useState<GenericRow[]>([emptyRow(['title_research','proponents','name_publication','date_published','funding_source'])]);
  const [mfo3pi4, setMfo3pi4] = useState<GenericRow[]>([emptyRow(['title_research','proponents','date','sponsoring_agency','venue'])]);
  const [mfo4pi1, setMfo4pi1] = useState<GenericRow[]>([emptyRow(['title_project','proponents','partner','project_locale'])]);
  const [mfo4pi2, setMfo4pi2] = useState<GenericRow[]>([emptyRow(['title_training','no_beneficiaries','length_training','total_manhours','partner_agency'])]);
  const [otherInitiatives, setOtherInitiatives] = useState<GenericRow[]>([emptyRow(['title_activity','date_conducted','venue','sponsoring_agency','students_involved','role_students','faculty_involved','role_faculty'])]);
  const [awards, setAwards] = useState<GenericRow[]>([emptyRow(['title_award','nature_award','granting_agency','date_awarding'])]);

  const computeProgress = () => {
    const allRows = [pi1,pi2,pi3,pi4,pi5,pi6,pi7,pi8,mfo3pi1,mfo3pi2,mfo3pi3,mfo3pi4,mfo4pi1,mfo4pi2,otherInitiatives,awards];
    const totalCells = allRows.reduce((acc, rows) => acc + rows.length * Object.keys(rows[0] || {}).length, 0);
    const filledCells = allRows.reduce((acc, rows) => acc + rows.reduce((a, row) => a + Object.values(row).filter(v => v.trim() !== '').length, 0), 0);
    const textFields = [program, otherAccomplishments, dateSubmitted].filter(v => v.trim() !== '').length;
    return Math.round(((filledCells + textFields) / (totalCells + 3)) * 100);
  };

  const progress = computeProgress();

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${REPORTS_API_URL}/my-draft`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) { setDraftStatus('error'); return; }
        const data = await res.json();
        if (data) {
          setReportId(data.id); setQuarter(data.quarter); setYear(data.year);
          setProgramChair(data.program_chair ?? userName); setProgram(data.program ?? '');
          setOtherAccomplishments(data.other_accomplishments ?? ''); setDateSubmitted(data.date_submitted ?? '');
          setStatus(data.status);
          if (data.pi1_data?.length) setPi1(data.pi1_data);
          if (data.pi2_data?.length) setPi2(data.pi2_data);
          if (data.pi3_data?.length) setPi3(data.pi3_data);
          if (data.pi4_data?.length) setPi4(data.pi4_data);
          if (data.pi5_data?.length) setPi5(data.pi5_data);
          if (data.pi6_data?.length) setPi6(data.pi6_data);
          if (data.pi7_data?.length) setPi7(data.pi7_data);
          if (data.pi8_data?.length) setPi8(data.pi8_data);
          if (data.mfo3_pi1_data?.length) setMfo3pi1(data.mfo3_pi1_data);
          if (data.mfo3_pi2_data?.length) setMfo3pi2(data.mfo3_pi2_data);
          if (data.mfo3_pi3_data?.length) setMfo3pi3(data.mfo3_pi3_data);
          if (data.mfo3_pi4_data?.length) setMfo3pi4(data.mfo3_pi4_data);
          if (data.mfo4_pi1_data?.length) setMfo4pi1(data.mfo4_pi1_data);
          if (data.mfo4_pi2_data?.length) setMfo4pi2(data.mfo4_pi2_data);
          if (data.other_data?.length) setOtherInitiatives(data.other_data);
          if (data.awards_data?.length) setAwards(data.awards_data);
          if (data.doc_entries_data?.length) setDocEntries(data.doc_entries_data);
          setLastSavedAt(data.updated_at ?? data.created_at ?? null);
          setDraftStatus('loaded');
        } else {
          setDraftStatus('none');
        }
      } catch {
        setDraftStatus('error');
      }
    };
    load();
  }, [userId]);

  // ── Documentation entry handlers ──
  const addDocEntry = (category: string) => {
    setDocEntries(prev => [...prev, { id: makeId(), category, title: '', venue: '', date: '', description: '', photos: [] }]);
  };

  const deletePhotosOnServer = async (paths: string[]) => {
    if (paths.length === 0) return;
    try {
      await fetch(`${REPORTS_API_URL}/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ paths }),
      });
    } catch {
      // best-effort cleanup — same as the previous fire-and-forget behavior
    }
  };

  const removeDocEntry = async (id: string) => {
    const entry = docEntries.find(e => e.id === id);
    setDocEntries(prev => prev.filter(e => e.id !== id));
    if (entry?.photos?.length) {
      await deletePhotosOnServer(entry.photos.map(p => p.path));
    }
  };

  const updateDocEntryField = (id: string, field: keyof DocEntry, value: string) => {
    setDocEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleEntryFilesSelected = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const entry = docEntries.find(en => en.id === entryId);
    const currentCount = entry?.photos.length ?? 0;
    const remainingSlots = MAX_PHOTOS_PER_ENTRY - currentCount;
    if (remainingSlots <= 0) {
      showError(`Maximum of ${MAX_PHOTOS_PER_ENTRY} photos per activity reached.`);
      if (fileInputRefs.current[entryId]) fileInputRefs.current[entryId]!.value = '';
      return;
    }

    const filesToUpload = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showError(`Only ${remainingSlots} more photo(s) allowed for this activity (max ${MAX_PHOTOS_PER_ENTRY}).`);
    }

    if (filesToUpload.length === 0) {
      if (fileInputRefs.current[entryId]) fileInputRefs.current[entryId]!.value = '';
      return;
    }

    setUploadingEntryId(entryId);
    try {
      const formData = new FormData();
      formData.append('entryId', entryId);
      filesToUpload.forEach(file => formData.append('files', file));

      const res = await fetch(`${REPORTS_API_URL}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError('Failed to upload photo(s): ' + (err.error || res.statusText));
        return;
      }

      const uploaded: { path: string; url: string }[] = await res.json();
      if (uploaded.length > 0) {
        setDocEntries(prev => prev.map(en => en.id === entryId
          ? { ...en, photos: [...en.photos, ...uploaded.map(u => ({ ...u, caption: '' }))] }
          : en));
        showSuccess(`${uploaded.length} photo(s) added.`);
      }
    } catch {
      showError('Could not reach the server. Please try again.');
    } finally {
      setUploadingEntryId(null);
      if (fileInputRefs.current[entryId]) fileInputRefs.current[entryId]!.value = '';
    }
  };

  const removeEntryPhoto = async (entryId: string, photoIdx: number) => {
    const entry = docEntries.find(e => e.id === entryId);
    const photo = entry?.photos[photoIdx];
    setDocEntries(prev => prev.map(en => en.id === entryId ? { ...en, photos: en.photos.filter((_, i) => i !== photoIdx) } : en));
    if (photo?.path) {
      await deletePhotosOnServer([photo.path]);
    }
  };

  const updateEntryPhotoCaption = (entryId: string, photoIdx: number, caption: string) => {
    setDocEntries(prev => prev.map(en => en.id === entryId ? { ...en, photos: en.photos.map((p, i) => i === photoIdx ? { ...p, caption } : p) } : en));
  };

  const getPayload = (submitStatus: string) => ({
    quarter, year, program_chair: programChair, program,
    pi1_data: pi1, pi2_data: pi2, pi3_data: pi3, pi4_data: pi4,
    pi5_data: pi5, pi6_data: pi6, pi7_data: pi7, pi8_data: pi8,
    mfo3_pi1_data: mfo3pi1, mfo3_pi2_data: mfo3pi2, mfo3_pi3_data: mfo3pi3, mfo3_pi4_data: mfo3pi4,
    mfo4_pi1_data: mfo4pi1, mfo4_pi2_data: mfo4pi2, other_data: otherInitiatives, awards_data: awards,
    doc_entries_data: docEntries,
    other_accomplishments: otherAccomplishments, date_submitted: dateSubmitted,
    status: submitStatus, progress: computeProgress(),
  });

  const persist = async (payload: Record<string, unknown>) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    };

    if (reportId) {
      const res = await fetch(`${REPORTS_API_URL}/${reportId}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }

    const res = await fetch(REPORTS_API_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const data = await persist(getPayload('draft'));
      if (!reportId && data?.id) setReportId(data.id);
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      setDraftStatus('loaded');
      showSuccess('Draft saved!');
    } catch (err: any) {
      showError('Failed to save draft: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async () => {
    setSaving(true);
    try {
      const data = await persist(getPayload('submitted'));
      if (!reportId && data?.id) setReportId(data.id);
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      setDraftStatus('loaded');
      setStatus('submitted');
      showSuccess('Report submitted to Dean!');
    } catch (err: any) {
      showError('Failed to submit report: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const formatSavedAt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // ── Reusable print table ──
  const PrintTable = ({ label, rows, cols, headers }: { label: string; rows: GenericRow[]; cols: string[]; headers: string[] }) => (
    <div className="mb-4">
      <p className="font-semibold mb-1">{label}</p>
      <table className="w-full border-collapse border border-black text-xs mb-2">
        <thead><tr>{headers.map(h => <th key={h} className="border border-black px-2 py-1 text-left font-bold bg-gray-100">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{cols.map(col => <td key={col} className="border border-black px-2 py-3 align-top">{row[col]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{errorMsg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accomplishment Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">For the Program Chairperson · SY {year}</p>
          <p className="text-xs mt-1">
            {draftStatus === 'loading' && <span className="text-gray-400">Checking for a saved draft…</span>}
            {draftStatus === 'loaded' && lastSavedAt && (
              <span className="text-gray-500">Continuing your saved draft — last saved {formatSavedAt(lastSavedAt)}</span>
            )}
            {draftStatus === 'none' && <span className="text-gray-500">No draft yet — this is a new report.</span>}
            {draftStatus === 'error' && <span className="text-red-500">Couldn't load your saved draft — please refresh or contact support.</span>}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"><Printer className="w-4 h-4" /> Print</button>
            <button onClick={saveDraft} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button onClick={submitReport} disabled={saving || status === 'submitted'} className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-50"><Send className="w-4 h-4" /> {status === 'submitted' ? 'Submitted ✓' : 'Submit to Dean'}</button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm font-bold text-[#1E3A8A]">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-[#1E3A8A] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {status === 'submitted' && <p className="text-xs text-green-600 font-medium mt-2">✓ Submitted to Dean</p>}
      </div>

      {/* Report Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quarter</label>
            <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
            <input type="text" value={year} onChange={e => setYear(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Program Chairperson</label>
            <input type="text" value={programChair} onChange={e => setProgramChair(e.target.value)} disabled={readOnly || status === 'submitted'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Program</label>
            <input type="text" value={program} onChange={e => setProgram(e.target.value)} disabled={readOnly || status === 'submitted'} placeholder="e.g. BEED" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* MFO 1 */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 1: Higher Education Services</div>
      <Section title="PI 1: Percentage of first-time licensure exam-takers that pass the licensure exams">
        <EditableTable columns={[{key:'date_exam',label:'Date of LET Examination'},{key:'no_first_time',label:'No. of First-time Takers'},{key:'no_passers',label:'No. of Passers'},{key:'passing_pct_first',label:'Passing % for First-time Takers'},{key:'total_takers',label:'Total No. of Takers'},{key:'total_passers',label:'Total No. of Passers'},{key:'overall_pct',label:'Over-all Passing %'}]} rows={pi1} onChange={setPi1} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 2: Updated % of graduates (2 years prior) that are employed">
        <EditableTable columns={[{key:'no_graduates',label:'No. of Graduates'},{key:'no_employed',label:'No. of Graduates Employed'},{key:'percentage',label:'Percentage'}]} rows={pi2} onChange={setPi2} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 3: % of undergraduate students enrolled in CHED-identified and RDC-identified priority programs">
        <EditableTable columns={[{key:'class_section',label:'Class Section'},{key:'no_enrolled',label:'No. of Students Enrolled'},{key:'name_adviser',label:'Name of Adviser'}]} rows={pi3} onChange={setPi3} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 4: List of Syllabus submitted for this semester for the entire program">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'courses_taught',label:'Courses Taught'},{key:'status_syllabus',label:'Status of Syllabus Submission'},{key:'remarks',label:'Remarks'}]} rows={pi4} onChange={setPi4} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 5: Certifications acquired from TESDA, ISO, AACCUP, and others">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'nature_cert',label:'Nature of Certification'},{key:'granting_agency',label:'Granting Agency'},{key:'date_granted',label:'Date Granted'}]} rows={pi5} onChange={setPi5} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 6: List of faculty members undergoing post-graduate education">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'program_enrolled',label:'Program Enrolled In'},{key:'total_units',label:'Total No. of Earned Units'},{key:'units_this_sem',label:'No. of Units Enrolled This Sem'},{key:'institution',label:'Name of Educational Institution'}]} rows={pi6} onChange={setPi6} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 7: List of trainings/workshops/seminars attended by faculty members">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'title_training',label:'Title of Training/Workshop/Seminar'},{key:'date',label:'Date'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'role',label:'Role'}]} rows={pi7} onChange={setPi7} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 8: Production of instructional materials">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty (Authors)'},{key:'title_im',label:'Title of IM'},{key:'type_im',label:'Type of IM'},{key:'courses_utilizing',label:'Courses Utilizing the IMs'},{key:'ip_protection',label:'Nature of IP Protection'}]} rows={pi8} onChange={setPi8} readOnly={readOnly || status === 'submitted'} />
      </Section>

      {/* MFO 3 */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 3: Research</div>
      <Section title="PI 1: Research output utilized by industry/community/beneficiaries">
        <EditableTable columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'nature_utilization',label:'Nature of Utilization'},{key:'partner_community',label:'Name of Partner Community/Industry'},{key:'address',label:'Address of Partner'}]} rows={mfo3pi1} onChange={setMfo3pi1} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 2: Research output completed within the quarter">
        <EditableTable columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'date_completed',label:'Date Completed'},{key:'funding_source',label:'Funding Source'}]} rows={mfo3pi2} onChange={setMfo3pi2} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 3: Research output published in internationally refereed or CHED accredited journals">
        <EditableTable columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'name_publication',label:'Name of Publication'},{key:'date_published',label:'Date Published'},{key:'funding_source',label:'Funding Source'}]} rows={mfo3pi3} onChange={setMfo3pi3} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 4: Research Output Presented in Research Conferences">
        <EditableTable columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponents'},{key:'date',label:'Date'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'venue',label:'Venue'}]} rows={mfo3pi4} onChange={setMfo3pi4} readOnly={readOnly || status === 'submitted'} />
      </Section>

      {/* MFO 4 */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 4: Technical Advisory Extension Program</div>
      <Section title="PI 1: Number of active partnerships with LGUs, industries, NGOs, NGAs, SMEs, and other stakeholders">
        <EditableTable columns={[{key:'title_project',label:'Title of Community Extension Project'},{key:'proponents',label:'Proponents'},{key:'partner',label:'Partner Industry/Community'},{key:'project_locale',label:'Project Locale'}]} rows={mfo4pi1} onChange={setMfo4pi1} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="PI 2: Number of trainees weighted by the length of training (manhours)">
        <EditableTable columns={[{key:'title_training',label:'Title of Training'},{key:'no_beneficiaries',label:'No. Community Beneficiaries'},{key:'length_training',label:'Length of Training'},{key:'total_manhours',label:'Total Manhours'},{key:'partner_agency',label:'Partner Agency'}]} rows={mfo4pi2} onChange={setMfo4pi2} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="Other initiatives/activities undertaken relevant to instruction/research/extension">
        <EditableTable columns={[{key:'title_activity',label:'Title of Activity'},{key:'date_conducted',label:'Date Conducted'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'students_involved',label:'Students Involved'},{key:'role_students',label:'Role (Students)'},{key:'faculty_involved',label:'Faculty Involved'},{key:'role_faculty',label:'Role (Faculty)'}]} rows={otherInitiatives} onChange={setOtherInitiatives} readOnly={readOnly || status === 'submitted'} />
      </Section>
      <Section title="Awards received for excellence in instruction, research, community extension work">
        <EditableTable columns={[{key:'title_award',label:'Title of Award'},{key:'nature_award',label:'Nature of Award'},{key:'granting_agency',label:'Granting Agency'},{key:'date_awarding',label:'Date of Awarding Ceremony'}]} rows={awards} onChange={setAwards} readOnly={readOnly || status === 'submitted'} />
      </Section>

      {/* Other Accomplishments */}
      <Section title="Other accomplishments of the program for this quarter">
        <textarea value={otherAccomplishments} onChange={e => setOtherAccomplishments(e.target.value)} disabled={readOnly || status === 'submitted'} rows={4} placeholder="Policies created, external grants, etc." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50" />
      </Section>

      {/* Documentation */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">DOCUMENTATION</div>
      {DOC_CATEGORIES.map(cat => {
        const entries = docEntries.filter(e => e.category === cat.key);
        return (
          <Section key={cat.key} title={`${cat.label} (${entries.length})`} defaultOpen={entries.length > 0}>
            <div className="space-y-4">
              {entries.map(entry => (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                      <input value={entry.title} onChange={e => updateDocEntryField(entry.id, 'title', e.target.value)} disabled={readOnly || status === 'submitted'}
                        placeholder="Activity Title" className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 sm:col-span-2" />
                      <input value={entry.venue} onChange={e => updateDocEntryField(entry.id, 'venue', e.target.value)} disabled={readOnly || status === 'submitted'}
                        placeholder="Venue" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                      <input value={entry.date} onChange={e => updateDocEntryField(entry.id, 'date', e.target.value)} disabled={readOnly || status === 'submitted'}
                        placeholder="Inclusive Date(s)" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                    </div>
                    {!readOnly && status !== 'submitted' && (
                      <button onClick={() => removeDocEntry(entry.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>

                  <textarea value={entry.description} onChange={e => updateDocEntryField(entry.id, 'description', e.target.value)} disabled={readOnly || status === 'submitted'} rows={3}
                    placeholder="Short narrative/description of the activity..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 mb-3" />

                  {!readOnly && status !== 'submitted' && (
                    <div className="mb-3">
                      <input ref={el => { fileInputRefs.current[entry.id] = el; }} type="file" accept="image/*" multiple
                        onChange={e => handleEntryFilesSelected(entry.id, e)} className="hidden" id={`photo-upload-${entry.id}`}
                        disabled={uploadingEntryId === entry.id || entry.photos.length >= MAX_PHOTOS_PER_ENTRY} />
                      <label htmlFor={`photo-upload-${entry.id}`} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded-xl text-xs font-medium transition-colors ${entry.photos.length >= MAX_PHOTOS_PER_ENTRY ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer'}`}>
                        {uploadingEntryId === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingEntryId === entry.id ? 'Uploading...' : `Upload Photos (${entry.photos.length}/${MAX_PHOTOS_PER_ENTRY})`}
                      </label>
                    </div>
                  )}

                  {entry.photos.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-400 py-3">
                      <ImageIcon className="w-4 h-4" />
                      <p className="text-xs">No photos yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {entry.photos.map((photo, idx) => (
                        <div key={photo.path} className="relative group border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <img src={photo.url} alt={`${entry.title || 'Documentation'} ${idx + 1}`} className="w-full h-28 object-cover" />
                          {!readOnly && status !== 'submitted' && (
                            <button onClick={() => removeEntryPhoto(entry.id, idx)} className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 rounded-full transition-colors">
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          )}
                          <input value={photo.caption} onChange={e => updateEntryPhotoCaption(entry.id, idx, e.target.value)} disabled={readOnly || status === 'submitted'}
                            placeholder="Caption (optional)" className="w-full px-2 py-1 text-[11px] border-t border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {!readOnly && status !== 'submitted' && (
                <button onClick={() => addDocEntry(cat.key)} className="flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors font-medium">
                  <Plus className="w-4 h-4" /> Add Activity
                </button>
              )}
            </div>
          </Section>
        );
      })}

      {/* Signature */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date Submitted</label>
            <input type="date" value={dateSubmitted} onChange={e => setDateSubmitted(e.target.value)} disabled={readOnly || status === 'submitted'} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">Submitted by:</p>
            <div className="border-b border-gray-400 w-48 mb-1" />
            <p className="text-xs text-gray-500">{programChair}</p>
            <p className="text-xs text-gray-500">Program Chairperson</p>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4 print-modal-overlay">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #print-area, #print-area * { visibility: visible; }
              .print-modal-overlay {
                position: static !important;
                overflow: visible !important;
                background: none !important;
                display: block !important;
                padding: 0 !important;
              }
              .print-modal-inner {
                position: static !important;
                overflow: visible !important;
                box-shadow: none !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              #print-area {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                padding-bottom: 110px !important;
              }
              .print-footer-fixed {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                margin-top: 0 !important;
              }
            }
          `}</style>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl print-modal-inner">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Print Preview — Accomplishment Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm"><Printer className="w-4 h-4" /> Print</button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            <div className="p-8 text-xs" id="print-area">

              {/* ── CTU Header Image ── */}
              <div className="mb-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              {/* ── Report Title ── */}
              <div className="text-center mb-4">
                <p className="font-bold text-base uppercase">Accomplishment Report – SY {year}</p>
                <p className="font-semibold">{quarter} Quarter, Months of {quarter === '1st' ? 'January to March' : quarter === '2nd' ? 'April to June' : quarter === '3rd' ? 'July to September' : 'October to December'}</p>
                <p className="font-semibold">(for the Program Chairperson)</p>
              </div>

              <div className="flex justify-between mb-3">
                <p><strong>Program Chairperson:</strong> {programChair}</p>
                <p><strong>Program:</strong> {program}</p>
              </div>
              <p className="mb-4 italic text-xs">Instructions: Fill in the table with the required data. Write NA for sections/items not applicable to your program.</p>

              {/* MFO 1 */}
              <p className="font-bold underline mb-2">MFO 1: Higher Education Services</p>
              <PrintTable label="Performance Indicator 1: Percentage of first-time licensure exam-takers pass the licensure exams" rows={pi1} cols={['date_exam','no_first_time','no_passers','passing_pct_first','total_takers','total_passers','overall_pct']} headers={['Date of LET Examination','No. of First-time Takers','No. of Passers','Passing % for First-time Takers','Total No. of Takers','Total No. of Passers','Over-all Passing %']} />
              <PrintTable label="Performance Indicator 2: Updated % of graduates (2 years prior) that are employed" rows={pi2} cols={['no_graduates','no_employed','percentage']} headers={['No. of Graduates','No. of Graduates Employed','Percentage']} />
              <PrintTable label="Performance Indicator 3: % of undergraduate students enrolled in CHED-identified priority programs" rows={pi3} cols={['class_section','no_enrolled','name_adviser']} headers={['Class Section','No. of Students Enrolled','Name of Adviser']} />
              <PrintTable label="Performance Indicator 4: List of Syllabus submitted" rows={pi4} cols={['name_faculty','courses_taught','status_syllabus','remarks']} headers={['Name of Faculty','Courses Taught','Status of Syllabus Submission','Remarks']} />
              <PrintTable label="Performance Indicator 5: Certifications acquired from TESDA, ISO, AACCUP, and others" rows={pi5} cols={['name_faculty','nature_cert','granting_agency','date_granted']} headers={['Name of Faculty','Nature of Certification','Granting Agency','Date Granted']} />
              <PrintTable label="Performance Indicator 6: List of faculty members undergoing post-graduate education" rows={pi6} cols={['name_faculty','program_enrolled','total_units','units_this_sem','institution']} headers={['Name of Faculty','Program Enrolled In','Total No. of Earned Units','No. of Units Enrolled This Sem','Name of Educational Institution']} />
              <PrintTable label="Performance Indicator 7: List of trainings/workshops/seminars attended by faculty members" rows={pi7} cols={['name_faculty','title_training','date','venue','sponsoring_agency','role']} headers={['Name of Faculty','Title of Training/Workshop/Seminar','Date','Venue','Sponsoring Agency','Role']} />
              <PrintTable label="Performance Indicator 8: Production of instructional materials" rows={pi8} cols={['name_faculty','title_im','type_im','courses_utilizing','ip_protection']} headers={['Name of Faculty (Authors)','Title of IM','Type of IM','Courses Utilizing the IMs','Nature of IP Protection']} />

              {/* MFO 3 */}
              <p className="font-bold underline mb-2 mt-4">MFO 3: Research</p>
              <PrintTable label="PI 1: Research output utilized by industry/community" rows={mfo3pi1} cols={['title_research','proponents','nature_utilization','partner_community','address']} headers={['Title of Research','Proponent/s','Nature of Utilization','Name of Partner Community/Industry','Address']} />
              <PrintTable label="PI 2: Research output completed within the quarter" rows={mfo3pi2} cols={['title_research','proponents','date_completed','funding_source']} headers={['Title of Research','Proponent/s','Date Completed','Funding Source']} />
              <PrintTable label="PI 3: Research output published in internationally refereed journals" rows={mfo3pi3} cols={['title_research','proponents','name_publication','date_published','funding_source']} headers={['Title of Research','Proponent/s','Name of Publication','Date Published','Funding Source']} />
              <PrintTable label="PI 4: Research Output Presented in Research Conferences" rows={mfo3pi4} cols={['title_research','proponents','date','sponsoring_agency','venue']} headers={['Title of Research','Proponents','Date','Sponsoring Agency','Venue']} />

              {/* MFO 4 */}
              <p className="font-bold underline mb-2 mt-4">MFO 4: Technical Advisory Extension Program</p>
              <PrintTable label="PI 1: Number of active partnerships with LGUs, industries, NGOs, etc." rows={mfo4pi1} cols={['title_project','proponents','partner','project_locale']} headers={['Title of Community Extension Project','Proponents','Partner Industry/Community','Project Locale']} />
              <PrintTable label="PI 2: Number of trainees weighted by length of training (manhours)" rows={mfo4pi2} cols={['title_training','no_beneficiaries','length_training','total_manhours','partner_agency']} headers={['Title of Training','No. Community Beneficiaries','Length of Training','Total Manhours','Partner Agency']} />
              <PrintTable label="Other initiatives/activities undertaken" rows={otherInitiatives} cols={['title_activity','date_conducted','venue','sponsoring_agency','students_involved','role_students','faculty_involved','role_faculty']} headers={['Title of Activity','Date Conducted','Venue','Sponsoring Agency','Students Involved','Role','Faculty Involved','Role']} />
              <PrintTable label="Awards received for excellence" rows={awards} cols={['title_award','nature_award','granting_agency','date_awarding']} headers={['Title of Award','Nature of Award','Granting Agency','Date of Awarding Ceremony']} />

              {/* Other Accomplishments */}
              {otherAccomplishments && (
                <div className="mb-4">
                  <p className="font-semibold mb-1">Other accomplishments of the program:</p>
                  <p>{otherAccomplishments}</p>
                </div>
              )}

              {/* Documentation */}
              {docEntries.length > 0 && (
                <div className="mt-6">
                  <p className="text-center font-bold text-base mb-4">DOCUMENTATION</p>
                  {DOC_CATEGORIES.map(cat => {
                    const entries = docEntries.filter(e => e.category === cat.key);
                    if (entries.length === 0) return null;
                    return (
                      <div key={cat.key} className="mb-6">
                        <p className="font-bold mb-3">{cat.label}</p>
                        {entries.map(entry => (
                          <div key={entry.id} className="mb-6 break-inside-avoid">
                            {entry.title && <p className="text-center font-bold italic mb-0.5">{entry.title}</p>}
                            {(entry.venue || entry.date) && (
                              <p className="text-center font-semibold mb-2">
                                {entry.venue}{entry.venue && entry.date ? ' | ' : ''}{entry.date}
                              </p>
                            )}
                            {entry.description && <p className="mb-3 text-justify">{entry.description}</p>}
                            <div className="flex flex-col items-center gap-3">
                              {entry.photos.map((photo, idx) => (
                                <div key={photo.path} className="border border-black w-2/3">
                                  <img src={photo.url} alt={`${entry.title || 'Documentation'} ${idx + 1}`} className="w-full object-contain" />
                                  {photo.caption && <p className="text-[10px] text-center px-1 py-0.5 border-t border-black">{photo.caption}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Signature */}
              <div className="mt-8 flex justify-between">
                <div><p><strong>Date Submitted:</strong> {dateSubmitted}</p></div>
                <div className="text-center">
                  <p className="font-semibold mb-6">Submitted by:</p>
                  <div className="border-b border-black w-48 mb-1" />
                  <p>{programChair}</p>
                  <p>Program Faculty/Staff</p>
                </div>
              </div>

              {/* ── CTU Footer Image (repeats on every printed page) ── */}
              <div className="mt-8 print-footer-fixed">
                <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain" />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}