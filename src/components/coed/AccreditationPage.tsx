import { Award, CheckCircle, FileText, Calendar } from 'lucide-react';

export function AccreditationPage() {
  const programs = [
    {
      id: 1,
      name: 'Bachelor of Elementary Education',
      level: 'Level III',
      status: 'Accredited',
      validUntil: 'June 2027',
      accreditor: 'AACCUP',
    },
    {
      id: 2,
      name: 'Bachelor of Secondary Education - English',
      level: 'Level III',
      status: 'Accredited',
      validUntil: 'August 2027',
      accreditor: 'AACCUP',
    },
    {
      id: 3,
      name: 'Bachelor of Secondary Education - Mathematics',
      level: 'Level III',
      status: 'Accredited',
      validUntil: 'August 2027',
      accreditor: 'AACCUP',
    },
    {
      id: 4,
      name: 'Bachelor of Secondary Education - Science',
      level: 'Level II',
      status: 'Accredited',
      validUntil: 'December 2026',
      accreditor: 'AACCUP',
    },
    {
      id: 5,
      name: 'Bachelor of Special Needs Education',
      level: 'Level II',
      status: 'Accredited',
      validUntil: 'March 2027',
      accreditor: 'AACCUP',
    },
    {
      id: 6,
      name: 'Master in Educational Management',
      level: 'Level III',
      status: 'Accredited',
      validUntil: 'May 2028',
      accreditor: 'AACCUP',
    },
  ];

  const certifications = [
    {
      id: 1,
      title: 'CHED Center of Excellence',
      description: 'Awarded for Teacher Education Programs',
      year: '2023',
    },
    {
      id: 2,
      title: 'ISO 9001:2015 Certified',
      description: 'Quality Management System Certification',
      year: '2024',
    },
    {
      id: 3,
      title: 'PACUCOA Institutional Accreditation',
      description: 'Granted Level III Status',
      year: '2025',
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Level III':
        return 'bg-green-100 text-green-700 border-green-500';
      case 'Level II':
        return 'bg-blue-100 text-blue-700 border-blue-500';
      case 'Level I':
        return 'bg-yellow-100 text-yellow-700 border-yellow-500';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">Accreditation</h1>
          <p className="text-xl text-gray-600">
            Recognized for quality and excellence in teacher education
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 mb-12 text-white">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-2">6</div>
              <div className="text-blue-100">Accredited Programs</div>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-2">Level III</div>
              <div className="text-blue-100">Highest Accreditation</div>
            </div>
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-2">AACCUP</div>
              <div className="text-blue-100">Accrediting Agency</div>
            </div>
          </div>
        </div>

        {/* What is Accreditation */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            About Accreditation
          </h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              Accreditation is a quality assurance process that certifies educational institutions and programs meet established standards of excellence. The College of Education is accredited by the Accrediting Agency of Chartered Colleges and Universities in the Philippines (AACCUP), the country's premier accrediting body for higher education.
            </p>
            <p>
              Our accreditation status demonstrates our commitment to continuous improvement and ensures that our graduates receive education that meets national and international standards. This recognition enhances the employability of our graduates and validates the quality of education we provide.
            </p>
          </div>
        </div>

        {/* Accreditation Levels */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            Understanding Accreditation Levels
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-yellow-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  Level I
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Candidate Status - Program meets basic standards and shows potential for development
              </p>
            </div>
            <div className="border-2 border-blue-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  Level II
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Fully Accredited - Program demonstrates quality education and continuous improvement
              </p>
            </div>
            <div className="border-2 border-green-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  Level III
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Excellence Status - Program exemplifies best practices and outstanding quality
              </p>
            </div>
          </div>
        </div>

        {/* Program Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            Program Accreditation Status
          </h2>
          <div className="grid gap-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {program.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{program.status}</span>
                      <span className="text-gray-400">•</span>
                      <span>Accredited by {program.accreditor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Valid Until</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {program.validUntil}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg border-2 font-semibold ${getLevelColor(
                        program.level
                      )}`}
                    >
                      {program.level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Other Certifications */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            Additional Certifications & Recognition
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {cert.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{cert.description}</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-sm font-medium">
                  {cert.year}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
