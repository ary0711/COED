import { 
  User, 
  FileText, 
  Award, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  CheckCircle 
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState } from 'react';

const alumniMenuItems = [
  { icon: Bell, label: 'Dashboard', id: 'dashboard' },
  { icon: FileText, label: 'Graduate Tracer Survey', id: 'tracer' },
  { icon: Bell, label: 'Alumni News', id: 'news' },
  { icon: BookOpen, label: 'College Information', id: 'college-info' },
  { icon: Award, label: 'Achievements', id: 'achievements' },
  { icon: FileText, label: 'Documents & Resources', id: 'documents' },
  { icon: MessageSquare, label: 'Inquiry / Contact', id: 'inquiry' },
];

interface AlumniDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function AlumniDashboard({ activeMenuItem, setActiveMenuItem }: AlumniDashboardProps) {
  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <Sidebar
        menuItems={alumniMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Alumni"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Alumni"
          userName="Maria Gabriela Santos"
        />

        <main className="p-6 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <AlumniDashboardView setActiveMenuItem={setActiveMenuItem} />}
          {activeMenuItem === 'tracer' && <TracerSurvey />}
          {activeMenuItem === 'news' && <AlumniNews />}
          {activeMenuItem === 'college-info' && <CollegeInformation />}
          {activeMenuItem === 'achievements' && <AlumniAchievements />}
          {activeMenuItem === 'documents' && <DocumentsResources />}
          {activeMenuItem === 'inquiry' && <AlumniInquiry />}
        </main>
      </div>
    </div>
  );
}

