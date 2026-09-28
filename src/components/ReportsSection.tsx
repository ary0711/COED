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
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit3,
} from 'lucide-react';

// ============================================================================
// 1. BACKEND ROUTE CONSTANTS & INTERFACES
// ============================================================================
const ACCOMPLISHMENT_API_URL = 'http://localhost:5000/api/accomplishment-reports';
const EXTENSION_API_URL      = 'http://localhost:5000/api/extension-reports';
const WFH_API_URL            = 'http://localhost:5000/api/wfh-reports';
const RESEARCH_API_URL       = 'http://localhost:5000/api/research-submissions';

function getToken() {
  return localStorage.getItem('token');
}

export type ReportType = 'accomplishment' | 'extension' | 'wfh';

export interface UnifiedTrackItem {
  id: string;
  type: ReportType;
  title: string;
  periodOrQuarter: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  progress: number;
  submittedAt?: string | null;
  updatedAt: string;
  deanRemarks?: string | null;
  rawData: any;
}

interface DocPhotoItem {
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
  photos: DocPhotoItem[];
}

interface SubmissionOption {
  id: string;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  date_received?: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const MAX_PHOTOS_PER_ENTRY = 8;
const DOC_CATEGORIES = [
  { key: 'instruction', label: 'A. Instruction-Related Engagements' },
  { key: 'research', label: 'B. Research' },
  { key: 'research_utilization', label: 'C. Research Utilization' },
  { key: 'extension', label: 'D. Extension' },
  { key: 'other', label: 'E. Other Engagements' },
];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Maps any raw report from /mine or /my-draft into a normalized item
function mapToUnified(type: ReportType, raw: any): UnifiedTrackItem | null {
  if (!raw || !raw.id) return null;
  const isWfh = type === 'wfh';
  const periodOrQuarter = isWfh
    ? (raw.reporting_period || 'Work-from-Home Period')
    : `${raw.quarter || '1st'} Quarter, ${raw.year || new Date().getFullYear()}`;

  const title =
    type === 'accomplishment'
      ? 'Accomplishment Report'
      : type === 'extension'
      ? 'Community Extension Services Accomplishment Report'
      : 'Work-From-Home (WFH) Accomplishment Report';

  return {
    id: raw.id,
    type,
    title,
    periodOrQuarter,
    status: raw.status || 'draft',
    progress: raw.progress ?? (raw.status === 'approved' ? 100 : raw.status === 'submitted' ? 100 : 0),
    submittedAt: raw.date_submitted || raw.updated_at || raw.created_at,
    updatedAt: raw.updated_at || raw.created_at || new Date().toISOString(),
    deanRemarks: raw.dean_remarks || null,
    rawData: raw,
  };
}

// ============================================================================
// 2. MY DRAFTS PANEL (Uses /my-draft)
// ============================================================================
function MyDraftsPanel({
  onEdit,
}: {
  onEdit: (type: ReportType, existingId?: string) => void;
}) {
  const [drafts, setDrafts] = useState<UnifiedTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [accRes, extRes, wfhRes] = await Promise.all([
        fetch(`${ACCOMPLISHMENT_API_URL}/my-draft`, { headers }),
        fetch(`${EXTENSION_API_URL}/my-draft`, { headers }),
        fetch(`${WFH_API_URL}/my-draft`, { headers }),
      ]);

      const accData = accRes.ok ? await accRes.json() : null;
      const extData = extRes.ok ? await extRes.json() : null;
      const wfhData = wfhRes.ok ? await wfhRes.json() : null;

      const list: UnifiedTrackItem[] = [];
      const acc = mapToUnified('accomplishment', accData);
      if (acc && acc.status === 'draft') list.push(acc);

      const ext = mapToUnified('extension', extData);
      if (ext && ext.status === 'draft') list.push(ext);

      const wfh = mapToUnified('wfh', wfhData);
      if (wfh && wfh.status === 'draft') list.push(wfh);

      setDrafts(list);
    } catch {
      setLoadError('Could not reach the server to retrieve your drafts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-900">My Drafts</h2>
        <button
          onClick={fetchDrafts}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh drafts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Unsubmitted drafts saved on the server. Once submitted, they will appear in Track Status.
      </p>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Checking saved drafts...</span>
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mb-2 text-gray-300" />
          <p className="text-sm">No active drafts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{d.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {d.periodOrQuarter} · {d.progress}% complete
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Last saved: {formatDate(d.updatedAt)}</div>
              </div>
              <button
                onClick={() => onEdit(d.type, d.id)}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#1E40AF] transition-colors flex-shrink-0 self-end sm:self-auto flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Continue Editing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. TRACK STATUS PANEL (Uses /mine)
// ============================================================================
function ReportTrackerPanel({
  onOpenReport,
  onPrintApproved,
}: {
  onOpenReport: (type: ReportType, targetId?: string) => void;
  onPrintApproved: (type: ReportType) => void;
}) {
  const [trackedReports, setTrackedReports] = useState<UnifiedTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchTracked = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      // Calls the real /mine endpoints on your backend
      const [accRes, extRes, wfhRes] = await Promise.all([
        fetch(`${ACCOMPLISHMENT_API_URL}/mine`, { headers }),
        fetch(`${EXTENSION_API_URL}/mine`, { headers }),
        fetch(`${WFH_API_URL}/mine`, { headers }),
      ]);

      const accData: any[] = accRes.ok ? await accRes.json() : [];
      const extData: any[] = extRes.ok ? await extRes.json() : [];
      const wfhData: any[] = wfhRes.ok ? await wfhRes.json() : [];

      const list: UnifiedTrackItem[] = [];

      (Array.isArray(accData) ? accData : []).forEach((r) => {
        const u = mapToUnified('accomplishment', r);
        if (u) list.push(u);
      });

      (Array.isArray(extData) ? extData : []).forEach((r) => {
        const u = mapToUnified('extension', r);
        if (u) list.push(u);
      });

      (Array.isArray(wfhData) ? wfhData : []).forEach((r) => {
        const u = mapToUnified('wfh', r);
        if (u) list.push(u);
      });

      // Sort by newest updated_at
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTrackedReports(list);
    } catch {
      setLoadError('Failed to load submitted reports from /mine backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  const getStatusBadge = (status: UnifiedTrackItem['status']) => {
    switch (status) {
      case 'approved':
        return {
          label: '✓ Approved by Dean',
          containerClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dotClass: 'bg-emerald-500',
        };
      case 'submitted':
      case 'under_review':
        return {
          label: '🟡 Under Review',
          containerClass: 'bg-amber-50 border-amber-200 text-amber-800',
          dotClass: 'bg-amber-500 animate-pulse',
        };
      case 'rejected':
        return {
          label: '✕ Rejected',
          containerClass: 'bg-red-50 border-red-200 text-red-800',
          dotClass: 'bg-red-500',
        };
      default:
        return {
          label: 'Draft',
          containerClass: 'bg-gray-50 border-gray-200 text-gray-700',
          dotClass: 'bg-gray-400',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Track Report Status</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status of reports submitted to the Dean.
          </p>
        </div>
        <button
          onClick={fetchTracked}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh tracking status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loadError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#1E3A8A]" />
          <span className="text-sm font-medium">Checking submissions...</span>
        </div>
      ) : trackedReports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No submitted reports found.</p>
          <p className="text-xs text-gray-400 mt-1">Submit your draft to track Dean review and decisions here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {trackedReports.map((item) => {
            const badge = getStatusBadge(item.status);
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-200 transition-all bg-gray-50/30 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {item.type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${badge.containerClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.periodOrQuarter}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>

                  {/* Rejection / Dean Feedback Box */}
                  {isRejected && item.deanRemarks && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      <div className="font-bold flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Dean's Feedback:
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{item.deanRemarks}</p>
                    </div>
                  )}

                  {/* Workflow Lifecycle Visualizer */}
                  <div className="pt-2">
                    <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mb-1">
                      Submitted → Under Review → Pending Dean Decision
                    </div>
                  </div>
                </div>

                {/* Actions strictly based on status */}
                <div className="pt-4 mt-4 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-gray-400 truncate">ID: {item.id.slice(0, 8)}</span>

                  <div className="flex items-center gap-2">
                    {/* Approved: View Approved Report + Print Report */}
                    {isApproved && (
                      <>
                        <button
                          onClick={() => onOpenReport(item.type, item.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => onPrintApproved(item.type)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Report
                        </button>
                      </>
                    )}

                    {/* Rejected: Review & Modify */}
                    {isRejected && (
                      <button
                        onClick={() => onOpenReport(item.type, item.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Review & Modify
                      </button>
                    )}

                    {/* Submitted / Under Review: Read-Only View */}
                    {!isApproved && !isRejected && (
                      <button
                        onClick={() => onOpenReport(item.type, item.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. ACCOMPLISHMENT REPORT COMPONENT
// ============================================================================
interface GenericRow {
  [key: string]: string;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <button
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
  importButtonLabel,
}: {
  columns: { key: string; label: string; width?: string }[];
  rows: GenericRow[];
  onChange: (rows: GenericRow[]) => void;
  readOnly?: boolean;
  onImportClick?: () => void;
  importButtonLabel?: string;
}) {
  const emptyRow = () => columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
  const updateCell = (rowIdx: number, key: string, value: string) =>
    onChange(rows.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)));
  const addRow = () => onChange([...rows, emptyRow()]);
  const deleteRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700"
                style={{ minWidth: col.width || '120px' }}
              >
                {col.label}
              </th>
            ))}
            {!readOnly && <th className="border border-gray-300 px-2 py-2 w-8" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((col) => (
                <td key={col.key} className="border border-gray-300 px-1 py-1">
                  <textarea
                    value={row[col.key] ?? ''}
                    onChange={(e) => updateCell(idx, col.key, e.target.value)}
                    disabled={readOnly}
                    rows={2}
                    className="w-full px-1.5 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded resize-none disabled:bg-transparent"
                    style={{ minWidth: col.width || '120px' }}
                  />
                </td>
              ))}
              {!readOnly && (
                <td className="border border-gray-300 px-1 py-1 text-center">
                  <button onClick={() => deleteRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-xs text-[#1E3A8A] hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
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
  targetReportId,
  readOnly = false,
  onAfterSubmit,
  externalPrintTrigger = false,
  onPrintHandled,
}: {
  userId: string;
  userName: string;
  targetReportId?: string;
  readOnly?: boolean;
  onAfterSubmit?: () => void;
  externalPrintTrigger?: boolean;
  onPrintHandled?: () => void;
}) {
  const [quarter, setQuarter] = useState('1st');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [programChair, setProgramChair] = useState(userName);
  const [program, setProgram] = useState('');
  const [otherAccomplishments, setOtherAccomplishments] = useState('');
  const [dateSubmitted, setDateSubmitted] = useState('');
  const [reportId, setReportId] = useState<string | null>(targetReportId || null);
  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');
  const [deanRemarks, setDeanRemarks] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [allSubmissions, setAllSubmissions] = useState<SubmissionOption[]>([]);
  const [activeImportTarget, setActiveImportTarget] = useState<string | null>(null);
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

  const isFormLocked = readOnly || status === 'submitted' || status === 'approved';

  const computeProgress = () => {
    const allRows = [pi1,pi2,pi3,pi4,pi5,pi6,pi7,pi8,mfo3pi1,mfo3pi2,mfo3pi3,mfo3pi4,mfo4pi1,mfo4pi2,otherInitiatives,awards];
    const totalCells = allRows.reduce((acc, rows) => acc + rows.length * Object.keys(rows[0] || {}).length, 0);
    const filledCells = allRows.reduce((acc, rows) => acc + rows.reduce((a, row) => a + Object.values(row).filter((v) => v.trim() !== '').length, 0), 0);
    const textFields = [program, otherAccomplishments, dateSubmitted].filter((v) => v.trim() !== '').length;
    return Math.round(((filledCells + textFields) / (totalCells + 3)) * 100);
  };

  const progress = computeProgress();
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };

  useEffect(() => {
    if (externalPrintTrigger) {
      setShowPrint(true);
      onPrintHandled?.();
    }
  }, [externalPrintTrigger, onPrintHandled]);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        let reportData: any = null;

        if (targetReportId) {
          // If a specific ID was clicked from Track Status (/mine), fetch from mine list or my-draft
          const res = await fetch(`${ACCOMPLISHMENT_API_URL}/mine`, { headers });
          if (res.ok) {
            const list: any[] = await res.json();
            reportData = list.find((r) => r.id === targetReportId);
          }
        }

        if (!reportData) {
          // Fallback to latest draft
          const res = await fetch(`${ACCOMPLISHMENT_API_URL}/my-draft`, { headers });
          if (res.ok) {
            reportData = await res.json();
          }
        }

        if (reportData && reportData.id) {
          setReportId(reportData.id);
          setQuarter(reportData.quarter || '1st');
          setYear(reportData.year || new Date().getFullYear().toString());
          setProgramChair(reportData.program_chair ?? userName);
          setProgram(reportData.program ?? '');
          setOtherAccomplishments(reportData.other_accomplishments ?? '');
          setDateSubmitted(reportData.date_submitted ?? '');
          setStatus(reportData.status || 'draft');
          setDeanRemarks(reportData.dean_remarks || null);

          if (reportData.pi1_data?.length) setPi1(reportData.pi1_data);
          if (reportData.pi2_data?.length) setPi2(reportData.pi2_data);
          if (reportData.pi3_data?.length) setPi3(reportData.pi3_data);
          if (reportData.pi4_data?.length) setPi4(reportData.pi4_data);
          if (reportData.pi5_data?.length) setPi5(reportData.pi5_data);
          if (reportData.pi6_data?.length) setPi6(reportData.pi6_data);
          if (reportData.pi7_data?.length) setPi7(reportData.pi7_data);
          if (reportData.pi8_data?.length) setPi8(reportData.pi8_data);
          if (reportData.mfo3_pi1_data?.length) setMfo3pi1(reportData.mfo3_pi1_data);
          if (reportData.mfo3_pi2_data?.length) setMfo3pi2(reportData.mfo3_pi2_data);
          if (reportData.mfo3_pi3_data?.length) setMfo3pi3(reportData.mfo3_pi3_data);
          if (reportData.mfo3_pi4_data?.length) setMfo3pi4(reportData.mfo3_pi4_data);
          if (reportData.mfo4_pi1_data?.length) setMfo4pi1(reportData.mfo4_pi1_data);
          if (reportData.mfo4_pi2_data?.length) setMfo4pi2(reportData.mfo4_pi2_data);
          if (reportData.other_data?.length) setOtherInitiatives(reportData.other_data);
          if (reportData.awards_data?.length) setAwards(reportData.awards_data);
          if (reportData.doc_entries_data?.length) setDocEntries(reportData.doc_entries_data);
          setLastSavedAt(reportData.updated_at ?? reportData.created_at ?? null);
        }
      } catch (err: any) {
        showError('Could not load report.');
      }
    };

    const loadSubmissions = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllSubmissions((data ?? []).filter((s: any) => s.status === 'approved' || s.status === 'pending'));
        }
      } catch {
        // silent
      }
    };

    loadReportData();
    loadSubmissions();
  }, [userId, userName, targetReportId]);

  const getPayload = (submitStatus: string) => ({
    quarter,
    year,
    program_chair: programChair,
    program,
    pi1_data: pi1,
    pi2_data: pi2,
    pi3_data: pi3,
    pi4_data: pi4,
    pi5_data: pi5,
    pi6_data: pi6,
    pi7_data: pi7,
    pi8_data: pi8,
    mfo3_pi1_data: mfo3pi1,
    mfo3_pi2_data: mfo3pi2,
    mfo3_pi3_data: mfo3pi3,
    mfo3_pi4_data: mfo3pi4,
    mfo4_pi1_data: mfo4pi1,
    mfo4_pi2_data: mfo4pi2,
    other_data: otherInitiatives,
    awards_data: awards,
    doc_entries_data: docEntries,
    other_accomplishments: otherAccomplishments,
    date_submitted: submitStatus === 'submitted' ? (dateSubmitted || new Date().toISOString().split('T')[0]) : dateSubmitted,
    status: submitStatus,
    progress: computeProgress(),
  });

  // Reuses existing reportId with PUT /:id, or creates a new row with POST /
  const persist = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    if (reportId) {
      const res = await fetch(`${ACCOMPLISHMENT_API_URL}/${reportId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }

    const res = await fetch(ACCOMPLISHMENT_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
      showSuccess('Draft saved successfully!');
    } catch (err: any) {
      showError('Failed to save draft: ' + (err?.message || 'Server error'));
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
      showSuccess(isResubmit ? 'Resubmitted to Dean! Status: Under Review.' : 'Submitted to Dean! Status: Under Review.');
      onAfterSubmit?.();
    } catch (err: any) {
      showError('Failed to submit report: ' + (err?.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const addDocEntry = (category: string) => {
    setDocEntries((prev) => [...prev, { id: makeId(), category, title: '', venue: '', date: '', description: '', photos: [] }]);
  };
  const removeDocEntry = (id: string) => setDocEntries((prev) => prev.filter((e) => e.id !== id));
  const updateDocEntryField = (id: string, field: keyof DocEntry, val: string) =>
    setDocEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: val } : e)));

  const handleEntryFilesSelected = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const entry = docEntries.find((en) => en.id === entryId);
    const remaining = MAX_PHOTOS_PER_ENTRY - (entry?.photos.length ?? 0);
    if (remaining <= 0) {
      showError(`Maximum ${MAX_PHOTOS_PER_ENTRY} photos reached.`);
      return;
    }
    const toUpload = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, remaining);
    setUploadingEntryId(entryId);
    try {
      const formData = new FormData();
      formData.append('entryId', entryId);
      toUpload.forEach((f) => formData.append('files', f));

      const res = await fetch(`${ACCOMPLISHMENT_API_URL}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const uploaded: { path: string; url: string }[] = await res.json();
        setDocEntries((prev) =>
          prev.map((en) =>
            en.id === entryId
              ? { ...en, photos: [...en.photos, ...uploaded.map((u) => ({ ...u, caption: '' }))] }
              : en
          )
        );
        showSuccess('Photo(s) attached.');
      }
    } catch {
      showError('Could not upload images.');
    } finally {
      setUploadingEntryId(null);
      if (fileInputRefs.current[entryId]) fileInputRefs.current[entryId]!.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{errorMsg}</div>}

      {/* Dean Rejection Banner */}
      {status === 'rejected' && deanRemarks && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-900">Report Returned by Dean</h4>
            <p className="text-xs text-red-700 mt-1">{deanRemarks}</p>
            <p className="text-[11px] text-red-600 mt-2 font-medium">
              Update the fields below and click <strong>"Resubmit to Dean"</strong>. The same report ID will be updated.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accomplishment Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Program Chairperson Report · SY {year}</p>
          {lastSavedAt && (
            <p className="text-xs text-gray-400 mt-0.5">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>

          {!isFormLocked && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] disabled:opacity-50 shadow-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {status === 'rejected' ? 'Resubmit to Dean' : 'Submit to Dean'}
                  </>
                )}
              </button>
            </>
          )}
          {status === 'submitted' && (
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

      {/* Progress */}
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
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              disabled={isFormLocked}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={isFormLocked}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Program Chairperson</label>
            <input
              type="text"
              value={programChair}
              onChange={(e) => setProgramChair(e.target.value)}
              disabled={isFormLocked}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Program</label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              disabled={isFormLocked}
              placeholder="e.g. BEEd"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      {/* MFO 1 */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 1: Higher Education Services</div>
      <Section title="PI 1: First-time Licensure Examination Passers">
        <EditableTable columns={[{key:'date_exam',label:'LET Exam Date'},{key:'no_first_time',label:'First-time Takers'},{key:'no_passers',label:'Passers'},{key:'passing_pct_first',label:'Passing %'},{key:'total_takers',label:'Total Takers'},{key:'total_passers',label:'Total Passers'},{key:'overall_pct',label:'Overall %'}]} rows={pi1} onChange={setPi1} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 2: Employment of Graduates (2 Years Prior)">
        <EditableTable columns={[{key:'no_graduates',label:'Graduates'},{key:'no_employed',label:'Employed'},{key:'percentage',label:'Percentage'}]} rows={pi2} onChange={setPi2} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 3: Enrollment in Priority Programs">
        <EditableTable columns={[{key:'class_section',label:'Class Section'},{key:'no_enrolled',label:'Enrolled'},{key:'name_adviser',label:'Adviser'}]} rows={pi3} onChange={setPi3} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 4: Syllabi Submissions">
        <EditableTable columns={[{key:'name_faculty',label:'Faculty'},{key:'courses_taught',label:'Courses'},{key:'status_syllabus',label:'Status'},{key:'remarks',label:'Remarks'}]} rows={pi4} onChange={setPi4} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 5: Certifications Acquired (TESDA/ISO/AACCUP)">
        <EditableTable columns={[{key:'name_faculty',label:'Faculty'},{key:'nature_cert',label:'Certification'},{key:'granting_agency',label:'Granting Agency'},{key:'date_granted',label:'Date'}]} rows={pi5} onChange={setPi5} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 6: Faculty Post-Graduate Education">
        <EditableTable columns={[{key:'name_faculty',label:'Faculty'},{key:'program_enrolled',label:'Program'},{key:'total_units',label:'Earned Units'},{key:'units_this_sem',label:'Units This Sem'},{key:'institution',label:'Institution'}]} rows={pi6} onChange={setPi6} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 7: Faculty Trainings/Workshops Attended">
        <EditableTable columns={[{key:'name_faculty',label:'Faculty'},{key:'title_training',label:'Training Title'},{key:'date',label:'Date'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsor'},{key:'role',label:'Role'}]} rows={pi7} onChange={setPi7} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 8: Instructional Materials Produced">
        <EditableTable columns={[{key:'name_faculty',label:'Author(s)'},{key:'title_im',label:'IM Title'},{key:'type_im',label:'Type'},{key:'courses_utilizing',label:'Courses Utilizing'},{key:'ip_protection',label:'IP Protection'}]} rows={pi8} onChange={setPi8} readOnly={isFormLocked} />
      </Section>

      {/* MFO 3: RESEARCH */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 3: Research</div>
      <Section title="PI 1: Research Output Utilized by Industry/Community">
        <EditableTable columns={[{key:'title_research',label:'Research Title'},{key:'proponents',label:'Proponents'},{key:'nature_utilization',label:'Utilization'},{key:'partner_community',label:'Partner Community'},{key:'address',label:'Address'}]} rows={mfo3pi1} onChange={setMfo3pi1} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 2: Research Output Completed Within Quarter">
        <EditableTable columns={[{key:'title_research',label:'Title'},{key:'proponents',label:'Proponents'},{key:'date_completed',label:'Completed Date'},{key:'funding_source',label:'Funding Source'}]} rows={mfo3pi2} onChange={setMfo3pi2} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 3: Refereed Journal Publications">
        <EditableTable columns={[{key:'title_research',label:'Title'},{key:'proponents',label:'Proponents'},{key:'name_publication',label:'Journal/Publication'},{key:'date_published',label:'Date Published'},{key:'funding_source',label:'Funding Source'}]} rows={mfo3pi3} onChange={setMfo3pi3} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 4: Conference Presentations">
        <EditableTable columns={[{key:'title_research',label:'Title'},{key:'proponents',label:'Proponents'},{key:'date',label:'Date'},{key:'sponsoring_agency',label:'Sponsoring Agency'},{key:'venue',label:'Venue'}]} rows={mfo3pi4} onChange={setMfo3pi4} readOnly={isFormLocked} />
      </Section>

      {/* MFO 4: EXTENSION */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">MFO 4: Technical Advisory Extension Program</div>
      <Section title="PI 1: Active Partnerships with LGUs/NGOs/Industries">
        <EditableTable columns={[{key:'title_project',label:'Project Title'},{key:'proponents',label:'Proponents'},{key:'partner',label:'Partner'},{key:'project_locale',label:'Locale'}]} rows={mfo4pi1} onChange={setMfo4pi1} readOnly={isFormLocked} />
      </Section>
      <Section title="PI 2: Weighted Trainees / Manhours">
        <EditableTable columns={[{key:'title_training',label:'Training Title'},{key:'no_beneficiaries',label:'Beneficiaries'},{key:'length_training',label:'Length'},{key:'total_manhours',label:'Manhours'},{key:'partner_agency',label:'Partner'}]} rows={mfo4pi2} onChange={setMfo4pi2} readOnly={isFormLocked} />
      </Section>
      <Section title="Other Initiatives & Institutional Awards">
        <EditableTable columns={[{key:'title_activity',label:'Activity Title'},{key:'date_conducted',label:'Date'},{key:'venue',label:'Venue'},{key:'sponsoring_agency',label:'Sponsor'},{key:'students_involved',label:'Students'},{key:'role_students',label:'Student Role'},{key:'faculty_involved',label:'Faculty'},{key:'role_faculty',label:'Faculty Role'}]} rows={otherInitiatives} onChange={setOtherInitiatives} readOnly={isFormLocked} />
      </Section>

      {/* Other Accomplishments Narrative */}
      <Section title="Other Accomplishments Narrative">
        <textarea
          value={otherAccomplishments}
          onChange={(e) => setOtherAccomplishments(e.target.value)}
          disabled={isFormLocked}
          rows={3}
          placeholder="Grants, policies, departmental milestones..."
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
        />
      </Section>

      {/* Documentation Photos */}
      <div className="bg-[#1E3A8A] text-white px-5 py-3 rounded-xl font-bold text-sm">DOCUMENTATION & EVIDENCE</div>
      {DOC_CATEGORIES.map((cat) => {
        const entries = docEntries.filter((e) => e.category === cat.key);
        return (
          <Section key={cat.key} title={`${cat.label} (${entries.length})`} defaultOpen={entries.length > 0}>
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={entry.title}
                      onChange={(e) => updateDocEntryField(entry.id, 'title', e.target.value)}
                      disabled={isFormLocked}
                      placeholder="Activity Title"
                      className="px-3 py-1.5 border rounded-lg text-sm w-full"
                    />
                    {!isFormLocked && (
                      <button onClick={() => removeDocEntry(entry.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={entry.description}
                    onChange={(e) => updateDocEntryField(entry.id, 'description', e.target.value)}
                    disabled={isFormLocked}
                    rows={2}
                    placeholder="Narrative brief..."
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                  {!isFormLocked && (
                    <div>
                      <input
                        ref={(el) => { fileInputRefs.current[entry.id] = el; }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleEntryFilesSelected(entry.id, e)}
                        className="hidden"
                        id={`photo-${entry.id}`}
                      />
                      <label
                        htmlFor={`photo-${entry.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer border border-blue-200"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Screenshot / Photo
                      </label>
                    </div>
                  )}
                  {entry.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {entry.photos.map((p, i) => (
                        <div key={i} className="border rounded-lg overflow-hidden bg-white">
                          <img src={p.url} alt={`Ev ${i}`} className="w-full h-24 object-cover" />
                          <input
                            type="text"
                            value={p.caption}
                            disabled={isFormLocked}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDocEntries((prev) =>
                                prev.map((en) =>
                                  en.id === entry.id
                                    ? {
                                        ...en,
                                        photos: en.photos.map((pt, idx) =>
                                          idx === i ? { ...pt, caption: val } : pt
                                        ),
                                      }
                                    : en
                                )
                              );
                            }}
                            placeholder="Caption..."
                            className="w-full px-1.5 py-1 text-[10px] border-t"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!isFormLocked && (
                <button
                  onClick={() => addDocEntry(cat.key)}
                  className="text-xs text-[#1E3A8A] font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Activity Documentation
                </button>
              )}
            </div>
          </Section>
        );
      })}

      {/* Print View Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8">
            <div className="flex justify-between items-center pb-4 border-b mb-4">
              <h3 className="font-bold text-gray-900">Print Preview — Accomplishment Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div id="print-area" className="text-xs leading-relaxed">
              <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain mb-4" />
              <div className="text-center font-bold uppercase mb-4">
                Accomplishment Report — {quarter} Quarter, SY {year}
                <div className="text-xs font-normal normal-case">Program: {program} | Submitted by: {programChair}</div>
              </div>
              <p className="font-bold underline mt-4 mb-1">MFO 1: Higher Education Services (LET Passing)</p>
              <table className="w-full border border-black border-collapse text-[11px] mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1">Exam Date</th>
                    <th className="border border-black p-1">First-time Passers</th>
                    <th className="border border-black p-1">Total Passers</th>
                    <th className="border border-black p-1">Overall %</th>
                  </tr>
                </thead>
                <tbody>
                  {pi1.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{r.date_exam}</td>
                      <td className="border border-black p-1">{r.no_passers}</td>
                      <td className="border border-black p-1">{r.total_passers}</td>
                      <td className="border border-black p-1">{r.overall_pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain mt-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. EXTENSION REPORT COMPONENT
// ============================================================================
interface ExtensionReportRow {
  extension_project: string;
  highlights: string;
  partner_linkage: string;
  num_trainees: string;
  venue: string;
  inclusive_date: string;
}

const EMPTY_EXTENSION_ROW: ExtensionReportRow = {
  extension_project: '',
  highlights: '',
  partner_linkage: '',
  num_trainees: '',
  venue: '',
  inclusive_date: '',
};

export function ExtensionReport({
  userId,
  userName,
  targetReportId,
  readOnly = false,
  onAfterSubmit,
  externalPrintTrigger = false,
  onPrintHandled,
}: {
  userId: string;
  userName: string;
  targetReportId?: string;
  readOnly?: boolean;
  onAfterSubmit?: () => void;
  externalPrintTrigger?: boolean;
  onPrintHandled?: () => void;
}) {
  const [quarter, setQuarter] = useState('1st');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rows, setRows] = useState<ExtensionReportRow[]>([{ ...EMPTY_EXTENSION_ROW }, { ...EMPTY_EXTENSION_ROW }]);
  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');
  const [reportId, setReportId] = useState<string | null>(targetReportId || null);
  const [deanRemarks, setDeanRemarks] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [preparedByName, setPreparedByName] = useState(userName);
  const [preparedByTitle, setPreparedByTitle] = useState('Extension Chairperson');
  const [notedByName1, setNotedByName1] = useState('TERESITA CLEOPOLDA B. SARILE');
  const [notedByTitle1, setNotedByTitle1] = useState('Chair, Extension Services');
  const [notedByName2, setNotedByName2] = useState('EINGILBERT C. BENOLIRAO');
  const [notedByTitle2, setNotedByTitle2] = useState('Campus Director');

  const isFormLocked = readOnly || status === 'submitted' || status === 'approved';

  useEffect(() => {
    if (externalPrintTrigger) {
      setShowPrint(true);
      onPrintHandled?.();
    }
  }, [externalPrintTrigger, onPrintHandled]);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        let reportData: any = null;

        if (targetReportId) {
          const res = await fetch(`${EXTENSION_API_URL}/mine`, { headers });
          if (res.ok) {
            const list: any[] = await res.json();
            reportData = list.find((r) => r.id === targetReportId);
          }
        }

        if (!reportData) {
          const res = await fetch(`${EXTENSION_API_URL}/my-draft`, { headers });
          if (res.ok) {
            reportData = await res.json();
          }
        }

        if (reportData && reportData.id) {
          setReportId(reportData.id);
          setQuarter(reportData.quarter || '1st');
          setYear(reportData.year || new Date().getFullYear().toString());
          setRows(reportData.rows?.length > 0 ? reportData.rows : [{ ...EMPTY_EXTENSION_ROW }, { ...EMPTY_EXTENSION_ROW }]);
          setStatus(reportData.status || 'draft');
          setDeanRemarks(reportData.dean_remarks || null);
          setPreparedByName(reportData.prepared_by_name ?? userName);
          setPreparedByTitle(reportData.prepared_by_title ?? 'Extension Chairperson');
          setNotedByName1(reportData.noted_by_name_1 ?? 'TERESITA CLEOPOLDA B. SARILE');
          setNotedByTitle1(reportData.noted_by_title_1 ?? 'Chair, Extension Services');
          setNotedByName2(reportData.noted_by_name_2 ?? 'EINGILBERT C. BENOLIRAO');
          setNotedByTitle2(reportData.noted_by_title_2 ?? 'Campus Director');
          setLastSavedAt(reportData.updated_at ?? reportData.created_at ?? null);
        }
      } catch {
        // silent
      }
    };
    loadReportData();
  }, [userId, userName, targetReportId]);

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_EXTENSION_ROW }]);
  const deleteRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateCell = (rowIdx: number, field: keyof ExtensionReportRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === rowIdx ? { ...row, [field]: value } : row)));
  };

  const getPayload = (submitStatus: string) => ({
    quarter,
    year,
    rows,
    prepared_by_name: preparedByName,
    prepared_by_title: preparedByTitle,
    noted_by_name_1: notedByName1,
    noted_by_title_1: notedByTitle1,
    noted_by_name_2: notedByName2,
    noted_by_title_2: notedByTitle2,
    status: submitStatus,
    progress: Math.min(100, Math.round((rows.filter((r) => r.extension_project.trim()).length / Math.max(rows.length, 1)) * 100)),
  });

  const persist = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    if (reportId) {
      const res = await fetch(`${EXTENSION_API_URL}/${reportId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    }
    const res = await fetch(EXTENSION_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Save failed');
    return res.json();
  };

  const handleSave = async (submitStatus: 'draft' | 'submitted') => {
    if (isFormLocked || saving) return;
    setSaving(true);
    try {
      const isResubmit = status === 'rejected';
      const data = await persist(getPayload(submitStatus));
      if (!reportId && data?.id) setReportId(data.id);
      setStatus(submitStatus);
      setLastSavedAt(new Date().toISOString());
      setSuccessMsg(
        submitStatus === 'submitted'
          ? isResubmit
            ? 'Resubmitted to Dean! Status: Under Review.'
            : 'Submitted to Dean! Status: Under Review.'
          : 'Draft saved!'
      );
      setTimeout(() => setSuccessMsg(''), 3000);
      if (submitStatus === 'submitted') onAfterSubmit?.();
    } catch {
      setErrorMsg('Failed to update extension report.');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">{errorMsg}</div>}

      {status === 'rejected' && deanRemarks && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-red-900">Extension Report Returned by Dean</h4>
            <p className="text-xs text-red-700 mt-1">{deanRemarks}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Community Extension Services Accomplishment Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Quarterly Extension Activities · 20{year.slice(-2)}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          {!isFormLocked && (
            <>
              <button onClick={() => handleSave('draft')} disabled={saving} className="px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-semibold hover:bg-blue-100 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave('submitted')} disabled={saving} className="px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-50">
                {saving ? 'Submitting...' : status === 'rejected' ? 'Resubmit to Dean' : 'Submit to Dean'}
              </button>
            </>
          )}
          {status === 'submitted' && (
            <span className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Under Review by Dean
            </span>
          )}
          {status === 'approved' && (
            <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Approved
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Quarter</label>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} disabled={isFormLocked} className="px-3 py-1.5 border rounded-lg text-sm bg-white">
            <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
          <input type="text" value={year} onChange={(e) => setYear(e.target.value)} disabled={isFormLocked} className="px-3 py-1.5 border rounded-lg text-sm w-24" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="p-2.5 text-left w-8">#</th>
                <th className="p-2.5 text-left">Extension Project / Activity</th>
                <th className="p-2.5 text-left">Highlights of Accomplishment</th>
                <th className="p-2.5 text-left">Partner / Linkage</th>
                <th className="p-2.5 text-left w-24">No. Trainees</th>
                <th className="p-2.5 text-left">Venue</th>
                <th className="p-2.5 text-left">Inclusive Date</th>
                {!isFormLocked && <th className="p-2.5 w-8" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 text-gray-400">{idx + 1}</td>
                  {(['extension_project', 'highlights', 'partner_linkage', 'num_trainees', 'venue', 'inclusive_date'] as (keyof ExtensionReportRow)[]).map((field) => (
                    <td key={field} className="p-1.5">
                      <textarea
                        value={row[field]}
                        onChange={(e) => updateCell(idx, field, e.target.value)}
                        disabled={isFormLocked}
                        rows={2}
                        className="w-full p-1.5 border border-gray-200 rounded text-xs resize-none"
                      />
                    </td>
                  ))}
                  {!isFormLocked && (
                    <td className="p-1.5 text-center">
                      <button onClick={() => deleteRow(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isFormLocked && (
          <div className="p-3 border-t">
            <button onClick={addRow} className="text-xs text-[#1E3A8A] font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Add Project Row
            </button>
          </div>
        )}
      </div>

      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 text-xs">
            <div className="flex justify-between items-center pb-4 border-b mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Print Preview — Community Extension Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div id="print-area">
              <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain mb-4" />
              <div className="text-center font-bold uppercase mb-4 text-sm">
                Community Extension Services Accomplishment Report
                <div className="text-xs font-normal mt-0.5">{quarter} Quarter, 20{year.slice(-2)}</div>
              </div>
              <table className="w-full border-collapse border border-black text-[11px] mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1">Project/Activity</th>
                    <th className="border border-black p-1">Highlights</th>
                    <th className="border border-black p-1">Partner</th>
                    <th className="border border-black p-1">Trainees</th>
                    <th className="border border-black p-1">Venue</th>
                    <th className="border border-black p-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{r.extension_project}</td>
                      <td className="border border-black p-1">{r.highlights}</td>
                      <td className="border border-black p-1">{r.partner_linkage}</td>
                      <td className="border border-black p-1">{r.num_trainees}</td>
                      <td className="border border-black p-1">{r.venue}</td>
                      <td className="border border-black p-1">{r.inclusive_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain mt-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. WORK FROM HOME (WFH) REPORT COMPONENT
// ============================================================================
interface DailyAccomplishment {
  date: string;
  activities: string;
  output: string;
}

interface PhotoItem {
  path?: string;
  url: string;
  caption?: string;
}

const SUPPORTING_DOC_OPTIONS = [
  { key: 'online_class', label: 'Screenshot of Online Class' },
  { key: 'teams_zoom', label: 'MS Teams/Zoom Attendance' },
  { key: 'lms_activity', label: 'Learning Management System (LMS) Activity' },
  { key: 'lesson_plan', label: 'Lesson Plan / Learning Materials' },
  { key: 'consultation_log', label: 'Student Consultation Log' },
  { key: 'research_output', label: 'Research Output' },
  { key: 'extension_report', label: 'Extension Report' },
  { key: 'meeting_attendance', label: 'Meeting Attendance/Minutes' },
  { key: 'office_report', label: 'Office Report' },
];

export function WfhReport({
  userId,
  userName,
  targetReportId,
  readOnly = false,
  onAfterSubmit,
  externalPrintTrigger = false,
  onPrintHandled,
}: {
  userId: string;
  userName: string;
  targetReportId?: string;
  readOnly?: boolean;
  onAfterSubmit?: () => void;
  externalPrintTrigger?: boolean;
  onPrintHandled?: () => void;
}) {
  const [reportId, setReportId] = useState<string | null>(targetReportId || null);
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [name, setName] = useState(userName);
  const [positionRank, setPositionRank] = useState('');
  const [collegeOffice, setCollegeOffice] = useState('');
  const [programUnit, setProgramUnit] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('');
  const [workingHours, setWorkingHours] = useState('8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M.');

  const [dailyAccomplishments, setDailyAccomplishments] = useState<DailyAccomplishment[]>([
    { date: '', activities: '', output: '' },
  ]);

  const [supportingDocs, setSupportingDocs] = useState<Record<string, boolean>>({
    online_class: false,
    teams_zoom: false,
    lms_activity: false,
    lesson_plan: false,
    consultation_log: false,
    research_output: false,
    extension_report: false,
    meeting_attendance: false,
    office_report: false,
    other: false,
  });
  const [otherDocsSpecify, setOtherDocsSpecify] = useState('');

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preparedByName, setPreparedByName] = useState(userName);
  const [preparedByDate, setPreparedByDate] = useState('');
  const [verifiedByName, setVerifiedByName] = useState('');
  const [verifiedByTitle, setVerifiedByTitle] = useState('Program Chairperson / Immediate Supervisor');
  const [verifiedByDate, setVerifiedByDate] = useState('');
  const [notedByName, setNotedByName] = useState('');
  const [notedByTitle, setNotedByTitle] = useState('Dean');
  const [notedByDate, setNotedByDate] = useState('');

  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');
  const [deanRemarks, setDeanRemarks] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const isFormLocked = readOnly || status === 'submitted' || status === 'approved';

  useEffect(() => {
    if (externalPrintTrigger) {
      setShowPrint(true);
      onPrintHandled?.();
    }
  }, [externalPrintTrigger, onPrintHandled]);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        let data: any = null;

        if (targetReportId) {
          const res = await fetch(`${WFH_API_URL}/mine`, { headers });
          if (res.ok) {
            const list: any[] = await res.json();
            data = list.find((r) => r.id === targetReportId);
          }
        }

        if (!data) {
          const res = await fetch(`${WFH_API_URL}/my-draft`, { headers });
          if (res.ok) {
            data = await res.json();
          }
        }

        if (data && data.id) {
          setReportId(data.id);
          setReportingPeriod(data.reporting_period ?? '');
          setName(data.name ?? userName);
          setPositionRank(data.position_rank ?? '');
          setCollegeOffice(data.college_office ?? '');
          setProgramUnit(data.program_unit ?? '');
          setAdminDesignation(data.admin_designation ?? '');
          setWorkingHours(data.working_hours ?? '8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M.');
          if (data.daily_accomplishments?.length) setDailyAccomplishments(data.daily_accomplishments);
          if (data.supporting_docs) setSupportingDocs(data.supporting_docs);
          setOtherDocsSpecify(data.other_docs_specify ?? '');
          if (data.photos?.length) setPhotos(data.photos);
          setPreparedByName(data.prepared_by_name ?? userName);
          setPreparedByDate(data.prepared_by_date ?? '');
          setVerifiedByName(data.verified_by_name ?? '');
          setVerifiedByTitle(data.verified_by_title ?? 'Program Chairperson / Immediate Supervisor');
          setVerifiedByDate(data.verified_by_date ?? '');
          setNotedByName(data.noted_by_name ?? '');
          setNotedByTitle(data.noted_by_title ?? 'Dean');
          setNotedByDate(data.noted_by_date ?? '');
          setStatus(data.status ?? 'draft');
          setDeanRemarks(data.dean_remarks || null);
          setLastSavedAt(data.updated_at ?? null);
        }
      } catch {
        // silent
      }
    };
    loadReportData();
  }, [userId, userName, targetReportId]);

  const addRow = () => {
    setDailyAccomplishments((prev) => [...prev, { date: '', activities: '', output: '' }]);
  };

  const deleteRow = (idx: number) => {
    if (dailyAccomplishments.length <= 1) return;
    setDailyAccomplishments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof DailyAccomplishment, value: string) => {
    setDailyAccomplishments((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleCheckboxChange = (key: string) => {
    if (isFormLocked) return;
    setSupportingDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));

      const res = await fetch(`${WFH_API_URL}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (res.ok) {
        const uploaded: { url: string; path?: string }[] = await res.json();
        setPhotos((prev) => [...prev, ...uploaded.map((u) => ({ url: u.url, path: u.path, caption: '' }))]);
        setSuccessMsg('Evidence photo(s) uploaded!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Failed to upload image(s).');
        setTimeout(() => setErrorMsg(''), 3500);
      }
    } catch {
      setErrorMsg('Could not upload images.');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getPayload = (submitStatus: string) => ({
    reporting_period: reportingPeriod,
    name,
    position_rank: positionRank,
    college_office: collegeOffice,
    program_unit: programUnit,
    admin_designation: adminDesignation,
    working_hours: workingHours,
    daily_accomplishments: dailyAccomplishments,
    supporting_docs: supportingDocs,
    other_docs_specify: otherDocsSpecify,
    photos,
    prepared_by_name: preparedByName,
    prepared_by_date: preparedByDate,
    verified_by_name: verifiedByName,
    verified_by_title: verifiedByTitle,
    verified_by_date: verifiedByDate,
    noted_by_name: notedByName,
    noted_by_title: notedByTitle,
    noted_by_date: notedByDate,
    status: submitStatus,
    progress: Math.min(
      100,
      Math.round(
        (dailyAccomplishments.filter((a) => a.activities.trim() && a.output.trim()).length /
          Math.max(dailyAccomplishments.length, 1)) *
          100
      )
    ),
  });

  const persist = async (payload: Record<string, unknown>) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    if (reportId) {
      const res = await fetch(`${WFH_API_URL}/${reportId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    }
    const res = await fetch(WFH_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Save failed');
    return res.json();
  };

  const handleSave = async (submitStatus: 'draft' | 'submitted') => {
    if (isFormLocked || saving) return;
    setSaving(true);
    try {
      const isResubmit = status === 'rejected';
      const data = await persist(getPayload(submitStatus));
      if (!reportId && data?.id) setReportId(data.id);
      setStatus(submitStatus);
      setLastSavedAt(new Date().toISOString());
      setSuccessMsg(
        submitStatus === 'submitted'
          ? isResubmit
            ? 'Resubmitted to Dean! Status: Under Review.'
            : 'WFH Report Submitted to Dean!'
          : 'Draft Saved!'
      );
      setTimeout(() => setSuccessMsg(''), 3000);
      if (submitStatus === 'submitted') onAfterSubmit?.();
    } catch {
      setErrorMsg('Error saving report.');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">{successMsg}</div>}
      {errorMsg && <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">{errorMsg}</div>}

      {/* Dean Rejection Banner */}
      {status === 'rejected' && deanRemarks && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-red-900">WFH Report Returned by Dean</h4>
            <p className="text-xs text-red-700 mt-1">{deanRemarks}</p>
            <p className="text-[11px] text-red-600 mt-1 font-medium">
              Update your report details below and click <strong>"Resubmit to Dean"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Work-From-Home (WFH) Accomplishment Report</h2>
          <p className="text-xs text-gray-500 mt-1">In Compliance with the CSC Work-from-Home Arrangement</p>
          {lastSavedAt && <p className="text-[11px] text-gray-400 mt-0.5">Last saved: {new Date(lastSavedAt).toLocaleString()}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPrint(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          {!isFormLocked && (
            <>
              <button onClick={() => handleSave('draft')} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm hover:bg-blue-100 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave('submitted')} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm hover:bg-[#1E40AF] disabled:opacity-50 shadow-xs">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {status === 'rejected' ? 'Resubmit to Dean' : 'Submit to Dean'}
                  </>
                )}
              </button>
            </>
          )}
          {status === 'submitted' && (
            <span className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Under Review
            </span>
          )}
          {status === 'approved' && (
            <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Approved
            </span>
          )}
        </div>
      </div>

      {/* Header Info Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">Faculty Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-gray-600 mb-1">Reporting Period</label>
            <input type="text" value={reportingPeriod} onChange={(e) => setReportingPeriod(e.target.value)} disabled={isFormLocked} placeholder="e.g. August 7 and 14, 2026" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Faculty Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isFormLocked} placeholder="Full Name" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Position / Academic Rank</label>
            <input type="text" value={positionRank} onChange={(e) => setPositionRank(e.target.value)} disabled={isFormLocked} placeholder="e.g. Instructor I" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">College / Office</label>
            <input type="text" value={collegeOffice} onChange={(e) => setCollegeOffice(e.target.value)} disabled={isFormLocked} placeholder="e.g. College of Technology and Engineering" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Program / Unit</label>
            <input type="text" value={programUnit} onChange={(e) => setProgramUnit(e.target.value)} disabled={isFormLocked} placeholder="e.g. BIT-CT" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block font-medium text-gray-600 mb-1">Administrative Designation (if any)</label>
            <input type="text" value={adminDesignation} onChange={(e) => setAdminDesignation(e.target.value)} disabled={isFormLocked} placeholder="N/A or Designation" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block font-medium text-gray-600 mb-1">Official Working Hours</label>
            <input type="text" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} disabled={isFormLocked} placeholder="8:00 A.M. – 12:00 NOON | 1:00 P.M. – 5:00 P.M." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* Section I: Daily Accomplishments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">I. Daily Accomplishments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="px-3 py-2 text-left w-36">Date</th>
                <th className="px-3 py-2 text-left">Activities Accomplished</th>
                <th className="px-3 py-2 text-left">Output / Deliverable</th>
                {!isFormLocked && <th className="px-2 py-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {dailyAccomplishments.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-1 border border-gray-200 align-top">
                    <input type="text" value={item.date} onChange={(e) => updateRow(idx, 'date', e.target.value)} disabled={isFormLocked} placeholder="Date" className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent" />
                  </td>
                  <td className="p-1 border border-gray-200 align-top">
                    <textarea rows={2} value={item.activities} onChange={(e) => updateRow(idx, 'activities', e.target.value)} disabled={isFormLocked} placeholder="Describe activities accomplished..." className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent resize-none" />
                  </td>
                  <td className="p-1 border border-gray-200 align-top">
                    <textarea rows={2} value={item.output} onChange={(e) => updateRow(idx, 'output', e.target.value)} disabled={isFormLocked} placeholder="Output or deliverable produced..." className="w-full p-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent resize-none" />
                  </td>
                  {!isFormLocked && (
                    <td className="p-1 border border-gray-200 text-center align-middle">
                      <button onClick={() => deleteRow(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isFormLocked && (
          <button onClick={addRow} className="flex items-center gap-1 text-xs text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Date
          </button>
        )}
      </div>

      {/* Section II: Supporting Documents Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">II. Supporting Documents Attached</h3>
        <p className="text-xs text-gray-400 italic -mt-2">(Check all applicable.)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {SUPPORTING_DOC_OPTIONS.map((doc) => (
            <label key={doc.key} className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={!!supportingDocs[doc.key]} onChange={() => handleCheckboxChange(doc.key)} disabled={isFormLocked} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-700">{doc.label}</span>
            </label>
          ))}
          <div className="sm:col-span-2 md:col-span-3 flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <input type="checkbox" checked={!!supportingDocs.other} onChange={() => handleCheckboxChange('other')} disabled={isFormLocked} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-700 font-medium">Other:</span>
            </label>
            <input type="text" value={otherDocsSpecify} onChange={(e) => setOtherDocsSpecify(e.target.value)} disabled={isFormLocked || !supportingDocs.other} placeholder="Specify other supporting document" className="flex-1 px-2 py-1 border-b border-gray-300 focus:border-blue-600 outline-none text-xs disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* Section III: Photos / Visual Evidences */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Evidence Screenshots & Photos</h3>
          {!isFormLocked && (
            <div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" id="wfh-photo-upload" onChange={handlePhotoUpload} />
              <label htmlFor="wfh-photo-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold cursor-pointer">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading...' : 'Upload Screenshot'}
              </label>
            </div>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
            <ImageIcon className="w-6 h-6 text-gray-300" />
            No screenshot evidences attached yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((item, idx) => (
              <div key={idx} className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <img src={item.url} alt={`Evidence ${idx + 1}`} className="w-full h-44 object-contain bg-white" />
                {!isFormLocked && (
                  <button onClick={() => removePhoto(idx)} className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, caption: val } : p)));
                  }}
                  disabled={isFormLocked}
                  placeholder="Caption (optional)"
                  className="w-full text-[11px] px-2 py-1.5 border-t border-gray-200 outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certification & Signatures */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Certification</h3>
        <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-[#1E3A8A] pl-3">
          I hereby certify that the foregoing information is true and correct and that I performed my official duties during the approved Work-from-Home arrangement in accordance with the Civil Service Commission guidelines and the policies of Cebu Technological University.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
          {/* Prepared by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Prepared by:</p>
            <input type="text" value={preparedByName} onChange={(e) => setPreparedByName(e.target.value)} disabled={isFormLocked} placeholder="Faculty Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <p className="text-[11px] text-gray-500">Signature Over Printed Name</p>
            <input type="date" value={preparedByDate} onChange={(e) => setPreparedByDate(e.target.value)} disabled={isFormLocked} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>

          {/* Verified by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Verified by:</p>
            <input type="text" value={verifiedByName} onChange={(e) => setVerifiedByName(e.target.value)} disabled={isFormLocked} placeholder="Chairperson / Supervisor Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <input type="text" value={verifiedByTitle} onChange={(e) => setVerifiedByTitle(e.target.value)} disabled={isFormLocked} placeholder="Position / Designation" className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
            <input type="date" value={verifiedByDate} onChange={(e) => setVerifiedByDate(e.target.value)} disabled={isFormLocked} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>

          {/* Noted by */}
          <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700">Noted by:</p>
            <input type="text" value={notedByName} onChange={(e) => setNotedByName(e.target.value)} disabled={isFormLocked} placeholder="Dean Name" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white" />
            <input type="text" value={notedByTitle} onChange={(e) => setNotedByTitle(e.target.value)} disabled={isFormLocked} placeholder="Position / Designation" className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
            <input type="date" value={notedByDate} onChange={(e) => setNotedByDate(e.target.value)} disabled={isFormLocked} className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white" />
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-sm">Print Preview — WFH Accomplishment Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowPrint(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-8 text-xs font-serif leading-relaxed" id="print-area">
              <div className="mb-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              <div className="text-center mb-5">
                <h1 className="font-bold text-sm uppercase">WORK-FROM-HOME (WFH) ACCOMPLISHMENT REPORT</h1>
                <p className="italic text-[11px]">(In Compliance with the CSC Work-from-Home Arrangement)</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4 text-[11px]">
                <p><strong>Reporting Period:</strong> {reportingPeriod || '____________________'}</p>
                <p><strong>Program/Unit:</strong> {programUnit || '____________________'}</p>
                <p><strong>Name:</strong> {name || '____________________'}</p>
                <p><strong>Administrative Designation (if any):</strong> {adminDesignation || 'N/A'}</p>
                <p><strong>Position/Academic Rank:</strong> {positionRank || '____________________'}</p>
                <p><strong>Official Working Hours:</strong> {workingHours || '____________________'}</p>
                <p className="col-span-2"><strong>College/Office:</strong> {collegeOffice || '____________________'}</p>
              </div>

              {/* I. Daily Accomplishments */}
              <div className="mb-4">
                <p className="font-bold mb-1.5">I. DAILY ACCOMPLISHMENTS</p>
                <table className="w-full border-collapse border border-black text-[10.5px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-2 py-1 text-left w-28">Date</th>
                      <th className="border border-black px-2 py-1 text-left">Activities Accomplished</th>
                      <th className="border border-black px-2 py-1 text-left">Output/Deliverable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAccomplishments.map((r, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-2 align-top">{r.date}</td>
                        <td className="border border-black px-2 py-2 align-top">{r.activities}</td>
                        <td className="border border-black px-2 py-2 align-top">{r.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* II. Supporting Documents Attached */}
              <div className="mb-4">
                <p className="font-bold mb-1">II. SUPPORTING DOCUMENTS ATTACHED</p>
                <p className="italic text-[10px] mb-2">(Check all applicable.)</p>
                <div className="grid grid-cols-2 gap-y-1 text-[10.5px]">
                  {SUPPORTING_DOC_OPTIONS.map((d) => (
                    <div key={d.key} className="flex items-center gap-1.5">
                      <span>{supportingDocs[d.key] ? '☒' : '☐'}</span>
                      <span>{d.label}</span>
                    </div>
                  ))}
                  <div className="col-span-2 flex items-center gap-1.5 mt-1">
                    <span>{supportingDocs.other ? '☒' : '☐'}</span>
                    <span>Other: <u>&nbsp;{otherDocsSpecify || '___________________________'}&nbsp;</u></span>
                  </div>
                </div>
              </div>

              {/* Photos in print */}
              {photos.length > 0 && (
                <div className="my-6 break-before-auto">
                  <p className="font-bold mb-3">ATTACHMENTS / EVIDENCES</p>
                  <div className="space-y-4">
                    {photos.map((p, i) => (
                      <div key={i} className="border border-black p-2 flex flex-col items-center">
                        <img src={p.url} alt={`Evidence ${i + 1}`} className="max-h-72 object-contain" />
                        {p.caption && <p className="text-[10px] mt-1 font-sans">{p.caption}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certification */}
              <div className="mt-6">
                <p className="font-bold mb-1">CERTIFICATION</p>
                <p className="text-justify text-[10.5px] leading-relaxed mb-8">
                  I hereby certify that the foregoing information is true and correct and that I performed my official duties during the approved Work-from-Home arrangement in accordance with the Civil Service Commission guidelines and the policies of Cebu Technological University.
                </p>

                <div className="grid grid-cols-3 gap-6 text-center text-[10.5px]">
                  <div>
                    <p className="text-left font-semibold mb-8">Prepared by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{preparedByName || '____________________'}</p>
                    <p className="text-[9.5px]">Faculty Member</p>
                    <p className="text-[9.5px] mt-1">Date: {preparedByDate || '____________'}</p>
                  </div>

                  <div>
                    <p className="text-left font-semibold mb-8">Verified by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{verifiedByName || '____________________'}</p>
                    <p className="text-[9.5px]">{verifiedByTitle}</p>
                    <p className="text-[9.5px] mt-1">Date: {verifiedByDate || '____________'}</p>
                  </div>

                  <div>
                    <p className="text-left font-semibold mb-8">Noted by:</p>
                    <div className="border-b border-black mx-auto mb-1" />
                    <p className="font-bold uppercase">{notedByName || '____________________'}</p>
                    <p className="text-[9.5px]">{notedByTitle}</p>
                    <p className="text-[9.5px] mt-1">Date: {notedByDate || '____________'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. UNIFIED REPORTS SECTION
// ============================================================================
export function ReportsSection({ userId, userName }: { userId: string; userName: string }) {
  const [tab, setTab] = useState<'drafts' | 'track' | 'accomplishment' | 'extension' | 'wfh'>('track');
  const [activeReportId, setActiveReportId] = useState<string | undefined>(undefined);
  const [printRequest, setPrintRequest] = useState<ReportType | null>(null);

  const handleOpenReport = (type: ReportType, targetId?: string) => {
    setActiveReportId(targetId);
    setTab(type);
  };

  const handlePrintApproved = (type: ReportType, targetId?: string) => {
    setActiveReportId(targetId);
    setPrintRequest(type);
    setTab(type);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Reports</h1>

      <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => { setActiveReportId(undefined); setTab('drafts'); }}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'drafts' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Drafts
        </button>
        <button
          type="button"
          onClick={() => { setActiveReportId(undefined); setTab('track'); }}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'track' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Track Status
        </button>
        <button
          type="button"
          onClick={() => { setActiveReportId(undefined); setTab('accomplishment'); }}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'accomplishment' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Accomplishment Report
        </button>
        <button
          type="button"
          onClick={() => { setActiveReportId(undefined); setTab('extension'); }}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'extension' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Extension Report
        </button>
        <button
          type="button"
          onClick={() => { setActiveReportId(undefined); setTab('wfh'); }}
          className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            tab === 'wfh' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          WFH Report
        </button>
      </div>

      {tab === 'drafts' && <MyDraftsPanel onEdit={handleOpenReport} />}

      {tab === 'track' && (
        <ReportTrackerPanel
          onOpenReport={handleOpenReport}
          onPrintApproved={handlePrintApproved}
        />
      )}

      {tab === 'accomplishment' && (
        <AccomplishmentReport
          key={`acc-${activeReportId || 'new'}`}
          userId={userId}
          userName={userName}
          targetReportId={activeReportId}
          onAfterSubmit={() => setTab('track')}
          externalPrintTrigger={printRequest === 'accomplishment'}
          onPrintHandled={() => setPrintRequest(null)}
        />
      )}

      {tab === 'extension' && (
        <ExtensionReport
          key={`ext-${activeReportId || 'new'}`}
          userId={userId}
          userName={userName}
          targetReportId={activeReportId}
          onAfterSubmit={() => setTab('track')}
          externalPrintTrigger={printRequest === 'extension'}
          onPrintHandled={() => setPrintRequest(null)}
        />
      )}

      {tab === 'wfh' && (
        <WfhReport
          key={`wfh-${activeReportId || 'new'}`}
          userId={userId}
          userName={userName}
          targetReportId={activeReportId}
          onAfterSubmit={() => setTab('track')}
          externalPrintTrigger={printRequest === 'wfh'}
          onPrintHandled={() => setPrintRequest(null)}
        />
      )}
    </div>
  );
}