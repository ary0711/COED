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
  Download,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState, useEffect } from 'react';
import { getTracerSurvey, saveTracerSurvey, updateTracerSurvey, validateTracerSurvey, getDashboardStats } from '../../tracerSurvey';
import { getAlumniNews, getSingleNewsArticle, type AlumniNewsItem } from '../../alumniNews';
import { submitInquiry, getInquiryHistory, type InquiryItem } from '../../alumniInquiry';
import { getDocuments, downloadDocument, type DocumentItem } from '../../alumniDocuments';

const alumniMenuItems = [
  { icon: Bell,         label: 'Dashboard',              id: 'dashboard'   },
  { icon: FileText,     label: 'Graduate Tracer Survey',  id: 'tracer'      },
  { icon: Bell,         label: 'Alumni News',             id: 'news'        },
  { icon: BookOpen,     label: 'College Information',     id: 'college-info'},
  { icon: Award,        label: 'Achievements',            id: 'achievements'},
  { icon: FileText,     label: 'Documents & Resources',   id: 'documents'   },
  { icon: MessageSquare,label: 'Inquiry / Contact',       id: 'inquiry'     },
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
  onRoleChange,
  onLogout,
  userName,
  idNumber,
}: AlumniDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-transparent">

      {/* ── Sidebar — slide-in on mobile, fixed on desktop ── */}
      <Sidebar
        menuItems={alumniMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Alumni"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Desktop spacer so content clears the fixed sidebar ── */}
      <div className="hidden lg:block w-64 shrink-0" />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 lg:px-0">
            {/* Hamburger — mobile only */}
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
                userName="Maria Gabriela Santos"
              />
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard'    && <AlumniDashboardView setActiveMenuItem={setActiveMenuItem} alumniId={idNumber || 'ALU-2020-0458'} />}
          {activeMenuItem === 'tracer'       && <TracerSurvey alumniId={idNumber || 'ALU-2020-0458'} />}
          {activeMenuItem === 'news'         && <AlumniNews />}
          {activeMenuItem === 'college-info' && <CollegeInformation />}
          {activeMenuItem === 'achievements' && <AlumniAchievements />}
          {activeMenuItem === 'documents'    && <DocumentsResources />}
          {activeMenuItem === 'inquiry'      && <AlumniInquiry alumniId={idNumber || 'ALU-2020-0458'} />}
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
  const [stats, setStats] = useState({
    surveyStatus: 'Not Started',
    employmentStatus: 'Not Set',
    lastUpdated: null as string | null,
    membershipStatus: 'Active',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats(alumniId);
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [alumniId]);

  return (
    <div>
      


      {/* Tracer Status */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.surveyStatus}
          </div>
          <div className="text-xs text-gray-600">Tracer Survey</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">
            {stats.lastUpdated
              ? `Last updated: ${new Date(stats.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'No data yet'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.employmentStatus}
          </div>
          <div className="text-xs text-gray-600">Employment</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">Full-time Teacher</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
          <div className="text-sm sm:text-2xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.membershipStatus}
          </div>
          <div className="text-xs text-gray-600">Alumni Status</div>
          <div className="hidden sm:block text-xs text-gray-500 mt-2">Member since 2020</div>
        </div>
      </div>

      {/* Announcements & Achivements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Announcements
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Alumni Homecoming 2026</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">March 30, 2026 • College Grounds</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="font-medium text-gray-900 text-sm sm:text-base">Career Mentorship Program</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Now accepting applications</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveMenuItem('achievements')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 text-sm sm:text-base">Recent Awards</div>
              <div className="text-xs sm:text-sm text-gray-600">See the college's latest honors and recognitions</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('achievements')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 text-sm sm:text-base">Research Highlights</div>
              <div className="text-xs sm:text-sm text-gray-600">Explore recent publications and partnerships</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== TRACER SURVEY ======================
function TracerSurvey({ alumniId }: { alumniId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [formData, setFormData] = useState({
    employmentStatus: 'employed',
    jobTitle: '',
    employer: '',
    yearsEmployed: '',
    monthlySalary: '25000-30000',
    relevance: 'very-relevant',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const existing = await getTracerSurvey(alumniId);
      if (existing) {
        setFormData({
          employmentStatus: existing.employment_status,
          jobTitle: existing.job_title || '',
          employer: existing.employer || '',
          yearsEmployed: String(existing.years_employed ?? ''),
          monthlySalary: existing.monthly_salary || '25000-30000',
          relevance: existing.relevance || 'very-relevant',
        });
        setLastUpdated(existing.updated_at);
        setIsNew(false);
        setIsEditing(false);
      } else {
        setIsNew(true);
        setIsEditing(true);
      }
      setLoading(false);
    })();
  }, [alumniId]);

  const handleSave = async () => {
    const payload = {
      alumni_id: alumniId,
      employment_status: formData.employmentStatus,
      job_title: formData.jobTitle,
      employer: formData.employer,
      years_employed: Number(formData.yearsEmployed) || 0,
      monthly_salary: formData.monthlySalary,
      relevance: formData.relevance,
    };

    const validationErrors = validateTracerSurvey(payload);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    try {
      if (isNew) {
        await saveTracerSurvey(payload);
      } else {
        await updateTracerSurvey(alumniId, payload);
      }
      setLastUpdated(new Date().toISOString());
      setIsNew(false);
      setIsEditing(false);
      alert('✅ Tracer information updated successfully!');
    } catch (err) {
      alert('❌ Error saving survey. Check console for details.');
      console.error(err);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading survey...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Graduate Tracer Survey</h1>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Tracer Information</h2>
            {lastUpdated && (
              <p className="text-xs sm:text-sm text-gray-600">
                Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
          {!isNew && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-fit"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Information'}
            </button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {errors.map((err) => <p key={err}>{err}</p>)}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed but looking</option>
                <option value="further-study">Pursuing further studies</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title / Position</label>
              <input type="text" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employer / Company</label>
              <input type="text" value={formData.employer} onChange={(e) => setFormData({ ...formData, employer: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years in Current Position</label>
              <input type="number" value={formData.yearsEmployed} onChange={(e) => setFormData({ ...formData, yearsEmployed: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary Range</label>
              <select value={formData.monthlySalary} onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm">
                <option value="below-20000">Below ₱20,000</option>
                <option value="20000-25000">₱20,000 - ₱25,000</option>
                <option value="25000-30000">₱25,000 - ₱30,000</option>
                <option value="30000-40000">₱30,000 - ₱40,000</option>
                <option value="above-40000">Above ₱40,000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Relevance to Degree</label>
              <select value={formData.relevance} onChange={(e) => setFormData({ ...formData, relevance: e.target.value })} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm">
                <option value="very-relevant">Very Relevant</option>
                <option value="relevant">Relevant</option>
                <option value="somewhat-relevant">Somewhat Relevant</option>
                <option value="not-relevant">Not Relevant</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">{isNew ? 'Save' : 'Save Changes'}</button>
               {!isNew && (
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">Cancel</button>
              )}
            </div>
          )}
        </div>
      </div>

      {!isNew && !isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Survey Completed</h3>
              <p className="text-xs sm:text-sm text-gray-700">
                Thank you for keeping your information updated. Your responses help us improve our programs and track alumni success.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== ALUMNI NEWS ======================
function AlumniNews() {
  const [news, setNews] = useState<AlumniNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<AlumniNewsItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAlumniNews();
        setNews(data);
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReadMore = async (newsId: string) => {
    try {
      const article = await getSingleNewsArticle(newsId);
      setSelectedArticle(article);
    } catch (err) {
      console.error('Failed to load article:', err);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading news...</p>;
  }

  if (selectedArticle) {
    return (
      <div>
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
        >
          ← Back to News
        </button>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {selectedArticle.image_url && (
            <div className="w-full h-64 bg-gray-200">
              <img src={selectedArticle.image_url} alt={selectedArticle.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="text-sm text-blue-600 font-medium mb-2">
              {new Date(selectedArticle.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">{selectedArticle.title}</h1>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {selectedArticle.content || selectedArticle.excerpt}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Alumni News</h1>
      {news.length === 0 ? (
        <p className="text-gray-600">No news articles yet.</p>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {news.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                {item.image_url && (
                  <div className="w-full md:w-64 h-48 bg-gray-200 flex-shrink-0">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 sm:p-6 flex-1">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium mb-2">
                    {new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{item.title}</h2>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{item.excerpt}</p>
                  <button onClick={() => handleReadMore(item.id)} className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
                    Read More →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== DOCUMENTS & RESOURCES ======================
function DocumentsResources() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(documents.map((d) => d.category)))];
  const filtered = activeCategory === 'All' ? documents : documents.filter((d) => d.category === activeCategory);

  const categoryColor: Record<string, string> = {
    Directory: 'bg-blue-100 text-blue-700',
    Guide: 'bg-purple-100 text-purple-700',
    Policy: 'bg-orange-100 text-orange-700',
    Form: 'bg-green-100 text-green-700',
  };

  const handleDownload = (doc: DocumentItem) => {
    downloadDocument(doc.file_url, doc.name);
  };

  if (loading) {
    return <p className="text-gray-600">Loading documents...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Documents & Resources</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
           className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
              activeCategory === c
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 '
            }`}     
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-5 text-gray-600 text-sm">No documents available.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[doc.category] || 'bg-gray-100 text-gray-700'}`}>
                        {doc.category}
                      </span>
                      {doc.size_label && <span className="text-xs text-gray-400">{doc.size_label}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Download size={14} /> <span className="hidden xs:inline sm:inline">Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== INQUIRY ======================
const INQUIRY_CATEGORIES = [
  'Transcript Request',
  'Certificate Request',
  'Alumni Card',
  'Event Inquiry',
  'Other',
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string) {
  if (status === 'Resolved') return 'bg-green-100 text-green-700';
  if (status === 'Ongoing') return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700'; // Pending
}

function AlumniInquiry({ alumniId }: { alumniId: string }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<InquiryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await getInquiryHistory(alumniId);
      setHistory(data);
    } catch (err) {
      setHistoryError('Failed to load inquiry history.');
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [alumniId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await submitInquiry({ alumni_id: alumniId, subject, category, message });
      setSubmitMessage({ type: 'success', text: '✅ Your inquiry has been submitted successfully! We will contact you soon.' });
      setSubject('');
      setCategory(INQUIRY_CATEGORIES[0]);
      setMessage('');
      await loadHistory();
    } catch (err) {
      setSubmitMessage({ type: 'error', text: '❌ Error submitting inquiry. Please try again.' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Submit a Concern or Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              required
            >
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              required
            />
          </div>

          {submitMessage && (
            <p className={`text-sm ${submitMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {submitMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      {/* ── Inquiry History ── */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> My Inquiry History
        </h2>

        {historyLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-lg" />
            <div className="h-16 bg-gray-100 rounded-lg" />
          </div>
        ) : historyError ? (
          <p className="text-sm text-red-600">{historyError}</p>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">You haven't submitted any inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {history.map((inq) => (
              <div key={inq.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{inq.subject}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">{inq.category}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{inq.message}</div>
                    <div className="text-xs text-gray-400 mt-2">{formatDate(inq.created_at)}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${getStatusStyle(inq.status)}`}>
                    {inq.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ====================== COLLEGE INFORMATION ======================
function CollegeInformation() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">College Information</h1>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">About COED</h2>
        <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
          The College of Education has been at the forefront of teacher education and professional development for over 32 years.
          Our commitment to excellence has produced thousands of passionate educators who are making a difference in classrooms across the nation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">32+</div>
            <div className="text-xs sm:text-sm text-gray-600">Years of Excellence</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">5,000+</div>
            <div className="text-xs sm:text-sm text-gray-600">Alumni Graduates</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">98%</div>
            <div className="text-xs sm:text-sm text-gray-600">Employment Rate</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Current Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Elementary Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BEEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Secondary Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BSEd (English, Math, Science, Social Studies)</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Special Education</h3>
            <p className="text-xs sm:text-sm text-gray-600">BSNEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Educational Leadership</h3>
            <p className="text-xs sm:text-sm text-gray-600">Master's, PhD Programs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== ALUMNI ACHIEVEMENTS ======================
function AlumniAchievements() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">College Achievements</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Awards</h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Excellence in Teacher Education Award</div>
                  <div className="text-xs sm:text-sm text-gray-600">National Commission - 2025</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Level III Accreditation Status</div>
                  <div className="text-xs sm:text-sm text-gray-600">AACCUP - 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Research Highlights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">285 Publications</div>
              <div className="text-xs sm:text-sm text-gray-600">Since 2020</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1 text-sm sm:text-base">International Partnerships</div>
              <div className="text-xs sm:text-sm text-gray-600">5 countries collaboration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


