import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { notifyDean } from '../notificationsApi';
import { createPortal } from 'react-dom';
import {
  Award,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  X,
  History,
  Info,
  Loader2,
  Eye,
  AlertTriangle,
  FileImage,
  FileCode,
  FileText,
  File as FileGenericIcon,
  Download,
} from 'lucide-react';
import { renderAsync } from 'docx-preview';

const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

function getResearchToken() {
  return localStorage.getItem('token');
}

interface FileAttachment {
  name: string;
  url: string;
  path?: string;
  size?: number;
  type?: string;
}

interface AchievementSubmission {
  id: string;
  title: string;
  type: 'achievement';
  category: string | null;
  date_received: string | null;
  file_name: string | null;
  file_url: string | null;
  file_path?: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'validation';
  title: string;
  message: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

function getFileIcon(filename: string, className = 'w-4 h-4') {
  const ext = getFileExtension(filename);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <FileImage className={className} />;
  }
  if (['txt', 'csv', 'json', 'log', 'js', 'ts', 'html'].includes(ext)) {
    return <FileCode className={className} />;
  }
  if (['pdf', 'docx', 'doc'].includes(ext)) {
    return <FileText className={className} />;
  }
  return <FileGenericIcon className={className} />;
}

export function FacultyAchievements({ userName = 'A faculty member' }: { userName?: string }) {
  const [tab, setTab] = useState<'submit' | 'approved' | 'history'>('submit');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardCategory, setAwardCategory] = useState('');
  const [awardDate, setAwardDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<AchievementSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // In-Modal Preview State
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const localBlobUrlsRef = useRef<Map<string, string>>(new Map());

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClosePreview = useCallback(() => {
    localBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    localBlobUrlsRef.current.clear();
    setPreviewFile(null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    const oversized = newFiles.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'File Too Large',
        message: `Some files exceed 15MB: ${oversized.map((f) => f.name).join(', ')}`,
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewLocalFile = (file: File) => {
    let blobUrl = localBlobUrlsRef.current.get(file.name);
    if (!blobUrl) {
      blobUrl = URL.createObjectURL(file);
      localBlobUrlsRef.current.set(file.name, blobUrl);
    }
    setPreviewFile({
      name: file.name,
      url: blobUrl,
      size: file.size,
      type: file.type,
    });
  };

  const handlePreviewRemoteFile = (file: FileAttachment) => {
    setPreviewFile(file);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${RESEARCH_API_URL}/mine`, {
          headers: { Authorization: `Bearer ${getResearchToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions((data ?? []).filter((s: any) => s.type === 'achievement'));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const approved = submissions.filter((a) => a.status === 'approved');
  const pendingCount = submissions.filter((a) => a.status === 'pending').length;
  const rejectedCount = submissions.filter((a) => a.status === 'rejected').length;

  const displayStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const handleSubmit = async () => {
    if (!awardTitle.trim()) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Missing Required Field',
        message: 'Please enter an award/achievement title before submitting.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', awardTitle.trim());
      formData.append('type', 'achievement');
      formData.append('category', awardCategory.trim());
      if (awardDate) formData.append('date_received', awardDate);

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch(RESEARCH_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getResearchToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Submission Failed',
          message: err.error || res.statusText || 'Failed to submit achievement.',
        });
        return;
      }

      const data: AchievementSubmission = await res.json();
      setSubmissions((prev) => [data, ...prev]);
      try {
  await notifyDean({
  title: 'New Achievement Submitted',
  message: `${userName} submitted: ${awardTitle.trim()}`,
  type: 'system',
});
} catch (e) {
  console.error('Achievement saved but Dean notification failed:', e);
}
      setAwardTitle('');
      setAwardCategory('');
      setAwardDate('');
      setSelectedFiles([]);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Submitted',
        message: 'Your achievement and attachments have been successfully submitted for review!',
      });
    } catch {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server. Please check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionFiles = (a: AchievementSubmission): FileAttachment[] => {
    if (Array.isArray(a.files) && a.files.length > 0) {
      return a.files;
    }
    if (a.file_url) {
      return [{ name: a.file_name || 'Attached Document', url: a.file_url, path: a.file_path || undefined }];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faculty Achievements</h1>
          <p className="text-sm text-gray-500 mt-1">Submit, monitor, and document your academic and professional recognitions.</p>
        </div>

        <div className="flex gap-1.5 p-1 bg-gray-100/80 rounded-xl w-fit border border-gray-200/60 self-start sm:self-auto">
          {[
            { id: 'submit', label: 'Submit Achievement', count: null },
            { id: 'approved', label: 'Approved', count: approved.length },
            { id: 'history', label: 'History & Tracking', count: submissions.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.id ? 'bg-blue-50 text-blue-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {tab === 'submit' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-lg font-bold text-gray-900">Submit New Achievement</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Provide verified information and certificates regarding your achievement for Dean evaluation.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    Achievement Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Award / Achievement Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={awardTitle}
                        onChange={(e) => setAwardTitle(e.target.value)}
                        placeholder="e.g., Outstanding Researcher of the Year, Best Paper Award"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                        <input
                          type="text"
                          value={awardCategory}
                          onChange={(e) => setAwardCategory(e.target.value)}
                          placeholder="e.g., Research, Teaching, Community Outreach"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date Received / Conferred</label>
                        <input
                          type="date"
                          value={awardDate}
                          onChange={(e) => setAwardDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    Supporting Certificates & Evidences
                  </h3>

                  <label className="border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer block bg-gray-50/40 group">
                    <div className="w-10 h-10 bg-white shadow-2xs border border-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">
                      Click to browse or drop certificate files here
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">PDF, JPG, PNG, DOCX up to 15MB each</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500">
                        {selectedFiles.length} file(s) attached:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-100/80 rounded-xl text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1 bg-white rounded-md border border-blue-100 text-blue-700">
                                {getFileIcon(file.name, 'w-3.5 h-3.5')}
                              </div>
                              <span className="truncate max-w-[200px] sm:max-w-[300px] font-medium text-blue-950" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewLocalFile(file)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                                title="Preview file"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>

                              <span className="text-gray-400 text-[11px]">{formatFileSize(file.size)}</span>
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold transition-all text-xs sm:text-sm disabled:opacity-60 shadow-2xs flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit for Endorsement'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'approved' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Endorsed Achievements</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Officially recognized achievements by the College Dean</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold px-2.5 py-1 rounded-full">
                  {approved.length} Verified
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                  <span className="text-xs sm:text-sm">Loading achievements…</span>
                </div>
              ) : approved.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Award className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No approved achievements yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted achievements that are verified will be archived here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {approved.map((a) => {
                    const files = getSubmissionFiles(a);
                    return (
                      <div
                        key={a.id}
                        className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0">
                              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  {a.category || 'General'}
                                </span>
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{a.title}</h4>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Approved on {formatDate(a.updated_at)}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Approved
                          </span>
                        </div>

                        {files.length > 0 && (
                          <div className="pl-12 sm:pl-14 flex flex-wrap gap-2 pt-1">
                            {files.map((f, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handlePreviewRemoteFile(f)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors border border-gray-200/80 font-medium"
                                title="Open attachment"
                              >
                                <Eye size={12} />
                                <span className="max-w-[160px] truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Achievement Records</h2>
                <p className="text-xs text-gray-500 mt-0.5">Timeline of all submitted awards and recognition filings</p>
              </div>

              {loading ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                  <span className="text-xs sm:text-sm">Loading history…</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No submission records found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {submissions.map((a) => {
                    const files = getSubmissionFiles(a);
                    return (
                      <div key={a.id} className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                {a.category || 'General'}
                              </span>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{a.title}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Conferred: {formatDate(a.date_received)} · Submitted: {formatDate(a.created_at)}
                            </div>
                          </div>
                          
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              a.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : a.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {displayStatus(a.status)}
                          </span>
                        </div>

                        {a.dean_remarks && (
                          <div className="mt-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                            <span className="font-bold block mb-0.5">Dean's Feedback:</span>
                            {a.dean_remarks}
                          </div>
                        )}

                        {files.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {files.map((f, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handlePreviewRemoteFile(f)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gray-50 hover:bg-blue-50 text-blue-700 border border-gray-200/80 font-medium"
                              >
                                <Eye size={12} />
                                <span className="max-w-[160px] truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Achievement Overview
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Total Filings</span>
                <span className="text-base font-bold text-gray-900">{submissions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
                <span className="text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Approved
                </span>
                <span className="text-base font-bold text-emerald-700">{approved.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/60">
                <span className="text-xs sm:text-sm text-amber-800 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Under Review
                </span>
                <span className="text-base font-bold text-amber-700">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100/60">
                <span className="text-xs sm:text-sm text-rose-800 font-medium flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-500" /> Action Required
                </span>
                <span className="text-base font-bold text-rose-700">{rejectedCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3.5 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> Guidelines & Reminders
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Upload authentic certifications, plaque scans, or official citations.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Supported formats: PDF, JPG, PNG, DOCX (up to 15MB per file).</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Evaluation usually takes 3–5 working days by the Dean's Office.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-blue-600 font-bold">•</span>
                <span>Check the History tab for reviewer feedback if revisions are requested.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- IN-APP PREVIEW MODAL --- */}
      {previewFile && (
        <AchievementPreviewModal
          file={previewFile}
          onClose={handleClosePreview}
        />
      )}

      {/* --- NOTIFICATION MODAL --- */}
      {modal.isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modal.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : modal.type === 'error'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {modal.type === 'success' && <CheckCircle className="w-6 h-6" />}
              {modal.type === 'error' && <XCircle className="w-6 h-6" />}
              {modal.type === 'validation' && <Info className="w-6 h-6" />}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">{modal.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{modal.message}</p>

            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs"
            >
              Dismiss
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Achievement Document Viewer Modal ────────────────────────────────────────

function AchievementPreviewModal({
  file,
  onClose,
}: {
  file: FileAttachment;
  onClose: () => void;
}) {
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const ext = useMemo(() => getFileExtension(file.name), [file.name]);
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isDocx = ext === 'docx' || ext === 'doc';
  const isText = ['txt', 'csv', 'json', 'log'].includes(ext);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setLoadError(false);
    setTextContent(null);

    const resolveUrl = async () => {
      try {
        if (file.path) {
          const res = await fetch(
            `${RESEARCH_API_URL}/preview-url?path=${encodeURIComponent(file.path)}`,
            { headers: { Authorization: `Bearer ${getResearchToken()}` } }
          );
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled) {
              setActiveUrl(data.url);
              return;
            }
          }
        }
        if (!isCancelled) {
          setActiveUrl(file.url);
        }
      } catch {
        if (!isCancelled) {
          setActiveUrl(file.url);
        }
      }
    };

    resolveUrl();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!activeUrl) return;

    if (isDocx) {
      fetch(activeUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.blob();
        })
        .then((blob) => {
          if (!docxContainerRef.current) return;
          docxContainerRef.current.innerHTML = '';
          return renderAsync(blob, docxContainerRef.current, undefined, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        })
        .then(() => setLoading(false))
        .catch(() => {
          setLoadError(true);
          setLoading(false);
        });
    } else if (isText) {
      fetch(activeUrl)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
          setLoading(false);
        })
        .catch(() => {
          setLoadError(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [activeUrl, isDocx, isText]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-b border-gray-700/60 text-white select-none shadow-md shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="text-blue-400 shrink-0">
            {getFileIcon(file.name, 'w-5 h-5')}
          </div>
          <span className="font-medium text-sm sm:text-base text-gray-100 truncate" title={file.name}>
            {file.name}
          </span>
          {file.size ? (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({formatFileSize(file.size)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeUrl || file.url}
            download={file.name}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Download File"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 w-full p-2 sm:p-6 flex items-center justify-center overflow-hidden"
        onClick={onClose}
      >
        <div
          className="w-full h-full max-w-5xl bg-white rounded-md shadow-2xl overflow-hidden relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 gap-2">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-600">Loading document...</span>
            </div>
          )}

          {loadError ? (
            <div className="m-auto text-center p-8 max-w-md">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">Unable to preview file</h4>
              <p className="text-xs text-gray-500 mb-4">
                The file &ldquo;{file.name}&rdquo; could not be rendered directly.
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href={activeUrl || file.url}
                  download={file.name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isImg ? (
            <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950 overflow-auto">
              <img
                src={activeUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${activeUrl}#toolbar=0`}
              title={file.name}
              className="w-full h-full border-0 bg-white"
            />
          ) : isText && textContent !== null ? (
            <div className="w-full h-full bg-gray-900 border border-gray-800 p-6 overflow-auto text-left select-text">
              <pre className="font-mono text-xs sm:text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {textContent}
              </pre>
            </div>
          ) : isDocx ? (
            <div className="w-full h-full overflow-y-auto bg-gray-100 p-4 sm:p-8 flex justify-center text-left select-text">
              <div ref={docxContainerRef} className="w-full max-w-3xl min-h-full" />
            </div>
          ) : (
            <div className="m-auto text-center p-8 max-w-md">
              <FileGenericIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">{file.name}</h4>
              <p className="text-xs text-gray-500 mb-4">
                This file format ({ext.toUpperCase()}) cannot be previewed directly in the browser.
              </p>
              <a
                href={activeUrl || file.url}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FacultyAchievements;