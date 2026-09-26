import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Download, Search, Eye, X, Loader2 } from 'lucide-react';

interface AcademicDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: 'handbook' | 'policy' | 'form' | 'memorandum';
  file_name: string;
  file_size: number;
  created_at: string;
}

interface ClassroomPreview {
  url: string;
  title: string;
  isImage: boolean;
}

interface AcademicDocumentsViewerProps {
  onOpenPreview?: (preview: ClassroomPreview) => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  handbook: 'Handbook',
  policy: 'Policy',
  form: 'Form',
  memorandum: 'Memorandum',
};

const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AcademicDocumentsViewer({ onOpenPreview }: AcademicDocumentsViewerProps) {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // In-component modal state (used if parent doesn't handle preview)
  const [internalPreview, setInternalPreview] = useState<ClassroomPreview | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('document_type', typeFilter);
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load documents.');
        setDocuments([]);
        return;
      }
      const data = await res.json();
      setDocuments(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    /* eslint-disable-next-line */
  }, [typeFilter]);

  // Lock scrolling & handle ESC key when internal modal is open
  useEffect(() => {
    if (internalPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInternalPreview(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [internalPreview]);

  const handlePreview = async (doc: AcademicDocument) => {
    setPreviewingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to open document preview.');
        return;
      }

      const { url, file_type } = await res.json();
      const isImg = Boolean(file_type?.startsWith('image/'));
      const isPdf = file_type === 'application/pdf';

      let renderUrl = url;
      // Convert Office documents to Google Docs embedded viewer inside iframe
      if (!isPdf && !isImg) {
        renderUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      }

      const previewData: ClassroomPreview = {
        url: renderUrl,
        title: doc.title,
        isImage: isImg,
      };

      if (onOpenPreview) {
        onOpenPreview(previewData);
      } else {
        setInternalPreview(previewData);
      }
    } catch {
      setLoadError('Could not reach the server to load preview.');
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDownload = async (doc: AcademicDocument) => {
    setDownloadingId(doc.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${DOCS_API_URL}/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to generate download link.');
        return;
      }
      const { url, file_name } = await res.json();

      const link = document.createElement('a');
      link.href = url;
      link.download = file_name || doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLoadError('Could not reach the server for download.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-6">Academic Documents</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Categories</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <FileText className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No documents found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => {
              const isPreviewing = previewingId === doc.id;
              const isDownloading = downloadingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="p-3 sm:p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-3 hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {doc.title}
                      </div>
                      {doc.description && (
                        <div className="text-xs text-gray-500 truncate">{doc.description}</div>
                      )}
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {DOC_TYPE_LABELS[doc.document_type]}
                        </span>
                        <span>{formatDate(doc.created_at)}</span>
                        <span>· {formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                      title="View file"
                    >
                      {isPreviewing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening…</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={isPreviewing || isDownloading}
                      className="flex items-center gap-1 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40"
                      title="Download"
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Classroom Dark Modal Overlay */}
      {internalPreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-sm"
            onClick={() => setInternalPreview(null)}
          >
            {/* Top Bar */}
            <div
              className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-b border-gray-700/60 text-white select-none shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base text-gray-100 truncate">
                  {internalPreview.title}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setInternalPreview(null)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Canvas */}
            <div
              className="flex-1 w-full p-2 sm:p-6 flex items-center justify-center overflow-hidden"
              onClick={() => setInternalPreview(null)}
            >
              <div
                className="w-full h-full max-w-5xl bg-white rounded-md shadow-2xl overflow-hidden relative flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {internalPreview.isImage ? (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950 overflow-auto">
                    <img
                      src={internalPreview.url}
                      alt={internalPreview.title}
                      className="max-h-full max-w-full object-contain select-none"
                    />
                  </div>
                ) : (
                  <iframe
                    src={internalPreview.url}
                    title={internalPreview.title}
                    className="w-full h-full border-0 bg-white"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}