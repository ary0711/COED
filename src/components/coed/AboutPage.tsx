import { useState, useEffect } from 'react';
import { Eye, Target, Award, Users, ChevronLeft, ChevronRight, User, PlayCircle, Sparkles, X } from 'lucide-react';
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
  previewFacultyMembers?: any[];
  previewCoreValues?: any[];
  previewCoreValueCards?: any[];
  previewDepartments?:  any[];
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
    className="relative w-full max-w-[220px] mx-auto aspect-[3/4] bg-[#e5e7eb] rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 shadow-md"
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
    <div className="absolute bottom-2 left-2 right-2 bg-white rounded-xl p-3 shadow-md transform transition-transform group-hover:-translate-y-1">
      <div className="overflow-hidden">
        <div className="font-bold text-gray-900 text-sm truncate">{person.name}</div>
        <div className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mt-0.5 truncate">{person.role}</div>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
export function AboutPage({
  previewMode = false,
  previewContent = {},
  previewStats = [],
  previewFacultyMembers = [],
  previewCoreValues = [],
  previewCoreValueCards = [],
  previewDepartments = []
}: AboutPageProps) {
  
  useEffect(() => {
  if (!previewMode) {
    loadAboutPage();
  }
}, [previewMode]);
const [loading, setLoading] = useState(true);

const [dean, setDean] =
  useState<FacultyMember | null>(null);
const deanToDisplay =
  previewMode
    ? previewFacultyMembers.find(
        member =>
          member.member_type === 'dean'
      )
    : dean;
 const [aboutContent, setAboutContent] =
  useState<Record<string, AboutContent>>({});
  const content = previewMode
  ? previewContent
  : aboutContent;
  
const [departments, setDepartments] =
  useState<Department[]>([]);
const departmentsToDisplay =
  previewMode
    ? previewDepartments
    : departments;
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

const facultyToDisplay =
  previewMode
    ? previewFacultyMembers
    : facultyMembers;

const valuesToDisplay =
  previewMode
    ? previewCoreValues
    : coreValues;

const coreValueCardsToDisplay =
  previewMode
    ? previewCoreValueCards
    : coreValueCards;
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
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Page 0 = Dean. Pages 1..N = one page per department (chairman + teachers together).
  const totalPages = 1 + departmentsToDisplay.length;

  const activeDepartment =
    currentPage > 0
      ? departmentsToDisplay[currentPage - 1]
      : null;

  const activeChairman = facultyToDisplay.find(
    member =>
      member.department_id === activeDepartment?.id &&
      member.member_type === 'chairman'
  );

  const activeTeachers = facultyToDisplay.filter(
    member =>
      member.department_id === activeDepartment?.id &&
      member.member_type === 'teacher'
  );

  // Chairman shown first, followed by the department's teachers
  const departmentMembers = activeChairman
    ? [activeChairman, ...activeTeachers]
    : activeTeachers;

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
    <div className="min-h-screen bg-white py-16 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 text-blue-600 font-semibold text-sm mb-5">
            About Us
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1E3A8A] mb-4 leading-tight">
            {content['header']?.title}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {content['header']?.description}
          </p>
        </div>

        {/* College History — image left (larger), text right */}
        <div className="mb-16">
          <div className="grid md:grid-cols-5 gap-14 items-stretch">

            {/* Image side with floating badge */}
            <div className="relative order-1 md:col-span-3">
              <div className="rounded-2xl overflow-hidden shadow-lg h-full aspect-[4/3] md:aspect-auto">
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

            {/* Text side */}
            <div className="order-2 md:col-span-2 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-5 leading-tight">
                Our History
              </h2>
              <div
                className="prose max-w-none text-gray-600 leading-relaxed text-[16px] [&>p]:mb-5"
                dangerouslySetInnerHTML={{
                  __html: content['history']?.content || ''
                }}
              />
            </div>
          </div>
        </div>

       

        {/* Vision, Mission, Goals */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Eye className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vision</h3>
            <div className="text-sm text-gray-600 leading-relaxed">
              {content['vision']?.description}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Target className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mission</h3>
            <div className="text-sm text-gray-600 leading-relaxed">
              {content['mission']?.description}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <Award className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Goals</h3>
            <div className="text-sm text-gray-600 leading-relaxed">
              {content['goals']?.description}
            </div>
          </div>
        </div>

        {/* Core Values Acronym - PREMIER */}
        <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-10 mb-20">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-8 text-center">University Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 text-center">
            {valuesToDisplay.map((value) => (
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

        {/* Organizational Structure Section — one page per department, chairman first */}
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
    {deanToDisplay && (
  <ProfileCard
    person={{
  id: deanToDisplay.id,
  name: deanToDisplay.name,
  role: deanToDisplay.role,
  education: deanToDisplay.education,
  experience: deanToDisplay.experience,
  subject: deanToDisplay.academic_rank,
  image: deanToDisplay.image
}}
    onClick={setSelectedPerson}
  />
)}
  </div>
) : (
  /* Department page: chairman first, then teachers, same grid */
  <div className="animate-fade-in pb-8">
    <div className="text-center mb-10">
      <h3 className="text-2xl font-bold text-gray-800">
        {activeDepartment?.name}
      </h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
      {departmentMembers.map((member) => (
  <ProfileCard
    key={member.id}
    person={{
      id: member.id,
      name: member.name,
      role: member.role,
      education: member.education,
      experience: member.experience,
      subject: member.academic_rank,
      image: member.image
    }}
    onClick={setSelectedPerson}
  />
      ))}
    </div>
  </div>
)}
          </div>
        </div>

        {/* Core Values */}
       <div className="bg-[#1E3A8A] rounded-2xl shadow-lg p-10 text-white">
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {coreValueCardsToDisplay.map((value) => (
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

      {/* Profile Detail Modal — X button top-left, no bottom close bar */}
      {selectedPerson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedPerson(null)}
        >
          <div 
            className="relative w-full max-w-5xl bg-[#f5f5f5] rounded-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()} 
          >
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Image */}
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

  {/* Close button — top-left */}
  <button
    onClick={() => setSelectedPerson(null)}
    aria-label="Close"
    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition-colors"
  >
    <X className="w-4 h-4" />
  </button>
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