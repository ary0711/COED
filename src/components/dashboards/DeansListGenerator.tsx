import { useState, useMemo, useRef } from 'react';
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
  ArrowUpDown,
  Award,
  Users,
  TrendingUp,
  Printer,
  AlertTriangle,
  History,
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

// A single past "batch" that was generated during this session.
// TODO(backend): once a persistence endpoint exists (e.g.
// GET/POST /api/deans-list/history), swap the in-memory `history` state
// below for a fetch on mount + an append/refresh after each successful
// generate, so this list survives page refreshes/logins instead of only
// living for the current session.
interface DeansListHistoryItem {
  id: string;
  semesterLabel: string;
  college: string;
  totalQualifiers: number;
  generatedAt: string;
  fileUrl: string;
  students: DeansListStudent[];
}

interface DeansListGeneratorProps {
  userId: string;
  userName?: string;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE_MB = 10;

export function DeansListGenerator({ userId, userName }: DeansListGeneratorProps) {
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

  // ── Results table controls ──
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Pre-upload file preview state ──
  // Lets the faculty eyeball the columns/rows they're about to submit,
  // so they can catch a wrong file or misaligned columns before the
  // official Dean's List (with letterhead) gets generated/downloaded.
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewTotalRows, setPreviewTotalRows] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Generation history (session-only for now — see TODO on the
  // DeansListHistoryItem interface above) ──
  const [history, setHistory] = useState<DeansListHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const semesterLabel = `${semester} AY ${academicYear}`;

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
          .map(r => cleanHeader.map((_, i) => String(r[i] ?? '').trim()));
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

  // Backend does the actual computation (grade rules, filtering, and file
  // generation with the CTU letterhead/logo). This just uploads + renders.
  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
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
      // { students: DeansListStudent[], fileUrl: string (download link) }
      const students: DeansListStudent[] = data.students || [];
      const url: string = data.fileUrl || '';
      const generatedTimestamp = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

      setResults(students);
      setDownloadUrl(url);
      setGeneratedAt(generatedTimestamp);

      // Record this batch in the (session-only) history list, newest first.
      setHistory(prev => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          semesterLabel,
          college,
          totalQualifiers: students.length,
          generatedAt: generatedTimestamp,
          fileUrl: url,
          students,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while processing the file.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (url: string, filenameBase: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `Deans-List-${filenameBase.replace(/\s+/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => downloadFile(downloadUrl, semesterLabel);

  // Loads a past batch from history back into the main results table/view
  // (does not re-fetch from the server — reuses the data already held in memory).
  const viewHistoryItem = (item: DeansListHistoryItem) => {
    setResults(item.students);
    setDownloadUrl(item.fileUrl);
    setGeneratedAt(item.generatedAt);
    setCollege(item.college);
    setShowHistoryModal(false);
  };

  // Faculty picks "Save as PDF" as the destination inside the browser's own
  // print dialog — no extra PDF library needed. The print-only CSS below
  // makes sure ONLY the letterhead + table shows up in that PDF/printout,
  // not the upload form, sidebar, or search/sort toolbar.
  const handlePrint = () => window.print();

  const reset = () => {
    setFile(null);
    setFileName('');
    setResults(null);
    setError('');
    setDownloadUrl('');
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
        Print isolation: only #dl-print-area (letterhead + stats + table)
        should appear when the faculty prints or "Save as PDF"s the page.
        Everything else on the page (upload form, sidebar, toolbar, nav,
        browser chrome we can't touch) is hidden for the print media type.
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
            padding-bottom: 110px;
            box-shadow: none !important;
            border: none !important;
          }
          #dl-print-area .no-print {
            display: none !important;
          }
          #dl-print-area .print-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            margin-top: 0 !important;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>

      <div className="mb-6 no-print flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dean's List Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a grade sheet to automatically identify qualifiers and produce an official, letterhead-ready list.</p>
        </div>
        <button
          onClick={() => setShowHistoryModal(true)}
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

          {/* Floating preview modal — pops up when "View file preview" is clicked */}
          {showPreviewModal && (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print"
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
                      Check that your columns line up (Name, Course, Grades/GWA) before generating.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History modal — lists batches generated during this session */}
          {showHistoryModal && (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print"
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
                  {history.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      No batches generated yet this session.
                      <p className="text-xs text-gray-300 mt-1">Batches you generate will show up here for quick reference.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {history.map(item => (
                        <li key={item.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.college}</p>
                            <p className="text-xs text-gray-500 truncate">{item.semesterLabel}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {item.totalQualifiers} qualifier{item.totalQualifiers !== 1 ? 's' : ''} · {item.generatedAt}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => viewHistoryItem(item)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => downloadFile(item.fileUrl, item.semesterLabel)}
                              disabled={!item.fileUrl}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
                            >
                              <Download size={12} /> Download
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
                      This history only lasts for your current session — it will clear if you refresh or leave the page.
                    </p>
                  </div>
                )}
              </div>
            </div>
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

              {/* CTU Header image — appears on screen preview and on the printed/PDF output */}
              <div className="px-4 sm:px-6 pt-4">
                <img src="/header-pics/ctu-header.png" alt="CTU Header" className="w-full object-contain" />
              </div>

              {/* Letterhead-style header — this is what should appear on the PDF */}
              <div className="px-4 sm:px-6 pt-2 pb-4 border-b border-gray-100 text-center">
                <p className="text-xs text-gray-400 tracking-wide uppercase">Cebu Technological University</p>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">Dean's List</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{college} · {semesterLabel}</p>
                {generatedAt && (
                  <p className="hidden print:block text-[10px] text-gray-400 mt-2">Generated {generatedAt}</p>
                )}
              </div>

              {/* Summary stat cards — screen only; keeps the printed page clean/formal */}
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
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or course..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSortAsc(s => !s)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowUpDown size={14} /> GWA {sortAsc ? '↑' : '↓'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Opens your browser's print dialog — choose 'Save as PDF' as the destination to export a PDF"
                  >
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!downloadUrl}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-lg text-xs sm:text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    <Download size={14} /> Download (CTU Letterhead)
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
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
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

              {/* CTU Footer image — fixed to the bottom of every printed page */}
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
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>GWA of 1.75 or higher standing (no grade below 2.0)</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>No failing, INC, or dropped subjects</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Regular student, full load for the semester</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" /> File Requirements
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Columns: Name, Course, Grades/GWA</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>First row must be the header row</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Accepted formats: .xlsx, .xls, .csv</span></li>
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>The downloaded file already includes the CTU logo and letterhead</span></li>
            </ul>
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