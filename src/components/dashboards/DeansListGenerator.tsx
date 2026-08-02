import { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, Loader2, GraduationCap, FileSpreadsheet, Info } from 'lucide-react';

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

export function DeansListGenerator({ userId, userName }: DeansListGeneratorProps) {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DeansListStudent[] | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [semester, setSemester] = useState('2nd Semester AY 2025–2026');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setResults(null);
    setError('');
    setDownloadUrl('');
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
      formData.append('semester', semester);
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
    link.download = `Deans-List-${semester.replace(/\s+/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setFileName('');
    setResults(null);
    setError('');
    setDownloadUrl('');
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Dean's List Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Upload Grade Sheet</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excel File (Student Grades)</label>
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">XLSX, XLS, or CSV up to 10MB</p>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                </label>
                {fileName && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <FileSpreadsheet size={14} /> {fileName}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <XCircle size={16} className="flex-shrink-0" /> {error}
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
              <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generated Dean's List</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{semester}</p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-all w-fit"
                >
                  <Download size={16} /> Download (with CTU Letterhead)
                </button>
              </div>

              {results.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No qualifiers found for this batch.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Student ID</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Full Name</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Course</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700">Year</th>
                        <th className="py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-700 text-center">GWA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((s, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-mono text-xs sm:text-sm text-gray-600">{s.studentId}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900 text-sm">{s.name}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{s.course}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-700 text-sm">{s.yearLevel}</td>
                          <td className="py-3 px-4 sm:py-4 sm:px-6 text-center">
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{s.gwa.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        </div>
      </div>
    </div>
  );
}