import { BookOpen, Users, GraduationCap } from 'lucide-react';

export function DepartmentsPage() {
  const departments = [
    {
      id: 1,
      name: 'Elementary Education',
      chair: 'Dr. Sarah Johnson',
      programs: [
        'Bachelor of Elementary Education (BEEd)',
        'Master in Elementary Education',
        'Certificate in Early Childhood Education',
      ],
      description:
        'Prepares future elementary school teachers with comprehensive pedagogical skills and child development knowledge.',
      faculty: 35,
      students: 892,
    },
    {
      id: 2,
      name: 'Secondary Education',
      chair: 'Dr. Michael Chen',
      programs: [
        'Bachelor of Secondary Education Major in English',
        'Bachelor of Secondary Education Major in Mathematics',
        'Bachelor of Secondary Education Major in Science',
        'Bachelor of Secondary Education Major in Social Studies',
        'Master in Secondary Education',
      ],
      description:
        'Develops competent secondary school teachers specialized in various subject areas with strong content knowledge.',
      faculty: 42,
      students: 1245,
    },
    {
      id: 3,
      name: 'Special Education',
      chair: 'Dr. Patricia Williams',
      programs: [
        'Bachelor of Special Needs Education',
        'Certificate in Inclusive Education',
        'Master in Special Education',
      ],
      description:
        'Trains educators to work with learners with special needs, promoting inclusive education and differentiated instruction.',
      faculty: 28,
      students: 487,
    },
    {
      id: 4,
      name: 'Educational Leadership',
      chair: 'Dr. Robert Anderson',
      programs: [
        'Master in Educational Management',
        'Doctor of Philosophy in Educational Leadership',
        'Certificate in School Administration',
      ],
      description:
        'Develops educational leaders and administrators who can effectively manage and lead educational institutions.',
      faculty: 22,
      students: 356,
    },
    {
      id: 5,
      name: 'Technology Education',
      chair: 'Dr. Jennifer Lee',
      programs: [
        'Bachelor in Educational Technology',
        'Master in Instructional Design',
        'Certificate in E-Learning Development',
      ],
      description:
        'Focuses on integrating technology in education and preparing educators to leverage digital tools for enhanced learning.',
      faculty: 18,
      students: 423,
    },
    {
      id: 6,
      name: 'Physical Education',
      chair: 'Dr. David Martinez',
      programs: [
        'Bachelor of Physical Education',
        'Master in Sports Pedagogy',
        'Certificate in Health and Wellness Education',
      ],
      description:
        'Prepares physical education teachers and coaches who promote health, fitness, and sports development.',
      faculty: 15,
      students: 318,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            Departments & Programs
          </h1>
          <p className="text-xl text-gray-600">
            Discover our diverse academic departments and degree programs
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#2563EB] to-[#60A5FA] rounded-xl shadow-lg p-6 text-white">
            <BookOpen className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">6</div>
            <div className="text-blue-100">Academic Departments</div>
          </div>
          <div className="bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-xl shadow-lg p-6 text-white">
            <GraduationCap className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">22</div>
            <div className="text-green-100">Degree Programs</div>
          </div>
          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg p-6 text-white">
            <Users className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">3,721</div>
            <div className="text-purple-100">Enrolled Students</div>
          </div>
        </div>

        {/* Departments List */}
        <div className="space-y-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-2">
                      {dept.name}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        Department Chair: <strong>{dept.chair}</strong>
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {dept.description}
                    </p>
                  </div>
                  <div className="flex md:flex-col gap-4 md:gap-2 md:ml-8">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg text-center">
                      <div className="text-2xl font-bold text-[#2563EB]">{dept.faculty}</div>
                      <div className="text-xs text-gray-600">Faculty</div>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{dept.students}</div>
                      <div className="text-xs text-gray-600">Students</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Programs Offered:
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {dept.programs.map((program, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-[#2563EB] rounded-full flex-shrink-0"></div>
                        <span className="text-sm">{program}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
            Join thousands of successful educators who began their career at COED. 
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
