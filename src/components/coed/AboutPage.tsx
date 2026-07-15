import { useState, useEffect } from 'react';
import { Eye, Target, Award, Users, ChevronLeft, ChevronRight, User, PlayCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// --- TypeScript Interfaces ---
interface Person {
  id: string;
  name: string;
  role: string;
  education: string;
  experience: string;
  subject: string;
  image: string;
}
interface AboutContent {
  id: string;
  section_name: string;
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  badge_number?: string;
}

// --- Dummy Data ---
interface FacultyMember {
  id: string;
  name: string;
  role: string;
  education: string;
  experience: string;
  academic_rank: string;
  image: string;
  department_id: string;
  member_type: string;
}

interface Department {
  id: string;
  name: string;
}

interface CoreValue {
  id: string;
  letter: string;
  word: string;
  description: string;
}

interface Statistic {
  id: string;
  count: string;
  label: string;
}
interface AboutPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewStats?: any[];
}
interface CoreValueCard {
  id: string;
  value_name: string;
  display_order: number;
}


// --- Extracted ProfileCard Component ---
interface ProfileCardProps {
  person: Person;
  onClick: (person: Person) => void;
}

const ProfileCard = ({ person, onClick }: ProfileCardProps) => (
  <div 
    onClick={() => onClick(person)} 
    className="relative w-full max-w-[220px] mx-auto aspect-[3/4] bg-[#e5e7eb] rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
  >
    {/* Placeholder for actual image */}
   <img
  src={person.image}
  alt={person.name}
  className="absolute inset-0 w-full h-full object-cover bg-gray-300"
  onError={() => {}}
/>
<div className="hidden image-missing:flex absolute inset-0 items-center justify-center bg-gray-300">
  <User className="w-12 h-12 text-gray-400" />
</div>

    {/* Floating White Label */}
    <div className="absolute bottom-2 left-2 right-2 bg-white rounded-xl p-3 flex justify-between items-center shadow-md transform transition-transform group-hover:-translate-y-1">
      <div className="overflow-hidden">
        <div className="font-bold text-gray-900 text-sm truncate">{person.name}</div>
        <div className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mt-0.5 truncate">{person.role}</div>
      </div>
      <div className="w-8 h-8 shrink-0 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors ml-2">
        <User className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
export function AboutPage({
  previewMode = false,
  previewContent = {},
  previewStats = []
}: AboutPageProps) {
  
  useEffect(() => {
  if (!previewMode) {
    loadAboutPage();
  }
}, [previewMode]);
const [loading, setLoading] = useState(true);
const [dean, setDean] =
  useState<FacultyMember | null>(null);
 const [aboutContent, setAboutContent] =
  useState<Record<string, AboutContent>>({});
  const content = previewMode
  ? previewContent
  : aboutContent;
  
const [departments, setDepartments] =
  useState<Department[]>([]);

const [facultyMembers, setFacultyMembers] =
  useState<FacultyMember[]>([]);

const [coreValues, setCoreValues] =
  useState<CoreValue[]>([]);

const [statistics, setStatistics] =
  useState<Statistic[]>([]);
  const statsToDisplay =
  previewMode
    ? previewStats
    : statistics;
const [coreValueCards, setCoreValueCards] =
  useState<CoreValueCard[]>([]);
async function loadAboutPage() {

  setLoading(true);

  const formatted: Record<
  string,
  AboutContent
> = {};

  const [
    contentRes,
    deptRes,
    facultyRes,
    valuesRes,
    statsRes,
    coreValuesRes,
    deanRes
  ] = await Promise.all([
    supabase.from('about_page_content').select('*'),
    supabase.from('departments').select('*'),
    supabase.from('faculty_members').select('*'),
    supabase.from('premier_values').select('*'),
    supabase.from('about_statistics').select('*'),
    supabase
      .from('core_values')
      .select('*')
      .order('display_order'),
    supabase
      .from('faculty_members')
      .select('*')
      .eq('member_type', 'dean')
      .single()
  ]);

  contentRes.data?.forEach((item) => {
  formatted[item.section_name] =
    item as AboutContent;
});
  setAboutContent(formatted);

  setDepartments(deptRes.data || []);
  setFacultyMembers(facultyRes.data || []);
  setCoreValues(valuesRes.data || []);
  setStatistics(statsRes.data || []);
  setCoreValueCards(coreValuesRes.data || []);
  setDean(deanRes.data || null);

  setLoading(false);
}
  
  const [currentPage, setCurrentPage] = useState<number>(0);
  // Type explicitly provided so TypeScript knows this holds either a Person object or null
  const department =
  departments[Math.floor((currentPage - 1) / 2)] || null;

const chairman = facultyMembers.find(
  member =>
    member.department_id === department?.id &&
    member.member_type === 'chairman'
);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const totalPages =
  1 + departments.length * 2; // 1 for Dean + 4 departments = 5 pages
  const teacherDepartment =
  departments[
    Math.floor((currentPage - 2) / 2)
  ];

const teachers =
  facultyMembers.filter(
    member =>
      member.department_id === teacherDepartment?.id &&
      member.member_type === 'teacher'
  );
  if (!previewMode && loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-[#1E3A8A]">
          Loading About...
        </h2>

        <p className="text-gray-500 mt-2">
          Please wait while we load the page.
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-white py-12 relative">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
            About Us
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1E3A8A] mb-4">  {content['header']?.title}</h1>
          <p className="text-xl text-gray-900">  {content['header']?.description}</p>
        </div>

        {/* College History — text left, image right w/ floating badge (Xennada-style) */}
        <div className="mb-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Text side */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-4 leading-tight">
                Our History
              </h2>
              <div
                className="prose max-w-none text-gray-900 leading-relaxed text-[17px] [&>p]:mb-5"
                dangerouslySetInnerHTML={{
                  __html: content['history']?.content || ''
                }}
              />
            </div>

            {/* Image side with floating badge */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                <img
  src={
    content['history']?.image ||
    '/bg.jpg'
  }
  alt="College of Education History"
  className="w-full h-full object-cover"
  loading="lazy"
/>
              </div>
              {/* Floating experience/stat badge */}
              <div className="absolute -bottom-6 left-6 bg-white rounded-xl shadow-xl px-5 py-4 flex items-center gap-3 border border-gray-100">
                <div className="w-11 h-11 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {content['history']?.badge_number || '30+'}
                </div>
                <div className="text-xs font-semibold text-gray-700 leading-tight uppercase tracking-wide">
                  Years of<br />Excellence
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision, Mission, Goals — livened up cards */}
        <div className="grid md:grid-cols-3 gap-9 mb-24 mt-14">
          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Eye className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vision</h3>
            <div className="text-medium text-gray-900 leading-relaxed">
              {content['vision']?.description}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Target className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mission</h3>
            <div className="text-medium text-gray-900 leading-relaxed">
              {content['mission']?.description}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Award className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Goals</h3>
            <div className="text-medium text-gray-900 leading-relaxed">
              {content['goals']?.description}
            </div>
          </div>
        </div>

        {/* Core Values Acronym - PREMIER */}
        <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-8 mb-16">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 text-center">University Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 text-center">
            {coreValues.map((value) => (
  <div
    key={value.id}
    className="flex flex-col items-center"
  >
    <div className="w-12 h-12 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center font-bold text-xl mb-2">
      {value.letter}
    </div>

    <div className="font-semibold text-gray-900 text-sm">
      {value.word}
    </div>

    <div className="text-xs text-gray-500 mt-1">
      {value.description}
    </div>
  </div>
))}
    </div>
    </div>

        {/* Organizational Structure Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-6">
            <div className="max-w-2xl">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{content.team_structure?.title}<div className="section_name"></div></h4>
              <h2 className="text-4xl font-bold text-[#1E3A8A] mb-4">
                {content.team_structure?.description}
              </h2>
              <p className="text-gray-600">
              {content.team_structure?.content}              </p>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className={`p-3 rounded-full border transition-all ${currentPage === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="font-medium text-gray-600 w-32 text-center">
                Page {currentPage + 1} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className={`p-3 rounded-full border transition-all ${currentPage === totalPages - 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
  {/* Render Active View */}
          <div className="min-h-[450px]">
            {currentPage === 0 ? (
  /* Page 1: Dean */
  <div className="flex flex-col items-center animate-fade-in py-10">
    <div className="mb-6 text-center">
      <h3 className="text-2xl font-bold text-gray-800">Office of the Dean</h3>
    </div>
    {dean && (
  <ProfileCard
    person={{
      id: dean.id,
      name: dean.name,
      role: dean.role,
      education: dean.education,
      experience: dean.experience,
      subject: dean.academic_rank,
      image: dean.image
    }}
    onClick={setSelectedPerson}
  />
)}
  </div>
) : currentPage % 2 === 1 ? (
  /* Odd pages: Chairman only */
  <div className="flex flex-col items-center animate-fade-in py-10">
    <div className="mb-6 text-center">
      <h3 className="text-2xl font-bold text-gray-800">
        {departments[
 Math.floor((currentPage - 1) / 2)
].name}
      </h3>
       </div>
    {chairman && (
  <ProfileCard
    person={{
      id: chairman.id,
      name: chairman.name,
      role: chairman.role,
      education: chairman.education,
      experience: chairman.experience,
      subject: chairman.academic_rank,
      image: chairman.image
    }}
    onClick={setSelectedPerson}
  />
)}
  </div>
) : (
  /* Even pages: Teachers grid */
  <div className="animate-fade-in pb-8">
    <div className="text-center mb-10">
      <h3 className="text-2xl font-bold text-gray-800">
        {teacherDepartment?.name}
      </h3>
       </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
      {teachers.map((teacher) => (
  <ProfileCard
    key={teacher.id}
    person={{
      id: teacher.id,
      name: teacher.name,
      role: teacher.role,
      education: teacher.education,
      experience: teacher.experience,
      subject: teacher.academic_rank,
      image: teacher.image
    }}
    onClick={setSelectedPerson}
  />
      ))}
    </div>
  </div>
)}
          </div>
        </div>


        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-gray-200 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsToDisplay.map((stat) => (
  <div
    key={stat.id}
    className="text-center"
  >
    <div className="bg-blue-50 rounded-xl p-6 h-full flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
      <Users className="w-8 h-8 text-[#2563EB] mx-auto mb-3" />

      <div className="text-3xl font-bold text-[#1E3A8A] mb-1">
        {stat.count}
      </div>

      <div className="text-sm text-gray-600">
        {stat.label}
      </div>
    </div>
  </div>
))}
          </div>
</div>
        {/* Core Values */}
       <div className="bg-[#1E3A8A] rounded-2xl shadow-lg p-10 text-white">
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {coreValueCards.map((value) => (
                <div key={value.id} className="text-center">
                  <div className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-xl p-4 md:p-6 h-full flex items-center justify-center">
                    <div className="text-lg md:text-xl font-medium">{value.value_name}</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedPerson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedPerson(null)}
        >
          <div 
            className="w-full max-w-5xl bg-[#f5f5f5] rounded-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()} 
          >
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Blank Square-ish Image Placeholder */}
            <div className="relative w-full md:w-[45%] bg-[#e5e7eb] min-h-[350px] md:min-h-[500px]">
  <img 
    src={selectedPerson.image} 
    alt={selectedPerson.name}
    className="absolute inset-0 w-full h-full object-cover object-top"
  />
  {!selectedPerson.image && (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
      <User className="w-20 h-20 text-gray-400" />
    </div>
  )}
</div>
              {/* Right Side: Data */}
              <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center bg-[#f5f5f5]">
                <h2 className="text-4xl md:text-5xl font-light text-gray-800 tracking-tight">
                  {selectedPerson.name}
                </h2>
                
                <div className="w-full h-px bg-gray-300 my-8"></div>
                
                <div className="space-y-6 text-gray-600 text-sm md:text-base leading-relaxed">
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Role</span>
                    {selectedPerson.role}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">
                    Educational Attainment
                  </span>

                  {selectedPerson.education.split(',').map((item, index) => (
                    <span key={index} className="block">
                      {item.trim()}
                    </span>
                  ))}
                </p>
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Years of Teaching</span>
                    {selectedPerson.experience}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Academic Rank</span>
                    {selectedPerson.subject}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bottom Dark Bar with Close Button */}
            <div className="bg-[#2d2d2d] w-full p-5 flex justify-end">
              <button 
                onClick={() => setSelectedPerson(null)}
                className="text-white text-sm font-bold tracking-[0.25em] hover:text-gray-300 transition-colors uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fade-in Animation CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}