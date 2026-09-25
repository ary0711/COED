import React, { useState, useEffect, useMemo, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  TrendingUp,
  FileText,
  X,
  Info,
  Calendar,
  DollarSign,
  Users,
  Building,
  Target,
  Plus,
  ArrowLeft,
  Edit3,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Send,
  SlidersHorizontal,
  Download,
} from 'lucide-react';

const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

function getResearchToken() {
  return localStorage.getItem('token');
}

const SDG_OPTIONS = [
  'SDG 1: No Poverty',
  'SDG 3: Good Health & Well-being',
  'SDG 4: Quality Education',
  'SDG 5: Gender Equality',
  'SDG 9: Industry, Innovation, & Infrastructure',
  'SDG 16: Peace, Justice, & Strong Institutions',
];

interface FileAttachment {
  name: string;
  url: string;
  path?: string;
  size?: number;
  type?: string;
}

interface FileUploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface ResearchSubmission {
  id: string;
  title: string;
  type: 'research' | 'extension';
  publication_link?: string | null;
  file_name: string | null;
  file_url: string | null;
  file_path?: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks?: string | null;
  created_at: string;
  updated_at: string;
  funding_source?: string | null;
  authors?: string | null;
  description?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  partner_organization?: string | null;
  beneficiaries?: number | null;
  sdg_alignment?: string[] | string | null;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'validation';
  title: string;
  message: string;
}

