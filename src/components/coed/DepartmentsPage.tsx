import { BookOpen, Users, GraduationCap } from 'lucide-react';

export function DepartmentsPage() {
  const colleges = [
    {
      id: 1,
      collegeName: 'College of Education',
      programs: [
        {
          id: 1,
          name: 'Bachelor of Elementary Education',
          description:
            'Prepares future elementary school teachers with comprehensive pedagogical skills and child development knowledge.',
          faculty: [
            { name: 'Jerome Abregana, MAEd A.S.', position: 'BEED Chairperson' },
            { name: 'Viviana C. Genabe, Dev. Ed. D.', position: 'Practice Teaching Coordinator' },
            { name: 'Lynnette Matea S. Camello, D.A.L.C.', position: 'University Director Education for Sustainable Development' },
            { name: 'Marivel Glinogo-Cañete, MAEd A.S.', position: 'Program GAD and Extension Coordinator' },
            { name: 'Suzette T. Elladora, Ph.D.', position: 'Chairman Ph.D. Program Graduate School/Coordinator Research and Development' },
            { name: 'Teresita Cleopolda B. Sarile, Dev. Ed.D.', position: 'Extension Director/College GAD, Program Internalization Coordinator' },
          ],
        },
        {
          id: 2,
          name: 'Bachelor of Technology and Livelihood Education',
          description:
            'Develops competent technical and vocational education teachers with practical skills and industry knowledge.',
          faculty: [
            { name: 'Venus H. Baldea, Ph.D.', position: 'BTLED Chairperson' },
            { name: 'Fitzgerald C. Kintanar, Ed.D.', position: 'Dean of Instruction, Alumni Affairs Director, Coordinator Research and Development' },
            { name: 'Jeramie C. Linaban, Dev. Ed. D.', position: 'Teaching Internship Chairperson' },
            { name: 'Rachelle G. Lopez, MAVEd', position: 'College Cultural Affairs & Internalization Coordinator' },
            { name: 'Mildred G. Martinez, MAVEd', position: 'College Extension Coordinator' },
            { name: 'Lemuel M. Velasco, Dev. Ed. D.', position: 'College Innovation & Sports Coordinator' },
          ],
        },
        {
          id: 3,
          name: 'Bachelor of Secondary Education (Mathematics/English)',
          description:
            'Develops competent secondary school teachers specialized in Mathematics and English with strong content knowledge and pedagogical expertise.',
          faculty: [
            { name: 'Marichou L. Carreon, Dev. Ed. D.', position: 'BSED Math/English Chairperson' },
            { name: 'Judith M. Aleguen, Ph.D.', position: 'College Research & Internalization Coordinator' },
            { name: 'Virginia S. Albarracin, Ed. D.', position: 'Program GAD Coordinator' },
            { name: 'Crysali Therese R. Dayaganon, Ph.D., Dev.Ed.D.', position: 'Extension Coordinator, ST Supervisor' },
            { name: 'Jean F. Puerto, Ph.D., Dev. Ed.D.', position: 'Campus Director, OSGIN' },
          ],
        },
      ],
    },
  ];

  // Calculate totals
  const totalPrograms = colleges.reduce((sum, college) => sum + college.programs.length, 0);
  const totalFaculty = colleges.reduce((sum, college) => 
    sum + college.programs.reduce((pSum, program) => pSum + program.faculty.length, 0), 0
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            College of Education - Departments & Programs
          </h1>
          <p className="text-xl text-gray-600">
            Meet our distinguished faculty and explore our academic programs
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
            <div className="text-3xl font-bold mb-1">1</div>
            <div className="text-purple-100">College</div>
          </div>
        </div>

        {/* Colleges and Programs */}
        <div className="space-y-8">
          {colleges.map((college) => (
            <div key={college.id}>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#1E3A8A] pb-3 border-b-4 border-[#2563EB]">
                  {college.collegeName}
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
                          {program.name}
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
                          {program.faculty.map((faculty, index) => (
                            <div
                              key={index}
                              className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {faculty.name}
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
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of successful educators who began their career at Cebu Technological University - Argao Campus. 
            Explore our programs and find the perfect fit for your aspirations.
          </p>
          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            Contact Admissions
          </button>
        </div>
      </div>
    </div>
  );
}