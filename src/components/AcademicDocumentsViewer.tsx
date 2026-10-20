import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Download, Search, Eye, X, Loader2, AlertTriangle, FileCode, FileImage, File as FileGenericIcon } from 'lucide-react';
import { renderAsync } from 'docx-preview';

interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface AcademicDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  category_id?: string | null;
  document_categories?: { id: string; name: string } | null;
  file_name: string;
  file_type: string;
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

const DOCS_API_URL = 'http://localhost:5000/api/academic-records/documents';
const CATEGORIES_API_URL = 'http://localhost:5000/api/academic-records/categories';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

function getFileIcon(filename: string, className = 'w-5 h-5') {
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

export function AcademicDocumentsViewer({ onOpenPreview }: AcademicDocumentsViewerProps) {
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  const [categoryIdFilter, setCategoryIdFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingCategory, setDownloadingCategory] = useState(false);

  const [internalPreview, setInternalPreview] = useState<ClassroomPreview | null>(null);

  // Fetch active categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${CATEGORIES_API_URL}?status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data ?? []);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  // Fetch documents filtered by category ID
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (categoryIdFilter !== 'all') params.set('category_id', categoryIdFilter);
      
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
  }, [categoryIdFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle ESC & lock scrolling when internal modal is open
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
      const { url } = await res.json();

      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name || doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLoadError('Could not reach the server for download.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download all files in the currently selected category
  const handleDownloadAllInCategory = async () => {
    if (categoryIdFilter === 'all') return;

    const targetDocs = documents.filter(
      (d) => d.category_id === categoryIdFilter || d.document_categories?.id === categoryIdFilter
    );

    if (targetDocs.length === 0) {
      setLoadError('No documents found in this category to download.');
      return;
    }

    setDownloadingCategory(true);
    setLoadError('');
    try {
      for (const doc of targetDocs) {
        await handleDownload(doc);
        // Small interval between sequential browser triggers
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch {
      setLoadError('Some files could not be downloaded.');
    } finally {
      setDownloadingCategory(false);
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

        <div className="flex gap-2">
          <select
            value={categoryIdFilter}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Download All in Category button (Visible when a category is selected) */}
          {categoryIdFilter !== 'all' && (
            <button
              type="button"
              onClick={handleDownloadAllInCategory}
              disabled={downloadingCategory || loading}
              className="px-3 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Download All Files in Selected Category"
            >
              {downloadingCategory ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Download All</span>
            </button>
          )}
        </div>
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
              const categoryName = doc.document_categories?.name || doc.document_type || 'General';

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
                          {categoryName}
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
                      disabled={isPreviewing || isDownloading || downloadingCategory}
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
                      disabled={isPreviewing || isDownloading || downloadingCategory}
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

      {/* Modal Overlay */}
      {internalPreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-sm"
            onClick={() => setInternalPreview(null)}
          >
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