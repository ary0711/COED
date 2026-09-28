import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  FileSpreadsheet,
  Info,
  Search,
  Award,
  Users,
  TrendingUp,
  Printer,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';

// How many data rows (excluding the header row) to show in the
// pre-upload preview table. The full file is still sent to the backend
// when generating — this cap is just to keep the preview compact.
const PREVIEW_ROW_LIMIT = 8;

interface DeansListStudent {
  name: string;
  course: string;
  gwa: number;
  units: number;
}

// A saved "batch" (comes from the database, so it survives refresh / logout).
interface DeansListHistoryItem {
  batchId: string;
  semesterLabel: string;
  college: string;
  totalStudents: number;
  totalQualifiers: number;
  isPublished: boolean;
  publishedAt: string | null;
  generatedAt: string; // ISO date
}

interface PublishResult {
  type: 'success' | 'error';
  text: string;
}

interface DeansListGeneratorProps {
  userId: string;
  userName?: string;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE_MB = 10;

export function DeansListGenerator({ userId }: DeansListGeneratorProps) {
  // ── Form state ──
  const [academicYear, setAcademicYear] = useState('2025–2026');
  const [semester, setSemester] = useState('2nd Semester');
  const [college, setCollege] = useState('College of Education');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // ── Request state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DeansListStudent[] | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string>('');

  // ── Publish state (updates students' Academic Standing) ──
  const [batchId, setBatchId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // ── Results table controls ──
  const [query, setQuery] = useState('');
  const [sortAsc] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Pre-upload file preview state ──
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewTotalRows, setPreviewTotalRows] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Generation history (saved in the database) ──
  const [history, setHistory] = useState<DeansListHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingId, setViewingId] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const semesterLabel = `${semester} AY ${academicYear}`;

  // The semester shown on the results/letterhead. It follows the batch being
  // viewed (e.g. from History), not whatever is currently typed in the form.
  const [resultsLabel, setResultsLabel] = useState('');
  const displayLabel = resultsLabel || semesterLabel;

