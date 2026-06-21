import { useState } from 'react';
import { Eye, Target, Award, Users, ChevronLeft, ChevronRight, User } from 'lucide-react';

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

interface Department {
  id: string;
  name: string;
  chairman: Person;
  teachers: Person[];
}

interface OrgData {
  dean: Person;
  departments: Department[];
}

// --- Dummy Data ---
const orgData: OrgData = {
  dean: {
    id: 'dean',
    name: 'Dr.Jorelyn P.Conception',
    role: 'College Dean',
    education: 'Ph.D. in Educational Leadership, Stanford University',
    experience: '25 Years',
    subject: 'Educational Administration & Policy',
    image: '/images/JPC.PNG',
  },
  departments: [
    {
      id: 'elem-ed',
      name: 'Bachelor of Elementary Education Program',
      chairman: {
        id: 'chair-1',
        name: 'Dr. Viviana C. Genabe',
        role: 'BEED Chairperson',
        education: 'Ph.D. in Elementary Education',
        experience: '18 Years',
        subject: 'Child Development & Pedagogy',
        image: '',
      },
      teachers: [
        { id: 't1', name: 'Dr. Viviana C. Genabe', role: 'BEED Chairperson', education: 'B.S. in Elementary Ed.', experience: '5 Years', subject: 'General Science', image: '' },
        { id: 't2', name: 'Dr. Lynette Matea S. Camelo', role: 'Teacher', education: 'M.A. in Education', experience: '10 Years', subject: 'Primary Mathematics', image: '' },
        { id: 't3', name: 'Dr. Ellagora', role: 'Teacher', education: 'M.A. in Teaching', experience: '12 Years', subject: 'Early Literacy', image: '' },
        { id: 't4', name: 'Dr. Jerome L. Abregana', role: 'Teacher', education: 'B.S. in Elementary Ed.', experience: '5 Years', subject: 'General Science', image: '' },
        { id: 't5', name: 'Dr. Teresita Georgina B. Nikal', role: 'Teacher', education: 'M.A. in Special Education', experience: '8 Years', subject: 'Inclusive Strategies', image: '' },
        { id: 't6', name: 'Dr. Marvin S. Olvido-Cañete', role: 'Teacher', education: 'B.S. in Elementary Ed.', experience: '5 Years', subject: 'General Science', image: '' },
       
      ]
    },
    {
      id: 'sec-ed',
      name: 'Bachelor of Secondary Education Major in Mathematics/English Program',
      chairman: {
        id: 'chair-2',
        name: 'Dr. Michael Chen',
        role: 'Department Chairman',
        education: 'Ed.D. in Curriculum and Instruction',
        experience: '20 Years',
        subject: 'Curriculum Design',
        image: '',
      },
      teachers: [
        { id: 't7', name: 'Dr. Maricho U. Carreon', role: 'Teacher', education: 'M.A. in English Lit.', experience: '8 Years', subject: 'High School English', image: '', },
        { id: 't8', name: 'Dr. Jean F. Puerto', role: 'Teacher', education: 'Ph.D. in Physics', experience: '15 Years', subject: 'Advanced Physics', image: '', },
        { id: 't9', name: 'Dr. Virginia S. Albarracin', role: 'Teacher', education: 'M.S. in Mathematics', experience: '11 Years', subject: 'Calculus & Algebra', image: '', },
        { id: 't10', name: 'Dr. Lynette Matea S. Camelo', role: 'Teacher', education: 'M.A. in History', experience: '14 Years', subject: 'World History', image: '', },
        { id: 't11', name: 'Dr. Crisju Theres B. Enriquez', role: 'Teacher', education: 'M.A. in History', experience: '14 Years', subject: 'World History', image: '', },
        { id: 't12', name: 'Dr. Judith M. Aliquiot', role: 'Teacher', education: 'M.A. in History', experience: '14 Years', subject: 'World History', image: '', },
        { id: 't13', name: 'Dr. Ariel L. RamosS', role: 'Teacher', education: 'M.A. in History', experience: '14 Years', subject: 'World History', image: '', },
      ]
    },
    {
      id: 'sped',
      name: 'Bachelor of Technology and Livelihood Education Program',
      chairman: {
        id: 'chair-3',
        name: 'Dr. Patricia Williams',
        role: 'Department Chairman',
        education: 'Ph.D. in Special Education',
        experience: '22 Years',
        subject: 'Behavioral Interventions',
         image: '',
      },
      teachers: [
        { id: 't14', name: 'Jessica Taylor', role: 'Teacher', education: 'M.A. in Special Ed.', experience: '9 Years', subject: 'Autism Spectrum Studies', image: '', },
        { id: 't15', name: 'William Moore', role: 'Teacher', education: 'M.Ed. in Inclusion', experience: '7 Years', subject: 'Sign Language & Comm.', image: '', },
        { id: 't16', name: 'Sophia Davis', role: 'Teacher', education: 'B.S. in Special Ed.', experience: '4 Years', subject: 'Adaptive Physical Ed.', image: '', },
        { id: 't17', name: 'Jessica Taylor', role: 'Teacher', education: 'M.A. in Special Ed.', experience: '9 Years', subject: 'Autism Spectrum Studies', image: '', },
        { id: 't18', name: 'Jessica Taylor', role: 'Teacher', education: 'M.A. in Special Ed.', experience: '9 Years', subject: 'Autism Spectrum Studies', image: '', },
        { id: 't19', name: 'Jessica Taylor', role: 'Teacher', education: 'M.A. in Special Ed.', experience: '9 Years', subject: 'Autism Spectrum Studies', image: '', },
        { id: 't20', name: 'Jessica Taylor', role: 'Teacher', education: 'M.A. in Special Ed.', experience: '9 Years', subject: 'Autism Spectrum Studies', image: '', },
     ]
    },
    {
      id: 'ed-lead',
      name: 'Educational Leadership',
      chairman: {
        id: 'chair-4',
        name: 'Dr. Robert Anderson',
        role: 'Department Chairman',
        education: 'Ed.D. in School Administration',
        experience: '28 Years',
        subject: 'Organizational Leadership',
         image: '',
      },
      teachers: [
        { id: 't12', name: 'Thomas White', role: 'Teacher', education: 'Ph.D. in Policy', experience: '16 Years', subject: 'Educational Law', image: '', },
        { id: 't13', name: 'Maria Garcia', role: 'Teacher', education: 'M.A. in Administration', experience: '13 Years', subject: 'School Finance', image: '', },
        { id: 't14', name: 'Kevin Lee', role: 'Teacher', education: 'M.Ed. in Leadership', experience: '10 Years', subject: 'Ethics in Education', image: '', },
      ]
    }
  ]
};

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
export function AboutPage() {
  const [currentPage, setCurrentPage] = useState<number>(0);
  // Type explicitly provided so TypeScript knows this holds either a Person object or null
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const totalPages = 1 + orgData.departments.length; // 1 for Dean + 4 departments = 5 pages

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50/30 py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
            About Us
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#1E3A8A] mb-4">About COED</h1>
          <p className="text-xl text-gray-600">32 Years of Excellence in Education</p>
        </div>

        {/* College History */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">Our History</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              Established in 1994, the College of Education has been a cornerstone of teacher education and professional development for over three decades. What began as a small institution with a handful of dedicated faculty members has grown into a premier college of education, recognized nationally for its innovative programs and commitment to excellence.
            </p>
            <p>
              Throughout our 32-year journey, we have consistently adapted to meet the evolving needs of the education sector while maintaining our core values of integrity, innovation, and inclusivity. Our graduates serve in leadership positions across educational institutions, government agencies, and international organizations.
            </p>
            <p>
              Today, COED stands as a testament to the power of quality education, producing thousands of highly competent educators who are transforming lives and communities through their dedication to teaching and learning.
            </p>
          </div>
        </div>

        {/* Vision, Mission, Goals */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-7 h-7 text-[#2563EB]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">Vision</h3>
            <p className="text-gray-700 leading-relaxed">
              To be a leading institution in teacher education, recognized globally for producing innovative, competent, and socially responsible educators.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">Mission</h3>
            <p className="text-gray-700 leading-relaxed">
              To provide quality education through innovative teaching methods, research, and community engagement that develops future educators committed to lifelong learning.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E3A8A] mb-4">Goals</h3>
            <p className="text-gray-700 leading-relaxed">
              To maintain excellence in instruction, foster research and innovation, strengthen community partnerships, and ensure continuous program improvement.
            </p>
          </div>
        </div>

        {/* Organizational Structure Section */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-6">
            <div className="max-w-2xl">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Our Team Structure</h4>
              <h2 className="text-4xl font-bold text-[#1E3A8A] mb-4">
                The People Behind the Programs
              </h2>
              <p className="text-gray-600">
                Our team is a blend of visionaries, educators, and mentors dedicated to crafting experiences, not just classes. We come together with one shared goal: to guide you seamlessly through the world of education.
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
                <ProfileCard person={orgData.dean} onClick={setSelectedPerson} />
              </div>
            ) : (
              /* Pages 2-5: Department Views */
              <div className="animate-fade-in pb-8">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {orgData.departments[currentPage - 1].name}
                  </h3>
                </div>
                
                {/* Chairman Top Center */}
                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <ProfileCard person={orgData.departments[currentPage - 1].chairman} onClick={setSelectedPerson} />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center mb-10">
                  <div className="h-px bg-gray-200 w-full max-w-3xl"></div>
                </div>

                {/* Teachers Group Grid Below */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
                  {orgData.departments[currentPage - 1].teachers.map(teacher => (
                    <ProfileCard key={teacher.id} person={teacher} onClick={setSelectedPerson} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-gray-200 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { count: '142', label: 'Total Faculty' },
              { count: '85', label: 'Full-Time' },
              { count: '57', label: 'Part-Time' },
              { count: '28', label: 'Support Staff' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-50 rounded-xl p-6 h-full flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
                  <Users className="w-8 h-8 text-[#2563EB] mx-auto mb-3" />
                  <div className="text-3xl font-bold text-[#1E3A8A] mb-1">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl shadow-lg p-10 text-white">
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {['Excellence', 'Integrity', 'Innovation', 'Inclusivity', 'Service'].map(
              (value, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-xl p-4 md:p-6 h-full flex items-center justify-center">
                    <div className="text-lg md:text-xl font-medium">{value}</div>
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
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Educational Attainment</span>
                    {selectedPerson.education}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Years of Teaching</span>
                    {selectedPerson.experience}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-400 uppercase tracking-widest text-xs mb-1">Subject Area</span>
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