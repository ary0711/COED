import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  FileText, Download, Search, Eye, X, Loader2, 
  FileCode, FileImage, File as FileGenericIcon, 
  UploadCloud, Trash2, FolderPlus, Folder as FolderIcon,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id: string | null;
  created_at: string;
}

export interface AccreditationDocument {
  id: string;
  folder_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface AccreditationWorkspaceProps {
  userRole?: 'dean' | 'chairperson' | 'department_chair' | 'faculty';
}

interface DocumentPreviewState {
  open: boolean;
  url: string | null;
  title: string;
  type: 'image' | 'pdf' | 'office' | 'text' | 'unsupported';
  size?: number;
}

interface CustomModalState {
  open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'confirm';
  onConfirm?: () => void;
}

const DOCS_API_URL = 'http://localhost:5000/api/accreditation';

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
  if (['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return <FileText className={className} />;
  }
  return <FileGenericIcon className={className} />;
}

export default function AccreditationWorkspace({ userRole = 'faculty' }: AccreditationWorkspaceProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([{ id: null, name: 'Accreditation' }]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<AccreditationDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Modal & Upload Staging States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderDesc, setNewFolderDesc] = useState<string>('');
  
  const [selectedFiles, setSelectedFiles] = useState<StagedFile[]>([]);
  const [previewModal, setPreviewModal] = useState<DocumentPreviewState>({
    open: false,
    url: null,
    title: '',
    type: 'unsupported',
  });

  const [modalAlert, setModalAlert] = useState<CustomModalState>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  const fetchFolderContents = useCallback(async (folderId: string | null) => {
    setLoading(true);
    setLoadError('');
    try {
      const folderRes = await axios.get(`${DOCS_API_URL}/folders${folderId ? `?parent_id=${folderId}` : ''}`);
      setFolders(folderRes.data.data || []);

      if (folderId) {
        const docRes = await axios.get(`${DOCS_API_URL}/folders/${folderId}/documents`);
        setDocuments(docRes.data.data || []);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Error fetching workspace contents:', err);
      setLoadError('Could not reach the server to load folder contents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolderContents(currentFolderId);
  }, [currentFolderId, fetchFolderContents]);

  // Lock scroll on modals
  useEffect(() => {
    if (isUploadModalOpen || isNewFolderModalOpen || previewModal.open || modalAlert.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isUploadModalOpen, isNewFolderModalOpen, previewModal.open, modalAlert.open]);

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath(folderPath.slice(0, index + 1));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${DOCS_API_URL}/folders`, {
        name: newFolderName.trim(),
        description: newFolderDesc.trim(),
        parent_id: currentFolderId,
        user_id: currentUserId
      }, { headers: { Authorization: `Bearer ${token}` } });

      setNewFolderName('');
      setNewFolderDesc('');
      setIsNewFolderModalOpen(false);
      fetchFolderContents(currentFolderId);
      setModalAlert({
        open: true,
        title: 'Folder Created',
        message: 'The accreditation folder was created successfully.',
        type: 'success',
      });
    } catch (err: any) {
      setModalAlert({
        open: true,
        title: 'Creation Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    }
  };

  // Multi-file staging handlers
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: StagedFile[] = Array.from(e.target.files).map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeStagedFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const executeBatchUpload = async () => {
    if (selectedFiles.length === 0 || !currentFolderId) return;
    const formData = new FormData();
    selectedFiles.forEach(item => formData.append('files', item.file));
    if (currentUserId) formData.append('userId', currentUserId);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${DOCS_API_URL}/folders/${currentFolderId}/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.data.success) {
        setSelectedFiles([]);
        setIsUploadModalOpen(false);
        fetchFolderContents(currentFolderId);
        setModalAlert({
          open: true,
          title: 'Upload Successful',
          message: `Successfully uploaded ${res.data.results.successful.length} file(s).`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setModalAlert({
        open: true,
        title: 'Upload Failed',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    }
  };

  const handlePreview = async (doc: AccreditationDocument) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/coed-accreditation/${doc.file_path}`;
    const ext = getFileExtension(doc.original_name);
    
    let previewType: DocumentPreviewState['type'] = 'unsupported';
    let renderUrl = fileUrl;

    if (doc.mime_type?.startsWith('image/')) {
      previewType = 'image';
    } else if (doc.mime_type === 'application/pdf' || ext === 'pdf') {
      previewType = 'pdf';
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      previewType = 'office';
      renderUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    } else if (['txt', 'csv', 'json', 'log', 'html', 'js', 'ts'].includes(ext)) {
      previewType = 'text';
    } else {
      previewType = 'office';
      renderUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }

    setPreviewModal({
      open: true,
      url: renderUrl,
      title: doc.original_name,
      type: previewType,
      size: doc.file_size
    });
  };

  const handleDownload = async (doc: AccreditationDocument) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const fileUrl = `${supabaseUrl}/storage/v1/object/public/coed-accreditation/${doc.file_path}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = doc.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setModalAlert({
        open: true,
        title: 'Download Error',
        message: 'Failed to download file.',
        type: 'error',
      });
    }
  };

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredDocuments = documents.filter(d => d.original_name.toLowerCase().includes(search.toLowerCase()));

  const canManageFolders = userRole === 'dean' || userRole === 'chairperson' || userRole === 'department_chair';

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Accreditation Management</h1>
          <nav className="flex items-center text-sm text-gray-500 mt-1 space-x-1">
            {folderPath.map((folder, index) => (
              <span key={folder.id || 'root'} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                <button 
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:underline text-blue-600 font-medium"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {currentFolderId && (
            <>
              {canManageFolders && (
                <button 
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>New Subfolder</span>
                </button>
              )}
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
            </>
          )}
          {!currentFolderId && canManageFolders && (
            <button 
              onClick={() => setIsNewFolderModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Main Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders and documents..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {loadError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
          {loadError}
        </div>
      )}

      {/* Workspace Grid */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm">Loading workspace contents...</span>
          </div>
        ) : filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <FolderIcon className="w-12 h-12 mb-2 opacity-30 text-blue-600" />
            <p className="text-sm text-gray-400 font-medium">This folder is empty.</p>
            <p className="text-xs text-gray-400 mt-1">Create subfolders or upload accreditation documents to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredFolders.map(folder => (
                    <div 
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer flex items-center space-x-3 transition-all group shadow-2xs"
                    >
                      <FolderIcon className="w-6 h-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{folder.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{folder.description || 'Accreditation folder'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {filteredDocuments.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documents & Files</h3>
                <div className="space-y-3">
                  {filteredDocuments.map(doc => (
                    <div 
                      key={doc.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-3 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-blue-600 flex-shrink-0">
                          {getFileIcon(doc.original_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {doc.original_name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium uppercase text-[10px]">
                              {doc.status}
                            </span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePreview(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View file"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-1 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {isNewFolderModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Create New Folder</h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Folder Name *</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Area I - Vision and Mission" 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description (Optional)</label>
                <textarea 
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description of accreditation criteria..." 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-50 shadow-sm"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Multi-File Upload Staging Modal */}
      {isUploadModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Upload Accreditation Files & Pictures</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              onChange={handleFileSelection} 
              className="hidden" 
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 bg-gray-50/50 transition-colors mb-4"
            >
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to select multiple files or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, XLSX, PPTX, JPG, PNG</p>
            </div>

            {/* Selected Files Staging List */}
            {selectedFiles.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4 border border-gray-200 p-2.5 rounded-xl bg-gray-50">
                {selectedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-100 shadow-2xs">
                    <div className="flex items-center space-x-2.5 truncate">
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt="" className="w-8 h-8 object-cover rounded-md flex-shrink-0" />
                      ) : (
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                          {getFileIcon(file.name, 'w-4 h-4')}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeStagedFile(file.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeBatchUpload}
                disabled={selectedFiles.length === 0}
                className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] disabled:opacity-50 shadow-sm"
              >
                Upload {selectedFiles.length} File(s)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full Viewport Blurred In-App Viewer Modal */}
      {previewModal.open && previewModal.url && createPortal(
        <div 
          className="fixed inset-0 z-[999999] bg-[#1a1a1a]/95 flex flex-col backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
        >
          <div 
            className="h-14 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-b border-gray-700/60 text-white select-none shadow-md shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base text-gray-100 truncate" title={previewModal.title}>
                {previewModal.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 w-full p-2 sm:p-6 flex items-center justify-center overflow-hidden"
            onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
          >
            <div 
              className="w-full h-full max-w-5xl bg-white rounded-md shadow-2xl overflow-hidden relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {previewModal.type === 'image' ? (
                <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-950 overflow-auto">
                  <img
                    src={previewModal.url}
                    alt={previewModal.title}
                    className="max-h-full max-w-full object-contain select-none"
                  />
                </div>
              ) : (
                <iframe
                  src={previewModal.url}
                  title={previewModal.title}
                  className="w-full h-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom COED Modal Alert */}
      {modalAlert.open && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {modalAlert.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {modalAlert.title}
              </h3>
              <button onClick={() => setModalAlert(prev => ({ ...prev, open: false }))} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-600">
              <p>{modalAlert.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  if (modalAlert.onConfirm) modalAlert.onConfirm();
                  setModalAlert(prev => ({ ...prev, open: false }));
                }}
                className="px-5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl hover:bg-[#1E40AF] transition-colors shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}