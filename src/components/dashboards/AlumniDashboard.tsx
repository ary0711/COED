import { 
  User, 
  FileText, 
  Award, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  CheckCircle,
  Menu,
  History,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Settings,
  Lock,
  LogOut,
  Check,
  Calendar,
  Upload,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { createPortal } from 'react-dom';
import { AcademicDocumentsViewer } from '../AcademicDocumentsViewer';

// ====================== TRACER SURVEY API HELPERS ======================
interface TracerSurveyData {
  alumni_id: string;
  first_name: string;
  last_name: string;
  employment_status: string;
  job_title: string;
  employer: string;
  years_employed: number;
  monthly_salary: string;
  relevance: string;
  post_graduate_degree: string;
  updated_at?: string;
}

const TRACER_API_URL = 'http://localhost:5000/api/tracer-survey';

function getToken() {
  return localStorage.getItem('token');
}

async function parseErrorOrThrow(res: Response) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || res.statusText);
}

async function getTracerSurvey(_alumniId: string) {
  const res = await fetch(`${TRACER_API_URL}/mine`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) await parseErrorOrThrow(res);
  return res.json();
}

async function saveTracerSurvey(data: TracerSurveyData) {
  const { alumni_id, ...payload } = data;
  const res = await fetch(TRACER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

async function updateTracerSurvey(_alumniId: string, data: Partial<TracerSurveyData>) {
  const { alumni_id, ...payload } = data as TracerSurveyData;
  const res = await fetch(TRACER_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

function validateTracerSurvey(data: Partial<TracerSurveyData>): string[] {
  const errors: string[] = [];
  if (!data.first_name) errors.push('First Name is required.');
  if (!data.last_name) errors.push('Last Name is required.');
  if (!data.employment_status) errors.push('Employment status is required.');
  if (data.employment_status === 'employed') {
    if (!data.employer) errors.push('Name of Company / Type of Business is required.');
  }
  return errors;
}

const alumniMenuItems = [
  { icon: Bell,         label: 'Dashboard',             id: 'dashboard'    },
  { icon: FileText,     label: 'Graduate Tracer Survey', id: 'tracer'       },
  { icon: CalendarIcon, label: 'Alumni Calendar',        id: 'calendar'    },
  { icon: Award,        label: 'Achievements',           id: 'achievements'},
  { icon: FileText,     label: 'Documents & Resources',  id: 'documents'   },
  { icon: MessageSquare,label: 'Inquiry / Contact',      id: 'inquiry'     },
  { icon: Settings,     label: 'Settings',               id: 'settings'    },
];

interface AlumniDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
  onRoleChange?: () => void;
  onLogout?: () => void;
  userName?: string;
  idNumber?: string;
}

export function AlumniDashboard({
  activeMenuItem,
  setActiveMenuItem,
  onLogout,
  userName,
  idNumber,
}: AlumniDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    userName ||
    localStorage.getItem('userFullName') ||
    'Alumni'
  );
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const handleInternalLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    if (onLogout) {
      onLogout();
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setUserEmail(data.email ?? '');

        if (data.full_name) {
          setDisplayName(data.full_name);
          localStorage.setItem('userFullName', data.full_name);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={alumniMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Alumni"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleInternalLogout}
      />

      <div className="hidden lg:block w-64 shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <DashboardHeader
                userRole="Alumni"
                userName={displayName}
                onLogout={handleInternalLogout}
              />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 flex flex-col min-h-0">
          {activeMenuItem === 'dashboard'    && <AlumniDashboardView setActiveMenuItem={setActiveMenuItem} alumniId={idNumber || 'ALU-2020-0458'} />}
          <div className={activeMenuItem !== 'dashboard' ? 'overflow-y-auto h-full pr-2' : 'h-full flex flex-col'}>
            {activeMenuItem === 'tracer'        && <TracerSurvey alumniId={idNumber || 'ALU-2020-0458'} />}
            {activeMenuItem === 'calendar'      && <AlumniCalendar />}
            {activeMenuItem === 'achievements' && <AlumniAchievements />}
            {activeMenuItem === 'documents'    && <DocumentsResources />}
            {activeMenuItem === 'inquiry'      && <AlumniInquiry />}
            {activeMenuItem === 'settings'     && (
              <AlumniSettings
                profile={profile}
                userEmail={userEmail}
                loading={profileLoading}
                onProfileUpdated={async () => {
                  await fetchProfile();
                  const updatedName = localStorage.getItem('userFullName');
                  if (updatedName) {
                    setDisplayName(updatedName);
                  }
                }}
                idNumber={idNumber || ''}
                onLogout={handleInternalLogout}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ====================== DASHBOARD VIEW ======================
function AlumniDashboardView({
  setActiveMenuItem,
  alumniId,
}: {
  setActiveMenuItem: (id: string) => void;
  alumniId: string;
}) {
  const [tracerData, setTracerData] = useState<any>(null);
  const [memberSince, setMemberSince] = useState<string>('2020');
  const [events, setEvents] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      try {
        const tr = await getTracerSurvey(alumniId).catch(() => null);
        if (isMounted) setTracerData(tr);

        const userId = localStorage.getItem('userId');
        if (userId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', userId)
            .single();
          
          if (isMounted && prof?.created_at) {
            setMemberSince(new Date(prof.created_at).getFullYear().toString());
          }

          const { data: inqs } = await supabase
            .from('inquiries')
            .select('*')
            .eq('sender_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (isMounted && inqs) setInquiries(inqs);
        }

        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/calendar-events', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        
        if (res && res.ok && isMounted) {
          const evs = await res.json();
          const todayStr = new Date().toISOString().split('T')[0];
          const upcoming = (Array.isArray(evs) ? evs : []).filter((e: any) => 
            (!e.audience || ['all', 'everyone', 'alumni'].includes(e.audience.toLowerCase())) &&
            (e.event_date.split('T')[0] >= todayStr)
          ).sort((a: any, b: any) => a.event_date.localeCompare(b.event_date));
          
          setEvents(upcoming);
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [alumniId]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 flex-shrink-0">
        <button 
          onClick={() => setActiveMenuItem('tracer')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${tracerData ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
              {tracerData ? 'Current Record' : 'Action Required'}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {loading ? '...' : (tracerData ? 'Completed' : 'Pending')}
            </div>
            <div className="text-sm font-medium text-gray-600">Tracer Survey</div>
            <div className="text-xs text-gray-400 mt-2">
              {tracerData?.updated_at ? `Last updated: ${new Date(tracerData.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}` : 'Update your current status'}
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveMenuItem('tracer')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 uppercase tracking-wider">
              {loading ? '...' : (tracerData?.employment_status || 'UNSET')}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 mb-1 truncate" title={tracerData?.job_title}>
              {loading ? '...' : (tracerData?.job_title || 'Not Specified')}
            </div>
            <div className="text-sm font-medium text-gray-600">Employment</div>
            <div className="text-xs text-gray-400 mt-2 truncate" title={tracerData?.employer}>
              {tracerData?.employer || 'Click to set employment details'}
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveMenuItem('tracer')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
              ACTIVE
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              Active Status
            </div>
            <div className="text-sm font-medium text-gray-600">Alumni Record</div>
            <div className="text-xs text-gray-400 mt-2">
              Member since {loading ? '...' : memberSince}
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[470px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-50 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Alumni Calendar</h2>
              <p className="text-xs text-gray-500 mt-0.5">Upcoming events & schedules</p>
            </div>
            <button 
              onClick={() => setActiveMenuItem('calendar')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              View Calendar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8 text-sm">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">No upcoming events.</div>
            ) : (
              events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setActiveMenuItem('calendar')}
                  className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-blue-100 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm mb-0.5">{ev.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{ev.event_type || 'Event'} • {new Date(ev.event_date.split('T')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider flex-shrink-0">
                    Nearest Event
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-50 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Inquiries</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tracking status of submitted concerns</p>
            </div>
            <button 
              onClick={() => setActiveMenuItem('inquiry')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8 text-sm">Loading inquiries...</div>
            ) : inquiries.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">No recent inquiries submitted.</div>
            ) : (
              inquiries.map((inq) => (
                <button
                  key={inq.id}
                  onClick={() => setActiveMenuItem('inquiry')}
                  className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-purple-100 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 pr-4">
                      <div className="font-bold text-gray-900 text-sm mb-0.5 truncate">{inq.subject}</div>
                      <div className="text-xs text-gray-500 truncate">{inq.category || 'General'} • {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${inq.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {inq.status === 'answered' ? 'Answered' : 'Pending'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== TRACER SURVEY (ALUMNI DASHBOARD) ======================
function TracerSurvey({ alumniId }: { alumniId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employmentStatus: 'employed',
    jobTitle: '',
    employer: '',
    yearsEmployed: '',
    monthlySalary: '25000-30000',
    relevance: 'very-relevant',
    postGraduateDegree: '',
  });

  const [originalData, setOriginalData] = useState<typeof formData | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const existing = await getTracerSurvey(alumniId);
        if (existing) {
          const fetchedData = {
            firstName: existing.first_name || '',
            lastName: existing.last_name || '',
            employmentStatus: existing.employment_status || 'employed',
            jobTitle: existing.job_title || '',
            employer: existing.employer || '',
            yearsEmployed: String(existing.years_employed ?? ''),
            monthlySalary: existing.monthly_salary || '25000-30000',
            relevance: existing.relevance || 'very-relevant',
            postGraduateDegree: existing.post_graduate_degree || '',
          };
          setFormData(fetchedData);
          setOriginalData(fetchedData);
          setLastUpdated(existing.updated_at);
          setIsNew(false);
          setIsEditing(false);
        } else {
          setIsNew(true);
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Failed to load existing survey:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [alumniId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 15;
        });
      }, 100);
    } else if (selected) {
      alert('Please select an image file (JPG, PNG).');
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const initiateSubmit = () => {
    const payload = {
      alumni_id: alumniId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      employment_status: formData.employmentStatus,
      job_title: formData.jobTitle,
      employer: formData.employer,
      years_employed: Number(formData.yearsEmployed) || 0,
      monthly_salary: formData.monthlySalary,
      relevance: formData.relevance,
      post_graduate_degree: formData.postGraduateDegree,
    };

    const validationErrors = validateTracerSurvey(payload);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    setShowConfirmModal(true);
  };

  const handleConfirmedSave = async () => {
    setSaving(true);
    const payload = {
      alumni_id: alumniId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      employment_status: formData.employmentStatus,
      job_title: formData.jobTitle,
      employer: formData.employer,
      years_employed: Number(formData.yearsEmployed) || 0,
      monthly_salary: formData.monthlySalary,
      relevance: formData.relevance,
      post_graduate_degree: formData.postGraduateDegree,
    };

    try {
      if (isNew) {
        await saveTracerSurvey(payload);
      } else {
        await updateTracerSurvey(alumniId, payload);
      }

      setLastUpdated(new Date().toISOString());
      setOriginalData(formData);
      setIsNew(false);
      setIsEditing(false);
      setShowConfirmModal(false);

      setFeedbackModal({
        open: true,
        type: 'success',
        title: 'Survey Recorded Successfully',
        message: 'Your employment and career details have been synchronized with the College Dean registry.',
      });
    } catch (err: any) {
      setShowConfirmModal(false);
      setFeedbackModal({
        open: true,
        type: 'error',
        title: 'Submission Error',
        message: err?.message || 'Could not save survey response. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-800">Retrieving Graduate Tracer Profile</p>
        <p className="text-xs text-gray-400 mt-1">Connecting to institutional records...</p>
      </div>
    );
  }

  const isEmployedType = formData.employmentStatus === 'employed';

  const handleCancelEdit = () => {
    if (originalData) setFormData(originalData);
    setIsEditing(false);
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#1E3A8A]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Institutional Graduate Tracer
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Accreditation & CHED Compliance Career Tracking System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Update Information
            </button>
          ) : !isNew && isEditing ? (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      {!isNew && !isEditing && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Tracer Profile is Active</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Last updated on{' '}
                <span className="font-semibold">
                  {lastUpdated
                    ? new Date(lastUpdated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Recent Session'}
                </span>
                . Your responses are officially counted in college analytics.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full w-fit">
            Verified Record
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <X className="w-4 h-4 text-rose-600" /> Missing Required Fields:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Professional & Employment Profile
          </span>
          <span className="text-xs text-gray-400">Alumni ID: {alumniId}</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                STATUS <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="not-tracked">Not tracked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                POST GRADUATE DEGREE
              </label>
              <input
                type="text"
                placeholder="e.g. Master's in Education, PhD, None"
                value={formData.postGraduateDegree}
                onChange={(e) => setFormData({ ...formData, postGraduateDegree: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                NAME OF COMPANY / TYPE OF BUSINESS {isEmployedType && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="Company / Institution Name"
                value={formData.employer}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                disabled={!isEditing || !isEmployedType}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                MEDIAN/AVERAGE SALARY (Monthly)
              </label>
              <select
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                disabled={!isEditing || !isEmployedType}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="below-20000">Below ₱20,000</option>
                <option value="20000-25000">₱20,000 – ₱25,000</option>
                <option value="25000-30000">₱25,000 – ₱30,000</option>
                <option value="30000-40000">₱30,000 – ₱40,000</option>
                <option value="above-40000">Above ₱40,000</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Degree Alignment & Relevance
              </label>
              <select
                value={formData.relevance}
                onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="very-relevant">Directly Relevant (Education / Teaching Field)</option>
                <option value="relevant">Relevant (Related Discipline or Instructional Role)</option>
                <option value="somewhat-relevant">Somewhat Relevant (General Skills Applied)</option>
                <option value="not-relevant">Not Relevant (Different Industry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Designation / Position Title {isEmployedType && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Master Teacher I, Secondary Math Teacher"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                disabled={!isEditing || !isEmployedType}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm">
                5
              </span> 
              EVIDENCES & SUPPORTING DOCUMENTS
            </h3>
            
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative mb-4">
              <input 
                type="file" 
                accept="image/jpeg, image/png" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                disabled={!isEditing} 
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <p className="text-sm text-gray-700 font-medium">Click to attach files or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">Image only (Company ID or COE, JPG, PNG) up to 15MB each</p>
            </div>

            {file && (
              <div className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-xl p-4 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">{file.name}</div>
                    <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  {uploadProgress < 100 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-medium animate-pulse">Uploading...</span>
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-blue-600 transition-all duration-300 ease-out"
                            strokeDasharray={`${uploadProgress}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[9px] font-bold text-gray-700">{uploadProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setShowPreview(true)} 
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      {isEditing && (
                        <button 
                          type="button" 
                          onClick={removeFile} 
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-100 mt-6">
              {!isNew && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Discard Changes
                </button>
              )}
              <button
                type="button"
                onClick={initiateSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {isNew ? 'Submit Survey Response' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showPreview && previewUrl && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-2 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Document Preview</h3>
              <button 
                onClick={() => setShowPreview(false)} 
                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-50/50 rounded-b-xl overflow-auto max-h-[75vh]">
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto object-contain rounded shadow-sm" />
            </div>
          </div>
        </div>,
        document.body
      )}

      {showConfirmModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto mb-3.5">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">Confirm Tracer Submission</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              You are about to save your employment details under{' '}
              <span className="font-semibold text-gray-800">
                {formData.jobTitle || formData.employmentStatus}
              </span>{' '}
              at{' '}
              <span className="font-semibold text-gray-800">
                {formData.employer || 'Self / N/A'}
              </span>
              . This information will be aggregated in the Dean's accreditation report.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleConfirmedSave}
                disabled={saving}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-all shadow-md inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Save'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {feedbackModal.open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
                feedbackModal.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {feedbackModal.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <X className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">{feedbackModal.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">{feedbackModal.message}</p>

            <button
              type="button"
              onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl transition-colors shadow-md"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== ALUMNI CALENDAR ======================
const CALENDAR_API_URL = 'http://localhost:5000/api/calendar-events';

interface BackendCalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  event_type: 'meeting' | 'activity' | 'deadline' | 'holiday' | 'exam' | string;
  audience?: string;
  location?: string | null;
  department_ids?: string[] | null;
  posted_by_role?: string | null;
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  meeting: '#3B82F6',
  activity: '#10B981',
  holiday: '#8B5CF6',
  deadline: '#F59E0B',
  exam: '#EF4444',
};
const DEFAULT_ALUMNI_EVENT_COLOR = '#1E3A8A';

const ROLE_DISPLAY_LABEL_ALUMNI: Record<string, string> = {
  dean: 'Dean',
  admin: 'Admin',
  college_dean: 'Dean',
  department_chair: 'Dept. Chair',
  faculty: 'Faculty',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function colorForAlumniEvent(ev: BackendCalendarEvent): string {
  const t = ev.event_type?.toLowerCase() || '';
  return EVENT_TYPE_COLOR[t] || DEFAULT_ALUMNI_EVENT_COLOR;
}

function dateOnlyAlumni(isoLike: string): string {
  if (!isoLike) return '';
  return isoLike.split('T')[0];
}

function formatSingleTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hoursNum = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hoursNum)) return timeStr;
  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const hours12 = hoursNum % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

function formatEventTimeRange(start?: string | null, end?: string | null): string {
  const s = formatSingleTime(start);
  const e = formatSingleTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return 'Time not specified';
}

function sortEventsChronologically(a: BackendCalendarEvent, b: BackendCalendarEvent): number {
  const dateComp = a.event_date.localeCompare(b.event_date);
  if (dateComp !== 0) return dateComp;
  const timeA = a.start_time;
  const timeB = b.start_time;
  if (timeA && !timeB) return -1;
  if (!timeA && timeB) return 1;
  if (!timeA && !timeB) return a.title.localeCompare(b.title);
  return (timeA ?? '').localeCompare(timeB ?? '');
}

function isAlumniAuthorizedEvent(ev: BackendCalendarEvent): boolean {
  if (!ev.audience) return true;
  const aud = ev.audience.trim().toLowerCase();
  return ['all', 'everyone', 'alumni'].includes(aud);
}

function AlumniCalendar() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [events, setEvents] = useState<BackendCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BackendCalendarEvent | null>(null);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(CALENDAR_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const alumniOnly = (Array.isArray(data) ? data : []).filter(isAlumniAuthorizedEvent);
        setEvents(alumniOnly);
      } else {
        setLoadError('Failed to load alumni events.');
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setLoadError('Could not connect to the calendar server. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();

    const channel = supabase
      .channel('alumni-calendar-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => fetchCalendarEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const jumpToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(todayStr);
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, BackendCalendarEvent[]>();
    const sorted = [...events].sort(sortEventsChronologically);
    sorted.forEach((ev) => {
      const d = dateOnlyAlumni(ev.event_date);
      if (!d) return;
      const current = map.get(d) || [];
      current.push(ev);
      map.set(d, current);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate.get(dateStr) || [];
  };

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => dateOnlyAlumni(e.event_date) >= todayStr)
      .sort(sortEventsChronologically);
  }, [events, todayStr]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
          Alumni Calendar & Activities
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Keep track of college alumni homecomings, seminars, mentorship schedules, and institutional events.
        </p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/40 gap-3">
            <div className="flex items-center gap-2">
              <select
                aria-label="Select month"
                value={currentMonth.getMonth()}
                onChange={(e) =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value, 10), 1))
                }
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                aria-label="Select year"
                value={currentMonth.getFullYear()}
                onChange={(e) =>
                  setCurrentMonth(new Date(parseInt(e.target.value, 10), currentMonth.getMonth(), 1))
                }
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                {Array.from({ length: 9 }, (_, i) => today.getFullYear() - 4 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                onClick={jumpToToday}
                className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 text-gray-600 transition-all"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/20">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{DAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading events…</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-50 bg-gray-50/30"
                />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayIndexInWeek = (firstDay + day - 1) % 7;
                const isRightmostCol = dayIndexInWeek >= 5;
                const dateStr = `${currentMonth.getFullYear()}-${String(
                  currentMonth.getMonth() + 1
                ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const dayEvents = getEventsForDay(day);
                const hasEvents = dayEvents.length > 0;
                const isTodayDate = dateStr === todayStr;
                const isPast = dateStr < todayStr;
                const isSelected = selectedCalendarDate === dateStr;
                const isHovered = hoveredDate === dateStr;
                const showPopover = (isHovered || isSelected) && hasEvents;

                return (
                  <div
                    key={day}
                    tabIndex={hasEvents ? 0 : -1}
                    aria-label={`${formatDate(dateStr)}${hasEvents ? `, ${dayEvents.length} events` : ''}`}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onClick={() => {
                      if (!isPast) {
                        setSelectedCalendarDate((prev) => (prev === dateStr ? null : dateStr));
                      }
                    }}
                    className={`relative min-h-[72px] sm:min-h-[96px] border-b border-r border-gray-100 p-1.5 sm:p-2 transition-colors outline-none ${
                      isPast
                        ? 'bg-gray-100/70 text-gray-400 cursor-not-allowed select-none'
                        : 'cursor-pointer hover:bg-blue-50/20'
                    } ${
                      isSelected && !isPast
                        ? 'bg-blue-50/50 ring-2 ring-[#1E3A8A] ring-inset z-20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-transform ${
                          isTodayDate
                            ? 'bg-[#1E3A8A] text-white shadow-xs'
                            : isPast
                            ? 'text-gray-400 bg-gray-200/50'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>

                      {hasEvents && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${isPast ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-[#1E3A8A]'}`}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:flex flex-col gap-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`text-left text-[10px] leading-tight font-medium px-1.5 py-0.5 rounded truncate text-white shadow-2xs transition-all ${isPast ? 'opacity-70 bg-gray-400 cursor-pointer' : 'hover:brightness-110'}`}
                          style={{ backgroundColor: isPast ? '#9CA3AF' : colorForAlumniEvent(ev) }}
                          title={ev.title}
                        >
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] font-semibold text-gray-400 px-1">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>

                    {hasEvents && (
                      <div className="sm:hidden flex gap-1 flex-wrap px-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isPast ? '#9CA3AF' : colorForAlumniEvent(ev) }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                    )}

                    {showPopover && (
                      <div
                        role="tooltip"
                        className={`absolute bottom-full mb-2 z-50 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 text-left transition-all animate-in fade-in zoom-in-95 ${
                          isRightmostCol ? 'right-0' : 'left-0'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-900">
                            {formatLongDate(dateStr)} {isPast && '(Past)'}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                          {dayEvents.map((ev) => {
                            const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50/40 border-l-[3px] space-y-1 cursor-pointer transition-colors"
                                style={{ borderLeftColor: isPast ? '#9CA3AF' : colorForAlumniEvent(ev) }}
                              >
                                <div className="text-xs font-semibold text-gray-900 leading-snug">
                                  {ev.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                  <span className="font-medium text-gray-700">
                                    {timeRangeStr}
                                  </span>
                                  {ev.event_type && (
                                    <span className="uppercase text-[9px] font-bold text-gray-600">
                                      {ev.event_type}
                                    </span>
                                  )}
                                </div>
                                {ev.location && (
                                  <p className="text-[11px] text-gray-500 truncate">
                                    📍 {ev.location}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Upcoming Activities</h2>
            <span className="px-2 py-0.5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-full">
              {upcomingEvents.length}
            </span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p className="text-xs font-medium">No upcoming events scheduled</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {upcomingEvents.map((ev) => {
                const evDate = dateOnlyAlumni(ev.event_date);
                const isDueToday = evDate === todayStr;
                const timeRangeStr = formatEventTimeRange(ev.start_time, ev.end_time);

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50/60 transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">
                        {ev.title}
                      </span>
                      {isDueToday ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
                          Today
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                          {formatDate(evDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">
                        {timeRangeStr}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colorForAlumniEvent(ev) }}
                      />
                      <span className="truncate capitalize">{ev.event_type || 'Activity'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="min-w-0">
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 capitalize"
                  style={{
                    backgroundColor: `${colorForAlumniEvent(selectedEvent)}15`,
                    color: colorForAlumniEvent(selectedEvent),
                  }}
                >
                  {selectedEvent.event_type || 'Activity'}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Scheduled for {formatLongDate(dateOnlyAlumni(selectedEvent.event_date))}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Time</p>
                <p className="text-sm text-gray-700">
                  {formatEventTimeRange(selectedEvent.start_time, selectedEvent.end_time)}
                </p>
              </div>

              {selectedEvent.location && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                  <p className="text-sm text-gray-700">{selectedEvent.location}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Posted By</p>
                <p className="text-sm text-gray-700">
                  {ROLE_DISPLAY_LABEL_ALUMNI[selectedEvent.posted_by_role ?? ''] ??
                    selectedEvent.posted_by_role ??
                    'College Administration'}
                </p>
              </div>

              {selectedEvent.description && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== DOCUMENTS & RESOURCES (ALUMNI) ======================
function DocumentsResources() {
  return <AcademicDocumentsViewer />;
}

// ====================== INQUIRY / CONTACT (SIDE-BY-SIDE FIXED CARDS) ======================
const INQUIRY_CATEGORIES = [
  'Documents',
  'Employment',
  'Alumni Records',
  'Events',
  'System',
  'Account',
  'Suggestion',
  'Other',
];

interface AlumniInquiryRow {
  id: string;
  subject: string;
  category: string | null;
  message: string;
  reply: string | null;
  status: 'pending' | 'answered';
  created_at: string;
  replied_at: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string) {
  return status === 'answered'
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700';
}

function AlumniInquiry() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<AlumniInquiryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<AlumniInquiryRow | null>(null);

  // Tab state for history card: 'all' vs 'answered'
  const [historyTab, setHistoryTab] = useState<'all' | 'answered'>('all');

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setHistoryError('Your session looks outdated. Please log out and log in again.');
        return;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('id, subject, category, message, reply, status, created_at, replied_at')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as AlumniInquiryRow[]) ?? []);
    } catch (err) {
      setHistoryError('Failed to load inquiry history.');
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const channelName = `alumni-inquiries-channel-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => loadHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setSubmitMessage({ type: 'error', text: 'Your session looks outdated. Please log out and log in again.' });
        return;
      }

      const { data: profileData } = await supabase
        .from('alumni_profiles')
        .select('full_name')
        .eq('user_id', currentUserId)
        .single();

      const { error } = await supabase.from('inquiries').insert({
        sender_id: currentUserId,
        sender_name: profileData?.full_name ?? localStorage.getItem('userFullName') ?? 'Alumni',
        sender_role: 'alumni',
        subject: subject.trim(),
        category,
        message: message.trim(),
        status: 'pending',
        student_id: currentUserId,
      });

      if (error) throw error;

      setSubmitMessage({ type: 'success', text: 'Your inquiry has been submitted successfully! We will contact you soon.' });
      setSubject('');
      setCategory(INQUIRY_CATEGORIES[0]);
      setMessage('');
      await loadHistory();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit your inquiry. Please try again.' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const removeInquiry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this inquiry from your history?')) return;
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (error) throw error;
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('Could not delete inquiry.');
    }
  };

  const allHistory = history;
  const answeredHistory = history.filter((item) => item.status === 'answered');
  const displayedHistory = historyTab === 'all' ? allHistory : answeredHistory;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      {/* Side-by-Side Fixed Height Cards with Drop Shadow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Card: Submit Inquiry Form (Fixed Height: 600px) */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-7 h-[600px] flex flex-col justify-between border border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Submit a Concern or Question</h2>
            <p className="text-xs text-gray-500 mb-4">Send your inquiries directly to the College Dean and administrative staff.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Transcript Request"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    required
                  >
                    {INQUIRY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide complete details regarding your concern..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  required
                />
              </div>

              {submitMessage && (
                <p className={`text-xs font-medium ${submitMessage.type === 'success' ? 'text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200' : 'text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200'}`}>
                  {submitMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Card: Inquiry History with Tabs (Fixed Height: 600px) */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 flex flex-col h-[600px] border border-gray-100">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" /> History
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setHistoryTab('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    historyTab === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({allHistory.length})
                </button>
                <button
                  onClick={() => setHistoryTab('answered')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    historyTab === 'answered' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Answered ({answeredHistory.length})
                </button>
              </div>
              <button onClick={loadHistory} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {historyLoading ? (
              <div className="space-y-3 animate-pulse pt-4">
                <div className="h-20 bg-gray-100 rounded-lg" />
                <div className="h-20 bg-gray-100 rounded-lg" />
              </div>
            ) : historyError ? (
              <p className="text-sm text-red-600 pt-4">{historyError}</p>
            ) : displayedHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{historyTab === 'all' ? 'No inquiries submitted yet.' : 'No answered inquiries found.'}</p>
              </div>
            ) : (
              displayedHistory.map((inq) => (
                <div
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className={`group relative w-full text-left p-3.5 rounded-xl transition-all cursor-pointer shadow-2xs border ${
                    inq.status === 'answered' ? 'bg-emerald-50/30 hover:bg-emerald-50/60 border-emerald-100' : 'bg-gray-50 hover:bg-blue-50/30 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm truncate">{inq.subject}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusStyle(inq.status)}`}>
                          {inq.status === 'answered' ? 'Answered' : 'Pending'}
                        </span>
                      </div>
                      {inq.category && <div className="text-xs text-gray-500">{inq.category} • {formatDate(inq.created_at)}</div>}
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{inq.message}</div>
                      {inq.status === 'answered' && inq.reply && (
                        <div className="text-xs text-emerald-900 bg-emerald-100/60 p-2 rounded-lg mt-2 line-clamp-2">
                          <span className="font-semibold">Dean's Reply:</span> {inq.reply}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => removeInquiry(inq.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                      title="Remove from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedInquiry && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="min-w-0">
                {selectedInquiry.category && (
                  <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mb-2">
                    {selectedInquiry.category}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedInquiry.subject}</h3>
                <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(selectedInquiry.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Your Message</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                {selectedInquiry.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    Awaiting reply from the Dean
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Answered
                  </span>
                )}
              </div>
              {selectedInquiry.reply && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Dean's Reply</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedInquiry.reply}</p>
                  {selectedInquiry.replied_at && (
                    <p className="text-xs text-blue-400 mt-2">{formatDate(selectedInquiry.replied_at)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====================== ALUMNI ACHIEVEMENTS ======================
interface AwardItem {
  id: string;
  title: string;
  org: string;
  year: string;
}

interface ResearchHighlightItem {
  id: string;
  title: string;
  detail: string;
}

function AlumniAchievements() {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [researchHighlights, setResearchHighlights] = useState<ResearchHighlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievementsData() {
      try {
        const userId = localStorage.getItem('userId');
        
        const { data: awardData } = await supabase
          .from('alumni_awards')
          .select('*')
          .eq('alumni_id', userId || '');

        const { data: researchData } = await supabase
          .from('alumni_student_research')
          .select('*')
          .eq('alumni_id', userId || '');

        if (awardData && awardData.length > 0) {
          setAwards(awardData.map((a: any) => ({
            id: a.id,
            title: a.title,
            org: a.org || a.awarding_body,
            year: a.year,
          })));
        } else {
          setAwards([
            { id: 'a1', title: 'Dean\'s Lister Academic Excellence', org: 'College of Education', year: '2024' },
            { id: 'a2', title: 'Outstanding Student Teacher Recognition', org: 'Practicum Department', year: '2025' },
          ]);
        }

        if (researchData && researchData.length > 0) {
          setResearchHighlights(researchData.map((r: any) => ({
            id: r.id,
            title: r.title,
            detail: r.detail || r.description,
          })));
        } else {
          setResearchHighlights([
            { id: 'r1', title: 'Undergraduate Research: Interactive Pedagogies in STEM', detail: 'Published in institutional journal repository.' },
            { id: 'r2', title: 'Community Extension Literacy Program Contributor', detail: 'Completed 120 hours of fieldwork.' },
          ]);
        }
      } catch (err) {
        console.error('Failed to load dynamic achievements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievementsData();
  }, []);

  const rowColors = ['bg-yellow-50 border-yellow-500', 'bg-blue-50 border-blue-500', 'bg-purple-50 border-purple-500', 'bg-green-50 border-green-500'];

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading achievements and records...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">College Achievements & Highlights</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Alumna / Student Awards</h2>
          </div>

          <div className="space-y-3">
            {awards.map((award, i) => {
              const [bg, border] = rowColors[i % rowColors.length].split(' ');
              return (
                <div key={award.id} className={`group p-4 ${bg} border-l-4 ${border} rounded-lg`}>
                  <div className="flex items-start gap-3">
                    <Award className={`w-5 h-5 mt-1 flex-shrink-0 ${border.replace('border-', 'text-')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{award.title}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{award.org}{award.year ? ` - ${award.year}` : ''}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Research & Student Highlights</h2>
          <div className="space-y-3">
            {researchHighlights.map((res) => (
              <div key={res.id} className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{res.title}</div>
                <div className="text-xs sm:text-sm text-gray-600">{res.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== SETTINGS ======================
interface AlumniSettingsProps {
  profile: { full_name: string; email: string } | null;
  userEmail: string;
  loading: boolean;
  onProfileUpdated: () => void;
  idNumber: string;
  onLogout?: () => void;
}

type AlumniSettingsTab =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'account';

function AlumniSettings({
  profile,
  userEmail,
  loading,
  onProfileUpdated,
  idNumber,
  onLogout,
}: AlumniSettingsProps) {
  const [activeTab, setActiveTab] =
    useState<AlumniSettingsTab>('profile');

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [announcementAlerts, setAnnouncementAlerts] =
    useState(true);

  const [fullNameInput, setFullNameInput] =
    useState('');

  const [emailInput, setEmailInput] =
    useState('');

  const [idNumberInput, setIdNumberInput] =
    useState('');

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  useEffect(() => {
    setFullNameInput(
      profile?.full_name ||
      localStorage.getItem('userFullName') ||
      ''
    );

    setEmailInput(
      profile?.email ||
      userEmail ||
      localStorage.getItem('userEmail') ||
      ''
    );

    setIdNumberInput(
      idNumber ||
      localStorage.getItem('userIdNumber') ||
      ''
    );
  }, [profile, userEmail, idNumber]);

  const saveProfile = async () => {
    const trimmedName = fullNameInput.trim();
    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedIdNumber = idNumberInput.trim();

    if (!trimmedName) {
      setSaveMessage({ type: 'error', text: 'Full name is required.' });
      return false;
    }

    if (!trimmedIdNumber) {
      setSaveMessage({ type: 'error', text: 'Alumni ID is required.' });
      return false;
    }

    if (!trimmedEmail) {
      setSaveMessage({ type: 'error', text: 'Email address is required.' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setSaveMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSaveMessage({ type: 'error', text: 'Your session has expired. Please log in again.' });
      return false;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: trimmedName,
            email: trimmedEmail,
            id_number: trimmedIdNumber,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update your profile.');
      }

      setFullNameInput(trimmedName);
      setEmailInput(trimmedEmail);
      setIdNumberInput(trimmedIdNumber);

      localStorage.setItem('userFullName', trimmedName);
      localStorage.setItem('userEmail', trimmedEmail);
      localStorage.setItem('userIdNumber', trimmedIdNumber);

      await onProfileUpdated();

      setSaveMessage({
        type: 'success',
        text: 'Personal information updated successfully.',
      });

      return true;
    } catch (error) {
      console.error('Alumni profile update failed:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update your personal information.',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordMessage('');
    setSaveMessage(null);

    if (!currentPassword) {
      setPasswordMessage('Current password is required.');
      return false;
    }

    if (!newPassword) {
      setPasswordMessage('New password is required.');
      return false;
    }

    if (!confirmPassword) {
      setPasswordMessage('Please confirm your new password.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirm password do not match.');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordMessage('Your new password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.');
      return false;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage('Your new password must be different from your current password.');
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setPasswordMessage('Your session has expired. Please log in again.');
      return false;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/password',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to change your password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('');

      setSaveMessage({
        type: 'success',
        text: 'Password changed successfully.',
      });

      return true;
    } catch (error) {
      console.error('Alumni password update failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to change your password.';
      setPasswordMessage(message);
      setSaveMessage({ type: 'error', text: message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (activeTab === 'profile') {
      await saveProfile();
      return;
    }

    if (activeTab === 'security') {
      await changePassword();
      return;
    }

    setSaveMessage({
      type: 'success',
      text: 'Settings saved successfully.',
    });
  };

  const tabs: {
    key: AlumniSettingsTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'profile',
      label: 'Profile Information',
      icon: <User className="w-4 h-4" />,
    },
    {
      key: 'security',
      label: 'Password & Security',
      icon: <Lock className="w-4 h-4" />,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
    },
    {
      key: 'account',
      label: 'Account Actions',
      icon: <LogOut className="w-4 h-4" />,
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account and system preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveChanges}
            disabled={saving || loading}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 text-sm rounded-xl border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <nav className="bg-white rounded-xl shadow-md p-3 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSaveMessage(null);
                setPasswordMessage('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 last:mb-0 transition-colors text-left ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 min-h-[520px]">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Update your personal details.
              </p>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          setSaveMessage(null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alumni ID
                      </label>
                      <input
                        type="text"
                        value={idNumberInput}
                        onChange={(e) => {
                          setIdNumberInput(e.target.value);
                          setSaveMessage(null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setSaveMessage(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Password & Security
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Keep your account secure.
              </p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Min 8 chars, Aa1@"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordMessage('');
                        setSaveMessage(null);
                      }}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div className="px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
                    {passwordMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose what you want to be notified about.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Receive email updates about your activities
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Announcement Alerts
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified about important announcements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementAlerts}
                      onChange={(e) => setAnnouncementAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Account Actions
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Manage your active session.
              </p>

              <div className="space-y-3 max-w-md">
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                >
                  Log Out from Account
                </button>
                <p className="text-xs text-gray-500 text-center">
                  This will sign you out from your session and return to the home page
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}