import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Calendar,
  Building,
  Users,
  DollarSign,
  Target,
  FileText,
  User,
  MessageSquare,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface FileAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface ResearchSubmissionRow {
  id: string;
  title: string;
  type: 'research' | 'extension' | 'achievement';
  category: string | null;
  description?: string | null;
  publication_link?: string | null;
  funding_source?: string | null;
  authors?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  partner_organization?: string | null;
  beneficiaries?: number | null;
  sdg_alignment?: string[] | string | null;
  file_name: string | null;
  file_url: string | null;
  files?: FileAttachment[] | null;
  status: 'pending' | 'approved' | 'rejected';
  dean_remarks: string | null;
  created_at: string;
  updated_at: string;
  submitter: { full_name: string; department: string | null } | null;
}

const RESEARCH_API_URL_DEAN = 'https://coed.onrender.com/api/research-submissions';

const RESEARCH_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending Review', color: '#92400E', bg: '#FEF3C7' },
  approved: { label: 'Approved',       color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Rejected',       color: '#991B1B', bg: '#FEE2E2' },
};

function getResearchTokenDean() {
  return localStorage.getItem('token');
}

export function ResearchAchievements() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'research' | 'extension' | 'achievement'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState<ResearchSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Action states
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<ResearchSubmissionRow | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [viewingItem, setViewingItem] = useState<ResearchSubmissionRow | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const url = statusFilter === 'all' ? RESEARCH_API_URL_DEAN : `${RESEARCH_API_URL_DEAN}?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getResearchTokenDean()}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load submissions.');
        setSubmissions([]);
        return;
      }
      const data = await res.json();
      setSubmissions(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const decide = async (submission: ResearchSubmissionRow, status: 'approved' | 'rejected', dean_remarks?: string) => {
    setActionId(submission.id);
    try {
      const res = await fetch(`${RESEARCH_API_URL_DEAN}/${submission.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getResearchTokenDean()}` },
        body: JSON.stringify({ status, dean_remarks }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to update submission status.');
        return;
      }
      
      // Update local state smoothly
      setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, status, dean_remarks: dean_remarks || null } : s));
      if (statusFilter !== 'all') {
        setSubmissions(prev => prev.filter(s => s.id !== submission.id));
      }
      
      setRejectFor(null);
      setRemarksInput('');
      if (viewingItem && viewingItem.id === submission.id) {
        setViewingItem(null);
      }
    } catch {
      setLoadError('Could not reach the server. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const parseSdgs = (raw: string[] | string | null | undefined): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const getAllAttachments = (item: ResearchSubmissionRow): FileAttachment[] => {
    if (Array.isArray(item.files) && item.files.length > 0) {
      return item.files;
    }
    if (item.file_url) {
      return [{ name: item.file_name || 'Attached Document', url: item.file_url }];
    }
    return [];
  };

  const handleViewFile = (file: FileAttachment) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImageOrPdf = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

    if (isImageOrPdf) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else {
      const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.url)}`;
      window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  const typeLabel = (t: string) => (t === 'research' ? 'Research' : t === 'extension' ? 'Extension' : 'Achievement');

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        s.title.toLowerCase().includes(term) ||
        (s.submitter?.full_name && s.submitter.full_name.toLowerCase().includes(term)) ||
        (s.submitter?.department && s.submitter.department.toLowerCase().includes(term)) ||
        (s.partner_organization && s.partner_organization.toLowerCase().includes(term)) ||
        (s.category && s.category.toLowerCase().includes(term));

      return matchesType && matchesSearch;
    });
  }, [submissions, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Main Filtering Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Research, Extension & Achievements</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review, inspect, and evaluate faculty scholarly and extension output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, faculty, dept..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="all">All Disciplines</option>
            <option value="research">Research</option>
            <option value="extension">Extension Activities</option>
            <option value="achievement">Faculty Achievements</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="pending">Pending Evaluation</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected / Revisions</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            {statusFilter === 'pending'
              ? 'Pending Endorsements'
              : statusFilter === 'approved'
              ? 'Approved Submissions'
              : statusFilter === 'rejected'
              ? 'Rejected Filings'
              : 'All Submissions'}
          </h2>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filtered.length} Record(s)
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Retrieving submissions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-600">No submissions found.</p>
            <p className="text-xs text-gray-400 mt-1">There are no records matching your current filter selection.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(item => {
              const cfg = RESEARCH_STATUS_LABEL[item.status] || RESEARCH_STATUS_LABEL.pending;
              const attachments = getAllAttachments(item);
              const sdgs = parseSdgs(item.sdg_alignment);

              return (
                <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Item Details */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {typeLabel(item.type)}
                        </span>
                        <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                      </div>

                      {/* Submitter info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {item.submitter?.full_name ?? 'Unknown Faculty'}
                        </span>
                        <span>·</span>
                        <span>{item.submitter?.department ?? 'No Department Specified'}</span>
                        <span>·</span>
                        <span>Submitted on {formatDate(item.created_at)}</span>
                      </div>

                      {/* Dynamic Field Preview Grid */}
                      <div className="flex flex-wrap gap-2 pt-1 text-xs">
                        {item.type === 'research' && (
                          <>
                            {item.authors && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                                Authors: {item.authors}
                              </span>
                            )}
                            {item.funding_source && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-400" />
                                Funding: {item.funding_source}
                              </span>
                            )}
                            {item.budget !== null && item.budget !== undefined && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                                ₱{Number(item.budget).toLocaleString()}
                              </span>
                            )}
                          </>
                        )}

                        {item.type === 'extension' && (
                          <>
                            {item.partner_organization && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                Partner: {item.partner_organization}
                              </span>
                            )}
                            {item.beneficiaries !== null && item.beneficiaries !== undefined && (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                {Number(item.beneficiaries).toLocaleString()} Beneficiaries
                              </span>
                            )}
                            {sdgs.length > 0 && (
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                                <Target className="w-3 h-3 text-blue-500" />
                                {sdgs.length} SDG(s) Aligned
                              </span>
                            )}
                          </>
                        )}

                        {item.type === 'achievement' && item.category && (
                          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium">
                            Category: {item.category}
                          </span>
                        )}

                        {(item.start_date || item.end_date) && (
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                          </span>
                        )}
                      </div>

                      {/* Brief Description preview */}
                      {item.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 pt-1">{item.description}</p>
                      )}

                      {/* Attachments list & External Link */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {item.publication_link && (
                          <a
                            href={item.publication_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold mr-2"
                          >
                            <ExternalLink size={12} />
                            <span>Journal / DOI Link</span>
                          </a>
                        )}

                        {attachments.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleViewFile(file)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title={`Inspect ${file.name}`}
                          >
                            <Eye className="w-3 h-3" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Remarks if any */}
                      {item.dean_remarks && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs mt-2">
                          <span className="font-bold">Evaluation Remarks:</span> {item.dean_remarks}
                        </div>
                      )}
                    </div>

                    {/* Actions & Status Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2.5 shrink-0 self-start">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Review & Inspect
                        </button>

                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => decide(item, 'approved')}
                              disabled={actionId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
                            >
                              {actionId === item.id ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setRejectFor(item);
                                setRemarksInput('');
                              }}
                              disabled={actionId === item.id}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Details & Evaluation Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setViewingItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                {typeLabel(viewingItem.type)}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase"
                style={{
                  background: (RESEARCH_STATUS_LABEL[viewingItem.status] || RESEARCH_STATUS_LABEL.pending).bg,
                  color: (RESEARCH_STATUS_LABEL[viewingItem.status] || RESEARCH_STATUS_LABEL.pending).color,
                }}
              >
                {viewingItem.status}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{viewingItem.title}</h2>
            <p className="text-xs text-gray-500 mb-4">
              Submitted by <span className="font-semibold text-gray-700">{viewingItem.submitter?.full_name}</span> (
              {viewingItem.submitter?.department || 'Department Unassigned'}) on {formatDate(viewingItem.created_at)}
            </p>

            <div className="space-y-4 border-t border-b border-gray-100 py-4 text-xs sm:text-sm text-gray-700">
              {viewingItem.description && (
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Project Description / Summary</span>
                  <p className="bg-gray-50 p-3 rounded-xl leading-relaxed text-gray-700">{viewingItem.description}</p>
                </div>
              )}

              {/* Research Fields */}
              {viewingItem.type === 'research' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-500 block">Authors / Researchers</span>
                    <span>{viewingItem.authors || 'None documented'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Funding Source</span>
                    <span>{viewingItem.funding_source || 'None / Institutional'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Allocated Budget</span>
                    <span>
                      {viewingItem.budget !== null && viewingItem.budget !== undefined
                        ? `₱${Number(viewingItem.budget).toLocaleString()}`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Implementation Period</span>
                    <span>{formatDate(viewingItem.start_date)} – {formatDate(viewingItem.end_date)}</span>
                  </div>
                </div>
              )}

              {/* Extension Fields */}
              {viewingItem.type === 'extension' && (
                <div className="space-y-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold text-gray-500 block">Partner Organization</span>
                      <span>{viewingItem.partner_organization || 'Not documented'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Target Beneficiaries</span>
                      <span>
                        {viewingItem.beneficiaries !== null && viewingItem.beneficiaries !== undefined
                          ? Number(viewingItem.beneficiaries).toLocaleString()
                          : 'Not documented'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Duration</span>
                      <span>{formatDate(viewingItem.start_date)} – {formatDate(viewingItem.end_date)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500 block mb-1.5">Aligned Sustainable Development Goals</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parseSdgs(viewingItem.sdg_alignment).map((sdg, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {sdg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Achievement Fields */}
              {viewingItem.type === 'achievement' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-500 block">Achievement Category</span>
                    <span>{viewingItem.category || 'General Recognition'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">Date Conferred</span>
                    <span>{formatDate(viewingItem.start_date || viewingItem.created_at)}</span>
                  </div>
                </div>
              )}

              {/* Link */}
              {viewingItem.publication_link && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">Publication / Evidence URL</span>
                  <a
                    href={viewingItem.publication_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{viewingItem.publication_link}</span>
                  </a>
                </div>
              )}

              {/* Attachments list */}
              {getAllAttachments(viewingItem).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-2">Attached Documents & Evidences</span>
                  <div className="flex flex-wrap gap-2">
                    {getAllAttachments(viewingItem).map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleViewFile(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="max-w-[200px] truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {viewingItem.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectFor(viewingItem);
                      setRemarksInput('');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decide(viewingItem, 'approved')}
                    disabled={actionId === viewingItem.id}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    {actionId === viewingItem.id ? 'Approving...' : 'Endorse & Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Submission?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Providing reviewer remarks for <span className="font-semibold text-gray-800">{rejectFor.submitter?.full_name}</span>'s output.
            </p>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reviewer Feedback / Remarks (Required for revisions)</label>
            <textarea
              value={remarksInput}
              onChange={e => setRemarksInput(e.target.value)}
              rows={3}
              placeholder="State reasons or corrective items needed..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectFor(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => decide(rejectFor, 'rejected', remarksInput)}
                disabled={actionId === rejectFor.id}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors shadow-xs"
              >
                {actionId === rejectFor.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}