import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Building,
  Calendar,
  X,
  Loader2,
  Inbox,
  XCircle,
  Megaphone,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { sendNotification } from '../notificationService';

// ============================================================================
// 1. ENDPOINTS & INTERFACES
// ============================================================================
const ACCOMPLISHMENT_API_URL = 'https://coed.onrender.com/api/accomplishment-reports';
const EXTENSION_API_URL      = 'https://coed.onrender.com/api/extension-reports';
const WFH_API_URL            = 'https://coed.onrender.com/api/wfh-reports';
const USERS_API_URL          = 'https://coed.onrender.com/api/auth/users';

export type ReportType = 'accomplishment' | 'extension' | 'wfh';

export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  display_order: number;
}

export interface RawReportItem {
  id: string;
  type: ReportType;
  submitted_by: string;
  user_id?: string;
  quarter?: string;
  year?: string;
  reporting_period?: string;
  program_chair?: string;
  program?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  progress?: number;
  dean_remarks?: string | null;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
  date_submitted?: string;
  submitter?: {
    id: string;
    full_name: string;
    department?: string;
    program?: string;
    role?: string;
  } | null;
  rawData: any;
}

export interface UserProfile {
  id: string;
  full_name: string;
  department?: string;
  program?: string;
  role: 'faculty' | 'chair' | 'department_chair' | string;
}

const QUARTER_NAMES = ['1st', '2nd', '3rd', '4th'] as const;

function getCurrentQuarterInfo() {
  const now = new Date();
  const quarterIndex = Math.floor(now.getMonth() / 3);
  return {
    quarter: QUARTER_NAMES[quarterIndex],
    year: String(now.getFullYear()),
  };
}

const hasPopulatedRows = (rows?: any[]): boolean => {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) =>
    Object.values(row).some((val) => typeof val === 'string' && val.trim() !== '')
  );
};

const PRINT_LAYOUT_STYLES = `
  @media print {
    @page {
      size: auto;
      margin: 0.6in 0.6in 0.6in 0.6in;
    }
    body {
      background: white !important;
      color: black !important;
      font-size: 11pt !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body * {
      visibility: hidden;
    }
    #dean-print-area, #dean-print-area *,
    #dean-research-dossier, #dean-research-dossier * {
      visibility: visible;
    }
    #dean-print-area,
    #dean-research-dossier {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      background: white !important;
    }
    .print-hide {
      display: none !important;
    }
    .print-avoid-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    table {
      page-break-inside: auto;
      width: 100% !important;
      border-collapse: collapse !important;
    }
    tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    thead {
      display: table-header-group !important;
    }
  }
`;