// ====================== FUNCTIONAL DASHBOARD VIEW ======================
function AlumniDashboardView({ setActiveMenuItem }: { setActiveMenuItem: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Alumni Dashboard</h1>
        <p className="text-gray-600">Welcome back, Maria Gabriela Santos</p>
      </div>

      {/* Alumni Profile Card */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Maria Gabriela Santos</h2>
            <p className="text-blue-100 mb-1">Alumni ID: ALU-2020-0458</p>
            <p className="text-blue-100">Bachelor of Elementary Education</p>
            <p className="text-blue-100">Graduated: May 2020</p>
            <p className="text-blue-100 mt-2">Current Position: Elementary School Teacher</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold mb-2">
              MS
            </div>
            <div className="text-sm text-blue-100">Class of 2020</div>
          </div>
        </div>
      </div>

      {/* Tracer Status */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Completed</div>
          <div className="text-sm text-gray-600">Tracer Survey Status</div>
          <div className="text-xs text-gray-500 mt-2">Last updated: Jan 15, 2026</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Employed</div>
          <div className="text-sm text-gray-600">Employment Status</div>
          <div className="text-xs text-gray-500 mt-2">Full-time Teacher</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Active</div>
          <div className="text-sm text-gray-600">Alumni Status</div>
          <div className="text-xs text-gray-500 mt-2">Member since 2020</div>
        </div>
      </div>

      {/* Announcements & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Announcements
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-medium text-gray-900">Alumni Homecoming 2026</div>
              <div className="text-sm text-gray-600 mt-1">March 30, 2026 • College Grounds</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="font-medium text-gray-900">Career Mentorship Program</div>
              <div className="text-sm text-gray-600 mt-1">Now accepting applications</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setActiveMenuItem('tracer')}
              className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">Update Tracer Information</div>
              <div className="text-sm text-gray-600">Keep your employment info current</div>
            </button>
            <button
              onClick={() => setActiveMenuItem('news')}
              className="w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">View Alumni News</div>
              <div className="text-sm text-gray-600">Latest updates and events</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== FUNCTIONAL TRACER SURVEY ======================
function TracerSurvey() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    employmentStatus: 'employed',
    jobTitle: 'Elementary School Teacher',
    employer: 'Metropolitan Elementary School',
    yearsEmployed: '4',
    monthlySalary: '25000-30000',
    relevance: 'very-relevant',
  });

  const handleSave = () => {
    alert("✅ Tracer information updated successfully!");
    setIsEditing(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Graduate Tracer Survey</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Tracer Information</h2>
            <p className="text-sm text-gray-600">Last updated: January 15, 2026</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Information'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed but looking</option>
                <option value="further-study">Pursuing further studies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title / Position</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employer / Company</label>
              <input
                type="text"
                value={formData.employer}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years in Current Position</label>
              <input
                type="number"
                value={formData.yearsEmployed}
                onChange={(e) => setFormData({ ...formData, yearsEmployed: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary Range</label>
              <select
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="below-20000">Below ₱20,000</option>
                <option value="20000-25000">₱20,000 - ₱25,000</option>
                <option value="25000-30000">₱25,000 - ₱30,000</option>
                <option value="30000-40000">₱30,000 - ₱40,000</option>
                <option value="above-40000">Above ₱40,000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Relevance to Degree</label>
              <select
                value={formData.relevance}
                onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="very-relevant">Very Relevant</option>
                <option value="relevant">Relevant</option>
                <option value="somewhat-relevant">Somewhat Relevant</option>
                <option value="not-relevant">Not Relevant</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Survey Completed</h3>
            <p className="text-sm text-gray-700">
              Thank you for keeping your information updated. Your responses help us improve our programs and track alumni success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== FUNCTIONAL ALUMNI NEWS ======================
function AlumniNews() {
  const handleReadMore = (title: string) => {
    alert(`📖 Opening full article: "${title}"`);
  };

  const news = [
    {
      id: 1,
      title: 'Alumni Homecoming 2026 Registration Now Open',
      date: 'February 10, 2026',
      excerpt: 'Join us for a memorable reunion with your batchmates and faculty. Early bird registration until March 1st.',
      image: 'https://images.unsplash.com/photo-1686213011376-d20df949af59?w=800',
    },
    {
      id: 2,
      title: 'Career Mentorship Program Launches',
      date: 'February 5, 2026',
      excerpt: 'Experienced alumni are invited to mentor current students. Share your expertise and give back to COED.',
      image: 'https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?w=800',
    },
    {
      id: 3,
      title: 'Alumni Spotlight: Maria Santos Named Principal of the Year',
      date: 'January 28, 2026',
      excerpt: 'Class of 2018 graduate recognized for outstanding leadership in education.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Alumni News</h1>
      <div className="space-y-6">
        {news.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="md:flex">
              <div className="md:w-64 h-48 bg-gray-200">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex-1">
                <div className="text-sm text-blue-600 font-medium mb-2">{item.date}</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h2>
                <p className="text-gray-600 mb-4">{item.excerpt}</p>
                <button 
                  onClick={() => handleReadMore(item.title)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Read More →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================== FUNCTIONAL DOCUMENTS & RESOURCES ======================
function DocumentsResources() {
  const handleDownload = (title: string) => {
    alert(`📥 Downloading: ${title}`);
  };

  const documents = [
    { title: 'Alumni Directory 2026', type: 'PDF', size: '3.2 MB' },
    { title: 'Career Development Guide', type: 'PDF', size: '2.8 MB' },
    { title: 'Alumni Benefits and Privileges', type: 'PDF', size: '1.5 MB' },
    { title: 'Transcript Request Form', type: 'PDF', size: '890 KB' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Documents & Resources</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Downloadable Resources</h2>
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{doc.title}</div>
                    <div className="text-sm text-gray-600">{doc.type} • {doc.size}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownload(doc.title)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================== FUNCTIONAL INQUIRY ======================
function AlumniInquiry() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✅ Your inquiry has been submitted successfully! We will contact you soon.");
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Inquiry / Contact</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Alumni Concern</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input type="text" placeholder="Enter subject" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option>Transcript Request</option>
              <option>Certificate Request</option>
              <option>Alumni Card</option>
              <option>Event Inquiry</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              rows={6}
              placeholder="Describe your concern"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  );
}

// ====================== REMAINING SECTIONS (UI unchanged) ======================
function CollegeInformation() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">College Information</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About COED</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          The College of Education has been at the forefront of teacher education and professional development for over 32 years. 
          Our commitment to excellence has produced thousands of passionate educators who are making a difference in classrooms across the nation.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">32+</div>
            <div className="text-sm text-gray-600">Years of Excellence</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">5,000+</div>
            <div className="text-sm text-gray-600">Alumni Graduates</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">98%</div>
            <div className="text-sm text-gray-600">Employment Rate</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Programs</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Elementary Education</h3>
            <p className="text-sm text-gray-600">BEEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Secondary Education</h3>
            <p className="text-sm text-gray-600">BSEd (English, Math, Science, Social Studies)</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Special Education</h3>
            <p className="text-sm text-gray-600">BSNEd, Master's Programs</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Educational Leadership</h3>
            <p className="text-sm text-gray-600">Master's, PhD Programs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlumniAchievements() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">College Achievements</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Awards</h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Excellence in Teacher Education Award</div>
                  <div className="text-sm text-gray-600">National Commission - 2025</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Level III Accreditation Status</div>
                  <div className="text-sm text-gray-600">AACCUP - 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Highlights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">285 Publications</div>
              <div className="text-sm text-gray-600">Since 2020</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">International Partnerships</div>
              <div className="text-sm text-gray-600">5 countries collaboration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}