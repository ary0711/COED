import { 
  User, 
  BookOpen, 
  Award, 
  FileText, 
  BarChart3, 
  Bell, 
  Calendar,
  Upload,
  Send 
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useState } from 'react';

const facultyMenuItems = [
  { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  { icon: User, label: 'My Profile', id: 'profile' },
  { icon: BookOpen, label: 'Teaching Load', id: 'teaching-load' },
  { icon: FileText, label: 'Research & Extension', id: 'research' },
  { icon: Award, label: 'Achievements', id: 'achievements' },
  { icon: FileText, label: 'Academic Records', id: 'records' },
  { icon: BarChart3, label: 'Evaluation Results', id: 'evaluation' },
  { icon: FileText, label: 'Reports', id: 'reports' },
];

interface FacultyDashboardProps {
  activeMenuItem: string;
  setActiveMenuItem: (id: string) => void;
}

export function FacultyDashboard({ activeMenuItem, setActiveMenuItem }: FacultyDashboardProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        menuItems={facultyMenuItems}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole="Faculty Member"
      />

      <div className="flex-1 ml-64">
        <DashboardHeader
          userRole="Faculty"
          userName="Prof. Sarah Johnson"
        />

        <main className="p-8 animate-in fade-in duration-500">
          {activeMenuItem === 'dashboard' && <FacultyDashboardView />}
          {activeMenuItem === 'profile' && <FacultyProfile />}
          {activeMenuItem === 'teaching-load' && <TeachingLoad />}
          {activeMenuItem === 'research' && <ResearchExtension />}
          {activeMenuItem === 'achievements' && <FacultyAchievements />}
          {activeMenuItem === 'records' && <AcademicRecordsView />}
          {activeMenuItem === 'evaluation' && <EvaluationResults />}
          {activeMenuItem === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

// ====================== UPDATED: PROFESSIONAL FORMAL REPORT GENERATOR ======================
function ReportsView() {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [period, setPeriod] = useState('');
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');

  const generateFormalReport = () => {
    if (!period.trim()) {
      alert("Please enter the Reporting Period before generating the report.");
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const facultyName = "Prof. Sarah Johnson";
    const department = "College of Education";

    const reportHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 60px 50px; line-height: 1.65; color: #1f2937; background: white;">
        <div style="text-align: center; margin-bottom: 70px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1E3A8A; margin: 0 0 12px 0;">
            ${reportType.toUpperCase()} REPORT
          </h1>
          <p style="font-size: 22px; margin: 8px 0; color: #374151;">${department}</p>
          <p style="font-size: 20px; margin: 15px 0; color: #1f2937;">${period}</p>
          <p style="font-size: 16px; margin: 35px 0 8px 0; color: #4b5563;">Prepared by: <strong>${facultyName}</strong></p>
          <p style="font-size: 15px; color: #6b7280;">Date: ${today}</p>
        </div>

        <h2 style="font-size: 20px; color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Introduction</h2>
        <p style="font-size: 15.5px; margin-top: 15px;">
          This ${reportType} report summarizes the teaching and academic activities for the period of <strong>${period}</strong>. 
          It includes student data, system usage, analysis of performance, challenges encountered, and recommendations for improvement.
        </p>

        <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Student and Class Data</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: left;">Month</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Number of Students</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Classes Conducted</th>
              <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid #cbd5e1; padding: 12px;">January 2026</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">156</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">18</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">92%</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 12px;">February 2026</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">162</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">20</td><td style="border: 1px solid #cbd5e1; padding: 12px; text-align: center;">89%</td></tr>
          </tbody>
        </table>

        <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Analysis & Highlights</h2>
        <p style="font-size: 15.5px;">${highlights || 'No specific highlights recorded for this period.'}</p>

        <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Issues / Problems Encountered</h2>
        <p style="font-size: 15.5px;">${challenges || 'No significant issues encountered during this period.'}</p>

        <h2 style="font-size: 20px; color: #1E3A8A; margin-top: 50px; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Recommendations</h2>
        <p style="font-size: 15.5px;">${recommendations || 'Continuing with existing academic strategies.'}</p>

        <div style="margin-top: 100px; text-align: center; font-size: 15px; color: #4b5563;">
          <p>Respectfully submitted,</p>
          <p style="margin-top: 50px; font-weight: bold;">${facultyName}</p>
          <p>Faculty Member, ${department}</p>
        </div>
      </div>
    `;

    setGeneratedReport(reportHTML);
    setShowPreview(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) {
      alert("Please enter the reporting period.");
      return;
    }
    alert(`✅ ${reportType === 'monthly' ? 'Monthly' : 'Quarterly'} Report for ${period} has been successfully submitted to the Dean.`);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Report Submission to Dean</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Faculty Report Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setReportType('monthly')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${reportType === 'monthly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Monthly</button>
                <button type="button" onClick={() => setReportType('quarterly')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${reportType === 'quarterly' ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Quarterly</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period *</label>
              <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g., March 2026" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Highlights</label>
              <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Challenges</label>
              <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
              <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-4 pt-6">
              <button type="button" onClick={generateFormalReport} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">Generate Preview</button>
              <button type="submit" className="flex-1 py-4 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                <Send className="w-5 h-5" /> Submit to Dean
              </button>
            </div>
          </form>
        </div>
        {showPreview && (
          <div className="bg-white rounded-2xl shadow-md p-8 overflow-auto max-h-[85vh] border border-gray-200">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-xl font-semibold">Ready to Print Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-red-600 hover:text-red-700 text-sm font-medium">Close</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: generatedReport }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== FACULTY PROFILE ======================
function FacultyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: "s.johnson@ctu.edu.ph",
    phone: "+63 912 345 6789",
    position: "Associate Professor",
    department: "College of Education",
  });

  const handleInputChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    alert("✅ Profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">SJ</div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Prof. Sarah Johnson</h2>
            <p className="text-gray-600">Computer Science Department</p>
            <p className="text-sm text-gray-500">Faculty ID: FAC-2024-0089</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={profileData.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" value={profileData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input type="text" value={profileData.position} onChange={(e) => handleInputChange('position', e.target.value)} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input type="text" value={profileData.department} onChange={(e) => handleInputChange('department', e.target.value)} disabled={!isEditing} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
          </div>
        </div>
        <div className="mt-6">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Update Profile</button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Save Changes</button>
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================== DASHBOARD VIEW ======================
function FacultyDashboardView() {
  const announcements = [
    { id: 1, title: 'Quarterly Report Deadline - February 20', date: '2 days ago', type: 'urgent' },
    { id: 2, title: 'Faculty Development Seminar', date: '1 week ago', type: 'info' },
  ];

  return (
    <div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">Welcome back, Prof. Sarah Johnson</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-600">Teaching Units</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <User className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">156</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <FileText className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-600">Pending Reports</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <Award className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">4.8/5.0</div>
          <div className="text-sm text-gray-600">Evaluation Rating</div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className={`p-4 rounded-lg border-l-4 ${ann.type === 'urgent' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                <div className="font-medium text-gray-900">{ann.title}</div>
                <div className="text-sm text-gray-600 mt-1">{ann.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Q4 Report Submission</div>
                <div className="text-sm text-gray-600">Due: February 20, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== TEACHING LOAD ======================
function TeachingLoad() {
  const subjects = [
    { code: 'CS101', name: 'Introduction to Computer Science', units: 3, students: 45, schedule: 'MWF 8:00-9:00 AM' },
    { code: 'CS201', name: 'Data Structures', units: 3, students: 38, schedule: 'TTH 10:00-11:30 AM' },
    { code: 'CS301', name: 'Software Engineering', units: 3, students: 42, schedule: 'MWF 1:00-2:00 PM' },
    { code: 'CS401', name: 'Capstone Project', units: 3, students: 31, schedule: 'TTH 2:00-3:30 PM' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Teaching Load</h1>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Academic Year 2025-2026</h2>
            <p className="text-gray-600">Second Semester</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">12 Units</div>
            <div className="text-sm text-gray-600">Total Load</div>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700">Code</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700">Course Name</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">Units</th>
              <th className="py-4 px-6 text-sm font-semibold text-gray-700">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900">{sub.code}</td>
                <td className="py-4 px-6 text-gray-700">{sub.name}</td>
                <td className="py-4 px-6 text-center text-gray-700">{sub.units}</td>
                <td className="py-4 px-6 text-gray-700">{sub.schedule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================== RESEARCH, ACHIEVEMENTS, RECORDS, EVALUATION ======================
function ResearchExtension() {
  const handleSubmit = () => alert("✅ Research output submitted!");
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Research & Extension</h1>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit New Research</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Research Title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit for Approval</button>
        </div>
      </div>
    </div>
  );
}

function FacultyAchievements() {
  const handleSubmit = () => alert("✅ Achievement submitted!");
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Achievements</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit New Achievement</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Award Title" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit for Review</button>
        </div>
      </div>
    </div>
  );
}

function AcademicRecordsView() {
  const handleDownload = (name: string) => alert(`📥 Downloading: ${name}`);
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Academic Records</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => handleDownload("Faculty Handbook")}>
          <div className="flex items-center gap-3"><FileText className="w-6 h-6 text-blue-600" /> <span className="font-medium">Faculty Handbook 2025-2026</span></div>
          <span className="text-blue-600 text-sm">Download</span>
        </div>
      </div>
    </div>
  );
}

function EvaluationResults() {
  const ratings = [
    { label: 'Teaching Effectiveness', score: 4.9 },
    { label: 'Course Content', score: 4.8 },
    { label: 'Communication Skills', score: 4.7 },
  ];
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Evaluation Results</h1>
      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">4.8</div>
          <div className="text-gray-600">Overall Rating (Out of 5.0)</div>
        </div>
        <div className="space-y-5">
          {ratings.map((r, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1"><span className="text-sm font-medium">{r.label}</span> <span className="text-sm font-bold">{r.score}/5.0</span></div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden"><div className="bg-blue-600 h-full rounded-full" style={{ width: `${(r.score / 5) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}