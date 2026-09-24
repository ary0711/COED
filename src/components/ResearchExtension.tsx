import React, { useState, useEffect, useMemo } from 'react';
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
  size?: number;
  type?: string;
}

interface ResearchSubmission {
  id: string;
  title: string;
  type: 'research' | 'extension';
  publication_link?: string | null;
  file_name: string | null;
  file_url: string | null;
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

  // Active tracking / viewing / editing targets
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [detailsModalSubmission, setDetailsModalSubmission] = useState<ResearchSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<ResearchSubmission | null>(null);

  // Form State
  const [researchType, setResearchType] = useState<'research' | 'extension'>('research');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileAttachment[]>([]);

  // Research Form Fields
  const [publicationLink, setPublicationLink] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [authors, setAuthors] = useState('');
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

  // System Modal State
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${RESEARCH_API_URL}/mine`, {
        headers: { Authorization: `Bearer ${getResearchToken()}` },
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
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
    if (s.file_url) return [{ name: s.file_name || 'Attached Document', url: s.file_url }];
    return [];
  };

  const openFileViewer = (url: string, name: string) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const isImageOrPdf = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

    if (isImageOrPdf) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setSelectedFiles([]);
    setExistingFiles([]);
    setPublicationLink('');
    setFundingSource('');
    setAuthors('');
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
    setSelectedFiles([]);

    if (submission.type === 'research') {
      setPublicationLink(submission.publication_link || '');
      setFundingSource(submission.funding_source || '');
      setAuthors(submission.authors || '');
      setBudget(submission.budget !== null && submission.budget !== undefined ? String(submission.budget) : '');
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
    const oversized = newFiles.filter(f => f.size > 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setModal({
        isOpen: true,
        type: 'validation',
        title: 'File Exceeds Limit',
        message: `Files exceeding 15MB: ${oversized.map(f => f.name).join(', ')}`,
      });
      return;
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSdg = (sdg: string) => {
    setSelectedSdgs(prev =>
      prev.includes(sdg) ? prev.filter(item => item !== sdg) : [...prev, sdg]
    );
  };

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
        if (authors.trim()) formData.append('authors', authors.trim());
        if (budget) formData.append('budget', budget);
      } else {
        if (partnerOrg.trim()) formData.append('partner_organization', partnerOrg.trim());
        if (beneficiaries) formData.append('beneficiaries', beneficiaries);
        formData.append('sdg_alignment', JSON.stringify(selectedSdgs));
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const isEdit = Boolean(editingSubmission);
      const endpoint = isEdit ? `${RESEARCH_API_URL}/${editingSubmission!.id}` : RESEARCH_API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${getResearchToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          isOpen: true,
          type: 'error',
          title: isEdit ? 'Update Failed' : 'Submission Failed',
          message: err.error || res.statusText || 'Operation could not be completed.',
        });
        return;
      }

      const updatedRecord: ResearchSubmission = await res.json();

      if (isEdit) {
        setSubmissions(prev => prev.map(s => (s.id === updatedRecord.id ? updatedRecord : s)));
      } else {
        setSubmissions(prev => [updatedRecord, ...prev]);
      }

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
    } catch {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server. Check your network connection.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Submissions Logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(item => {
      const matchesTab =
        overviewTab === 'all' ? true : item.type === overviewTab;
      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.authors && item.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.partner_organization && item.partner_organization.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [submissions, overviewTab, statusFilter, searchQuery]);

  // Statistics Aggregates
  const stats = useMemo(() => {
    return {
      total: submissions.length,
      approved: submissions.filter(s => s.status === 'approved').length,
      pending: submissions.filter(s => s.status === 'pending').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      researchCount: submissions.filter(s => s.type === 'research').length,
      extensionCount: submissions.filter(s => s.type === 'extension').length,
    };
  }, [submissions]);

  // Formatting Utilities
  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified';

  const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${map[status] || map.pending}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    return <Clock className="w-5 h-5 text-amber-500 shrink-0" />;
  };

  // Currently Tracked Submission
  const activeSubmission = useMemo(() => {
    return submissions.find(s => s.id === activeTrackingId) || submissions[0] || null;
  }, [submissions, activeTrackingId]);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Top Header & Navigation Breadcrumb */}
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
                  {view === 'create' ? (editingSubmission ? 'Edit Submission' : 'New Submission') : 'Track Status'}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Research & Extension</h1>
        </div>

        {/* Global Action Switches */}
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

      {/* Primary View Routing */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Dashboard Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Outputs</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.researchCount} Res · {stats.extensionCount} Ext</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Approved</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.approved}</div>
              <div className="text-xs text-emerald-600/80 mt-1">Verified records</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending Review</div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-amber-600/80 mt-1">Under Dean review</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Rejected / Revision</div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600">{stats.rejected}</div>
              <div className="text-xs text-rose-600/80 mt-1">Needs attention</div>
            </div>
          </div>

          {/* Submissions Management Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
              {/* Type Category Tabs */}
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  onClick={() => setOverviewTab('all')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'all' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Outputs ({submissions.length})
                </button>
                <button
                  onClick={() => setOverviewTab('research')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'research' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Research ({stats.researchCount})
                </button>
                <button
                  onClick={() => setOverviewTab('extension')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    overviewTab === 'extension' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Extension ({stats.extensionCount})
                </button>
              </div>

              {/* Search & Status Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title, partner, author..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
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

            {/* Submissions List / Grid */}
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
                {filteredSubmissions.map(item => {
                  const sdgs = parseSdgs(item.sdg_alignment);
                  const files = getSubmissionFiles(item);

                  return (
                    <div key={item.id} className="py-4 sm:py-5 hover:bg-gray-50/70 transition-colors rounded-xl px-2 sm:px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{statusIcon(item.status)}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {item.type}
                              </span>
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900">{item.title}</h3>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Submitted on {formatDate(item.created_at)}
                              {item.start_date && ` · Activity: ${formatDate(item.start_date)} – ${formatDate(item.end_date)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {statusBadge(item.status)}
                        </div>
                      </div>

                      {/* Brief Metadata Display */}
                      <div className="pl-8 text-xs text-gray-600 line-clamp-2 mt-1 mb-3">
                        {item.description || (
                          <span className="text-gray-400 italic">No description provided.</span>
                        )}
                      </div>

                      {/* Pill Highlights */}
                      <div className="pl-8 flex flex-wrap items-center gap-2 mb-3">
                        {item.type === 'research' && item.funding_source && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            Funding: {item.funding_source}
                          </span>
                        )}
                        {item.type === 'research' && item.budget !== null && item.budget !== undefined && (
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

                      {/* Action Bar */}
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

      {/* Create / Edit Form View */}
      {view === 'create' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubmission ? `Edit ${researchType === 'research' ? 'Research' : 'Extension'} Output` : 'New Submission'}
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
                    researchType === 'research' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Research
                </button>
                <button
                  type="button"
                  onClick={() => setResearchType('extension')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    researchType === 'extension' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Extension Activity
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* 1. General Project Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">1</span>
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
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter full descriptive title"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Executive Summary / Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly state the background, methodology, objectives, and impact..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Researchers or Partners */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">2</span>
                {researchType === 'research' ? 'Authors & Collaborators' : 'Partnership & Reach'}
              </h3>
              {researchType === 'research' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Authors / Co-authors</label>
                    <input
                      type="text"
                      value={authors}
                      onChange={e => setAuthors(e.target.value)}
                      placeholder="e.g., Dr. Jane Doe, Prof. John Smith"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Publication Link <span className="text-gray-400 font-normal">(Optional DOI or URL)</span>
                    </label>
                    <input
                      type="url"
                      value={publicationLink}
                      onChange={e => setPublicationLink(e.target.value)}
                      placeholder="https://doi.org/... or journal link"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Partner Organization / LGU</label>
                    <input
                      type="text"
                      value={partnerOrg}
                      onChange={e => setPartnerOrg(e.target.value)}
                      placeholder="e.g. Barangay San Jose, Red Cross"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Beneficiaries</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={beneficiaries}
                      onChange={e => setBeneficiaries(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Financials & Impact Alignment */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">3</span>
                {researchType === 'research' ? 'Funding & Budget' : 'SDG Alignment'}
              </h3>
              {researchType === 'research' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Funding Source</label>
                    <input
                      type="text"
                      value={fundingSource}
                      onChange={e => setFundingSource(e.target.value)}
                      placeholder="e.g., Institutional Grant, DOST-PCHRD, Self-Funded"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Allocated Budget (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Sustainable Development Goals (SDGs) Multi-select
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {SDG_OPTIONS.map(sdg => {
                      const isChecked = selectedSdgs.includes(sdg);
                      return (
                        <label
                          key={sdg}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSdg(sdg)}
                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{sdg}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Schedule and Timeline */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">4</span>
                Implementation Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Document Attachments */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">5</span>
                Evidences & Supporting Documents
              </h3>

              {existingFiles.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-500 mb-2 block">Previously Uploaded:</span>
                  <div className="flex flex-wrap gap-2">
                    {existingFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-gray-500" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors cursor-pointer block bg-gray-50/50">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-700 font-medium">Click to attach files or drag and drop</p>
                <p className="text-[11px] text-gray-400 mt-1">PDF, DOCX, JPG, PNG up to 15MB each</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">{selectedFiles.length} new file(s) selected:</p>
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-xs font-medium text-blue-900">{f.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission Actions */}
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
                <span>{submitting ? 'Submitting...' : editingSubmission ? 'Update & Endorse' : 'Save & Submit Output'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Status / Timeline View */}
      {view === 'track' && activeSubmission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Column */}
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
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{activeSubmission.title}</h2>
                </div>
                <div>{statusBadge(activeSubmission.status)}</div>
              </div>

              {/* Progress Stepper Component */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {/* Step 1: Initial Submission */}
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

                {/* Step 2: Under Review */}
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
                    <h4 className="text-sm font-bold text-gray-900">Dean Evaluation & Quality Review</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeSubmission.status === 'pending'
                        ? 'Currently pending formal evaluation by the College Dean.'
                        : `Evaluated on ${formatDate(activeSubmission.updated_at)}`}
                    </p>
                  </div>
                </div>

                {/* Step 3: Final Decision */}
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

              {/* Action Buttons for Track Page */}
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
                    <span>{activeSubmission.status === 'rejected' ? 'Revise & Resubmit' : 'Modify Submission'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Select Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Your Submissions</h3>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {submissions.map(item => (
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
                    <div className="text-gray-400 text-[11px] capitalize">{item.type} · {formatDate(item.created_at)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Details Modal */}
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

            <h2 className="text-xl font-bold text-gray-900 mb-2">{detailsModalSubmission.title}</h2>
            <p className="text-xs text-gray-400 mb-6">Filed on {formatDate(detailsModalSubmission.created_at)}</p>

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
                  <span>{formatDate(detailsModalSubmission.start_date)} – {formatDate(detailsModalSubmission.end_date)}</span>
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
                        {detailsModalSubmission.budget !== null && detailsModalSubmission.budget !== undefined
                          ? `₱${Number(detailsModalSubmission.budget).toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {detailsModalSubmission.type === 'extension' && (
                  <>
                    <div>
                      <span className="font-semibold text-gray-500 block">Partner Organization</span>
                      <span>{detailsModalSubmission.partner_organization || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Beneficiaries</span>
                      <span>
                        {detailsModalSubmission.beneficiaries !== null && detailsModalSubmission.beneficiaries !== undefined
                          ? Number(detailsModalSubmission.beneficiaries).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {detailsModalSubmission.type === 'research' && detailsModalSubmission.publication_link && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">Publication Link</span>
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
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-lg font-medium">
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {getSubmissionFiles(detailsModalSubmission).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-2">Attached Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {getSubmissionFiles(detailsModalSubmission).map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => openFileViewer(file.url, file.name)}
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

      {/* Notifications Modal */}
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