  const formatHistoryDate = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/deans-list/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load the history.');
      setHistory(data.batches || []);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load the history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type "${ext}". Please upload ${ACCEPTED_EXTENSIONS.join(', ')} only.`;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const clearPreview = () => {
    setPreviewHeaders([]);
    setPreviewRows([]);
    setPreviewTotalRows(0);
    setPreviewError('');
    setPreviewLoading(false);
    setShowPreviewModal(false);
  };

  // Reads the file entirely client-side (nothing is uploaded yet) just to
  // render a quick look at its columns and first few rows.
  const parsePreview = (f: File) => {
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewHeaders([]);
    setPreviewRows([]);
    setPreviewTotalRows(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

        if (!rows || rows.length === 0) {
          setPreviewError('The file looks empty — no rows were found.');
          return;
        }

        const [header, ...dataRows] = rows;
        const cleanHeader = header.map((h: any) => {
          const val = String(h ?? '').trim();
          return val || '(blank)';
        });
        const cleanRows = dataRows
          .filter(r => r.some((cell: any) => String(cell ?? '').trim() !== ''))
          .slice(0, PREVIEW_ROW_LIMIT)
          .map(r => cleanHeader.map((_: any, i: number) => String(r[i] ?? '').trim()));
        const totalDataRows = dataRows.filter(r => r.some((cell: any) => String(cell ?? '').trim() !== '')).length;

        setPreviewHeaders(cleanHeader);
        setPreviewRows(cleanRows);
        setPreviewTotalRows(totalDataRows);
      } catch (err) {
        setPreviewError('Could not read this file to preview it. It may still work when generating — please double-check it\'s a valid Excel/CSV file.');
      } finally {
        setPreviewLoading(false);
      }
    };
    reader.onerror = () => {
      setPreviewError('Could not read the file to preview it.');
      setPreviewLoading(false);
    };
    reader.readAsArrayBuffer(f);
  };

  const applyFile = (f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      clearPreview();
      return;
    }
    setFile(f);
    setFileName(f.name);
    setResults(null);
    setError('');
    setDownloadUrl('');
    setBatchId('');
    setPublishResult(null);
    parsePreview(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  // Backend does the computation (grade rules, filtering, PDF with the CTU
  // letterhead). Generate does NOT change the students' Academic Standing —
  // that only happens when the faculty clicks "Publish to Students".
  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setPublishResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('semester', semesterLabel);
      formData.append('college', college);
      formData.append('userId', userId);

      const res = await fetch('/api/deans-list/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate Dean\'s List.');
      }

      const data = await res.json();
      // Expected response shape:
      // { students: DeansListStudent[], fileUrl: string, batchId: string }
      const students: DeansListStudent[] = data.students || [];
      const url: string = data.fileUrl || '';
      const newBatchId: string = data.batchId || '';
      const generatedTimestamp = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

      setResults(students);
      setDownloadUrl(url);
      setGeneratedAt(generatedTimestamp);
      setBatchId(newBatchId);

      // Open the freshly generated PDF in a new tab right away so the
      // faculty member can immediately verify it.
      if (url) viewInNewTab(url);

      setResultsLabel(semesterLabel);
      loadHistory(); // the new batch is already saved on the server
    } catch (err: any) {
      setError(err.message || 'Something went wrong while processing the file.');
    } finally {
      setLoading(false);
    }
  };

  // Publishes the current batch: the backend updates each qualifier's
  // Academic Standing to "Dean's Lister" so it shows on their Student Dashboard.
  const handlePublish = async () => {
    if (!batchId) return;

    setPublishing(true);
    setPublishResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/deans-list/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to publish.');

      const { published = 0, qualified = 0, standing } = data;
      const unmatched: string[] = standing?.unmatched || [];
      let text = `Dean's List published. ${qualified} of ${published} students qualified, and ${standing?.updated ?? 0} Academic Standing record${standing?.updated === 1 ? ' was' : 's were'} updated.`;
      if (standing?.reset > 0) text += ` ${standing.reset} student${standing.reset === 1 ? ' was' : 's were'} returned to Good Standing.`;
      if (unmatched.length > 0) text += ` Student ID not found in the system: ${unmatched.join(', ')}.`;
      setPublishResult({ type: 'success', text });
      loadHistory();
    } catch (err: any) {
      setPublishResult({ type: 'error', text: err.message || 'Something went wrong while publishing.' });
    } finally {
      setPublishing(false);
      setShowPublishModal(false);
    }
  };

  // Opens a generated PDF in a new browser tab using the browser's own PDF viewer.
  const viewInNewTab = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Asks the server to (re)create the CTU-letterhead PDF of a saved batch.
  const fetchBatchPdf = async (id: string): Promise<string> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/deans-list/history/${id}/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.fileUrl) throw new Error(data.message || 'Failed to create the PDF.');
    return data.fileUrl as string;
  };

  // Download button in the toolbar: uses the existing PDF, or re-creates it
  // for a batch that was opened from History.
  const handleDownload = async () => {
    if (downloadUrl) return viewInNewTab(downloadUrl);
    if (!batchId) return;
    setDownloadingId(batchId);
    try {
      const url = await fetchBatchPdf(batchId);
      setDownloadUrl(url);
      viewInNewTab(url);
    } catch (err: any) {
      setPublishResult({ type: 'error', text: err.message || 'Failed to create the PDF.' });
    } finally {
      setDownloadingId('');
    }
  };

  // Download button inside the History list
  const downloadHistoryItem = async (item: DeansListHistoryItem) => {
    setDownloadingId(item.batchId);
    setHistoryError('');
    try {
      viewInNewTab(await fetchBatchPdf(item.batchId));
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to create the PDF.');
    } finally {
      setDownloadingId('');
    }
  };

  // Loads a saved batch from the server back into the main results view.
  const viewHistoryItem = async (item: DeansListHistoryItem) => {
    setViewingId(item.batchId);
    setHistoryError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/deans-list/history/${item.batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load this batch.');

      setResults(data.students || []);
      setDownloadUrl('');
      setGeneratedAt(formatHistoryDate(item.generatedAt));
      setCollege(item.college);
      setResultsLabel(item.semesterLabel);
      setBatchId(item.batchId);
      setPublishResult(null);
      setQuery('');
      setShowHistoryModal(false);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load this batch.');
    } finally {
      setViewingId('');
    }
  };

  // Browser print dialog -> "Save as PDF". The print CSS below shows only the
  // letterhead + table.
  const handlePrint = () => window.print();

  const reset = () => {
    setFile(null);
    setFileName('');
    setResults(null);
    setError('');
    setDownloadUrl('');
    setBatchId('');
    setResultsLabel('');
    setPublishResult(null);
    setQuery('');
    clearPreview();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Derived stats + filtered/sorted table data ──
  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;
    const avg = results.reduce((sum, s) => sum + s.gwa, 0) / results.length;
    const top = [...results].sort((a, b) => a.gwa - b.gwa)[0];
    return { total: results.length, avgGwa: avg, top };
  }, [results]);

  const visibleRows = useMemo(() => {
    if (!results) return [];
    let rows = results;
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        s => s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => (sortAsc ? a.gwa - b.gwa : b.gwa - a.gwa));
  }, [results, query, sortAsc]);

  return (
    <div>
      {/*
        Print isolation: only #dl-print-area (letterhead + table) appears when
        printing / "Save as PDF". Header and footer images are position: fixed
        so they repeat on every printed page.
      */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dl-print-area, #dl-print-area * {
            visibility: visible;
          }
          #dl-print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            padding-top: 130px;
            padding-bottom: 110px;
            box-shadow: none !important;
            border: none !important;
          }
          #dl-print-area .no-print {
            display: none !important;
          }
          #dl-print-area .print-header-fixed {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            margin-top: 0 !important;
            padding-top: 0 !important;
            background: white;
            z-index: 10;
          }
          #dl-print-area .print-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            margin-top: 0 !important;
          }
          #dl-print-area table tbody tr:nth-of-type(15n) {
            page-break-after: always;
            break-after: page;
          }
          #dl-print-area table tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>

      <div className="mb-6 no-print flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dean's List Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a list (Student ID, Full Name, Course, GWA) to identify qualifiers, produce the official list, and publish it to the students' dashboards.</p>
        </div>
        <button
          onClick={() => { setShowHistoryModal(true); loadHistory(); }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shrink-0"
        >
          <History size={16} /> View History {history.length > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{history.length}</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8 no-print">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Batch Details</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g., 2025–2026"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                    <option>Summer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College / Department</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g., College of Education"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excel File (Student Grades)</label>
                <label
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer block ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-500">
                    {isDragging ? 'Drop the file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">XLSX, XLS, or CSV up to {MAX_FILE_SIZE_MB}MB</p>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                </label>
                {fileName && (
                  <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <FileSpreadsheet size={14} /> {fileName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      disabled={previewLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading file...
                        </>
                      ) : (
                        <>
                          <Search size={13} /> View file preview
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <XCircle size={16} className="flex-shrink-0 mt-0.5" /> <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!file || loading}
                  className="flex-1 py-4 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" /> Generate Dean's List
                    </>
                  )}
                </button>
                {(file || results) && (
                  <button
                    onClick={reset}
                    className="px-5 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm sm:text-base"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Floating preview modal */}
          {showPreviewModal && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 no-print"
              onClick={() => setShowPreviewModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <FileSpreadsheet size={16} className="text-gray-400" /> {fileName || 'File preview'}
                    </h3>
                    {!previewLoading && !previewError && previewTotalRows > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{previewTotalRows} data row{previewTotalRows !== 1 ? 's' : ''} detected</p>
                    )}
                  </div>
                  <button onClick={() => setShowPreviewModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="overflow-auto flex-1">
                  {previewLoading && (
                    <div className="p-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Reading file...
                    </div>
                  )}

                  {!previewLoading && previewError && (
                    <div className="p-5 text-xs text-amber-700 bg-amber-50 flex items-start gap-2 m-4 rounded-xl">
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> <span>{previewError}</span>
                    </div>
                  )}

                  {!previewLoading && !previewError && previewHeaders.length > 0 && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {previewHeaders.map((h, i) => (
                            <th key={i} className="px-3 py-2 font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan={previewHeaders.length} className="px-3 py-6 text-center text-gray-400">
                              Headers found, but no data rows.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-2 text-gray-700 border-b border-gray-100 whitespace-nowrap">{cell || '—'}</td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {!previewLoading && !previewError && previewHeaders.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 space-y-1">
                    {previewTotalRows > PREVIEW_ROW_LIMIT && (
                      <p className="text-[11px] text-gray-400">
                        Showing first {PREVIEW_ROW_LIMIT} of {previewTotalRows} rows. The full file will be used when you click "Generate".
                      </p>
                    )}
                    <p className="text-[11px] text-blue-700">
                      Check that the columns "Student ID", "Full Name", "Course" and "GWA" are present before generating.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* History modal */}
          {showHistoryModal && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 no-print"
              onClick={() => setShowHistoryModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <History size={16} className="text-gray-400" /> Generation History
                  </h3>
                  <button onClick={() => setShowHistoryModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {historyError && (
                    <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                      <XCircle size={14} className="flex-shrink-0 mt-0.5" /> <span>{historyError}</span>
                    </div>
                  )}

                  {historyLoading && history.length === 0 ? (
                    <div className="p-10 flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      No batches generated yet.
                      <p className="text-xs text-gray-300 mt-1">Every list you generate is saved here.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {history.map(item => (
                        <li key={item.batchId} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.college || 'College'}</p>
                              {item.isPublished && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                  Published
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.semesterLabel}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {item.totalQualifiers} of {item.totalStudents} qualified · {formatHistoryDate(item.generatedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => viewHistoryItem(item)}
                              disabled={viewingId === item.batchId}
                              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 disabled:opacity-60 transition-colors"
                            >
                              {viewingId === item.batchId && <Loader2 size={12} className="animate-spin" />} View
                            </button>
                            <button
                              onClick={() => downloadHistoryItem(item)}
                              disabled={downloadingId === item.batchId}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-medium hover:bg-blue-800 disabled:opacity-60 transition-colors"
                            >
                              {downloadingId === item.batchId ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Download
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-[11px] text-gray-400">
                      History is saved in the system. Click View to open a past list, then Publish to make it the active Dean's List.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* Publish confirmation modal */}
          {showPublishModal && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 no-print"
              onClick={() => { if (!publishing) setShowPublishModal(false); }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="publish-modal-title"
              >
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Send size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 id="publish-modal-title" className="text-lg font-semibold text-gray-900">
                      Publish Dean's List?
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You are about to publish <span className="font-semibold text-gray-900">{results?.length ?? 0}</span> qualifier{(results?.length ?? 0) !== 1 ? 's' : ''} for{' '}
                      <span className="font-semibold text-gray-900">{displayLabel}</span>.
                    </p>
                  </div>
                </div>

                <ul className="mx-6 mb-5 space-y-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <li className="flex gap-2"><span className="text-emerald-600 font-bold">•</span><span>Qualifiers will be marked as <span className="font-medium text-gray-900">Dean's Lister</span> on their Student Dashboard.</span></li>
                  <li className="flex gap-2"><span className="text-emerald-600 font-bold">•</span><span>Students from the previously published list who no longer qualify will return to <span className="font-medium text-gray-900">Good Standing</span>.</span></li>
                </ul>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    disabled={publishing}
                    className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Publishing...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Results — this whole block is the printable/PDF-able area */}
          {results && (
            <div id="dl-print-area" className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Success banner — screen only */}
              <div className="px-4 sm:px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2 no-print">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Generated <span className="font-semibold">{results.length}</span> qualifier{results.length !== 1 ? 's' : ''}
                  {generatedAt && <span className="text-green-600"> · {generatedAt}</span>}
                </p>
              </div>

              {/* Publish result — screen only */}
              {publishResult && (
                <div
                  className={`px-4 sm:px-6 py-3 text-sm border-b no-print ${
                    publishResult.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}
                >
                  {publishResult.text}
                </div>
              )}

              {/* CTU Header image */}
              <div className="px-4 sm:px-6 pt-4 print-header-fixed">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              {/* Letterhead-style title block */}
              <div className="px-4 sm:px-6 pt-2 pb-4 border-b border-gray-100 text-center">
                <p className="text-xs text-gray-400 tracking-wide uppercase">Cebu Technological University</p>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">Dean's List</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{college} · {displayLabel}</p>
                {generatedAt && (
                  <p className="hidden print:block text-[10px] text-gray-400 mt-2">Generated {generatedAt}</p>
                )}
              </div>

              {/* Summary stat cards — screen only */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-gray-50/60 border-b border-gray-100 no-print">
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Total Qualifiers</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.avgGwa.toFixed(2)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Average GWA</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 text-center">
                    <Award className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                    <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{stats.top.gwa.toFixed(2)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">Top: {stats.top.name.split(',')[0]}</p>
                  </div>
                </div>
              )}

              {/* Table toolbar — screen only */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 no-print">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or course..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>

                {/* Buttons never get clipped: if space runs out, this whole group drops to the next line */}
                <div className="flex flex-wrap items-center gap-2 max-w-full ml-auto">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-100 transition-colors shrink-0 whitespace-nowrap"
                    title="Opens your browser's print dialog — choose 'Save as PDF' as the destination to export a PDF"
                  >
                    <Printer size={14} /> <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={(!downloadUrl && !batchId) || downloadingId === batchId && !!batchId}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs sm:text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shrink-0 whitespace-nowrap"
                    title="Open the official PDF with the CTU letterhead"
                  >
                    {downloadingId && downloadingId === batchId ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} <span>Download</span>
                  </button>
                  <button
                    onClick={() => setShowPublishModal(true)}
                    disabled={!batchId || publishing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 whitespace-nowrap"
                    title="Updates the Academic Standing of the qualifiers so it shows on their Student Dashboard"
                  >
                    {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{publishing ? 'Publishing...' : 'Publish to Students'}</span>
                  </button>
                </div>
              </div>

              {visibleRows.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  {results.length === 0 ? 'No qualifiers found for this batch.' : 'No students match your search.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[420px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 w-12">#</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Full Name</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Course</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">GWA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((s, i) => (
                        <tr key={s.name + i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-xs text-gray-400">{i + 1}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900 text-sm">{s.name}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{s.course}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-center">
                            <span className={`inline-block min-w-[3.25rem] text-center tabular-nums px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                              s.gwa <= 1.5 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {s.gwa.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {visibleRows.length > 0 && (
                <div className="px-4 sm:px-6 py-3 border-t border-gray-100 text-xs text-gray-400 no-print">
                  Showing {visibleRows.length} of {results.length} qualifier{results.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* CTU Footer image */}
              <div className="px-4 sm:px-6 pb-4 mt-6 print-footer-fixed">
                <img src="/header-pics/ctu-footer.png" alt="CTU Footer" className="w-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Side panel — screen only */}
        <div className="space-y-6 no-print">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" /> Qualification Rule
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>GWA of 1.75 or better qualifies</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Students in the list above 1.75 are shown as "Not qualified"</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" /> File Requirements
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>One row per student</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Columns: Student ID, Full Name, Course, GWA (header row can have a title above it)</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>The Student ID must be the same as the student's ID in the system (format the column as Text)</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Accepted formats: .xlsx, .xls, .csv</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>The downloaded file already includes the CTU logo and letterhead</span></li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
            <h3 className="text-base font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" /> Publish to Students
            </h3>
            <p className="text-sm text-emerald-800">
              Generating only creates the list. Click <span className="font-semibold">Publish to Students</span> after checking it so each qualifier's Academic Standing becomes "Dean's Lister" on their dashboard.
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
            <h3 className="text-base font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Before You Submit
            </h3>
            <p className="text-sm text-amber-800">
              Double-check the Academic Year, Semester, and College fields — these appear directly on the official generated document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}