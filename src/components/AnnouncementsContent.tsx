import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Inbox,
  Calendar,
  Building2,
  CheckCircle,
  Users,
  Trash2,
  X,
  Send,
  CircleDot,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const ANNOUNCEMENTS_API_URL = 'http://localhost:5000/api/announcements';
const ALL_ROLES = ['department_chair', 'faculty', 'student', 'alumni'];

const ANNOUNCEMENT_ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  department_chair: {
    label: 'Department Chairs',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  faculty: {
    label: 'Faculty',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  student: {
    label: 'Students',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  alumni: {
    label: 'Alumni',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

export interface DeptOption {
  id: string;
  name: string;
}

export interface AnnouncementsContentProps {
  userRole?: 'dean' | 'department_chair' | string;
}

export default function AnnouncementsContent({ userRole }: AnnouncementsContentProps) {
  const detectedRole = (() => {
    if (userRole) return userRole.toLowerCase();
    const storedRole = localStorage.getItem('userRole') || localStorage.getItem('role');
    if (storedRole) return storedRole.toLowerCase();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.role) return payload.role.toLowerCase();
      }
    } catch {
      // fallback
    }
    return 'dean';
  })();

  const isChair = detectedRole === 'department_chair' || detectedRole === 'chair';

  if (isChair) {
    return <ChairAnnouncementsView />;
  }

  return <DeanAnnouncementsView />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEPARTMENT CHAIR ANNOUNCEMENT VIEW (With Edit & Scheduling)
// ─────────────────────────────────────────────────────────────────────────────
interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author_id?: string | null;
  target_role: string[] | null;
  is_pinned?: boolean | null;
  expires_at?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
}
function ChairAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    recipients: { faculty: false, student: false, alumni: false },
  });
  const [formError, setFormError] = useState('');

  const getToken = () => localStorage.getItem('token');

  // Retrieve current Chair's user ID from JWT token
  const currentUserId = (() => {
    try {
      const token = getToken();
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || '';
    } catch {
      return '';
    }
  })();

  const fetchAnnouncements = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(ANNOUNCEMENTS_API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load announcements');
      const data = await res.json();
      setAnnouncements(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      recipients: { faculty: false, student: false, alumni: false },
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (ann: AnnouncementItem) => {
    // Safety check: only author can edit
    if (ann.created_by && currentUserId && ann.created_by !== currentUserId) {
      alert('You can only edit announcements that you created.');
      return;
    }
    setEditingId(ann.id);
    const roles = ann.target_role ?? [];
    setForm({
      title: ann.title || '',
      description: ann.content || '',
      eventDate: ann.event_date ? ann.event_date.split('T')[0] : '',
      startTime: ann.start_time ? ann.start_time.slice(0, 5) : '',
      endTime: ann.end_time ? ann.end_time.slice(0, 5) : '',
      recipients: {
        faculty: roles.includes('faculty'),
        student: roles.includes('student'),
        alumni: roles.includes('alumni'),
      },
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (!form.eventDate) {
      setFormError('Announcement date is required.');
      return;
    }
    if (form.startTime && form.endTime && form.startTime > form.endTime) {
      setFormError('End time cannot be earlier than start time.');
      return;
    }

    const hasRecipient = form.recipients.faculty || form.recipients.student || form.recipients.alumni;
    if (!hasRecipient) {
      setFormError('Please select at least one target recipient.');
      return;
    }

    setSubmitting(true);
    const targetRoles: string[] = [];
    if (form.recipients.faculty) targetRoles.push('faculty');
    if (form.recipients.student) targetRoles.push('student');
    if (form.recipients.alumni) targetRoles.push('alumni');

    const payload = {
      title: form.title.trim(),
      content: form.description.trim(),
      target_role: targetRoles,
      event_date: form.eventDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      expires_at: `${form.eventDate}T23:59:59.000Z`,
    };

    const isEdit = Boolean(editingId);
    const endpoint = isEdit ? `${ANNOUNCEMENTS_API_URL}/${editingId}` : ANNOUNCEMENTS_API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'post'} announcement`);
      }

      await fetchAnnouncements();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete announcement');
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not reach the server.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSchedule = (dateStr?: string | null, start?: string | null, end?: string | null) => {
    if (!dateStr) return null;
    const formattedDate = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formatT = (tStr?: string | null) => {
      if (!tStr) return '';
      const [h, m] = tStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10));
      return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (start && end) return `${formattedDate} • ${formatT(start)} - ${formatT(end)}`;
    if (start) return `${formattedDate} • Starts at ${formatT(start)}`;
    return formattedDate;
  };

  const dateOnly = (dateStr?: string | null) => (dateStr ? dateStr.split('T')[0] : '');

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isUpcoming = (expiresAt: string | null | undefined, eventDate?: string | null) => {
    const compareDate = eventDate || (expiresAt ? dateOnly(expiresAt) : null);
    if (!compareDate) return true;
    const today = new Date().toISOString().split('T')[0];
    return compareDate >= today;
  };

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Announcements</h1>
          <p className="text-gray-500 text-sm">Post and manage announcements for your department personnel and students.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E40AF] transition-colors text-sm font-semibold shadow-md flex-shrink-0 self-start"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading announcements…</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const scheduleDisplay = formatSchedule(ann.event_date, ann.start_time, ann.end_time);
            // Strict check: Only show Edit & Delete if this announcement was created by this Chair
            const isMyAnnouncement = Boolean(ann.created_by && currentUserId && ann.created_by === currentUserId);

            return (
              <div
                key={ann.id}
                onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-[#1E3A8A]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4 p-4 sm:p-5">
                  <div className="w-1 self-stretch rounded-full bg-[#1E3A8A] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isUpcoming(ann.expires_at, ann.event_date)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isUpcoming(ann.expires_at, ann.event_date) ? 'Upcoming' : 'Past'}
                      </span>

                      {scheduleDisplay && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {scheduleDisplay}
                        </span>
                      )}

                      {isMyAnnouncement && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          Posted by You
                        </span>
                      )}

                      <span className="text-xs text-gray-400">
                        Posted {formatDate(dateOnly(ann.created_at))}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 group-hover:text-[#1E3A8A] text-base leading-snug transition-colors">
                      {ann.title}
                    </h3>

                    {ann.target_role && ann.target_role.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-semibold mr-1">To:</span>
                        {ann.target_role.map((role) => (
                          <span
                            key={role}
                            className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-semibold"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* ONLY SHOW EDIT & DELETE IF CREATED BY CURRENT USER */}
                    {isMyAnnouncement && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(ann);
                          }}
                          className="p-2 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Announcement"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(ann.id);
                          }}
                          disabled={deletingId === ann.id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete Announcement"
                        >
                          {deletingId === ann.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="p-2 text-gray-400 group-hover:text-[#1E3A8A] group-hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium"
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          expandedId === ann.id ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {expandedId === ann.id && (
                  <div className="px-5 pb-5 pt-0 ml-5 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3 whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chair Modal */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingId ? 'Edit Announcement' : 'New Announcement'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingId
                      ? 'Update the announcement schedule and details.'
                      : 'Fill in the schedule and audience details below.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Department Meeting — July 2026"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Recipients <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#1E3A8A] border-gray-300 rounded focus:ring-[#1E3A8A]"
                        checked={form.recipients.faculty}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recipients: { ...form.recipients, faculty: e.target.checked },
                          })
                        }
                      />
                      Faculty / Staff
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#1E3A8A] border-gray-300 rounded focus:ring-[#1E3A8A]"
                        checked={form.recipients.student}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recipients: { ...form.recipients, student: e.target.checked },
                          })
                        }
                      />
                      Students
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#1E3A8A] border-gray-300 rounded focus:ring-[#1E3A8A]"
                        checked={form.recipients.alumni}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recipients: { ...form.recipients, alumni: e.target.checked },
                          })
                        }
                      />
                      Alumni
                    </label>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Announcement Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        End Time
                      </label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Write the full announcement message here…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting
                    ? editingId
                      ? 'Updating…'
                      : 'Posting…'
                    : editingId
                    ? 'Save Changes'
                    : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Announcement?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently remove{' '}
                <span className="font-semibold text-gray-800">
                  "{announcements.find((a) => a.id === deleteConfirm)?.title}"
                </span>
                . This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEAN / ADMIN ANNOUNCEMENT VIEW (With Edit & Department Targeting)
// ─────────────────────────────────────────────────────────────────────────────
function DeanAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [selectedRoles, setSelectedRoles] = useState<string[]>([...ALL_ROLES]);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);

  function formatManilaTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function formatSchedule(dateStr?: string, start?: string, end?: string) {
    if (!dateStr) return null;
    const formattedDate = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formatT = (tStr?: string) => {
      if (!tStr) return '';
      const [h, m] = tStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10));
      return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (start && end) return `${formattedDate} • ${formatT(start)} - ${formatT(end)}`;
    if (start) return `${formattedDate} • Starts at ${formatT(start)}`;
    return formattedDate;
  }

  const getToken = () => localStorage.getItem('token');

  const loadAnnouncements = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(ANNOUNCEMENTS_API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoadError(err.error || 'Failed to load announcements.');
        setAnnouncements([]);
        return;
      }
      const data = await res.json();
      setAnnouncements(data ?? []);
    } catch {
      setLoadError('Could not reach the server. Please try again.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase.from('departments').select('id, name').order('name');
    if (!error && data) setDepartments(data);
  };

  useEffect(() => {
    loadAnnouncements();
    loadDepartments();

    const channelName = `announcements-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () =>
        loadAnnouncements()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCreateComposer = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setSelectedRoles([...ALL_ROLES]);
    setTargetDepartmentId('');
    setIsComposerOpen(true);
  };

  const openEditComposer = (ann: any) => {
    setEditingId(ann.id);
    setTitle(ann.title || '');
    setContent(ann.content || '');
    setEventDate(ann.event_date ? ann.event_date.split('T')[0] : '');
    setStartTime(ann.start_time ? ann.start_time.slice(0, 5) : '');
    setEndTime(ann.end_time ? ann.end_time.slice(0, 5) : '');
    setSelectedRoles(ann.target_role ?? [...ALL_ROLES]);
    setTargetDepartmentId(ann.target_department_id || '');
    setIsComposerOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const selectAllRoles = () => setSelectedRoles([...ALL_ROLES]);
  const deselectAllRoles = () => setSelectedRoles([]);

  const closeComposer = () => {
    setIsComposerOpen(false);
  };

  const publishAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setModalType('error');
      setModalTitle('Required Fields Missing');
      setModalMessage('Please provide both an announcement title and detailed content.');
      setShowModal(true);
      return;
    }

    if (!eventDate) {
      setModalType('error');
      setModalTitle('Schedule Date Required');
      setModalMessage('Please select a date for this announcement.');
      setShowModal(true);
      return;
    }

    if (startTime && endTime && startTime > endTime) {
      setModalType('error');
      setModalTitle('Invalid Time Range');
      setModalMessage('The end time cannot be earlier than the start time.');
      setShowModal(true);
      return;
    }

    if (selectedRoles.length === 0) {
      setModalType('error');
      setModalTitle('No Recipients Selected');
      setModalMessage('Please select at least one recipient role for this announcement.');
      setShowModal(true);
      return;
    }

    setPublishing(true);
    const isEdit = Boolean(editingId);
    const endpoint = isEdit ? `${ANNOUNCEMENTS_API_URL}/${editingId}` : ANNOUNCEMENTS_API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          target_role: selectedRoles,
          target_department_id: targetDepartmentId || null,
          event_date: eventDate,
          start_time: startTime || null,
          end_time: endTime || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModalType('error');
        setModalTitle(isEdit ? 'Update Failed' : 'Publishing Failed');
        setModalMessage(err.error || `Failed to ${isEdit ? 'update' : 'publish'} announcement.`);
        setShowModal(true);
        return;
      }

      setIsComposerOpen(false);
      setModalType('success');
      setModalTitle(isEdit ? 'Announcement Updated' : 'Announcement Published');
      setModalMessage(
        isEdit
          ? 'Your changes have been saved.'
          : 'Your broadcast has been registered and distributed to the selected audience.'
      );
      setShowModal(true);
      await loadAnnouncements();
    } catch (err: any) {
      setModalType('error');
      setModalTitle('Operation Error');
      setModalMessage(err?.message || 'Failed to save announcement.');
      setShowModal(true);
    } finally {
      setPublishing(false);
    }
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        setModalType('error');
        setModalTitle('Delete Failed');
        setModalMessage(err.error || 'Failed to delete announcement.');
        setShowModal(true);
        return;
      }

      await supabase
        .from('notifications')
        .delete()
        .eq('reference_id', id)
        .eq('reference_table', 'announcements');

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setItemToDelete(null);
    } catch {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage('Failed to delete announcement.');
      setShowModal(true);
    } finally {
      setDeletingId(null);
    }
  };

  const roleLabel = (r: string) => ANNOUNCEMENT_ROLE_CONFIG[r]?.label ?? r;
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? 'Department-Restricted' : null;

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      filterDepartment === 'all'
        ? true
        : filterDepartment === 'college_wide'
        ? !a.target_department_id
        : a.target_department_id === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[#1E3A8A]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Announcements Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Create official notices and broadcast targeted updates across departments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={openCreateComposer}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">Total Records:</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {filteredAnnouncements.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white text-gray-700 font-medium"
            >
              <option value="all">All Scopes</option>
              <option value="college_wide">College-Wide Only</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} Only
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to refresh announcements</p>
            <p className="text-rose-600 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-16 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-800">Synchronizing Announcements</p>
          <p className="text-xs text-gray-400 mt-1">Fetching latest published broadcasts from system records...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Announcements Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || filterDepartment !== 'all'
              ? 'No matching announcements found for the selected criteria.'
              : 'There are currently no active announcements published.'}
          </p>
          <button
            type="button"
            onClick={openCreateComposer}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E40AF] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Post First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => {
            const roles: string[] = announcement.target_role ?? [];
            const dept = deptName(announcement.target_department_id);
            const scheduleDisplay = formatSchedule(
              announcement.event_date,
              announcement.start_time,
              announcement.end_time
            );

            return (
              <div
                key={announcement.id}
                className="bg-white rounded-xl border border-gray-200/80 hover:border-gray-300 transition-all p-5 shadow-sm hover:shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatManilaTime(announcement.created_at)}
                      </span>

                      {scheduleDisplay && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {scheduleDisplay}
                        </span>
                      )}

                      {dept ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" />
                          {dept} Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" />
                          College-Wide
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug tracking-tight">
                      {announcement.title}
                    </h3>

                    <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-0.5">
                      {announcement.content}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-400 mr-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Audience:
                      </span>
                      {roles.map((r: string) => {
                        const conf = ANNOUNCEMENT_ROLE_CONFIG[r];
                        return (
                          <span
                            key={r}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              conf
                                ? `${conf.bg} ${conf.text}${conf.border}`
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {roleLabel(r)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 sm:pl-3 sm:border-l sm:border-gray-100">
                    <button
                      type="button"
                      onClick={() => openEditComposer(announcement)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                      title="Edit Announcement"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          id: announcement.id,
                          title: announcement.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dean Composer Modal */}
      {isComposerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                  <Megaphone className="w-5 h-5 text-[#1E3A8A]" />
                  {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                </div>
                <button
                  type="button"
                  onClick={closeComposer}
                  disabled={publishing}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm Examination Schedule & Room Assignments"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Content / Memorandum <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type the announcement details and instructions here..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all resize-none"
                  />
                </div>

                {/* Scheduling */}
                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Announcement Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      Target Recipient Roles <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllRoles}
                        className="text-[11px] text-[#1E3A8A] font-semibold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllRoles}
                        className="text-[11px] text-gray-500 hover:text-gray-800"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_ROLES.map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="truncate">{roleLabel(role)}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 shrink-0 ml-1 stroke-[2.5]" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0 ml-1 rounded-full border border-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                    Department Scope (Optional)
                  </label>
                  <select
                    value={targetDepartmentId}
                    onChange={(e) => setTargetDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white text-gray-800"
                  >
                    <option value="">All Departments (College-Wide)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} Department Only
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeComposer}
                  disabled={publishing}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={publishAnnouncement}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {editingId ? 'Save Changes' : 'Publish Announcement'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Dean Delete Modal */}
      {itemToDelete &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete Announcement?</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">
                Are you sure you want to permanently remove{' '}
                <span className="font-semibold text-gray-800">"{itemToDelete.title}"</span>? Associated notifications will also be cleared.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  disabled={Boolean(deletingId)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDelete(itemToDelete.id)}
                  disabled={Boolean(deletingId)}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-1"
                >
                  {deletingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  {deletingId ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Dean Status Modal */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
                  modalType === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {modalType === 'success' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <CircleDot className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">{modalTitle}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">{modalMessage}</p>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-colors shadow-sm"
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