export function ResearchExtension({ userId }: { userId: string }) {
  // Navigation State
  const [view, setView] = useState<'overview' | 'create' | 'track'>('overview');
  const [overviewTab, setOverviewTab] = useState<'all' | 'research' | 'extension'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Tracking / Modal references
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [detailsModalSubmission, setDetailsModalSubmission] = useState<ResearchSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<ResearchSubmission | null>(null);

  // In-Modal File Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const localBlobUrlRef = useRef<string | null>(null);

  // Form State
  const [researchType, setResearchType] = useState<'research' | 'extension'>('research');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [existingFiles, setExistingFiles] = useState<FileAttachment[]>([]);
  const [isSdgDropdownOpen, setIsSdgDropdownOpen] = useState(false);

  // Co-authors array state (one author per textbox)
  const [coAuthors, setCoAuthors] = useState<string[]>(['']);

  // File Upload Queue & Progress
  const [uploadQueue, setUploadQueue] = useState<FileUploadTask[]>([]);

  // Research Form Fields
  const [publicationLink, setPublicationLink] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [budget, setBudget] = useState('');

  // Extension Form Fields
  const [partnerOrg, setPartnerOrg] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([]);

  // Data & Async State
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Overall Submission Notification Modal State
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const handleClosePreview = () => {
    if (localBlobUrlRef.current) {
      URL.revokeObjectURL(localBlobUrlRef.current);
      localBlobUrlRef.current = null;
    }
    setPreviewFile(null);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${RESEARCH_API_URL}/mine`, {
        headers: { Authorization: `Bearer ${getResearchToken()}` },
      });
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();
      setSubmissions((data ?? []).filter((s: any) => s.type === 'research' || s.type === 'extension'));
    } catch (err: any) {
      setFetchError(err.message || 'Unable to connect to research submission service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [userId]);

  const parseSdgs = (raw: string[] | string | null | undefined): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const getSubmissionFiles = (s: ResearchSubmission): FileAttachment[] => {
    if (Array.isArray(s.files) && s.files.length > 0) return s.files;
    if (s.file_url) {
      return [
        {
          name: s.file_name || 'Attached Document',
          url: s.file_url,
          path: s.file_path || undefined,
        },
      ];
    }
    return [];
  };

  // Preview for already-saved remote files
  const handleOpenPreview = async (file: FileAttachment) => {
    if (localBlobUrlRef.current) {
      URL.revokeObjectURL(localBlobUrlRef.current);
      localBlobUrlRef.current = null;
    }

    if (file.path) {
      try {
        const res = await fetch(
          `${RESEARCH_API_URL}/preview-url?path=${encodeURIComponent(file.path)}`,
          { headers: { Authorization: `Bearer ${getResearchToken()}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPreviewFile({ url: data.url, name: file.name });
          return;
        }
      } catch {
        // Fall back to stored public URL
      }
    }
    setPreviewFile({ url: file.url, name: file.name });
  };

  // Preview local unsubmitted files directly from browser memory
  const handlePreviewLocalFile = (file: File) => {
    if (localBlobUrlRef.current) {
      URL.revokeObjectURL(localBlobUrlRef.current);
      localBlobUrlRef.current = null;
    }
    const blobUrl = URL.createObjectURL(file);
    localBlobUrlRef.current = blobUrl;
    setPreviewFile({ url: blobUrl, name: file.name });
  };

  // Co-Author List Handlers
  const handleAddCoAuthor = () => {
    setCoAuthors((prev) => [...prev, '']);
  };

  const handleCoAuthorChange = (index: number, value: string) => {
    setCoAuthors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveCoAuthor = (index: number) => {
    setCoAuthors((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setExistingFiles([]);
    setUploadQueue([]);
    setPublicationLink('');
    setFundingSource('');
    setCoAuthors(['']);
    setBudget('');
    setPartnerOrg('');
    setBeneficiaries('');
    setSelectedSdgs([]);
    setEditingSubmission(null);
  };

  const handleStartCreate = (type: 'research' | 'extension') => {
    resetForm();
    setResearchType(type);
    setView('create');
  };

  const handleStartEdit = (submission: ResearchSubmission) => {
    if (submission.status === 'approved') return;
    setEditingSubmission(submission);
    setResearchType(submission.type);
    setTitle(submission.title || '');
    setDescription(submission.description || '');
    setStartDate(submission.start_date || '');
    setEndDate(submission.end_date || '');
    setExistingFiles(getSubmissionFiles(submission));
    setUploadQueue([]);

    if (submission.type === 'research') {
      setPublicationLink(submission.publication_link || '');
      setFundingSource(submission.funding_source || '');
      setBudget(
        submission.budget !== null && submission.budget !== undefined
          ? String(submission.budget)
          : ''
      );

      if (submission.authors) {
        const splitAuthors = submission.authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
        setCoAuthors(splitAuthors.length > 0 ? splitAuthors : ['']);
      } else {
        setCoAuthors(['']);
      }
    } else {
      setPartnerOrg(submission.partner_organization || '');
      setBeneficiaries(
        submission.beneficiaries !== null && submission.beneficiaries !== undefined
          ? String(submission.beneficiaries)
          : ''
      );
      setSelectedSdgs(parseSdgs(submission.sdg_alignment));
    }
    setView('create');
  };

  const handleNavigateToTrack = (id: string) => {
    setActiveTrackingId(id);
    setView('track');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    const oversized = newFiles.filter((f) => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'File Exceeds Limit',
        message: `Files exceeding 15MB: ${oversized.map((f) => f.name).join(', ')}`,
      });
      return;
    }

    const tasks: FileUploadTask[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...tasks]);
    e.target.value = '';
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSdg = (sdg: string) => {
    setSelectedSdgs((prev) =>
      prev.includes(sdg) ? prev.filter((item) => item !== sdg) : [...prev, sdg]
    );
  };

  // Upload Progress calculations
  const totalFilesCount = uploadQueue.length;
  const completedFilesCount = uploadQueue.filter((t) => t.status === 'completed').length;
  const failedFilesCount = uploadQueue.filter((t) => t.status === 'error').length;
  const overallPercentage =
    totalFilesCount > 0
      ? Math.round(uploadQueue.reduce((acc, t) => acc + t.progress, 0) / totalFilesCount)
      : 0;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Missing Required Field',
        message: 'Please provide a title for your submission.',
      });
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Invalid Date Range',
        message: 'End Date cannot be earlier than Start Date.',
      });
      return;
    }

    if (researchType === 'research' && budget && Number(budget) < 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Invalid Budget',
        message: 'Budget cannot be a negative value.',
      });
      return;
    }

    if (researchType === 'extension' && beneficiaries && Number(beneficiaries) < 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'Invalid Beneficiaries',
        message: 'Number of beneficiaries must be a non-negative whole number.',
      });
      return;
    }

    // Clean co-authors: trim whitespace, filter empty values
    const cleanedCoAuthors = coAuthors.map((a) => a.trim()).filter(Boolean);
    const coAuthorsString = cleanedCoAuthors.join(', ');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', researchType);
      if (description.trim()) formData.append('description', description.trim());
      if (startDate) formData.append('start_date', startDate);
      if (endDate) formData.append('end_date', endDate);

      if (researchType === 'research') {
        if (publicationLink.trim()) formData.append('publication_link', publicationLink.trim());
        if (fundingSource.trim()) formData.append('funding_source', fundingSource.trim());
        if (coAuthorsString) formData.append('authors', coAuthorsString);
        if (budget) formData.append('budget', budget);
      } else {
        if (partnerOrg.trim()) formData.append('partner_organization', partnerOrg.trim());
        if (beneficiaries) formData.append('beneficiaries', beneficiaries);
        formData.append('sdg_alignment', JSON.stringify(selectedSdgs));
      }

      const isEdit = Boolean(editingSubmission);
      const endpoint = isEdit ? `${RESEARCH_API_URL}/${editingSubmission!.id}` : RESEARCH_API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      // Attach ALL pending files to the single FormData request
      const pendingFiles = uploadQueue.filter(
        (t) => t.status === 'pending' || t.status === 'error'
      );
      pendingFiles.forEach((task) => {
        formData.append('files', task.file);
      });

      // Submit all files in a single unified request with live progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, endpoint, true);
        xhr.setRequestHeader('Authorization', `Bearer ${getResearchToken()}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            setUploadQueue((prev) =>
              prev.map((t) => ({ ...t, progress: percent, status: 'uploading' }))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadQueue((prev) =>
              prev.map((t) => ({ ...t, progress: 100, status: 'completed' }))
            );
            resolve();
          } else {
            let errorMsg = 'Failed to submit';
            try {
              const resJson = JSON.parse(xhr.responseText);
              errorMsg = resJson.error || errorMsg;
            } catch {}
            setUploadQueue((prev) =>
              prev.map((t) => ({ ...t, status: 'error', errorMessage: errorMsg }))
            );
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          setUploadQueue((prev) =>
            prev.map((t) => ({ ...t, status: 'error', errorMessage: 'Network connection failed' }))
          );
          reject(new Error('Network error during upload'));
        };

        xhr.send(formData);
      });

      await fetchSubmissions();
      resetForm();
      setView('overview');
      setModal({
        isOpen: true,
        type: 'success',
        title: isEdit ? 'Submission Updated' : 'Submission Received',
        message: isEdit
          ? 'Your modifications have been submitted for review.'
          : 'Your submission has been filed and routed for administrative review.',
      });
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Submission Issue',
        message: err.message || 'Could not reach the server. Check your connection.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesTab = overviewTab === 'all' ? true : item.type === overviewTab;
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(term) ||
        (item.authors && item.authors.toLowerCase().includes(term)) ||
        (item.partner_organization && item.partner_organization.toLowerCase().includes(term));

      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [submissions, overviewTab, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
      researchCount: submissions.filter((s) => s.type === 'research').length,
      extensionCount: submissions.filter((s) => s.type === 'extension').length,
    };
  }, [submissions]);

  const formatDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Not specified';

  const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
          map[status] || map.pending
        }`}
      >
        {formatStatus(status)}
      </span>
    );
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    return <Clock className="w-5 h-5 text-amber-500 shrink-0" />;
  };

  const activeSubmission = useMemo(() => {
    return submissions.find((s) => s.id === activeTrackingId) || submissions[0] || null;
  }, [submissions, activeTrackingId]);

  return (
    <div className="w-full pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Faculty Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Research & Extension</span>
            {view !== 'overview' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-blue-700 font-semibold capitalize">
                  {view === 'create'
                    ? editingSubmission
                      ? 'Edit Submission'
                      : 'New Submission'
                    : 'Track Status'}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Research & Extension</h1>
        </div>

        {view === 'overview' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartCreate('research')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Research</span>
            </button>
            <button
              onClick={() => handleStartCreate('extension')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm font-medium rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Extension</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              resetForm();
              setView('overview');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
        )}
      </div>

      {/* OVERVIEW VIEW */}
      {view === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Total Outputs
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.researchCount} Res · {stats.extensionCount} Ext
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                Approved
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.approved}</div>
              <div className="text-xs text-emerald-600/80 mt-1">Verified records</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                Pending Review
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-amber-600/80 mt-1">Under Dean review</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
                Rejected / Revision
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600">{stats.rejected}</div>
              <div className="text-xs text-rose-600/80 mt-1">Needs attention</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  onClick={() => setOverviewTab('all')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'all'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Outputs ({submissions.length})
                </button>
                <button
                  onClick={() => setOverviewTab('research')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'research'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Research ({stats.researchCount})
                </button>
                <button
                  onClick={() => setOverviewTab('extension')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'extension'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Extension ({stats.extensionCount})
                </button>
              </div>

              <div className="flex flex-1 sm:flex-initial flex-wrap items-center gap-2 justify-end">
                <div className="relative w-full sm:w-80 lg:w-96">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, partner, author..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs sm:text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Loading submissions...</p>
              </div>
            ) : fetchError ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to Load Records</h3>
                <p className="text-xs text-gray-500 mb-4">{fetchError}</p>
                <button
                  onClick={fetchSubmissions}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No Submissions Found</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter settings.'
                    : 'Start submitting your research studies or institutional extension engagements.'}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleStartCreate('research')}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors"
                  >
                    Submit Research
                  </button>
                  <button
                    onClick={() => handleStartCreate('extension')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Submit Extension
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSubmissions.map((item) => {
                  const sdgs = parseSdgs(item.sdg_alignment);
                  const files = getSubmissionFiles(item);

                  return (
                    <div
                      key={item.id}
                      className="py-4 sm:py-5 hover:bg-gray-50/70 transition-colors rounded-xl px-2 sm:px-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{statusIcon(item.status)}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {item.type}
                              </span>
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                {item.title}
                              </h3>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Submitted on {formatDate(item.created_at)}
                              {item.start_date &&
                                ` · Activity: ${formatDate(item.start_date)} – ${formatDate(
                                  item.end_date
                                )}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {statusBadge(item.status)}
                        </div>
                      </div>

                      <div className="pl-8 text-xs text-gray-600 line-clamp-2 mt-1 mb-3">
                        {item.description || (
                          <span className="text-gray-400 italic">No description provided.</span>
                        )}
                      </div>

                      <div className="pl-8 flex flex-wrap items-center gap-2 mb-3">
                        {item.type === 'research' && item.funding_source && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            Funding: {item.funding_source}
                          </span>
                        )}
                        {item.type === 'research' &&
                          item.budget !== null &&
                          item.budget !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                              ₱{Number(item.budget).toLocaleString()}
                            </span>
                          )}
                        {item.type === 'extension' && item.partner_organization && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                            <Building className="w-3 h-3 text-gray-400" />
                            Partner: {item.partner_organization}
                          </span>
                        )}
                        {item.type === 'extension' && sdgs.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg">
                            <Target className="w-3 h-3 text-blue-500" />
                            {sdgs.length} SDG(s) Aligned
                          </span>
                        )}
                        {files.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                            <FileText className="w-3 h-3 text-gray-400" />
                            {files.length} file(s) attached
                          </span>
                        )}
                      </div>

                      <div className="pl-8 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setDetailsModalSubmission(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleNavigateToTrack(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Track Status
                        </button>
                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            {item.status === 'rejected' ? 'Edit & Resubmit' : 'Edit Submission'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM VIEW */}
      {view === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 w-full">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubmission
                  ? `Edit ${researchType === 'research' ? 'Research' : 'Extension'} Output`
                  : 'New Submission'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Fill in the verified academic project records to be logged and endorsed.
              </p>
            </div>
            {!editingSubmission && (
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setResearchType('research')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    researchType === 'research'
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Research
                </button>
                <button
                  type="button"
                  onClick={() => setResearchType('extension')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    researchType === 'extension'
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Extension Activity
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* 1. General Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                General Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {researchType === 'research' ? 'Research Title *' : 'Extension Project Title *'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter full descriptive title"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Executive Summary / Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly state the background, methodology, objectives, and impact..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Authors / Collaborators (ONE PER TEXTBOX) */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                {researchType === 'research' ? 'Authors & Co-Authors' : 'Partnership & Reach'}
              </h3>
              {researchType === 'research' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Co-Authors</label>
                    <div className="space-y-2.5">
                      {coAuthors.map((author, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => handleCoAuthorChange(index, e.target.value)}
                            placeholder={`Co-author name #${index + 1}`}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCoAuthor(index)}
                            disabled={coAuthors.length === 1 && !author}
                            className="px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCoAuthor}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Co-Author</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Publication Link <span className="text-gray-400 font-normal">(Optional DOI or URL)</span>
                    </label>
                    <input
                      type="url"
                      value={publicationLink}
                      onChange={(e) => setPublicationLink(e.target.value)}
                      placeholder="https://doi.org/... or journal link"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Partner Organization / LGU
                    </label>
                    <input
                      type="text"
                      value={partnerOrg}
                      onChange={(e) => setPartnerOrg(e.target.value)}
                      placeholder="e.g. Barangay San Jose, Red Cross"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Number of Beneficiaries
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={beneficiaries}
                      onChange={(e) => setBeneficiaries(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Financials & SDGs */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  3
                </span>
                {researchType === 'research' ? 'Funding & Budget' : 'SDG Alignment'}
              </h3>
              {researchType === 'research' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Funding Source</label>
                    <input
                      type="text"
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                      placeholder="e.g., Institutional Grant, DOST, Self-Funded"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Allocated Budget (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    SDG Alignment <span className="text-gray-400 font-normal">(Select all that apply)</span>
                  </label>

                  <div className="relative">
                    {/* Textbox / Trigger container */}
                    <div
                      onClick={() => setIsSdgDropdownOpen((prev) => !prev)}
                      className="min-h-[46px] w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 transition-all shadow-xs"
                    >
                      {selectedSdgs.length === 0 ? (
                        <span className="text-gray-400 text-sm select-none">
                          Click to choose Sustainable Development Goals (SDGs)...
                        </span>
                      ) : (
                        selectedSdgs.map((sdg) => (
                          <span
                            key={sdg}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200/70"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{sdg}</span>
                            <button
                              type="button"
                              onClick={() => toggleSdg(sdg)}
                              className="text-blue-500 hover:text-rose-600 rounded p-0.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}

                      <div className="ml-auto pl-2 text-gray-400">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isSdgDropdownOpen ? 'rotate-90 text-blue-600' : 'rotate-0'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isSdgDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsSdgDropdownOpen(false)}
                        />

                        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                          {SDG_OPTIONS.map((sdg) => {
                            const isSelected = selectedSdgs.includes(sdg);
                            return (
                              <div
                                key={sdg}
                                onClick={() => toggleSdg(sdg)}
                                className={`px-4 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50/70 text-blue-900 font-semibold'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span>{sdg}</span>
                                {isSelected ? (
                                  <span className="text-blue-600 font-bold text-xs">✓ Selected</span>
                                ) : (
                                  <span className="text-gray-300 text-xs">+ Add</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Implementation Schedule */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  4
                </span>
                Implementation Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Document Attachments & Progress */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  5
                </span>
                Evidences & Supporting Documents
              </h3>

              {existingFiles.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-500 mb-2 block">
                    Previously Uploaded:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {existingFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(file)}
                          className="text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors cursor-pointer block bg-gray-50/50">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-700 font-medium">
                  Click to attach files or drag and drop
                </p>
                <p className="text-[11px] text-gray-400 mt-1">PDF, DOCX, JPG, PNG up to 15MB each</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.xlsx,.xls,.txt,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {uploadQueue.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>
                      {completedFilesCount} of {totalFilesCount} files uploaded
                      {failedFilesCount > 0 && (
                        <span className="text-rose-600 ml-2">({failedFilesCount} failed)</span>
                      )}
                    </span>
                    <span className="text-blue-700">{overallPercentage}% overall</span>
                  </div>

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${overallPercentage}%` }}
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    {uploadQueue.map((task) => (
                      <div
                        key={task.id}
                        className="p-2.5 bg-white border border-gray-200/80 rounded-xl text-xs space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate max-w-sm">
                            {task.file.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* In-Modal Preview for Staged Unsubmitted Local Files */}
                            <button
                              type="button"
                              onClick={() => handlePreviewLocalFile(task.file)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline bg-blue-50/60 px-2 py-0.5 rounded transition-colors"
                              title="Preview file content before submitting"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>

                            <span className="text-[11px] font-semibold text-gray-500">
                              {task.status === 'completed'
                                ? 'Uploaded 100%'
                                : task.status === 'error'
                                ? 'Upload failed'
                                : `${task.progress}%`}
                            </span>
                            {task.status !== 'uploading' && (
                              <button
                                type="button"
                                onClick={() => removeQueueItem(task.id)}
                                className="text-gray-400 hover:text-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              task.status === 'error'
                                ? 'bg-rose-500'
                                : task.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView('overview');
                }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Submitting...'
                    : editingSubmission
                    ? 'Update & Endorse'
                    : 'Save & Submit Output'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK STATUS VIEW */}
      {view === 'track' && activeSubmission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 pb-6 mb-8 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {activeSubmission.type}
                    </span>
                    <span className="text-xs text-gray-400">ID: {activeSubmission.id.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {activeSubmission.title}
                  </h2>
                </div>
                <div>{statusBadge(activeSubmission.status)}</div>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Submission Lodged</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Successfully submitted by faculty member on {formatDate(activeSubmission.created_at)}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      activeSubmission.status !== 'pending'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Dean Evaluation & Quality Review
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeSubmission.status === 'pending'
                        ? 'Currently pending formal evaluation by the College Dean.'
                        : `Evaluated on ${formatDate(activeSubmission.updated_at)}`}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      activeSubmission.status === 'approved'
                        ? 'bg-emerald-500 text-white'
                        : activeSubmission.status === 'rejected'
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {activeSubmission.status === 'approved' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : activeSubmission.status === 'rejected' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {activeSubmission.status === 'approved'
                        ? 'Approved & Officially Endorsed'
                        : activeSubmission.status === 'rejected'
                        ? 'Returned / Revisions Requested'
                        : 'Final Verification'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeSubmission.status === 'approved'
                        ? 'Output is archived into institutional performance indicators.'
                        : activeSubmission.status === 'rejected'
                        ? 'The reviewer provided corrective guidance before this output can be recognized.'
                        : 'Awaiting completion of administrative review.'}
                    </p>

                    {activeSubmission.dean_remarks && (
                      <div className="mt-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                        <span className="font-semibold block mb-0.5">Reviewer Remarks:</span>
                        {activeSubmission.dean_remarks}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setDetailsModalSubmission(activeSubmission)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Inspect Full Record
                </button>
                {activeSubmission.status !== 'approved' && (
                  <button
                    onClick={() => handleStartEdit(activeSubmission)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      {activeSubmission.status === 'rejected'
                        ? 'Revise & Resubmit'
                        : 'Modify Submission'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Your Submissions</h3>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {submissions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTrackingId(item.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      item.id === activeSubmission.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold truncate max-w-[140px]">{item.title}</span>
                      <span className="capitalize text-[10px] font-bold">{item.status}</span>
                    </div>
                    <div className="text-gray-400 text-[11px] capitalize">
                      {item.type} · {formatDate(item.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS VIEW MODAL */}
      {detailsModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setDetailsModalSubmission(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                {detailsModalSubmission.type}
              </span>
              {statusBadge(detailsModalSubmission.status)}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {detailsModalSubmission.title}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Filed on {formatDate(detailsModalSubmission.created_at)}
            </p>

            <div className="space-y-4 text-xs sm:text-sm text-gray-700 border-t border-b border-gray-100 py-4">
              <div>
                <span className="font-bold text-gray-900 block mb-1">Description</span>
                <p className="bg-gray-50 p-3 rounded-xl text-gray-600 leading-relaxed">
                  {detailsModalSubmission.description || 'No description recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-gray-500 block">Implementation Period</span>
                  <span>
                    {formatDate(detailsModalSubmission.start_date)} –{' '}
                    {formatDate(detailsModalSubmission.end_date)}
                  </span>
                </div>
                {detailsModalSubmission.type === 'research' && (
                  <>
                    <div>
                      <span className="font-semibold text-gray-500 block">Authors</span>
                      <span>{detailsModalSubmission.authors || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Funding Source</span>
                      <span>{detailsModalSubmission.funding_source || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Budget</span>
                      <span>
                        {detailsModalSubmission.budget !== null &&
                        detailsModalSubmission.budget !== undefined
                          ? `₱${Number(detailsModalSubmission.budget).toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {detailsModalSubmission.type === 'extension' && (
                  <>
                    <div>
                      <span className="font-semibold text-gray-500 block">
                        Partner Organization
                      </span>
                      <span>{detailsModalSubmission.partner_organization || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Beneficiaries</span>
                      <span>
                        {detailsModalSubmission.beneficiaries !== null &&
                        detailsModalSubmission.beneficiaries !== undefined
                          ? Number(detailsModalSubmission.beneficiaries).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {detailsModalSubmission.type === 'research' &&
                detailsModalSubmission.publication_link && (
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">
                      Publication Link
                    </span>
                    <a
                      href={detailsModalSubmission.publication_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{detailsModalSubmission.publication_link}</span>
                    </a>
                  </div>
                )}

              {detailsModalSubmission.type === 'extension' && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1.5">SDG Alignment</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parseSdgs(detailsModalSubmission.sdg_alignment).map((sdg, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-lg font-medium"
                      >
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {getSubmissionFiles(detailsModalSubmission).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-2">Attached Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {getSubmissionFiles(detailsModalSubmission).map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOpenPreview(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="max-w-[180px] truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  const id = detailsModalSubmission.id;
                  setDetailsModalSubmission(null);
                  handleNavigateToTrack(id);
                }}
                className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Track Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <DocxPreviewModal
          file={previewFile}
          onClose={handleClosePreview}
        />
      )}

      {/* NOTIFICATIONS MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
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
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocxPreviewModal({
  file,
  onClose,
}: {
  file: { url: string; name: string };
  onClose: () => void;
}) {
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [renderingDocx, setRenderingDocx] = useState(false);
  const [renderError, setRenderError] = useState(false);

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isText = ['txt', 'csv', 'json', 'log'].includes(ext);
  const isDocx = ext === 'docx';
  const isOfficeDoc = ['doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);
  const isLocalBlob = file.url.startsWith('blob:');

  useEffect(() => {
    // Client-side rendering for DOCX (works for both local files and Supabase files)
    if (isDocx && docxContainerRef.current) {
      setRenderingDocx(true);
      setRenderError(false);
      docxContainerRef.current.innerHTML = '';

      fetch(file.url)
        .then((res) => res.blob())
        .then((blob) => {
          if (docxContainerRef.current) {
            return renderAsync(blob, docxContainerRef.current, undefined, {
              className: 'docx-preview-content',
              inWrapper: false,
            });
          }
        })
        .catch((err) => {
          console.error('Docx preview error:', err);
          setRenderError(true);
        })
        .finally(() => {
          setRenderingDocx(false);
        });
    }
  }, [file.url, isDocx]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm truncate">{file.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto bg-gray-100/50 p-4 flex items-center justify-center min-h-[400px]">
          {/* 1. PDF */}
          {isPdf && (
            <iframe
              src={`${file.url}#toolbar=0`}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white"
              title={file.name}
            />
          )}

          {/* 2. Image */}
          {isImg && (
            <div className="flex items-center justify-center w-full h-[68vh] bg-white rounded-xl border border-gray-200 p-2">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {/* 3. Text / CSV */}
          {isText && (
            <iframe
              src={file.url}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs"
              title={file.name}
            />
          )}

          {/* 4. Native DOCX Viewer (Works on Local Pre-submission and Live files) */}
          {isDocx && (
            <div className="w-full h-[68vh] bg-white rounded-xl border border-gray-200 overflow-y-auto p-6 sm:p-10 shadow-inner">
              {renderingDocx && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Rendering Word document...</span>
                </div>
              )}
              {renderError && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  Could not parse this Word file preview. Use "Save a Copy" below to inspect.
                </div>
              )}
              <div ref={docxContainerRef} className="max-w-3xl mx-auto" />
            </div>
          )}

          {/* 5. Remote Excel / PPT (via Office Online Viewer) */}
          {isOfficeDoc && !isLocalBlob && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
              className="w-full h-[68vh] rounded-xl border border-gray-200 bg-white"
              title={file.name}
            />
          )}

          {/* 6. Fallback for un-uploaded non-DOCX formats (e.g. local .xlsx) */}
          {!isPdf && !isImg && !isText && !isDocx && (!isOfficeDoc || isLocalBlob) && (
            <div className="text-center py-12 px-4 max-w-md">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">{file.name}</h4>
              <p className="text-xs text-gray-500 mb-4">
                This format ({ext.toUpperCase()}) will be viewable inline once submitted.
              </p>
              <a
                href={file.url}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save a Copy</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 flex justify-end gap-2 bg-white">
          <a
            href={file.url}
            download={file.name}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save a Copy</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}