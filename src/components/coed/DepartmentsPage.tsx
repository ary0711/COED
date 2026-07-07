import { BookOpen, Users, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface Faculty {
  id: string;
  faculty_name: string;
  position: string;
  display_order: number;
}

interface Program {
  id: string;
  program_name: string;
  description: string;
  display_order: number;
  program_faculty: Faculty[];
}

interface College {
  id: string;
  college_name: string;
  display_order: number;
  programs: Program[];
}

interface DepartmentsPageProps {
  onNavigate?: (page: string) => void;

  previewMode?: boolean;
  previewContent?: any;
  previewColleges?: College[];
}

export function DepartmentsPage({
  onNavigate,
  previewMode = false,
  previewContent,
  previewColleges,
}: DepartmentsPageProps) {
  const [pageContent, setPageContent] =
  useState<Record<string, any>>({});
  const [colleges, setColleges] = useState<College[]>(
  previewMode ? previewColleges || [] : []
);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  loadDepartmentsPage();
   loadPageContent();
}, []);
  const displayContent =
  previewMode && previewContent
    ? previewContent
    : pageContent;

const displayColleges =
  previewMode && previewColleges
    ? previewColleges
    : colleges;
async function loadPageContent() {
  const { data, error } = await supabase
    .from('department_page_content')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const formatted: Record<string, any> = {};

  data?.forEach(item => {
    formatted[item.section_name] = item;
  });

  setPageContent(formatted);
}
async function loadDepartmentsPage() {
  const { data, error } = await supabase
    .from('colleges')
    .select(`
      *,
      programs (
        *,
        program_faculty (*)
      )
    `)
    .order('display_order', { ascending: true });

 if (error) {
  console.error(error);
  setLoading(false);
  return;
}
  

  const formatted =
    data?.map((college: any) => ({
      ...college,
      programs:
        college.programs?.sort(
          (a: any, b: any) =>
            a.display_order - b.display_order
        ) || [],
    })) || [];

  setColleges(formatted);
  setLoading(false);
}
  // Calculate totals
  const totalPrograms =  displayColleges.reduce(
  (sum, college) => sum + college.programs.length,
  0
);

const totalFaculty =  displayColleges.reduce(
  (sum, college) =>
    sum +
    college.programs.reduce(
      (pSum, program) =>
        pSum +
        (program.program_faculty?.length || 0),
      0
    ),
  0
);
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
             {displayContent.header?.title}
          </h1>
          <p className="text-xl text-gray-600">
              {displayContent.header?.description}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#2563EB] to-[#60A5FA] rounded-xl shadow-lg p-6 text-white">
            <BookOpen className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{totalPrograms}</div>
            <div className="text-blue-100">Academic Programs</div>
          </div>
          <div className="bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-xl shadow-lg p-6 text-white">
            <Users className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{totalFaculty}</div>
            <div className="text-green-100">Distinguished Faculty</div>
          </div>
          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg p-6 text-white">
            <GraduationCap className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{ displayColleges.length}</div>
            <div className="text-purple-100">College</div>
          </div>
        </div>

        {/* Colleges and Programs */}
        <div className="space-y-8">
          {displayColleges.map((college) => (
            <div key={college.id}>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#1E3A8A] pb-3 border-b-4 border-[#2563EB]">
                  {college.college_name}
                </h2>
              </div>

              {/* Programs within College */}
              <div className="space-y-6">
                {college.programs.map((program) => (
                  <div
                    key={program.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="p-8">
                      {/* Program Header */}
                      <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-[#1E3A8A] mb-2">
                          {program.program_name}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {program.description}
                        </p>
                      </div>

                      {/* Faculty List */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                          Program Faculty:
                        </h4>
                        <div className="space-y-3">
                          {program.program_faculty?.map((faculty) => (
                            <div
                             key={faculty.id}
                              className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm sm:text-base">
                                 {faculty.faculty_name}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                  {faculty.position}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-3">
             {displayContent.cta?.title}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              {displayContent.cta?.description}
          </p>
          <button   onClick={() => onNavigate?.('contact')}
          className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            {displayContent.cta?.content}
          </button>
        </div>
      </div>
    </div>
  );
}