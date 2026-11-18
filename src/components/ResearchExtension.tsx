import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { notifyDean } from '../notificationsApi';
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
  FileImage,
  FileCode,
  File as FileGenericIcon,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const RESEARCH_API_URL = 'http://localhost:5000/api/research-submissions';

function getResearchToken() {
  return localStorage.getItem('token');
}

// Complete list of all 17 Sustainable Development Goals
const SDG_OPTIONS = [
  'SDG 1 – No Poverty',
  'SDG 2 – Zero Hunger',
  'SDG 3 – Good Health and Well-Being',
  'SDG 4 – Quality Education',
  'SDG 5 – Gender Equality',
  'SDG 6 – Clean Water and Sanitation',
  'SDG 7 – Affordable and Clean Energy',
  'SDG 8 – Decent Work and Economic Growth',
  'SDG 9 – Industry, Innovation and Infrastructure',
  'SDG 10 – Reduced Inequalities',
  'SDG 11 – Sustainable Cities and Communities',
  'SDG 12 – Responsible Consumption and Production',
  'SDG 13 – Climate Action',
  'SDG 14 – Life Below Water',
  'SDG 15 – Life on Land',
  'SDG 16 – Peace, Justice and Strong Institutions',
  'SDG 17 – Partnerships for the Goals',
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
  submitted_by?: string | null;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  publication_link?: string | null;
  file_name: string | null;
  file_url: string | null;
  file_path?: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  research_status?: 'on-going' | 'completed' | 'published' | null;
  dean_remarks?: string | null;
  remarks?: string | null;
  category?: string | null;
  date_received?: string | null;
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

function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return (name.split('.').pop() || '').toLowerCase();
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

export function ResearchExtension({ userId, userName = 'A faculty member' }: { userId: string; userName?: string }) {
  // Navigation State
  const [view, setView] = useState<'overview' | 'create' | 'track'>('overview');
  const [overviewTab, setOverviewTab] = useState<'all' | 'research' | 'extension' | 'achievement'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Tracking / Modal references
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [detailsModalSubmission, setDetailsModalSubmission] = useState<ResearchSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<ResearchSubmission | null>(null);

  // In-Modal Preview State
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const localBlobUrlMapRef = useRef<Map<string, string>>(new Map());

  // Form State
  const [researchType, setResearchType] = useState<'research' | 'extension' | 'achievement'>('research');
  const [researchStatus, setResearchStatus] = useState<'on-going' | 'completed' | 'published'>('completed');
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

  const handleClosePreview = useCallback(() => {
    localBlobUrlMapRef.current.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    localBlobUrlMapRef.current.clear();
    setPreviewFile(null);
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${RESEARCH_API_URL}/mine`, {
        headers: { Authorization: `Bearer ${getResearchToken()}` },
      });
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();
      setSubmissions((data ?? []).filter((s: any) => ['research', 'extension', 'achievement'].includes(s.type)));
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
    setResearchStatus('completed');
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
    setIsSdgDropdownOpen(false);
  };

  const handleStartCreate = (type: 'research' | 'extension' | 'achievement') => {
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
    setResearchStatus(submission.research_status || 'completed');
    setExistingFiles(getSubmissionFiles(submission));
    setUploadQueue([]);
    setSelectedSdgs(parseSdgs(submission.sdg_alignment));

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
    } else if (submission.type === 'extension') {
      setPartnerOrg(submission.partner_organization || '');
      setBeneficiaries(
        submission.beneficiaries !== null && submission.beneficiaries !== undefined
          ? String(submission.beneficiaries)
          : ''
      );
    }
    setView('create');
  };

  const handleResearchStatusChange = (statusVal: 'on-going' | 'completed' | 'published') => {
    setResearchStatus(statusVal);
    if (statusVal !== 'published') {
      setPublicationLink('');
    }
    if (statusVal === 'on-going') {
      setEndDate('');
    }
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

  const handlePreviewQueuedTask = (task: FileUploadTask) => {
    let blobUrl = localBlobUrlMapRef.current.get(task.id);
    if (!blobUrl) {
      blobUrl = URL.createObjectURL(task.file);
      localBlobUrlMapRef.current.set(task.id, blobUrl);
    }
    setPreviewFile({
      name: task.file.name,
      url: blobUrl,
      size: task.file.size,
      type: task.file.type,
    });
  };

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

    if (
      researchType === 'research' &&
      (researchStatus === 'completed' || researchStatus === 'published') &&
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
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

    const cleanedCoAuthors = coAuthors.map((a) => a.trim()).filter(Boolean);
    const coAuthorsString = cleanedCoAuthors.join(', ');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', researchType);
      if (description.trim()) formData.append('description', description.trim());
      if (startDate) formData.append('start_date', startDate);
      if (researchType === 'research') {
        formData.append('research_status', researchStatus);
        if (researchStatus !== 'on-going') {
          if (endDate) formData.append('end_date', endDate);
        }
        if (researchStatus === 'published' && publicationLink.trim()) {
          formData.append('publication_link', publicationLink.trim());
        }
      } else {
        if (endDate) formData.append('end_date', endDate);
      }
      formData.append('sdg_alignment', JSON.stringify(selectedSdgs));

      if (researchType === 'research') {
        if (fundingSource.trim()) formData.append('funding_source', fundingSource.trim());
        if (coAuthorsString) formData.append('authors', coAuthorsString);
        if (budget) formData.append('budget', budget);
      } else if (researchType === 'extension') {
        if (partnerOrg.trim()) formData.append('partner_organization', partnerOrg.trim());
        if (beneficiaries) formData.append('beneficiaries', beneficiaries);
      }

      const isEdit = Boolean(editingSubmission);
      const endpoint = isEdit ? `${RESEARCH_API_URL}/${editingSubmission!.id}` : RESEARCH_API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const pendingFiles = uploadQueue.filter(
        (t) => t.status === 'pending' || t.status === 'error'
      );
      pendingFiles.forEach((task) => {
        formData.append('files', task.file);
      });

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

      try {
        await notifyDean({
          title: `${isEdit ? 'Updated' : 'New'} ${researchType.charAt(0).toUpperCase() + researchType.slice(1)} Submission`,
          message: title.trim(),
          type: 'system',
        });
      } catch (e) {
        console.error('Submission saved but Dean notification failed:', e);
      }

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
      achievementCount: submissions.filter((s) => s.type === 'achievement').length,
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
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
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
                              {item.type === 'research' && item.research_status && (
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    item.research_status === 'on-going'
                                      ? 'bg-amber-100 text-amber-800'
                                      : item.research_status === 'published'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.research_status === 'on-going'
                                    ? 'On-going'
                                    : item.research_status === 'published'
                                    ? 'Published'
                                    : 'Completed'}
                                </span>
                              )}
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                {item.title}
                              </h3>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Submitted on {formatDate(item.created_at)}
                              {item.start_date &&
                                ` · Activity: ${formatDate(item.start_date)} – ${
                                  item.end_date ? formatDate(item.end_date) : 'Present'
                                }`}
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
                        {sdgs.length > 0 && (
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
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 flex-wrap gap-4">
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
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl flex-wrap">
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

            {/* 2. Authors / Collaborators */}
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
                      {researchStatus !== 'published' && (
                        <span className="text-amber-600 ml-1 font-medium">✨ Available only when status is Published</span>
                      )}
                    </label>
                    <input
                      type="url"
                      value={publicationLink}
                      disabled={researchStatus !== 'published'}
                      onChange={(e) => setPublicationLink(e.target.value)}
                      placeholder={
                        researchStatus !== 'published'
                          ? 'Select "Published" status to add a link'
                          : 'https://doi.org/... or journal link'
                      }
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all ${
                        researchStatus !== 'published'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                          : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                      }`}
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

            {/* 3. Financials & SDG Alignment */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  3
                </span>
                {researchType === 'research' ? 'Funding & SDG Alignment' : 'SDG Alignment'}
              </h3>

              <div className="space-y-4">
                {researchType === 'research' && (
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
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Sustainable Development Goals (SDG) Alignment{' '}
                    <span className="text-gray-400 font-normal">(Select all that apply)</span>
                  </label>

                  <div className="relative">
                    <div
                      onClick={() => setIsSdgDropdownOpen((prev) => !prev)}
                      className="min-h-[50px] w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer flex flex-wrap items-center gap-2 transition-all shadow-xs"
                    >
                      {selectedSdgs.length === 0 ? (
                        <span className="text-gray-400 text-sm select-none py-1">
                          Click to select Sustainable Development Goals...
                        </span>
                      ) : (
                        selectedSdgs.map((sdg) => (
                          <span
                            key={sdg}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/90 text-blue-900 rounded-lg text-xs font-medium border border-blue-200 shadow-2xs hover:bg-blue-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="max-w-[280px] sm:max-w-none truncate">{sdg}</span>
                            <button
                              type="button"
                              onClick={() => toggleSdg(sdg)}
                              className="text-blue-500 hover:text-rose-600 rounded p-0.5 ml-1 transition-colors"
                              title={`Remove ${sdg}`}
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

                    {isSdgDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsSdgDropdownOpen(false)}
                        />

                        <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-100 max-h-80 overflow-y-auto">
                          <div className="p-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600">
                            <span>UN Sustainable Development Goals ({selectedSdgs.length} selected)</span>
                            {selectedSdgs.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSdgs([]);
                                }}
                                className="text-rose-600 hover:underline"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          {SDG_OPTIONS.map((sdg) => {
                            const isSelected = selectedSdgs.includes(sdg);
                            return (
                              <div
                                key={sdg}
                                onClick={() => toggleSdg(sdg)}
                                className={`px-4 py-3 flex items-center justify-between text-xs sm:text-sm cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50/70 text-blue-900 font-semibold'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="leading-snug pr-4">{sdg}</span>
                                {isSelected ? (
                                  <span className="text-blue-600 font-bold text-xs shrink-0 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Selected
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs shrink-0 hover:text-gray-700">
                                    + Add
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Implementation Schedule */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  4
                </span>
                Implementation Schedule
              </h3>

              {researchType === 'research' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Research Status *
                  </label>
                  <select
                    value={researchStatus}
                    onChange={(e) => handleResearchStatusChange(e.target.value as 'on-going' | 'completed' | 'published')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-medium text-gray-900"
                  >
                    <option value="completed">Completed</option>
                    <option value="on-going">On-going</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              )}

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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                    {researchType === 'research' && researchStatus === 'on-going' && (
                      <span className="text-amber-600 ml-1 font-medium">✨ Disabled for On-going research</span>
                    )}
                  </label>
                  <input
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    disabled={researchType === 'research' && researchStatus === 'on-going'}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all ${
                      researchType === 'research' && researchStatus === 'on-going'
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 5. Document Attachments & Google Classroom File Cards */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                  5
                </span>
                Evidences & Supporting Documents
              </h3>

              {existingFiles.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 mb-2.5 block">
                    Current Attached Documents:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {existingFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {getFileExtension(file.name).toUpperCase()}
                              {file.size ? ` • ${formatFileSize(file.size)}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
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
                <p className="text-[11px] text-gray-400 mt-1">PDF, DOCX, JPG, PNG, XLSX up to 15MB each</p>
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
                        className="p-3 bg-white border border-gray-200/80 rounded-xl text-xs space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {getFileIcon(task.file.name, 'w-4 h-4 text-blue-600 shrink-0')}
                            <span className="font-semibold text-gray-900 truncate" title={task.file.name}>
                              {task.file.name}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({formatFileSize(task.file.size)})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePreviewQueuedTask(task)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                              title="Preview file"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>

                            <span className="text-[11px] font-semibold text-gray-500">
                              {task.status === 'completed'
                                ? '100%'
                                : task.status === 'error'
                                ? 'Upload failed'
                                : `${task.progress}%`}
                            </span>
                            {task.status !== 'uploading' && (
                              <button
                                type="button"
                                onClick={() => removeQueueItem(task.id)}
                                className="text-gray-400 hover:text-rose-600 p-0.5"
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
                    {activeSubmission.type === 'research' && activeSubmission.research_status && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          activeSubmission.research_status === 'on-going'
                            ? 'bg-amber-100 text-amber-800'
                            : activeSubmission.research_status === 'published'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {activeSubmission.research_status === 'on-going'
                          ? 'On-going'
                          : activeSubmission.research_status === 'published'
                          ? 'Published'
                          : 'Completed'}
                      </span>
                    )}
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

                    {(activeSubmission.dean_remarks || activeSubmission.remarks) && (
                      <div className="mt-3 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl">
                        <span className="font-semibold block mb-0.5">Reviewer Remarks:</span>
                        {activeSubmission.dean_remarks || activeSubmission.remarks}
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
              {detailsModalSubmission.type === 'research' && detailsModalSubmission.research_status && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    detailsModalSubmission.research_status === 'on-going'
                      ? 'bg-amber-100 text-amber-800'
                      : detailsModalSubmission.research_status === 'published'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {detailsModalSubmission.research_status === 'on-going'
                    ? 'On-going'
                    : detailsModalSubmission.research_status === 'published'
                    ? 'Published'
                    : 'Completed'}
                </span>
              )}
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
                    {detailsModalSubmission.end_date ? formatDate(detailsModalSubmission.end_date) : 'Present (On-going)'}
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

              {parseSdgs(detailsModalSubmission.sdg_alignment).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1.5">
                    Sustainable Development Goals (SDG) Alignment
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parseSdgs(detailsModalSubmission.sdg_alignment).map((sdg, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-lg font-medium border border-blue-100"
                      >
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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

              {getSubmissionFiles(detailsModalSubmission).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-2">Attached Documents</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {getSubmissionFiles(detailsModalSubmission).map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {getFileExtension(file.name).toUpperCase()}
                              {file.size ? ` • ${formatFileSize(file.size)}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors shrink-0 shadow-2xs"
                        >
                          View
                        </button>
                      </div>
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

      {/* GOOGLE CLASSROOM DARK MODAL OVERLAY */}
      {previewFile && (
        <ClassroomDocumentViewer
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

// ─── Google Classroom-Style Document Viewer Component ────────────────────────

function ClassroomDocumentViewer({
  file,
  onClose,
}: {
  file: FileAttachment;
  onClose: () => void;
}) {
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const ext = useMemo(() => getFileExtension(file?.name || ''), [file]);
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isText = ['txt', 'csv', 'json', 'log'].includes(ext);
  const isDocx = ext === 'docx';

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
    setLoadingFile(true);
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

    if (isDocx && docxContainerRef.current) {
      docxContainerRef.current.innerHTML = '';
      fetch(activeUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.blob();
        })
        .then((blob) => {
          if (docxContainerRef.current) {
            return renderAsync(blob, docxContainerRef.current, undefined, {
              className: 'docx-preview-content',
              inWrapper: false,
            });
          }
        })
        .catch(() => setLoadError(true))
        .finally(() => setLoadingFile(false));
    } else if (isText) {
      fetch(activeUrl)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
          setLoadingFile(false);
        })
        .catch(() => {
          setLoadError(true);
          setLoadingFile(false);
        });
    } else {
      setLoadingFile(false);
    }
  }, [activeUrl, isDocx, isText]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-b border-gray-700/60 text-white select-none shadow-md shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base text-gray-100 truncate" title={file.name}>
            {file.name}
          </span>
          {file.size ? (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({formatFileSize(file.size)})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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
          className="w-full h-full max-w-5xl bg-white rounded-md shadow-2xl overflow-hidden relative flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          ) : loadError ? (
            <div className="text-center p-8 max-w-md">
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
            <div className="w-full h-full bg-white text-gray-900 overflow-y-auto p-6 sm:p-12 text-left select-text">
              <div ref={docxContainerRef} className="max-w-3xl mx-auto" />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md">
              <FileGenericIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900 mb-1">{file.name}</h4>
              <p className="text-xs text-gray-500 mb-4">
                This file type ({ext.toUpperCase()}) cannot be previewed directly in the browser.
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