// ============================================================================
// 2. MAIN COMPONENT: ReportsAnalytics
// ============================================================================
export function ReportsAnalytics() {
  const [reports, setReports] = useState<RawReportItem[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [officialDepartments, setOfficialDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filtering States
  const currentDefaults = useMemo(() => getCurrentQuarterInfo(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentDefaults.quarter);
  const [selectedYear, setSelectedYear] = useState<string>(currentDefaults.year);
  const [activeTab, setActiveTab] = useState<'all' | 'needs_review' | 'approved' | 'rejected' | 'archived'>('needs_review');
  const [selectedType, setSelectedType] = useState<'all' | ReportType>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<'all' | 'faculty' | 'chair'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deadline & Reminder States
  const [deadline, setDeadlineState] = useState<{ id: string; due_date: string } | null>(null);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  // Modal States
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);
  const [showResearchDossierModal, setShowResearchDossierModal] = useState(false);
  const [statusMessageModal, setStatusMessageModal] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Inspections & Printing
  const [inspectReport, setInspectReport] = useState<RawReportItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [rejectingTarget, setRejectingTarget] = useState<RawReportItem | null>(null);
  const [remarksInput, setRemarksInput] = useState<string>('');

  const [archiveModalTarget, setArchiveModalTarget] = useState<{
    item: RawReportItem;
    targetState: boolean;
  } | null>(null);

  const getToken = () => localStorage.getItem('token');

  // Calculates current datetime in YYYY-MM-DDTHH:mm format to restrict past inputs
  const minDateTimeInput = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, [showDeadlineModal]);

  // Load official departments
  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code, display_order')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setOfficialDepartments(data);
      }
    } catch (err) {
      console.error('Failed to load official departments:', err);
    }
  }, []);

  const matchDepartmentCode = useCallback((val?: string | null): string | null => {
    if (!val) return null;
    const cleaned = val.trim().toLowerCase();

    for (const dept of officialDepartments) {
      if (
        dept.id.toLowerCase() === cleaned ||
        dept.code.toLowerCase() === cleaned ||
        dept.name.toLowerCase() === cleaned
      ) {
        return dept.code;
      }
      if (dept.code === 'BEEd' && (cleaned.includes('elementary') || cleaned.includes('beed'))) {
        return 'BEEd';
      }
      if (dept.code === 'BTLEd' && (cleaned.includes('livelihood') || cleaned.includes('btled') || cleaned.includes('technology'))) {
        return 'BTLEd';
      }
      if (dept.code === 'BSEd-Math' && (cleaned.includes('secondary') || cleaned.includes('bsed') || cleaned.includes('math'))) {
        return 'BSEd-Math';
      }
    }
    return null;
  }, [officialDepartments]);

  const fetchDeadline = useCallback(async () => {
    const periodTitle = `Quarterly Report – ${selectedQuarter} Quarter ${selectedYear}`;
    const { data } = await supabase
      .from('report_deadlines')
      .select('*')
      .eq('title', periodTitle)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDeadlineState({ id: data.id, due_date: data.due_date });
      setDeadlineInput(data.due_date ? data.due_date.slice(0, 16) : '');
    } else {
      setDeadlineState(null);
      setDeadlineInput('');
    }
  }, [selectedQuarter, selectedYear]);

  // Save deadline & notify personnel (Validating past times)
  const saveDeadline = async () => {
    if (!deadlineInput) {
      setStatusMessageModal({
        type: 'warning',
        title: 'Missing Date',
        message: 'Please select a valid deadline date and time.',
      });
      return;
    }

    const pickedTime = new Date(deadlineInput).getTime();
    if (pickedTime < Date.now()) {
      setStatusMessageModal({
        type: 'warning',
        title: 'Invalid Timestamp',
        message: 'You cannot set a deadline in the past. Please select an upcoming date and time.',
      });
      return;
    }

    setSavingDeadline(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const title = `Quarterly Report – ${selectedQuarter} Quarter ${selectedYear}`;
      const description = `Submit your ${selectedQuarter} Quarter ${selectedYear} quarterly reports.`;

      const { error } = await supabase.from('report_deadlines').upsert(
        deadline
          ? { id: deadline.id, title, description, due_date: deadlineInput, created_by: user?.id }
          : { title, description, due_date: deadlineInput, created_by: user?.id }
      );
      if (error) throw error;

      const formattedDate = new Date(deadlineInput).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      await sendNotification({
        title,
        message: `The deadline for the ${selectedQuarter} Quarter ${selectedYear} quarterly reports has been set to ${formattedDate}.`,
        type: 'report',
        roles: ['faculty', 'department_chair'],
      });

      await fetchDeadline();
      setShowDeadlineModal(false);
      setStatusMessageModal({
        type: 'success',
        title: 'Deadline Broadcasted',
        message: 'Deadline successfully saved and notification broadcasted to Faculty & Department Chairs.',
      });
    } catch (err: any) {
      setStatusMessageModal({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save deadline.',
      });
    } finally {
      setSavingDeadline(false);
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const headers = { Authorization: `Bearer ${getToken()}` };

    try {
      const [accRes, extRes, wfhRes, userRes] = await Promise.all([
        fetch(ACCOMPLISHMENT_API_URL, { headers }).catch(() => null),
        fetch(EXTENSION_API_URL, { headers }).catch(() => null),
        fetch(WFH_API_URL, { headers }).catch(() => null),
        fetch(USERS_API_URL, { headers }).catch(() => null),
      ]);

      const accData: any[] = accRes && accRes.ok ? await accRes.json() : [];
      const extData: any[] = extRes && extRes.ok ? await extRes.json() : [];
      const wfhData: any[] = wfhRes && wfhRes.ok ? await wfhRes.json() : [];

      let fetchedProfiles: UserProfile[] = [];
      if (userRes && userRes.ok) {
        const u = await userRes.json();
        fetchedProfiles = (Array.isArray(u) ? u : []).filter((item: any) =>
          ['faculty', 'chair', 'department_chair'].includes(item.role?.toLowerCase())
        );
      } else {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, full_name, department, program, role')
          .in('role', ['faculty', 'chair', 'department_chair']);
        fetchedProfiles = p || [];
      }
      setProfiles(fetchedProfiles);

      const profileMap = new Map<string, UserProfile>(fetchedProfiles.map((p) => [p.id, p]));
      const combined: RawReportItem[] = [];

      (Array.isArray(accData) ? accData : []).forEach((item) => {
        if (item.status === 'draft') return;
        const sub = profileMap.get(item.submitted_by) || item.submitter;
        combined.push({
          id: item.id,
          type: 'accomplishment',
          submitted_by: item.submitted_by,
          quarter: item.quarter || '1st',
          year: String(item.year || new Date().getFullYear()),
          status: item.status,
          progress: item.progress ?? 100,
          dean_remarks: item.dean_remarks || null,
          is_archived: Boolean(item.is_archived || item.archived),
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at,
          date_submitted: item.date_submitted || item.created_at,
          submitter: sub,
          rawData: item,
        });
      });

      (Array.isArray(extData) ? extData : []).forEach((item) => {
        if (item.status === 'draft') return;
        const sub = profileMap.get(item.submitted_by) || item.submitter;
        combined.push({
          id: item.id,
          type: 'extension',
          submitted_by: item.submitted_by,
          quarter: item.quarter || '1st',
          year: String(item.year || new Date().getFullYear()),
          status: item.status,
          progress: item.progress ?? 100,
          dean_remarks: item.dean_remarks || null,
          is_archived: Boolean(item.is_archived || item.archived),
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at,
          date_submitted: item.date_submitted || item.created_at,
          submitter: sub,
          rawData: item,
        });
      });

      (Array.isArray(wfhData) ? wfhData : []).forEach((item) => {
        if (item.status === 'draft') return;
        const ownerId = item.submitted_by || item.user_id;
        const sub = profileMap.get(ownerId) || item.submitter;

        let derivedYear = String(new Date().getFullYear());
        let derivedQuarter = '1st';
        const dateSample = item.created_at || item.reporting_period || '';
        const matchYear = dateSample.match(/\b(20\d\d)\b/);
        if (matchYear) derivedYear = matchYear[1];

        combined.push({
          id: item.id,
          type: 'wfh',
          submitted_by: ownerId,
          user_id: ownerId,
          quarter: item.quarter || derivedQuarter,
          year: String(item.year || derivedYear),
          reporting_period: item.reporting_period,
          status: item.status,
          progress: item.progress ?? 100,
          dean_remarks: item.dean_remarks || null,
          is_archived: Boolean(item.is_archived || item.archived),
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at,
          date_submitted: item.created_at,
          submitter: sub,
          rawData: item,
        });
      });

      const uniqueMap = new Map<string, RawReportItem>();
      combined.forEach((item) => uniqueMap.set(item.id, item));
      const deduplicated = Array.from(uniqueMap.values());

      deduplicated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setReports(deduplicated);
    } catch {
      setLoadError('Failed to load quarterly reports from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchAllData();
    fetchDeadline();
  }, [fetchDepartments, fetchAllData, fetchDeadline]);

  // Realtime subscription
  useEffect(() => {
    const channelName = `dean-report-sync-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accomplishment_reports' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extension_reports' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wfh_reports' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_deadlines' }, () => fetchDeadline())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData, fetchDeadline]);

  const stepQuarter = (direction: 'prev' | 'next') => {
    const idx = QUARTER_NAMES.indexOf(selectedQuarter as any);
    const yr = parseInt(selectedYear, 10);
    if (direction === 'prev') {
      if (idx === 0) {
        setSelectedQuarter('4th');
        setSelectedYear(String(yr - 1));
      } else {
        setSelectedQuarter(QUARTER_NAMES[idx - 1]);
      }
    } else {
      if (idx === 3) {
        setSelectedQuarter('1st');
        setSelectedYear(String(yr + 1));
      } else {
        setSelectedQuarter(QUARTER_NAMES[idx + 1]);
      }
    }
    setCurrentPage(1);
  };

  const jumpToCurrentQuarter = () => {
    setSelectedQuarter(currentDefaults.quarter);
    setSelectedYear(currentDefaults.year);
    setCurrentPage(1);
  };

  const periodReports = useMemo(() => {
    return reports.filter((r) => r.quarter === selectedQuarter && r.year === selectedYear);
  }, [reports, selectedQuarter, selectedYear]);

  const metrics = useMemo(() => {
    const active = periodReports.filter((r) => !r.is_archived);
    return {
      total: active.length,
      needsReview: active.filter((r) => r.status === 'submitted' || r.status === 'under_review').length,
      approved: active.filter((r) => r.status === 'approved').length,
      rejected: active.filter((r) => r.status === 'rejected').length,
      archived: periodReports.filter((r) => r.is_archived).length,
    };
  }, [periodReports]);

  // Aggregates all research entries across every accomplishment report in the current quarter
  const quarterlyResearchDossier = useMemo(() => {
    const accReports = periodReports.filter((r) => r.type === 'accomplishment' && !r.is_archived);

    const onGoingCompleted: any[] = [];
    const inHouseReviews: any[] = [];
    const expertServices: any[] = [];
    const publications: any[] = [];

    accReports.forEach((rep) => {
      const submitterName = rep.submitter?.full_name || rep.program_chair || 'Faculty';
      const dept = matchDepartmentCode(rep.submitter?.department || rep.rawData?.program) || 'COED';

      (rep.rawData?.mfo2_pi1_data || []).forEach((row: any) => {
        if (row.name_faculty || row.event_title || row.nature_service) {
          expertServices.push({ ...row, submitter: submitterName, department: dept });
        }
      });

      (rep.rawData?.mfo2_pi2_data || []).forEach((row: any) => {
        if (row.title_research) {
          onGoingCompleted.push({ ...row, submitter: submitterName, department: dept });
        }
      });

      (rep.rawData?.mfo2_pi3_data || []).forEach((row: any) => {
        if (row.title_research) {
          inHouseReviews.push({ ...row, submitter: submitterName, department: dept });
        }
      });

      (rep.rawData?.mfo3_pi2_data || []).forEach((row: any) => {
        if (row.title_research) {
          onGoingCompleted.push({
            title_research: row.title_research,
            proponents: row.proponents || submitterName,
            status_phase: 'Completed',
            funding_source: row.funding_source || '—',
            submitter: submitterName,
            department: dept,
          });
        }
      });

      (rep.rawData?.mfo3_pi3_data || []).forEach((row: any) => {
        if (row.title_research) {
          publications.push({ ...row, submitter: submitterName, department: dept });
        }
      });
    });

    return {
      totalFound: onGoingCompleted.length + inHouseReviews.length + expertServices.length + publications.length,
      onGoingCompleted,
      inHouseReviews,
      expertServices,
      publications,
    };
  }, [periodReports, matchDepartmentCode]);

  const pendingProfiles = useMemo(() => {
    const submittedUserIds = new Set(
      periodReports
        .filter((r) => !r.is_archived && (r.status === 'submitted' || r.status === 'approved'))
        .map((r) => r.submitted_by)
    );
    return profiles.filter((p) => !submittedUserIds.has(p.id));
  }, [periodReports, profiles]);

  const executeSendBulkReminder = async () => {
    if (pendingProfiles.length === 0) {
      setShowBulkReminderModal(false);
      setStatusMessageModal({
        type: 'warning',
        title: 'All Reports Submitted',
        message: `All faculty and department chairs have submitted their reports for ${selectedQuarter} Quarter ${selectedYear}.`,
      });
      return;
    }

    setSendingBulk(true);
    try {
      const dueText = deadline
        ? ` The submission deadline is ${new Date(deadline.due_date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}.`
        : '';

      const result = await sendNotification({
        title: `Reminder: ${selectedQuarter} Quarter ${selectedYear} Report`,
        message: `Please complete and submit your ${selectedQuarter} Quarter ${selectedYear} quarterly reports.${dueText}`,
        type: 'report',
        user_ids: pendingProfiles.map((p) => p.id),
      });

      setShowBulkReminderModal(false);
      setStatusMessageModal({
        type: 'success',
        title: 'Reminders Dispatched',
        message: `Reminders successfully dispatched to ${result.sent} of ${pendingProfiles.length} pending faculty members.`,
      });
    } catch (err: any) {
      setStatusMessageModal({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message || 'Failed to dispatch reminders.',
      });
    } finally {
      setSendingBulk(false);
    }
  };

  const departmentBreakdown = useMemo(() => {
    const statsMap: Record<string, { code: string; label: string; total: number; approved: number; pending: number; rejected: number }> = {};

    officialDepartments.forEach((d) => {
      statsMap[d.code] = {
        code: d.code,
        label: d.code,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    });

    periodReports.filter((r) => !r.is_archived).forEach((r) => {
      const rawDept = r.submitter?.department || r.submitter?.program || r.rawData?.program || r.rawData?.college_office;
      const resolvedCode = matchDepartmentCode(rawDept);

      if (resolvedCode && statsMap[resolvedCode]) {
        statsMap[resolvedCode].total += 1;
        if (r.status === 'approved') statsMap[resolvedCode].approved += 1;
        else if (r.status === 'rejected') statsMap[resolvedCode].rejected += 1;
        else statsMap[resolvedCode].pending += 1;
      }
    });

    return Object.values(statsMap);
  }, [officialDepartments, periodReports, matchDepartmentCode]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (r.quarter !== selectedQuarter || r.year !== selectedYear) return false;

      if (activeTab === 'archived') {
        if (!r.is_archived) return false;
      } else {
        if (r.is_archived) return false;
        if (activeTab === 'needs_review' && !(r.status === 'submitted' || r.status === 'under_review')) return false;
        if (activeTab === 'approved' && r.status !== 'approved') return false;
        if (activeTab === 'rejected' && r.status !== 'rejected') return false;
      }

      if (selectedType !== 'all' && r.type !== selectedType) return false;

      if (selectedDept !== 'all') {
        const rawDept = r.submitter?.department || r.submitter?.program || r.rawData?.program || r.rawData?.college_office;
        const resolvedCode = matchDepartmentCode(rawDept);
        if (resolvedCode !== selectedDept) return false;
      }

      if (selectedRole !== 'all') {
        const isChair = ['chair', 'department_chair'].includes(r.submitter?.role?.toLowerCase() || '');
        if (selectedRole === 'chair' && !isChair) return false;
        if (selectedRole === 'faculty' && isChair) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const submitterName = (r.submitter?.full_name || '').toLowerCase();
        const dept = (r.submitter?.department || r.submitter?.program || '').toLowerCase();
        const idMatch = r.id.toLowerCase().includes(q);
        const typeMatch = r.type.toLowerCase().includes(q);
        if (!submitterName.includes(q) && !dept.includes(q) && !idMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [reports, selectedQuarter, selectedYear, activeTab, selectedType, selectedDept, selectedRole, searchQuery, matchDepartmentCode]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);

  const handleDecide = async (reportItem: RawReportItem, newStatus: 'approved' | 'rejected', remarks?: string) => {
    setActionLoading(true);
    const endpoint =
      reportItem.type === 'accomplishment'
        ? ACCOMPLISHMENT_API_URL
        : reportItem.type === 'extension'
        ? EXTENSION_API_URL
        : WFH_API_URL;

    try {
      const res = await fetch(`${endpoint}/${reportItem.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          status: newStatus,
          dean_remarks: remarks || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatusMessageModal({
          type: 'error',
          title: 'Action Failed',
          message: err.error || 'Failed to update report status.',
        });
        return;
      }

      await fetchAllData();
      setRejectingTarget(null);
      setRemarksInput('');
      if (inspectReport?.id === reportItem.id) {
        setInspectReport((prev) => prev ? { ...prev, status: newStatus, dean_remarks: remarks || null } : null);
      }
    } catch {
      setStatusMessageModal({
        type: 'error',
        title: 'Network Error',
        message: 'Network failure updating report status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const executeToggleArchive = async (reportItem: RawReportItem, newArchiveState: boolean) => {
    setActionLoading(true);
    const endpoint =
      reportItem.type === 'accomplishment'
        ? ACCOMPLISHMENT_API_URL
        : reportItem.type === 'extension'
        ? EXTENSION_API_URL
        : WFH_API_URL;

    try {
      const res = await fetch(`${endpoint}/${reportItem.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ is_archived: newArchiveState }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatusMessageModal({
          type: 'error',
          title: 'Archive Failed',
          message: err.error || 'Failed to update archive status.',
        });
        return;
      }

      await fetchAllData();
      setArchiveModalTarget(null);
    } catch {
      setStatusMessageModal({
        type: 'error',
        title: 'Network Error',
        message: 'Network failure toggling archive.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getBadgeStyle = (status: RawReportItem['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'submitted':
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <style>{PRINT_LAYOUT_STYLES}</style>

      {/* Header & Quarter Stepper */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Quarterly Report Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Review, monitor, and approve faculty and department chairperson submissions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs self-start lg:self-auto">
          <button
            onClick={() => stepQuarter('prev')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
            title="Previous Quarter"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3">
            <Calendar className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
              {selectedQuarter} Quarter, {selectedYear}
            </span>
          </div>

          <button
            onClick={() => stepQuarter('next')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
            title="Next Quarter"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={jumpToCurrentQuarter}
            className="ml-1 text-xs font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Current
          </button>

          <button
            onClick={fetchAllData}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {loadError}
          </div>
          <button onClick={fetchAllData} className="font-semibold underline">Try Again</button>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${activeTab === 'all' ? 'border-[#1E3A8A] ring-2 ring-blue-100' : 'border-gray-100 shadow-xs hover:border-gray-200'}`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold">Total Reports</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
        </div>

        <div
          onClick={() => { setActiveTab('needs_review'); setCurrentPage(1); }}
          className={`bg-amber-50/60 rounded-2xl border p-4 cursor-pointer transition-all ${activeTab === 'needs_review' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-amber-200/60 hover:border-amber-300'}`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-semibold">Needs Review</span>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{metrics.needsReview}</div>
        </div>

        <div
          onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
          className={`bg-emerald-50/60 rounded-2xl border p-4 cursor-pointer transition-all ${activeTab === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-200/60 hover:border-emerald-300'}`}
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-semibold">Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{metrics.approved}</div>
        </div>

        <div
          onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
          className={`bg-red-50/60 rounded-2xl border p-4 cursor-pointer transition-all ${activeTab === 'rejected' ? 'border-red-500 ring-2 ring-red-100' : 'border-red-200/60 hover:border-red-300'}`}
        >
          <div className="flex items-center justify-between text-red-800 mb-1">
            <span className="text-xs font-semibold">Rejected</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">{metrics.rejected}</div>
        </div>

        <div
          onClick={() => { setActiveTab('archived'); setCurrentPage(1); }}
          className={`bg-gray-50 rounded-2xl border p-4 cursor-pointer transition-all col-span-2 sm:col-span-1 ${activeTab === 'archived' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-semibold">Archived</span>
            <Archive className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{metrics.archived}</div>
        </div>
      </div>

      {/* Set Deadline, Bulk Reminder & Single Action Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Period Submission Deadlines & Notifications ({selectedQuarter} Quarter {selectedYear})
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Current Deadline:{' '}
              <strong className="text-gray-900">
                {deadline
                  ? new Date(deadline.due_date).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'No deadline specified yet'}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setShowDeadlineModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              {deadline ? 'Update Deadline' : 'Set Deadline'}
            </button>

            <button
              onClick={() => setShowBulkReminderModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Megaphone className="w-4 h-4" />
              Send Bulk Reminder
            </button>

            {/* Retained Single Action Button with Layout, Logo & Print View */}
            <button
              onClick={() => setShowResearchDossierModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Quarterly Research
            </button>
          </div>
        </div>
      </div>

      {/* Official Department Breakdown Chips */}
      {departmentBreakdown.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] shrink-0 mr-1">
            Departments:
          </span>
          {departmentBreakdown.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setSelectedDept(selectedDept === item.code ? 'all' : item.code);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all whitespace-nowrap ${
                selectedDept === item.code
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Building className="w-3.5 h-3.5 opacity-60" />
              <span className="font-medium">{item.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedDept === item.code ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.total}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search faculty name, department, report ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Report Types</option>
              <option value="accomplishment">Accomplishment</option>
              <option value="extension">Extension</option>
              <option value="wfh">Work-From-Home</option>
            </select>

            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="chair">Department Chairs</option>
            </select>

            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 max-w-[180px]"
            >
              <option value="all">All Departments</option>
              {officialDepartments.map((d) => (
                <option key={d.id} value={d.code} title={d.name}>
                  {d.code} – {d.name}
                </option>
              ))}
            </select>

            {(selectedType !== 'all' || selectedRole !== 'all' || selectedDept !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedRole('all');
                  setSelectedDept('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border rounded-xl hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 border-t border-gray-100 pt-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('needs_review'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'needs_review' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Needs Review ({metrics.needsReview})
          </button>
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Active ({metrics.total})
          </button>
          <button
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'approved' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Approved ({metrics.approved})
          </button>
          <button
            onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'rejected' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Rejected ({metrics.rejected})
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'archived' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" /> Archived ({metrics.archived})
          </button>
        </div>
      </div>

      {/* Reports Table & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
            <span className="text-sm font-medium">Loading quarterly submissions…</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto opacity-30 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              {activeTab === 'needs_review'
                ? "You're all caught up! No reports currently awaiting review."
                : activeTab === 'archived'
                ? 'No archived reports for this quarter.'
                : 'No reports found matching your criteria.'}
            </p>
            <p className="text-xs text-gray-400">Try changing your filters or quarter selection.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Submitter</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Role</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Department</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Report Type</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px]">Submitted</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px] text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedReports.map((item) => {
                    const isChair = ['chair', 'department_chair'].includes(item.submitter?.role?.toLowerCase() || '');
                    const badge = getBadgeStyle(item.status);
                    const canArchive = !item.is_archived && (item.status === 'approved' || item.status === 'rejected');

                    const rawDept = item.submitter?.department || item.submitter?.program || item.rawData?.program || item.rawData?.college_office;
                    const resolvedDeptCode = matchDepartmentCode(rawDept) || rawDept || '—';

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E3A8A] font-bold flex items-center justify-center text-xs">
                              {(item.submitter?.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 leading-snug">
                                {item.submitter?.full_name || 'Unknown Submitter'}
                              </div>
                              <span className="text-[10px] font-mono text-gray-400">ID: {item.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isChair ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                            {isChair ? 'Dept. Chair' : 'Faculty'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-gray-600 font-semibold">
                          {resolvedDeptCode}
                        </td>

                        <td className="py-3.5 px-4 capitalize font-semibold text-gray-800">
                          {item.type === 'wfh' ? 'Work-From-Home' : item.type}
                        </td>

                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(item.date_submitted || item.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${badge}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.is_archived && (
                              <button
                                type="button"
                                onClick={() => setArchiveModalTarget({ item, targetState: false })}
                                className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                                title="Restore to Active Reports"
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                              </button>
                            )}

                            <button
                              onClick={() => setInspectReport(item)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>

                            {item.status === 'approved' && (
                              <button
                                onClick={() => {
                                  setInspectReport(item);
                                  setShowPrintModal(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                                title="Print Approved Report"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print
                              </button>
                            )}

                            {canArchive && (
                              <button
                                type="button"
                                onClick={() => setArchiveModalTarget({ item, targetState: true })}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Archive Report"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedReports.map((item) => {
                const canArchive = !item.is_archived && (item.status === 'approved' || item.status === 'rejected');
                const rawDept = item.submitter?.department || item.submitter?.program || item.rawData?.program || item.rawData?.college_office;
                const resolvedDeptCode = matchDepartmentCode(rawDept) || rawDept || '—';

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{item.submitter?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {resolvedDeptCode} · <span className="capitalize">{item.type}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${getBadgeStyle(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                      <span>Submitted: {new Date(item.date_submitted || item.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-1.5">
                        {item.is_archived && (
                          <button
                            type="button"
                            onClick={() => setArchiveModalTarget({ item, targetState: false })}
                            className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => setInspectReport(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg"
                        >
                          View
                        </button>
                        {item.status === 'approved' && (
                          <button
                            onClick={() => { setInspectReport(item); setShowPrintModal(true); }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
                          >
                            Print
                          </button>
                        )}
                        {canArchive && (
                          <button
                            type="button"
                            onClick={() => setArchiveModalTarget({ item, targetState: true })}
                            className="p-1 text-gray-400 rounded-lg"
                            title="Archive Report"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredReports.length)} to{' '}
                  {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-2 py-1 rounded border disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-2 py-1 rounded border ${currentPage === p ? 'bg-[#1E3A8A] text-white font-bold' : ''}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-2 py-1 rounded border disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. REPORT VIEWER MODAL (WITH OFFICIAL HEADER & FOOTER LOGOS)          */}
      {/* ===================================================================== */}
      {inspectReport && !showPrintModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 py-8 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0"
            onClick={() => setInspectReport(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg capitalize">
                  {inspectReport.type === 'wfh' ? 'Work-From-Home (WFH)' : inspectReport.type} Report
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitter: <strong className="text-gray-800">{inspectReport.submitter?.full_name}</strong> ·{' '}
                  {inspectReport.quarter} Quarter, {inspectReport.year} ·{' '}
                  <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[10px] ${getBadgeStyle(inspectReport.status)}`}>
                    {inspectReport.status.replace('_', ' ')}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {inspectReport.status === 'approved' && (
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                )}
                <button onClick={() => setInspectReport(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Header Logo */}
              <div className="text-center pb-2">
                <img
                  src="/header-pics/ctu-header.png"
                  alt="CTU Header"
                  className="max-w-[440px] w-full mx-auto object-contain mb-2"
                />
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">College of Education</div>
                <div className="text-xs font-bold text-gray-900 uppercase">
                  {inspectReport.type === 'wfh' ? 'Work-From-Home Accomplishment' : inspectReport.type === 'extension' ? 'Community Extension Report' : 'Program Accomplishment Report'}
                </div>
              </div>

              {inspectReport.dean_remarks && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" /> Dean's Feedback:
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{inspectReport.dean_remarks}</p>
                </div>
              )}

              {/* Accomplishment View */}
              {inspectReport.type === 'accomplishment' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div><strong>Quarter:</strong> {inspectReport.quarter}</div>
                    <div><strong>Year:</strong> {inspectReport.year}</div>
                    <div><strong>Program:</strong> {inspectReport.rawData.program || 'N/A'}</div>
                    <div><strong>Program Chair:</strong> {inspectReport.rawData.program_chair || 'N/A'}</div>
                  </div>

                  {/* MFO 1 Table */}
                  {hasPopulatedRows(inspectReport.rawData.pi1_data) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">MFO 1: Licensure Exam Passers</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.pi1_data}
                        columns={[
                          { key: 'date_exam', label: 'Exam Date' },
                          { key: 'no_first_time', label: 'First-time Takers' },
                          { key: 'no_passers', label: 'Passers' },
                          { key: 'passing_pct_first', label: 'Passing %' },
                          { key: 'overall_pct', label: 'Overall %' },
                        ]}
                      />
                    </div>
                  )}

                  {/* MFO 2A Table: Faculty Awards & Expert Services */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi1_data) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">MFO 2A: Faculty Awards & Expert Services Rendered</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.mfo2_pi1_data}
                        columns={[
                          { key: 'name_faculty', label: 'Faculty / Staff' },
                          { key: 'nature_service', label: 'Nature of Service / Award' },
                          { key: 'event_title', label: 'Event / Engagement Title' },
                          { key: 'date', label: 'Date' },
                          { key: 'venue', label: 'Venue' },
                          { key: 'level_role', label: 'Role / Level' },
                        ]}
                      />
                    </div>
                  )}

                  {/* MFO 2B Table: On-Going / Completed Researches */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi2_data) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">MFO 2B: On-Going / Completed Researches</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.mfo2_pi2_data}
                        columns={[
                          { key: 'title_research', label: 'Research Title' },
                          { key: 'proponents', label: 'Proponents' },
                          { key: 'status_phase', label: 'Status / Phase' },
                          { key: 'funding_source', label: 'Funding Source' },
                          { key: 'date_started', label: 'Date Started' },
                          { key: 'target_completion', label: 'Target / Completed' },
                        ]}
                      />
                    </div>
                  )}

                  {/* MFO 2C Table: Research In-house Review */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi3_data) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">MFO 2C: Research In-house Review</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.mfo2_pi3_data}
                        columns={[
                          { key: 'title_research', label: 'Proposal / Research Title' },
                          { key: 'proponents', label: 'Proponents' },
                          { key: 'date_review', label: 'Date of Review' },
                          { key: 'panel_reviewers', label: 'Panel Reviewers' },
                          { key: 'remarks', label: 'Remarks / Action Taken' },
                        ]}
                      />
                    </div>
                  )}

                  {/* MFO 3: Completed Research Output */}
                  {hasPopulatedRows(inspectReport.rawData.mfo3_pi2_data) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">MFO 3 — PI 2: Research Output Completed Within Quarter</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.mfo3_pi2_data}
                        columns={[
                          { key: 'title_research', label: 'Research Title' },
                          { key: 'proponents', label: 'Proponents' },
                          { key: 'date_completed', label: 'Date Completed' },
                          { key: 'funding_source', label: 'Funding Source' },
                        ]}
                      />
                    </div>
                  )}

                  {inspectReport.rawData.other_accomplishments && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-1">Other Accomplishments Narrative</h4>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{inspectReport.rawData.other_accomplishments}</p>
                    </div>
                  )}

                  {inspectReport.rawData.doc_entries_data?.some((e: any) => e.photos?.length > 0) && (
                    <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                      <h4 className="font-bold text-gray-800">Documentation & Attachments</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {inspectReport.rawData.doc_entries_data.flatMap((e: any) =>
                          (e.photos || []).map((p: any, idx: number) => (
                            <div key={idx} className="border rounded-lg overflow-hidden bg-white">
                              <img src={p.url} alt="Photo" className="w-full h-28 object-contain bg-gray-50" />
                              {p.caption && <p className="p-1 text-[10px] text-gray-500 text-center truncate">{p.caption}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extension View */}
              {inspectReport.type === 'extension' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div><strong>Prepared By:</strong> {inspectReport.rawData.prepared_by_name || 'N/A'}</div>
                    <div><strong>Designation:</strong> {inspectReport.rawData.prepared_by_title || 'Extension Chairperson'}</div>
                    <div><strong>Quarter/Year:</strong> {inspectReport.quarter} Quarter, {inspectReport.year}</div>
                  </div>

                  {hasPopulatedRows(inspectReport.rawData.rows) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">Extension Projects & Activities</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.rows || []}
                        columns={[
                          { key: 'extension_project', label: 'Project / Activity' },
                          { key: 'highlights', label: 'Highlights' },
                          { key: 'partner_linkage', label: 'Partner' },
                          { key: 'num_trainees', label: 'No. Trainees' },
                          { key: 'venue', label: 'Venue' },
                          { key: 'inclusive_date', label: 'Date' },
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* WFH View */}
              {inspectReport.type === 'wfh' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <p><strong>Faculty:</strong> {inspectReport.rawData.name || inspectReport.submitter?.full_name}</p>
                    <p><strong>Rank:</strong> {inspectReport.rawData.position_rank || 'N/A'}</p>
                    <p><strong>Period:</strong> {inspectReport.rawData.reporting_period || 'N/A'}</p>
                    <p><strong>Unit:</strong> {inspectReport.rawData.program_unit || 'N/A'}</p>
                    <p><strong>Hours:</strong> {inspectReport.rawData.working_hours || 'N/A'}</p>
                  </div>

                  {hasPopulatedRows(inspectReport.rawData.daily_accomplishments) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">Daily Accomplishments</h4>
                      <GenericTableViewer
                        rows={inspectReport.rawData.daily_accomplishments || []}
                        columns={[
                          { key: 'date', label: 'Date' },
                          { key: 'activities', label: 'Activities Accomplished' },
                          { key: 'output', label: 'Output / Deliverable' },
                        ]}
                      />
                    </div>
                  )}

                  {inspectReport.rawData.photos?.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <h4 className="font-bold text-gray-800 mb-2">Evidence Screenshots</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {inspectReport.rawData.photos.map((p: any, idx: number) => (
                          <div key={idx} className="border rounded-lg overflow-hidden bg-white p-1">
                            <img src={p.url} alt="Evidence" className="w-full h-32 object-contain bg-gray-50" />
                            {p.caption && <p className="text-[10px] text-gray-600 mt-1 text-center truncate">{p.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Logo */}
              <div className="pt-4 text-center">
                <img
                  src="/header-pics/ctu-footer.png"
                  alt="CTU Footer"
                  className="max-w-[440px] w-full mx-auto object-contain"
                />
              </div>
            </div>

            {/* Approval / Rejection Controls */}
            {(inspectReport.status === 'submitted' || inspectReport.status === 'under_review') && (
              <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() => setRejectingTarget(inspectReport)}
                  className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject with Remarks
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleDecide(inspectReport, 'approved')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Report
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 4. REJECT MODAL WITH REMARKS (PORTAL COVERING 100% OF VIEWPORT)       */}
      {/* ===================================================================== */}
      {rejectingTarget && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0" 
            onClick={() => !actionLoading && setRejectingTarget(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-gray-900 text-base">Return Report for Revisions</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Specify what corrections or missing requirements are needed for <span className="font-semibold text-gray-800">{rejectingTarget.submitter?.full_name || 'this personnel'}</span>. The faculty member will be able to revise and resubmit the same report.
            </p>

            <textarea
              rows={4}
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              placeholder="e.g. Please attach the certificate of completion for the research project."
              className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !remarksInput.trim()}
                onClick={() => handleDecide(rejectingTarget, 'rejected', remarksInput)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 5. STYLED CONFIRMATION MODAL (PORTAL COVERING 100% OF VIEWPORT)       */}
      {/* ===================================================================== */}
      {archiveModalTarget && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0" 
            onClick={() => !actionLoading && setArchiveModalTarget(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center z-10 animate-in fade-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${archiveModalTarget.targetState ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {archiveModalTarget.targetState ? <Archive className="w-6 h-6" /> : <ArchiveRestore className="w-6 h-6" />}
            </div>

            <h3 className="font-bold text-gray-900 text-lg">
              {archiveModalTarget.targetState ? 'Archive Report?' : 'Restore to Active?'}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              {archiveModalTarget.targetState
                ? `Move the ${archiveModalTarget.item.type} report for ${archiveModalTarget.item.submitter?.full_name || 'this personnel'} to the Archived tab? It can still be inspected and printed at any time.`
                : `Restore the ${archiveModalTarget.item.type} report for ${archiveModalTarget.item.submitter?.full_name || 'this personnel'} back to active quarterly submissions?`}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArchiveModalTarget(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeToggleArchive(archiveModalTarget.item, archiveModalTarget.targetState)}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                  archiveModalTarget.targetState
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#1E3A8A] hover:bg-[#1E40AF]'
                }`}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {archiveModalTarget.targetState ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 6. SET / UPDATE DEADLINE MODAL (RESTRICTS PAST TIMESTAMPS)            */}
      {/* ===================================================================== */}
      {showDeadlineModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0"
            onClick={() => !savingDeadline && setShowDeadlineModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#1E3A8A]">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 text-base">
                  {deadline ? 'Update Deadline' : 'Set Submission Deadline'}
                </h3>
              </div>
              <button
                disabled={savingDeadline}
                onClick={() => setShowDeadlineModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Set the submission cutoff date and time for <strong>{selectedQuarter} Quarter {selectedYear}</strong>. All faculty members and department chairs will receive an automatic announcement.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                min={minDateTimeInput}
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Past dates and times are disabled.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={savingDeadline}
                onClick={() => setShowDeadlineModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingDeadline || !deadlineInput}
                onClick={saveDeadline}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E40AF] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                {savingDeadline && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingDeadline ? 'Saving...' : deadline ? 'Update & Broadcast' : 'Set & Broadcast'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 7. SEND BULK REMINDER MODAL (FULL VIEWPORT PORTAL)                   */}
      {/* ===================================================================== */}
      {showBulkReminderModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0"
            onClick={() => !sendingBulk && setShowBulkReminderModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-amber-600">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 text-base">Send Bulk Reminder</h3>
              </div>
              <button
                disabled={sendingBulk}
                onClick={() => setShowBulkReminderModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <p>
                You are about to dispatch quarterly report reminder notifications for <strong>{selectedQuarter} Quarter {selectedYear}</strong>.
              </p>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div>Pending Submissions: <strong>{pendingProfiles.length} Personnel</strong></div>
                {deadline && (
                  <div className="text-[11px] text-amber-700">
                    Deadline: {new Date(deadline.due_date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={sendingBulk}
                onClick={() => setShowBulkReminderModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingBulk || pendingProfiles.length === 0}
                onClick={executeSendBulkReminder}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                {sendingBulk && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {sendingBulk ? 'Dispatching...' : 'Confirm & Dispatch'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 8. STATUS / RESPONSE MESSAGE MODAL (REPLACES BROWSER ALERTS)          */}
      {/* ===================================================================== */}
      {statusMessageModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div 
            className="fixed inset-0"
            onClick={() => setStatusMessageModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-center z-10 animate-in fade-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              statusMessageModal.type === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : statusMessageModal.type === 'warning'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {statusMessageModal.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : statusMessageModal.type === 'warning' ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <h3 className="font-bold text-gray-900 text-base">{statusMessageModal.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{statusMessageModal.message}</p>

            <button
              type="button"
              onClick={() => setStatusMessageModal(null)}
              className="w-full py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E40AF] transition-colors shadow-sm"
            >
              Okay
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 9. COMPLETE PRINT MODAL (PORTAL COVERING 100% OF VIEWPORT)             */}
      {/* ===================================================================== */}
      {showPrintModal && inspectReport && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b mb-6 print-hide">
              <h3 className="font-bold text-gray-900 text-sm">Print Document — {inspectReport.submitter?.full_name}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div id="dean-print-area" className="text-black bg-white text-xs leading-relaxed max-w-[800px] mx-auto">
              <div className="text-center mb-4">
                <img
                  src="/header-pics/ctu-header.png"
                  alt="CTU Header"
                  className="max-w-[480px] w-full mx-auto object-contain mb-2"
                />
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">College of Education</div>
                <h1 className="text-sm font-extrabold uppercase mt-1">
                  {inspectReport.type === 'wfh'
                    ? 'WORK-FROM-HOME (WFH) ACCOMPLISHMENT REPORT'
                    : inspectReport.type === 'extension'
                    ? 'COMMUNITY EXTENSION SERVICES ACCOMPLISHMENT REPORT'
                    : 'PROGRAM ACCOMPLISHMENT REPORT'}
                </h1>
                <div className="text-xs font-semibold text-gray-800">
                  {inspectReport.quarter} Quarter, {inspectReport.year}
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Submitter: <span className="font-semibold text-black">{inspectReport.submitter?.full_name}</span> |{' '}
                  Status: <span className="font-semibold text-black uppercase">{inspectReport.status}</span>
                </div>
              </div>

              {/* Accomplishment Tables */}
              {inspectReport.type === 'accomplishment' && (
                <div className="space-y-4">
                  {/* Print MFO 1 */}
                  {hasPopulatedRows(inspectReport.rawData.pi1_data) && (
                    <div className="print-avoid-break">
                      <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-1 uppercase">MFO 1: Licensure Examination Passers</div>
                      <table className="w-full border border-black border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="border border-black p-1">Exam Date</th>
                            <th className="border border-black p-1">First-time Passers</th>
                            <th className="border border-black p-1">Total Passers</th>
                            <th className="border border-black p-1">Overall %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectReport.rawData.pi1_data.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black p-1">{r.date_exam || '—'}</td>
                              <td className="border border-black p-1">{r.no_passers || '—'}</td>
                              <td className="border border-black p-1">{r.total_passers || '—'}</td>
                              <td className="border border-black p-1">{r.overall_pct || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Print MFO 2A: Faculty Awards & Expert Services */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi1_data) && (
                    <div className="print-avoid-break">
                      <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-1 uppercase">
                        MFO 2A: Faculty Awards & Expert Services Rendered
                      </div>
                      <table className="w-full border border-black border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="border border-black p-1">Faculty / Staff</th>
                            <th className="border border-black p-1">Nature of Service / Award</th>
                            <th className="border border-black p-1">Event Title</th>
                            <th className="border border-black p-1">Date</th>
                            <th className="border border-black p-1">Venue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectReport.rawData.mfo2_pi1_data.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black p-1 font-semibold">{r.name_faculty || '—'}</td>
                              <td className="border border-black p-1">{r.nature_service || '—'}</td>
                              <td className="border border-black p-1">{r.event_title || '—'}</td>
                              <td className="border border-black p-1">{r.date || '—'}</td>
                              <td className="border border-black p-1">{r.venue || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Print MFO 2B: On-Going / Completed Researches */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi2_data) && (
                    <div className="print-avoid-break">
                      <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-1 uppercase">
                        MFO 2B: On-Going / Completed Researches
                      </div>
                      <table className="w-full border border-black border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="border border-black p-1">Research Title</th>
                            <th className="border border-black p-1">Proponents</th>
                            <th className="border border-black p-1">Status / Phase</th>
                            <th className="border border-black p-1">Funding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectReport.rawData.mfo2_pi2_data.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black p-1 font-semibold">{r.title_research || '—'}</td>
                              <td className="border border-black p-1">{r.proponents || '—'}</td>
                              <td className="border border-black p-1">{r.status_phase || '—'}</td>
                              <td className="border border-black p-1">{r.funding_source || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Print MFO 2C: Research In-house Review */}
                  {hasPopulatedRows(inspectReport.rawData.mfo2_pi3_data) && (
                    <div className="print-avoid-break">
                      <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-1 uppercase">
                        MFO 2C: Research In-house Review
                      </div>
                      <table className="w-full border border-black border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="border border-black p-1">Proposal Title</th>
                            <th className="border border-black p-1">Proponents</th>
                            <th className="border border-black p-1">Date</th>
                            <th className="border border-black p-1">Panel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectReport.rawData.mfo2_pi3_data.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black p-1 font-semibold">{r.title_research || '—'}</td>
                              <td className="border border-black p-1">{r.proponents || '—'}</td>
                              <td className="border border-black p-1">{r.date_review || '—'}</td>
                              <td className="border border-black p-1">{r.panel_reviewers || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Print MFO 3: Completed Research */}
                  {hasPopulatedRows(inspectReport.rawData.mfo3_pi2_data) && (
                    <div className="print-avoid-break">
                      <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-1 uppercase">MFO 3 — PI 2: Research Completed Within Quarter</div>
                      <table className="w-full border border-black border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="border border-black p-1">Title</th>
                            <th className="border border-black p-1">Proponents</th>
                            <th className="border border-black p-1">Date Completed</th>
                            <th className="border border-black p-1">Funding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectReport.rawData.mfo3_pi2_data.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="border border-black p-1 font-semibold">{r.title_research || '—'}</td>
                              <td className="border border-black p-1">{r.proponents || '—'}</td>
                              <td className="border border-black p-1">{r.date_completed || '—'}</td>
                              <td className="border border-black p-1">{r.funding_source || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Extension Table */}
              {inspectReport.type === 'extension' && hasPopulatedRows(inspectReport.rawData.rows) && (
                <div className="print-avoid-break">
                  <table className="w-full border border-black border-collapse text-[10px] mb-6">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="border border-black p-1">Project / Activity</th>
                        <th className="border border-black p-1">Highlights</th>
                        <th className="border border-black p-1">Partner</th>
                        <th className="border border-black p-1">Trainees</th>
                        <th className="border border-black p-1">Venue</th>
                        <th className="border border-black p-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(inspectReport.rawData.rows || []).map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-black p-1 font-semibold">{r.extension_project || '—'}</td>
                          <td className="border border-black p-1 whitespace-pre-wrap">{r.highlights || '—'}</td>
                          <td className="border border-black p-1">{r.partner_linkage || '—'}</td>
                          <td className="border border-black p-1 text-center">{r.num_trainees || '—'}</td>
                          <td className="border border-black p-1">{r.venue || '—'}</td>
                          <td className="border border-black p-1">{r.inclusive_date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 print-avoid-break">
                <div className="flex justify-between items-start text-[11px] px-6">
                  <div className="text-center w-60">
                    <p className="text-left font-semibold mb-8">Prepared by:</p>
                    <div className="border-b border-black w-full mb-1" />
                    <p className="font-bold uppercase">{inspectReport.submitter?.full_name}</p>
                    <p className="text-[10px] text-gray-600">Submitter</p>
                  </div>
                  <div className="text-center w-60">
                    <p className="text-left font-semibold mb-8">Approved by:</p>
                    <div className="border-b border-black w-full mb-1" />
                    <p className="font-bold uppercase">Dean / Campus Director</p>
                    <p className="text-[10px] text-gray-600">College of Education</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <img
                  src="/header-pics/ctu-footer.png"
                  alt="CTU Footer"
                  className="max-w-[480px] w-full mx-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 10. SINGLE ACTION PRINT MODAL: CONSOLIDATED QUARTERLY RESEARCH        */}
      {/* ===================================================================== */}
      {showResearchDossierModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen z-[99999] bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4 m-0"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b mb-6 print-hide">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  College of Education — Consolidated Research Outputs
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedQuarter} Quarter, {selectedYear} · {quarterlyResearchDossier.totalFound} Total Deliverables Found
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Research Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setShowResearchDossierModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {quarterlyResearchDossier.totalFound === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No research deliverables recorded for {selectedQuarter} Quarter {selectedYear}.</p>
              </div>
            ) : (
              <div id="dean-research-dossier" className="text-black bg-white text-xs leading-relaxed max-w-[850px] mx-auto">
                <div className="text-center mb-5">
                  <img
                    src="/header-pics/ctu-header.png"
                    alt="CTU Header"
                    className="max-w-[500px] w-full mx-auto object-contain mb-2"
                  />
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">College of Education</div>
                  <h1 className="text-sm font-extrabold uppercase mt-1">
                    CONSOLIDATED RESEARCH & DEVELOPMENT ACCOMPLISHMENTS
                  </h1>
                  <div className="text-xs font-semibold text-gray-800">
                    {selectedQuarter} Quarter, School Year {selectedYear}
                  </div>
                </div>

                {/* Section 1: Completed / On-going Researches */}
                {quarterlyResearchDossier.onGoingCompleted.length > 0 && (
                  <div className="print-avoid-break mb-6">
                    <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-2 uppercase">
                      I. Completed & On-Going Research Outputs ({quarterlyResearchDossier.onGoingCompleted.length})
                    </div>
                    <table className="w-full border border-black border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="border border-black p-1.5">#</th>
                          <th className="border border-black p-1.5">Research Title</th>
                          <th className="border border-black p-1.5">Proponents / Lead</th>
                          <th className="border border-black p-1.5">Program / Dept</th>
                          <th className="border border-black p-1.5">Status / Phase</th>
                          <th className="border border-black p-1.5">Funding Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyResearchDossier.onGoingCompleted.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-black p-1.5 text-center">{i + 1}</td>
                            <td className="border border-black p-1.5 font-semibold">{r.title_research || '—'}</td>
                            <td className="border border-black p-1.5">{r.proponents || r.submitter || '—'}</td>
                            <td className="border border-black p-1.5">{r.department || '—'}</td>
                            <td className="border border-black p-1.5">{r.status_phase || 'Completed'}</td>
                            <td className="border border-black p-1.5">{r.funding_source || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 2: Refereed Journal Publications */}
                {quarterlyResearchDossier.publications.length > 0 && (
                  <div className="print-avoid-break mb-6">
                    <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-2 uppercase">
                      II. Refereed Journal Publications ({quarterlyResearchDossier.publications.length})
                    </div>
                    <table className="w-full border border-black border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="border border-black p-1.5">#</th>
                          <th className="border border-black p-1.5">Publication / Journal Title</th>
                          <th className="border border-black p-1.5">Proponents</th>
                          <th className="border border-black p-1.5">Journal Name</th>
                          <th className="border border-black p-1.5">Date Published</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyResearchDossier.publications.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-black p-1.5 text-center">{i + 1}</td>
                            <td className="border border-black p-1.5 font-semibold">{r.title_research || '—'}</td>
                            <td className="border border-black p-1.5">{r.proponents || r.submitter || '—'}</td>
                            <td className="border border-black p-1.5">{r.name_publication || '—'}</td>
                            <td className="border border-black p-1.5">{r.date_published || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 3: Faculty Awards & Expert Services Rendered */}
                {quarterlyResearchDossier.expertServices.length > 0 && (
                  <div className="print-avoid-break mb-6">
                    <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-2 uppercase">
                      III. Expert Services Rendered & Research Awards ({quarterlyResearchDossier.expertServices.length})
                    </div>
                    <table className="w-full border border-black border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="border border-black p-1.5">#</th>
                          <th className="border border-black p-1.5">Faculty / Researcher</th>
                          <th className="border border-black p-1.5">Engagement / Event</th>
                          <th className="border border-black p-1.5">Nature of Service</th>
                          <th className="border border-black p-1.5">Venue / Agency</th>
                          <th className="border border-black p-1.5">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyResearchDossier.expertServices.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-black p-1.5 text-center">{i + 1}</td>
                            <td className="border border-black p-1.5 font-semibold">{r.name_faculty || r.submitter || '—'}</td>
                            <td className="border border-black p-1.5">{r.event_title || '—'}</td>
                            <td className="border border-black p-1.5">{r.nature_service || '—'}</td>
                            <td className="border border-black p-1.5">{r.venue || '—'}</td>
                            <td className="border border-black p-1.5">{r.date || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 4: In-House Proposal Reviews */}
                {quarterlyResearchDossier.inHouseReviews.length > 0 && (
                  <div className="print-avoid-break mb-6">
                    <div className="font-bold text-[11px] border-b border-black pb-0.5 mb-2 uppercase">
                      IV. In-House Reviews & Proposal Evaluations ({quarterlyResearchDossier.inHouseReviews.length})
                    </div>
                    <table className="w-full border border-black border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="border border-black p-1.5">#</th>
                          <th className="border border-black p-1.5">Proposal Title</th>
                          <th className="border border-black p-1.5">Proponents</th>
                          <th className="border border-black p-1.5">Review Date</th>
                          <th className="border border-black p-1.5">Panel / Evaluators</th>
                          <th className="border border-black p-1.5">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarterlyResearchDossier.inHouseReviews.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-black p-1.5 text-center">{i + 1}</td>
                            <td className="border border-black p-1.5 font-semibold">{r.title_research || '—'}</td>
                            <td className="border border-black p-1.5">{r.proponents || r.submitter || '—'}</td>
                            <td className="border border-black p-1.5">{r.date_review || '—'}</td>
                            <td className="border border-black p-1.5">{r.panel_reviewers || '—'}</td>
                            <td className="border border-black p-1.5">{r.remarks || 'Reviewed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Dean & Institutional Signatures */}
                <div className="pt-8 print-avoid-break">
                  <div className="flex justify-between items-start text-[11px] px-6">
                    <div className="text-center w-60">
                      <p className="text-left font-semibold mb-8">Consolidated by:</p>
                      <div className="border-b border-black w-full mb-1" />
                      <p className="font-bold uppercase">Research & Extension Chairperson</p>
                      <p className="text-[10px] text-gray-600">College of Education</p>
                    </div>
                    <div className="text-center w-60">
                      <p className="text-left font-semibold mb-8">Approved by:</p>
                      <div className="border-b border-black w-full mb-1" />
                      <p className="font-bold uppercase">Dean / Campus Director</p>
                      <p className="text-[10px] text-gray-600">College of Education</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <img
                    src="/header-pics/ctu-footer.png"
                    alt="CTU Footer"
                    className="max-w-[500px] w-full mx-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ============================================================================
// 11. HELPER TABLE VIEWER COMPONENT
// ============================================================================
function GenericTableViewer({ rows, columns }: { rows: any[]; columns: { key: string; label: string }[] }) {
  if (!rows || rows.length === 0) return <p className="text-gray-400 italic py-1 text-xs">No records entered.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((c) => (
              <th key={c.key} className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-700">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {columns.map((c) => (
                <td key={c.key} className="border border-gray-200 px-2 py-1.5 align-top text-gray-800">
                  {row[c.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportsAnalytics;