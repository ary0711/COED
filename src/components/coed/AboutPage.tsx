import { useState, useEffect } from 'react';
import { Eye, Target, Award, Users, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';
interface AboutPageProps {
  previewMode?: boolean;
  previewContent?: any;
}

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
   {person.image ? (
  <img
    src={person.image}
    alt={person.name}
    className="absolute inset-0 w-full h-full object-cover"
  />
) : (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
    <User className="w-12 h-12 text-gray-400" />
  </div>
)}

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
}: AboutPageProps) {
  
  const [coreValues, setCoreValues] =
  useState<any[]>([]);

const [statistics, setStatistics] =
  useState<any[]>([]);

const [facultyMembers, setFacultyMembers] =
  useState<any[]>([]);
const dean = facultyMembers.find(
  member =>
    member.role?.toLowerCase().includes('dean')
);

const departments = [
  ...new Set(
    facultyMembers
      .filter(member => member.department)
      .map(member => member.department)
  ),
];
  const [currentPage, setCurrentPage] = useState<number>(0);
  // Type explicitly provided so TypeScript knows this holds either a Person object or null
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [aboutContent, setAboutContent] = useState<any>({});
  const fetchCoreValues = async () => {
  const { data } = await supabase
    .from('core_values')
    .select('*')
    .order('display_order');

  setCoreValues(data || []);
};
const fetchStatistics = async () => {
  const { data } = await supabase
    .from('about_statistics')
    .select('*')
    .order('display_order');

  setStatistics(data || []);
};
const fetchFacultyMembers = async () => {
  const { data } = await supabase
    .from('faculty_members')
    .select('*')
    .order('display_order');

  setFacultyMembers(data || []);
};
  const fetchAboutContent = async () => {
  const { data, error } = await supabase
    .from('about_page_content')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const formatted: any = {};

  data?.forEach((item: any) => {
    formatted[item.section_name] = {
      title: item.title,
      description: item.description,
    };
  });

  setAboutContent(formatted);
};
useEffect(() => {
  if (previewMode) return;

  fetchAboutContent();
  fetchCoreValues();
  fetchStatistics();
  fetchFacultyMembers();

  const channel = supabase
  .channel('about-page-updates')

  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'about_page_content',
    },
    fetchAboutContent
  )

  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'core_values',
    },
    fetchCoreValues
  )

  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'about_statistics',
    },
    fetchStatistics
  )

  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'faculty_members',
    },
    fetchFacultyMembers
  )

  .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [previewMode]);
  
  const totalPages =
  1 + departments.length;
  const currentDepartment =
  departments[currentPage - 1];

const chairman =
  facultyMembers.find(
    member =>
      member.department ===
        currentDepartment &&
      member.role === 'Chairperson'
  );

const teachers =
  facultyMembers.filter(
    member =>
      member.department ===
        currentDepartment &&
      member.role === 'Faculty'
  );
  const getContent = (section: string) => {
  if (previewMode) {
    return previewContent?.[section] || aboutContent?.[section];
  }

  return aboutContent?.[section];
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
            About Us
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1E3A8A] mb-4">{getContent('About Header')?.title || 'About COED'}</h1>
          <p className="text-xl text-gray-600">{getContent('About Header')?.description ||
  '32 Years of Excellence in Education'}</p>
        </div>

        {/* College History */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">{getContent('History')?.title || 'Our History'}</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              {getContent('History')?.description}
            </p>
          </div>
        </div>

        {/* Vision, Mission, Goals */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-7 h-7 text-[#2563EB]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">{getContent('Vision')?.title || 'Vision'}</h3>
            <p className="text-gray-700 leading-relaxed">
              {getContent('Vision')?.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">{getContent('Mission')?.title || 'Mission'}</h3>
            <p className="text-gray-700 leading-relaxed">
              {getContent('Mission')?.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">{getContent('Goals')?.title || 'Goals'}</h3>
            <p className="text-gray-700 leading-relaxed">

             {getContent('Goals')?.description}
            </p>
          </div>
        </div>

        {/* Core Values Acronym - PREMIER */}
        <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-8 mb-16">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 text-center">University Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 text-center">
            {[
              { letter: 'P', word: 'Progressive', desc: 'Advancing through innovation' },
              { letter: 'R', word: 'Responsive', desc: 'Adaptive to evolving demands' },
              { letter: 'E', word: 'Excellent', desc: 'Highest standards in education' },
              { letter: 'M', word: 'Morally grounded', desc: 'Integrity & accountability' },
              { letter: 'I', word: 'Inclusive', desc: 'Equal opportunities for all' },
              { letter: 'E', word: 'Empowered', desc: 'Knowledge & sustainable skills' },
              { letter: 'R', word: 'Relevant', desc: 'Addressing real-world needs' },
            ].map((value, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center font-bold text-xl mb-2">
                  {value.letter}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{value.word}</div>
                <div className="text-xs text-gray-500 mt-1">{value.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Organizational Structure Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-6">
            <div className="max-w-2xl">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Our Team Structure</h4>
              <h2 className="text-4xl font-bold text-[#1E3A8A] mb-4">
                {getContent('Team Structure')?.title ||
  'The People Behind the Programs'}
              </h2>
              <p className="text-gray-600">
               {getContent('Team Structure')?.description}
              </p>
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
              /* Page 1: Dean Solo View */
              <div className="flex flex-col items-center animate-fade-in py-10">
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-800">Office of the Dean</h3>
                </div>
                {dean && (
  <ProfileCard
  person={dean as Person}
  onClick={setSelectedPerson}
/>
)}
              </div>
            ) : (
              /* Pages 2-5: Department Views */
              <div className="animate-fade-in pb-8">
                
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-gray-800">
                   {departments[currentPage - 1]}
                  </h3>
                </div>
                
                {/* Chairman Top Center */}
                <div className="flex justify-center mb-10">
  <div className="relative">
    {chairman && (
      <ProfileCard
        person={chairman as Person}
        onClick={setSelectedPerson}
      />
    )}
  </div>
</div>
                {/* Divider */}
                <div className="flex items-center justify-center mb-10">
                  <div className="h-px bg-gray-200 w-full max-w-3xl"></div>
                </div>

                {/* Teachers Group Grid Below */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
                  {teachers.map((teacher) => (
  <ProfileCard
    key={teacher.id}
    person={teacher as Person}
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
    {statistics.map((stat) => (
      <div
        key={stat.id}
        className="text-center"
      >
        <div className="bg-blue-50 rounded-xl p-6 h-full flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
          <Users className="w-8 h-8 text-[#2563EB] mx-auto mb-3" />

          <div className="text-3xl font-bold text-[#1E3A8A] mb-1">
            {stat.stat_value}
          </div>

          <div className="text-sm text-gray-600">
            {stat.stat_label}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

        {/* Core Values */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
  {coreValues.map((value) => (
    <div
      key={value.id}
      className="text-center"
    >
      <div className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-xl p-4 md:p-6 h-full flex items-center justify-center">
        <div className="text-lg md:text-xl font-medium">
          {value.value_name}
        </div>
      </div>
    </div>
  ))}
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
                   <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Educational Attainment</span>
                  {selectedPerson.education.split(',').map((line, i) => (
                    <span key={i} className="block">{line.trim()}</span>
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