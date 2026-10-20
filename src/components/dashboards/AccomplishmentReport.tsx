import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Printer, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  ImageIcon, 
  Loader2, 
  FolderPlus,
  Building,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface AccomplishmentReportProps {
  userId: string;
  userName: string;
  userRole?: string;
  userDepartment?: string;
  targetReportId?: string;
  readOnly?: boolean;
  onAfterSubmit?: () => void;
  externalPrintTrigger?: boolean;
  onPrintHandled?: () => void;
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

interface SubmissionOption {
  id: string;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  date_received?: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const MAX_PHOTOS_PER_ENTRY = 8;
const REPORTS_API_URL = 'http://localhost:5000/api/accomplishment-reports';
const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

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
      <button 
        type="button"
        onClick={() => setOpen(!open)} 
        className="w-full flex items-center justify-between px-5 py-4 bg-[#1E3A8A] text-white font-semibold text-sm hover:bg-[#1E40AF] transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function EditableTable({ 
  columns, 
  rows, 
  onChange, 
  readOnly,
  onImportClick,
  importButtonLabel
}: { 
  columns: { key: string; label: string; width?: string }[]; 
  rows: GenericRow[]; 
  onChange: (rows: GenericRow[]) => void; 
  readOnly?: boolean;
  onImportClick?: () => void;
  importButtonLabel?: string;
}) {
  const emptyRow = () => columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
  const updateCell = (rowIdx: number, key: string, value: string) => onChange(rows.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
  const addRow = () => onChange([...rows, emptyRow()]);
  const deleteRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map(col => (
              <th key={col.key} className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700" style={{ minWidth: col.width || '120px' }}>
                {col.label}
              </th>
            ))}
            {!readOnly && <th className="border border-gray-300 px-2 py-2 w-8" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map(col => (
                <td key={col.key} className="border border-gray-300 px-1 py-1">
                  <textarea 
                    value={row[col.key] ?? ''} 
                    onChange={e => updateCell(idx, col.key, e.target.value)} 
                    disabled={readOnly} 
                    rows={2}
                    className="w-full px-1.5 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded resize-none disabled:bg-transparent"
                    style={{ minWidth: col.width || '120px' }} 
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="border border-gray-300 px-1 py-1 text-center">
                  <button type="button" onClick={() => deleteRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-[#1E3A8A] hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          {onImportClick && (
            <button type="button" onClick={onImportClick} className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold">
              <FolderPlus className="w-3.5 h-3.5" /> {importButtonLabel || 'Import Record'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AccomplishmentReport({ 
  userId, 
  userName, 
  userRole: propRole,
  userDepartment: propDept,
  targetReportId,
  readOnly = false,
  onAfterSubmit,
  externalPrintTrigger = false,
  onPrintHandled
}: AccomplishmentReportProps) {
  // Decode JWT if props are omitted
  const token = getToken();
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = propRole || decoded?.role || 'faculty';
  const userDepartment = propDept || decoded?.departmentNames?.[0] || decoded?.program || '';

  const isChair = userRole === 'chair' || userRole === 'department_chair';
  const isFaculty = !isChair;

  const [quarter, setQuarter] = useState('1st');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [reportId, setReportId] = useState<string | null>(targetReportId || null);
  const [status, setStatus] = useState<'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'>('draft');
  const [deanRemarks, setDeanRemarks] = useState<string | null>(null);

  const [programChair, setProgramChair] = useState(isChair ? userName : '');
  const [program, setProgram] = useState(userDepartment || '');
  const [otherAccomplishments, setOtherAccomplishments] = useState('');
  const [dateSubmitted, setDateSubmitted] = useState('');

  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // MFO 1 synchronization states
  const [chairMfo1Data, setChairMfo1Data] = useState<any | null>(null);
  const [loadingChairMfo1, setLoadingChairMfo1] = useState(false);

  // Submissions & Modal Targets
  const [allSubmissions, setAllSubmissions] = useState<SubmissionOption[]>([]);
  const [activeImportTarget, setActiveImportTarget] = useState<'mfo3pi1' | 'mfo3pi2' | 'mfo3pi3' | 'mfo3pi4' | 'mfo4pi1' | 'awards' | null>(null);

  // Documentation
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

  const activePeriodRef = useRef<string>('');

  const resetBlankForm = useCallback((newQuarter: string, newYear: string) => {
    setReportId(null);
    setStatus('draft');
    setDeanRemarks(null);
    setProgramChair(isChair ? userName : '');
    setProgram(userDepartment || '');
    setOtherAccomplishments('');
    setDateSubmitted('');
    setDocEntries([]);
    setPi1([emptyRow(['date_exam','no_first_time','no_passers','passing_pct_first','total_takers','total_passers','overall_pct'])]);
    setPi2([emptyRow(['no_graduates','no_employed','percentage'])]);
    setPi3([emptyRow(['class_section','no_enrolled','name_adviser'])]);
    setPi4([emptyRow(['name_faculty','courses_taught','status_syllabus','remarks'])]);
    setPi5([emptyRow(['name_faculty','nature_cert','granting_agency','date_granted'])]);
    setPi6([emptyRow(['name_faculty','program_enrolled','total_units','units_this_sem','institution'])]);
    setPi7([emptyRow(['name_faculty','title_training','date','venue','sponsoring_agency','role'])]);
    setPi8([emptyRow(['name_faculty','title_im','type_im','courses_utilizing','ip_protection'])]);
    setMfo3pi1([emptyRow(['title_research','proponents','nature_utilization','partner_community','address'])]);
    setMfo3pi2([emptyRow(['title_research','proponents','date_completed','funding_source'])]);
    setMfo3pi3([emptyRow(['title_research','proponents','name_publication','date_published','funding_source'])]);
    setMfo3pi4([emptyRow(['title_research','proponents','date','sponsoring_agency','venue'])]);
    setMfo4pi1([emptyRow(['title_project','proponents','partner','project_locale'])]);
    setMfo4pi2([emptyRow(['title_training','no_beneficiaries','length_training','total_manhours','partner_agency'])]);
    setOtherInitiatives([emptyRow(['title_activity','date_conducted','venue','sponsoring_agency','students_involved','role_students','faculty_involved','role_faculty'])]);
    setAwards([emptyRow(['title_award','nature_award','granting_agency','date_awarding'])]);
    setLastSavedAt(null);
  }, [userName, isChair, userDepartment]);

  // Load user's report for the period
  const loadPeriodReport = useCallback(async (targetQ: string, targetY: string, explicitId?: string) => {
    const periodKey = explicitId ? `id:${explicitId}` : `${targetQ}-${targetY}`;
    activePeriodRef.current = periodKey;

    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const res = await fetch(`${REPORTS_API_URL}/mine`, { headers });
      if (!res.ok) return;

      const list: any[] = await res.json();
      if (activePeriodRef.current !== periodKey) return;

      let matched: any = null;
      if (explicitId) {
        matched = list.find((r) => r.id === explicitId);
      } else {
        matched = list.find((r) => r.quarter === targetQ && String(r.year) === String(targetY));
      }

      if (matched) {
        setReportId(matched.id);
        setQuarter(matched.quarter || targetQ);
        setYear(String(matched.year || targetY));
        setStatus(matched.status || 'draft');
        setDeanRemarks(matched.dean_remarks || null);
        setProgramChair(matched.program_chair ?? (isChair ? userName : ''));
        setProgram(matched.program ?? userDepartment ?? '');
        setOtherAccomplishments(matched.other_accomplishments ?? '');
        setDateSubmitted(matched.date_submitted ?? '');

        if (matched.pi1_data?.length) setPi1(matched.pi1_data);
        if (matched.pi2_data?.length) setPi2(matched.pi2_data);
        if (matched.pi3_data?.length) setPi3(matched.pi3_data);
        if (matched.pi4_data?.length) setPi4(matched.pi4_data);
        if (matched.pi5_data?.length) setPi5(matched.pi5_data);
        if (matched.pi6_data?.length) setPi6(matched.pi6_data);
        if (matched.pi7_data?.length) setPi7(matched.pi7_data);
        if (matched.pi8_data?.length) setPi8(matched.pi8_data);
        if (matched.mfo3_pi1_data?.length) setMfo3pi1(matched.mfo3_pi1_data);
        if (matched.mfo3_pi2_data?.length) setMfo3pi2(matched.mfo3_pi2_data);
        if (matched.mfo3_pi3_data?.length) setMfo3pi3(matched.mfo3_pi3_data);
        if (matched.mfo3_pi4_data?.length) setMfo3pi4(matched.mfo3_pi4_data);
        if (matched.mfo4_pi1_data?.length) setMfo4pi1(matched.mfo4_pi1_data);
        if (matched.mfo4_pi2_data?.length) setMfo4pi2(matched.mfo4_pi2_data);
        if (matched.other_data?.length) setOtherInitiatives(matched.other_data);
        if (matched.awards_data?.length) setAwards(matched.awards_data);
        if (matched.doc_entries_data?.length) setDocEntries(matched.doc_entries_data);
        setLastSavedAt(matched.updated_at ?? matched.created_at ?? null);
      } else {
        resetBlankForm(targetQ, targetY);
      }
    } catch {
      // silent
    }
  }, [userName, isChair, userDepartment, resetBlankForm]);

  useEffect(() => {
    loadPeriodReport(quarter, year, targetReportId);
  }, [loadPeriodReport, targetReportId]);

  // Synchronize Chair MFO 1 entries if Faculty
  useEffect(() => {
    if (isChair) return;

    const fetchChairMfo1 = async () => {
      setLoadingChairMfo1(true);
      try {
        const progQuery = encodeURIComponent(userDepartment || program || '');
        const res = await fetch(
          `${REPORTS_API_URL}/program-mfo1?program=${progQuery}&quarter=${quarter}&year=${year}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (res.ok) {
          const chairData = await res.json();
          if (chairData) {
            setChairMfo1Data(chairData);
            if (chairData.program_chair) setProgramChair(chairData.program_chair);
            if (chairData.pi1_data?.length) setPi1(chairData.pi1_data);
            if (chairData.pi2_data?.length) setPi2(chairData.pi2_data);
            if (chairData.pi3_data?.length) setPi3(chairData.pi3_data);
            if (chairData.pi4_data?.length) setPi4(chairData.pi4_data);
            if (chairData.pi5_data?.length) setPi5(chairData.pi5_data);
            if (chairData.pi6_data?.length) setPi6(chairData.pi6_data);
            if (chairData.pi7_data?.length) setPi7(chairData.pi7_data);
            if (chairData.pi8_data?.length) setPi8(chairData.pi8_data);
          } else {
            setChairMfo1Data(null);
          }
        }
      } catch (err) {
        console.error('Error fetching chair MFO1:', err);
      } finally {
        setLoadingChairMfo1(false);
      }
    };

    fetchChairMfo1();
  }, [quarter, year, isChair, userDepartment, program]);

  // Load Submissions for Import
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          const filtered = (data ?? []).filter((s: any) => s.status === 'approved' || s.status === 'pending');
          setAllSubmissions(filtered);
        }
      } catch {
        // silent
      }
    };
    loadSubmissions();
  }, [userId]);

  const isFormLocked = readOnly || status === 'submitted' || status === 'under_review' || status === 'approved';
  const isApproved = status === 'approved';
  const isRevisionMode = status === 'rejected';

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

  const getModalFilteredOptions = (): { title: string; subtitle: string; options: SubmissionOption[] } => {
    if (!activeImportTarget) return { title: '', subtitle: '', options: [] };

    if (activeImportTarget.startsWith('mfo3')) {
      return {
        title: 'Select Research Output',
        subtitle: 'Pick a research output to import its title.',
        options: allSubmissions.filter(s => s.type === 'research'),
      };
    }
    if (activeImportTarget === 'mfo4pi1') {
      return {
        title: 'Select Extension Project',
        subtitle: 'Pick an extension activity to import its title.',
        options: allSubmissions.filter(s => s.type === 'extension'),
      };
    }
    if (activeImportTarget === 'awards') {
      return {
        title: 'Select Award / Achievement',
        subtitle: 'Pick an achievement to import its title and date.',
        options: allSubmissions.filter(s => s.type === 'achievement'),
      };
    }
    return { title: '', subtitle: '', options: [] };
  };

  const populateOrAppend = (
    rows: GenericRow[],
    fieldsToSet: Record<string, string>,
    defaultRow: GenericRow
  ): GenericRow[] => {
    const firstEmptyIndex = rows.findIndex((row) =>
      Object.values(row).every((val) => !val || val.trim() === '')
    );

    if (firstEmptyIndex !== -1) {
      return rows.map((row, idx) =>
        idx === firstEmptyIndex ? { ...row, ...fieldsToSet } : row
      );
    }
    return [...rows, { ...defaultRow, ...fieldsToSet }];
  };

  const handleSelectRecord = (item: SubmissionOption) => {
    if (!activeImportTarget) return;

    if (activeImportTarget === 'mfo3pi1') {
      setMfo3pi1((prev) =>
        populateOrAppend(prev, { title_research: item.title }, { title_research: '', proponents: '', nature_utilization: '', partner_community: '', address: '' })
      );
    } else if (activeImportTarget === 'mfo3pi2') {
      setMfo3pi2((prev) =>
        populateOrAppend(prev, { title_research: item.title }, { title_research: '', proponents: '', date_completed: '', funding_source: '' })
      );
    } else if (activeImportTarget === 'mfo3pi3') {
      setMfo3pi3((prev) =>
        populateOrAppend(prev, { title_research: item.title }, { title_research: '', proponents: '', name_publication: '', date_published: '', funding_source: '' })
      );
    } else if (activeImportTarget === 'mfo3pi4') {
      setMfo3pi4((prev) =>
        populateOrAppend(prev, { title_research: item.title }, { title_research: '', proponents: '', date: '', sponsoring_agency: '', venue: '' })
      );
    } else if (activeImportTarget === 'mfo4pi1') {
      setMfo4pi1((prev) =>
        populateOrAppend(prev, { title_project: item.title }, { title_project: '', proponents: '', partner: '', project_locale: '' })
      );
    } else if (activeImportTarget === 'awards') {
      const formattedDate = item.date_received
        ? new Date(item.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      setAwards((prev) =>
        populateOrAppend(prev, { title_award: item.title, date_awarding: formattedDate }, { title_award: '', nature_award: '', granting_agency: '', date_awarding: '' })
      );
    }

    showSuccess('Record imported successfully!');
    setActiveImportTarget(null);
  };

  const addDocEntry = (category: string) => {
    setDocEntries(prev => [...prev, { id: makeId(), category, title: '', venue: '', date: '', description: '', photos: [] }]);
  };

  const removeDocEntry = (id: string) => {
    setDocEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateDocEntryField = (id: string, field: keyof DocEntry, value: string) => {
    setDocEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleEntryFilesSelected = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const entry = docEntries.find(en => en.id === entryId);
    const remainingSlots = MAX_PHOTOS_PER_ENTRY - (entry?.photos.length ?? 0);
    if (remainingSlots <= 0) {
      showError(`Maximum of ${MAX_PHOTOS_PER_ENTRY} photos per activity reached.`);
      return;
    }

    const filesToUpload = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remainingSlots);
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

  const getPayload = (submitStatus: string) => ({
    quarter, year, program_chair: programChair, program,
    pi1_data: pi1, pi2_data: pi2, pi3_data: pi3, pi4_data: pi4,
    pi5_data: pi5, pi6_data: pi6, pi7_data: pi7, pi8_data: pi8,
    mfo3_pi1_data: mfo3pi1, mfo3_pi2_data: mfo3pi2, mfo3_pi3_data: mfo3pi3, mfo3_pi4_data: mfo3pi4,
    mfo4_pi1_data: mfo4pi1, mfo4_pi2_data: mfo4pi2, other_data: otherInitiatives, awards_data: awards,
    doc_entries_data: docEntries,
    other_accomplishments: otherAccomplishments,
    date_submitted: submitStatus === 'submitted' ? (dateSubmitted || new Date().toISOString().split('T')[0]) : dateSubmitted,
    status: submitStatus, progress: computeProgress(),
  });

  const persist = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
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
      if (res.status === 409 && err.existingId && err.status === 'draft') {
        setReportId(err.existingId);
        const putRes = await fetch(`${REPORTS_API_URL}/${err.existingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!putRes.ok) throw new Error('Failed to update existing draft.');
        return putRes.json();
      }
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  };

  const handleSaveDraft = async () => {
    if (isFormLocked || saving) return;
    setSaving(true);
    try {
      const data = await persist(getPayload('draft'));
      if (!reportId && data?.id) setReportId(data.id);
      setStatus('draft');
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      showSuccess('Draft saved!');
    } catch (err: any) {
      showError(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isFormLocked || saving) return;
    setSaving(true);
    try {
      const isResubmit = status === 'rejected';
      const data = await persist(getPayload('submitted'));
      if (!reportId && data?.id) setReportId(data.id);
      setStatus('submitted');
      setLastSavedAt(data?.updated_at ?? new Date().toISOString());
      showSuccess(isResubmit ? 'Resubmitted to Dean!' : 'Submitted to Dean!');
      onAfterSubmit?.();
    } catch (err: any) {
      showError(err.message || 'Failed to submit report.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuarterChange = (newQ: string) => {
    if (isRevisionMode) {
      alert('This is a revision for an existing rejected report. The quarter cannot be reassigned.');
      return;
    }
    setQuarter(newQ);
    resetBlankForm(newQ, year);
    loadPeriodReport(newQ, year);
  };

  const handleYearChange = (newY: string) => {
    if (isRevisionMode) return;
    setYear(newY);
    if (newY.length === 4) {
      resetBlankForm(quarter, newY);
      loadPeriodReport(quarter, newY);
    }
  };

  const PrintTable = ({ label, rows, cols, headers }: { label: string; rows: GenericRow[]; cols: string[]; headers: string[] }) => (
    <div className="mb-4">
      <p className="font-semibold mb-1">{label}</p>
      <table className="w-full border-collapse border border-black text-xs mb-2">
        <thead><tr>{headers.map(h => <th key={h} className="border border-black px-2 py-1 text-left font-bold bg-gray-100">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{cols.map(col => <td key={col} className="border border-black px-2 py-3 align-top">{row[col]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  const modalConfig = getModalFilteredOptions();

  return (
    <div className="space-y-4">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{errorMsg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accomplishment Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isChair ? 'Program Chairperson Report' : 'Faculty Accomplishment Report'} · SY {year}
          </p>
          {lastSavedAt && (
            <p className="text-xs text-gray-400 mt-0.5">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          {!isFormLocked && (
            <>
              <button type="button" onClick={handleSaveDraft} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] transition-colors disabled:opacity-50 shadow-xs">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {isRevisionMode ? 'Resubmit to Dean' : 'Submit to Dean'}
                  </>
                )}
              </button>
            </>
          )}
          {(status === 'submitted' || status === 'under_review') && (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              <Clock className="w-4 h-4" /> Under Review
            </span>
          )}
          {status === 'approved' && (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> Approved
            </span>
          )}
        </div>
      </div>

      {/* Completion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm font-bold text-[#1E3A8A]">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-[#1E3A8A] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quarter</label>
            <select value={quarter} onChange={e => handleQuarterChange(e.target.value)} disabled={isFormLocked || isRevisionMode} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-50">
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <input type="text" value={year} onChange={e => handleYearChange(e.target.value)} disabled={isFormLocked || isRevisionMode} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Program Chairperson</label>
            <input type="text" value={programChair} onChange={e => setProgramChair(e.target.value)} disabled={isFaculty || isFormLocked} placeholder={isFaculty ? 'Auto-filled from Chair' : 'Chairperson Name'} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Program</label>
            <input type="text" value={program} onChange={e => setProgram(e.target.value)} disabled={isFaculty || isFormLocked} placeholder="e.g. BEEd" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* MFO 1: HIGHER EDUCATION SERVICES */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-between">
        <span>MFO 1: Higher Education Services</span>
        {isFaculty && (
          <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
            Program Wide (Read-Only for Faculty)
          </span>
        )}
      </div>

      {isFaculty && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              {chairMfo1Data
                ? `MFO 1 records are synchronized with Chairperson (${chairMfo1Data.program_chair || 'Program Chair'}) for ${quarter} Quarter ${year}.`
                : `The Program Chairperson has not yet published MFO 1 records for ${quarter} Quarter ${year}.`}
            </span>
          </div>
          {loadingChairMfo1 && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />}
        </div>
      )}

      <Section title="PI 1: Percentage of first-time licensure exam-takers that pass the licensure exams">
        <EditableTable columns={[{key:'date_exam',label:'Date of LET Examination'},{key:'no_first_time',label:'No. of First-time Takers'},{key:'no_passers',label:'No. of Passers'},{key:'passing_pct_first',label:'Passing % for First-time Takers'},{key:'total_takers',label:'Total No. of Takers'},{key:'total_passers',label:'Total No. of Passers'},{key:'overall_pct',label:'Over-all Passing %'}]} rows={pi1} onChange={setPi1} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 2: Updated % of graduates (2 years prior) that are employed">
        <EditableTable columns={[{key:'no_graduates',label:'No. of Graduates'},{key:'no_employed',label:'No. of Graduates Employed'},{key:'percentage',label:'Percentage'}]} rows={pi2} onChange={setPi2} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 3: % of undergraduate students enrolled in CHED-identified and RDC-identified priority programs">
        <EditableTable columns={[{key:'class_section',label:'Class Section'},{key:'no_enrolled',label:'No. of Students Enrolled'},{key:'name_adviser',label:'Name of Adviser'}]} rows={pi3} onChange={setPi3} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 4: List of Syllabus submitted for this semester for the entire program">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'courses_taught',label:'Courses Taught'},{key:'status_syllabus',label:'Status of Syllabus Submission'},{key:'remarks',label:'Remarks'}]} rows={pi4} onChange={setPi4} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 5: Certifications acquired from TESDA, ISO, AACCUP, and others">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'nature_cert',label:'Nature of Certification'},{key:'granting_agency',label:'Granting Agency'},{key:'date_granted',label:'Date Granted'}]} rows={pi5} onChange={setPi5} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 6: List of faculty members undergoing post-graduate education">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'program_enrolled',label:'Program Enrolled In'},{key:'total_units',label:'Total No. of Earned Units'},{key:'units_this_sem',label:'No. of Units Enrolled This Sem'},{key:'institution',label:'Name of Educational Institution'}]} rows={pi6} onChange={setPi6} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 7: List of trainings/workshops/seminars attended by faculty members">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty'},{key:'title_training',label:'Title of Training/Workshop/Seminar'},{key:'date',label:'Date'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'role',label:'Role'}]} rows={pi7} onChange={setPi7} readOnly={isFaculty || isFormLocked} />
      </Section>
      <Section title="PI 8: Production of instructional materials">
        <EditableTable columns={[{key:'name_faculty',label:'Name of Faculty (Authors)'},{key:'title_im',label:'Title of IM'},{key:'type_im',label:'Type of IM'},{key:'courses_utilizing',label:'Courses Utilizing the IMs'},{key:'ip_protection',label:'Nature of IP Protection'}]} rows={pi8} onChange={setPi8} readOnly={isFaculty || isFormLocked} />
      </Section>

      {/* MFO 3: RESEARCH */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 3: Research</div>
      <Section title="PI 1: Research output utilized by industry/community/beneficiaries">
        <EditableTable 
          columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'nature_utilization',label:'Nature of Utilization'},{key:'partner_community',label:'Name of Partner Community/Industry'},{key:'address',label:'Address of Partner'}]} 
          rows={mfo3pi1} 
          onChange={setMfo3pi1} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('mfo3pi1')}
          importButtonLabel="Import from My Research"
        />
      </Section>
      <Section title="PI 2: Research output completed within the quarter">
        <EditableTable 
          columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'date_completed',label:'Date Completed'},{key:'funding_source',label:'Funding Source'}]} 
          rows={mfo3pi2} 
          onChange={setMfo3pi2} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('mfo3pi2')}
          importButtonLabel="Import from My Research"
        />
      </Section>
      <Section title="PI 3: Research output published in internationally refereed or CHED accredited journals">
        <EditableTable 
          columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponent/s'},{key:'name_publication',label:'Name of Publication'},{key:'date_published',label:'Date Published'},{key:'funding_source',label:'Funding Source'}]} 
          rows={mfo3pi3} 
          onChange={setMfo3pi3} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('mfo3pi3')}
          importButtonLabel="Import from My Research"
        />
      </Section>
      <Section title="PI 4: Research Output Presented in Research Conferences">
        <EditableTable 
          columns={[{key:'title_research',label:'Title of Research'},{key:'proponents',label:'Proponents'},{key:'date',label:'Date'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'venue',label:'Venue'}]} 
          rows={mfo3pi4} 
          onChange={setMfo3pi4} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('mfo3pi4')}
          importButtonLabel="Import from My Research"
        />
      </Section>

      {/* MFO 4: EXTENSION */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 4: Technical Advisory Extension Program</div>
      <Section title="PI 1: Number of active partnerships with LGUs, industries, NGOs, NGAs, SMEs, and other stakeholders">
        <EditableTable 
          columns={[{key:'title_project',label:'Title of Community Extension Project'},{key:'proponents',label:'Proponents'},{key:'partner',label:'Partner Industry/Community'},{key:'project_locale',label:'Project Locale'}]} 
          rows={mfo4pi1} 
          onChange={setMfo4pi1} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('mfo4pi1')}
          importButtonLabel="Import from My Extension"
        />
      </Section>
      <Section title="PI 2: Number of trainees weighted by the length of training (manhours)">
        <EditableTable columns={[{key:'title_training',label:'Title of Training'},{key:'no_beneficiaries',label:'No. Community Beneficiaries'},{key:'length_training',label:'Length of Training'},{key:'total_manhours',label:'Total Manhours'},{key:'partner_agency',label:'Partner Agency'}]} rows={mfo4pi2} onChange={setMfo4pi2} readOnly={isFormLocked} />
      </Section>
      <Section title="Other initiatives/activities undertaken relevant to instruction/research/extension">
        <EditableTable columns={[{key:'title_activity',label:'Title of Activity'},{key:'date_conducted',label:'Date Conducted'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'students_involved',label:'Students Involved'},{key:'role_students',label:'Role (Students)'},{key:'faculty_involved',label:'Faculty Involved'},{key:'role_faculty',label:'Role (Faculty)'}]} rows={otherInitiatives} onChange={setOtherInitiatives} readOnly={isFormLocked} />
      </Section>
      <Section title="Awards received for excellence in instruction, research, community extension work">
        <EditableTable 
          columns={[{key:'title_award',label:'Title of Award'},{key:'nature_award',label:'Nature of Award'},{key:'granting_agency',label:'Granting Agency'},{key:'date_awarding',label:'Date of Awarding Ceremony'}]} 
          rows={awards} 
          onChange={setAwards} 
          readOnly={isFormLocked} 
          onImportClick={() => setActiveImportTarget('awards')}
          importButtonLabel="Import from My Achievements"
        />
      </Section>

      {/* Narrative */}
      <Section title="Other accomplishments of the program for this quarter">
        <textarea value={otherAccomplishments} onChange={e => setOtherAccomplishments(e.target.value)} disabled={isFormLocked} rows={4} placeholder="Policies created, external grants, etc." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50" />
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
                      <input value={entry.title} onChange={e => updateDocEntryField(entry.id, 'title', e.target.value)} disabled={isFormLocked}
                        placeholder="Activity Title" className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 sm:col-span-2" />
                      <input value={entry.venue} onChange={e => updateDocEntryField(entry.id, 'venue', e.target.value)} disabled={isFormLocked}
                        placeholder="Venue" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                      <input value={entry.date} onChange={e => updateDocEntryField(entry.id, 'date', e.target.value)} disabled={isFormLocked}
                        placeholder="Inclusive Date(s)" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                    </div>
                    {!isFormLocked && (
                      <button type="button" onClick={() => removeDocEntry(entry.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>

                  <textarea value={entry.description} onChange={e => updateDocEntryField(entry.id, 'description', e.target.value)} disabled={isFormLocked} rows={3}
                    placeholder="Short narrative/description of the activity..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 mb-3" />

                  {!isFormLocked && (
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
                        <div key={idx} className="relative group border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <img src={photo.url} alt={`${entry.title || 'Documentation'} ${idx + 1}`} className="w-full h-28 object-cover" />
                          <input value={photo.caption} onChange={e => {
                            const val = e.target.value;
                            setDocEntries(prev => prev.map(en => en.id === entry.id ? { ...en, photos: en.photos.map((pt, pIdx) => pIdx === idx ? { ...pt, caption: val } : pt) } : en));
                          }} disabled={isFormLocked}
                            placeholder="Caption (optional)" className="w-full px-2 py-1 text-[11px] border-t border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {!isFormLocked && (
                <button type="button" onClick={() => addDocEntry(cat.key)} className="flex items-center gap-1.5 text-sm text-[#1E3A8A] hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors font-medium">
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
            <input type="date" value={dateSubmitted} onChange={e => setDateSubmitted(e.target.value)} disabled={isFormLocked} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">Submitted by:</p>
            <div className="border-b border-gray-400 w-48 mb-1" />
            <p className="text-xs text-gray-900 font-bold uppercase">{isChair ? programChair : userName}</p>
            <p className="text-xs text-gray-500">{isChair ? 'Program Chairperson' : 'Program Faculty'}</p>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {activeImportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{modalConfig.title}</h3>
                <p className="text-xs text-gray-500">{modalConfig.subtitle}</p>
              </div>
              <button type="button" onClick={() => setActiveImportTarget(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalConfig.options.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No matching records found under your account.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 pr-1">
                {modalConfig.options.map(item => (
                  <div key={item.id} className="py-3 px-2 flex items-center justify-between gap-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status}
                        </span>
                        {item.date_received && (
                          <span className="text-[11px] text-gray-400">
                            {new Date(item.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectRecord(item)}
                      className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setActiveImportTarget(null)} 
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4 print-modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl print-modal-inner">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Print Preview — Accomplishment Report</h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button type="button" onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-8 text-xs text-black bg-white" id="print-area">
              <div className="mb-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              <div className="text-center mb-4">
                <p className="font-bold text-base uppercase">Accomplishment Report – SY {year}</p>
                <p className="font-semibold">{quarter} Quarter</p>
                <p className="font-semibold">({isChair ? 'for the Program Chairperson' : 'for the Program Faculty'})</p>
              </div>

              <div className="flex justify-between mb-3">
                <p><strong>Program Chairperson:</strong> {programChair}</p>
                <p><strong>Program:</strong> {program}</p>
              </div>

              <p className="font-bold underline mb-2">MFO 1: Higher Education Services</p>
              <PrintTable label="PI 1: Percentage of first-time licensure exam-takers that pass" rows={pi1} cols={['date_exam','no_first_time','no_passers','passing_pct_first','total_takers','total_passers','overall_pct']} headers={['Date of LET Examination','No. of First-time Takers','No. of Passers','Passing % for First-time Takers','Total No. of Takers','Total No. of Passers','Over-all Passing %']} />
              <PrintTable label="PI 2: % of graduates employed (2 years prior)" rows={pi2} cols={['no_graduates','no_employed','percentage']} headers={['No. of Graduates','No. of Graduates Employed','Percentage']} />
              <PrintTable label="PI 3: % enrolled in priority programs" rows={pi3} cols={['class_section','no_enrolled','name_adviser']} headers={['Class Section','No. of Students Enrolled','Name of Adviser']} />
              <PrintTable label="PI 4: Syllabi Submissions" rows={pi4} cols={['name_faculty','courses_taught','status_syllabus','remarks']} headers={['Name of Faculty','Courses Taught','Status of Syllabus Submission','Remarks']} />
              <PrintTable label="PI 5: Certifications Acquired" rows={pi5} cols={['name_faculty','nature_cert','granting_agency','date_granted']} headers={['Name of Faculty','Nature of Certification','Granting Agency','Date Granted']} />
              <PrintTable label="PI 6: Faculty Post-Graduate Education" rows={pi6} cols={['name_faculty','program_enrolled','total_units','units_this_sem','institution']} headers={['Name of Faculty','Program Enrolled In','Total No. of Earned Units','No. of Units Enrolled This Sem','Name of Educational Institution']} />
              <PrintTable label="PI 7: Faculty Trainings/Workshops" rows={pi7} cols={['name_faculty','title_training','date','venue','sponsoring_agency','role']} headers={['Name of Faculty','Title of Training/Workshop/Seminar','Date','Venue','Sponsoring Agency','Role']} />
              <PrintTable label="PI 8: Instructional Materials Produced" rows={pi8} cols={['name_faculty','title_im','type_im','courses_utilizing','ip_protection']} headers={['Name of Faculty (Authors)','Title of IM','Type of IM','Courses Utilizing the IMs','Nature of IP Protection']} />

              <p className="font-bold underline mb-2 mt-4">MFO 3: Research</p>
              <PrintTable label="PI 1: Research output utilized" rows={mfo3pi1} cols={['title_research','proponents','nature_utilization','partner_community','address']} headers={['Title of Research','Proponent/s','Nature of Utilization','Name of Partner Community/Industry','Address']} />
              <PrintTable label="PI 2: Research output completed within the quarter" rows={mfo3pi2} cols={['title_research','proponents','date_completed','funding_source']} headers={['Title of Research','Proponent/s','Date Completed','Funding Source']} />
              <PrintTable label="PI 3: Refereed Journal Publications" rows={mfo3pi3} cols={['title_research','proponents','name_publication','date_published','funding_source']} headers={['Title of Research','Proponent/s','Name of Publication','Date Published','Funding Source']} />
              <PrintTable label="PI 4: Conference Presentations" rows={mfo3pi4} cols={['title_research','proponents','date','sponsoring_agency','venue']} headers={['Title of Research','Proponents','Date','Sponsoring Agency','Venue']} />

              <p className="font-bold underline mb-2 mt-4">MFO 4: Technical Advisory Extension Program</p>
              <PrintTable label="PI 1: Active Partnerships" rows={mfo4pi1} cols={['title_project','proponents','partner','project_locale']} headers={['Title of Community Extension Project','Proponents','Partner Industry/Community','Project Locale']} />
              <PrintTable label="PI 2: Weighted Trainees / Manhours" rows={mfo4pi2} cols={['title_training','no_beneficiaries','length_training','total_manhours','partner_agency']} headers={['Title of Training','No. Community Beneficiaries','Length of Training','Total Manhours','Partner Agency']} />
              <PrintTable label="Other Initiatives" rows={otherInitiatives} cols={['title_activity','date_conducted','venue','sponsoring_agency','students_involved','role_students','faculty_involved','role_faculty']} headers={['Title of Activity','Date Conducted','Venue','Sponsoring Agency','Students Involved','Role','Faculty Involved','Role']} />
              <PrintTable label="Awards Received" rows={awards} cols={['title_award','nature_award','granting_agency','date_awarding']} headers={['Title of Award','Nature of Award','Granting Agency','Date of Awarding Ceremony']} />

              {otherAccomplishments && (
                <div className="mb-4">
                  <p className="font-semibold mb-1">Other accomplishments of the program:</p>
                  <p className="whitespace-pre-wrap">{otherAccomplishments}</p>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <div><p><strong>Date Submitted:</strong> {dateSubmitted || '—'}</p></div>
                <div className="text-center">
                  <p className="font-semibold mb-6">Submitted by:</p>
                  <div className="border-b border-black w-48 mb-1" />
                  <p className="font-bold uppercase">{isChair ? programChair : userName}</p>
                  <p className="text-gray-500">{isChair ? 'Program Chairperson' : 'Program Faculty'}</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}