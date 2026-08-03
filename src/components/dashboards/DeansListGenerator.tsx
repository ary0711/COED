import { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';

interface DeansListStudent {
  studentId: string;
  name: string;
  course: string;
  yearLevel: string;
  gwa: number;
  units: number;
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

  const applyFile = (f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(f);
    setFileName(f.name);
    setResults(null);
    setError('');
    setDownloadUrl('');
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
      setResults(data.students || []);
      setDownloadUrl(data.fileUrl || '');
      setGeneratedAt(new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (err: any) {
      setError(err.message || 'Something went wrong while processing the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Deans-List-${semesterLabel.replace(/\s+/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => window.print();

  const reset = () => {
    setFile(null);
    setFileName('');
    setResults(null);
    setError('');
    setDownloadUrl('');
    setQuery('');
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
        s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.course.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => (sortAsc ? a.gwa - b.gwa : b.gwa - a.gwa));
  }, [results, query, sortAsc]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dean's List Generator</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a grade sheet to automatically identify qualifiers and produce an official, letterhead-ready list.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
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
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <FileSpreadsheet size={14} /> {fileName}
                  </p>
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

          {/* Results */}
          {results && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Success banner */}
              <div className="px-4 sm:px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Generated <span className="font-semibold">{results.length}</span> qualifier{results.length !== 1 ? 's' : ''}
                  {generatedAt && <span className="text-green-600"> · {generatedAt}</span>}
                </p>
              </div>

              {/* Letterhead-style header preview */}
              <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100 text-center">
                <p className="text-xs text-gray-400 tracking-wide uppercase">Cebu Technological University</p>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">Dean's List</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{college} · {semesterLabel}</p>
              </div>

              {/* Summary stat cards */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-gray-50/60 border-b border-gray-100">
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

              {/* Table toolbar */}
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, ID, or course..."
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
                  >
                    <Printer size={14} /> Print
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
                  <table className="w-full text-left min-w-[560px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 w-12">#</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Student ID</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Full Name</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Course</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Year</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">GWA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((s, i) => (
                        <tr key={s.studentId + i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-xs text-gray-400">{i + 1}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono text-xs sm:text-sm text-gray-600">{s.studentId}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900 text-sm">{s.name}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{s.course}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{s.yearLevel}</td>
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
                <div className="px-4 sm:px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
                  Showing {visibleRows.length} of {results.length} qualifier{results.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
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
              <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span><span>Columns: Student ID, Name, Course, Year Level, Grades/GWA</span></li>
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