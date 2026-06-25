import { Award, CheckCircle, FileText, Calendar } from 'lucide-react';

export function AccreditationPage() {
  const programs = [
    {
      id: 1,
      name: 'Bachelor of Elementary Education (BEEd)',
      level: 'Level IV',
      status: 'Re-Accredited',
      cmoReference: 'CMO 74, s. 2017',
      accreditor: 'AACCUP',
    },
    {
      id: 2,
      name: 'Bachelor of Secondary Education - Major in English (BSEd-English)',
      level: 'Level III',
      status: 'Re-Accredited',
      cmoReference: 'CMO 75, s. 2017',
      accreditor: 'AACCUP',
    },
    {
      id: 3,
      name: 'Bachelor of Secondary Education - Major in Mathematics (BSEd-Math)',
      level: 'Level III',
      status: 'Re-Accredited',
      cmoReference: 'CMO 75, s. 2017',
      accreditor: 'AACCUP',
    },
    {
      id: 4,
      name: 'Bachelor of Technology and Livelihood Education - Home Economics (BTLEd-HE)',
      level: 'Level III',
      status: 'Re-Accredited',
      cmoReference: 'CMO 78, s. 2017',
      accreditor: 'AACCUP',
    },
  ];

  const certifications = [
    {
      id: 1,
      title: 'AACCUP Level 3 & 4 Re-Accredited TEI',
      description: 'Teacher Education Institution status across program levels',
      year: '2025',
    },
    {
      id: 2,
      title: 'CHEd Compliant College',
      description: 'Fully aligned with CHED memoranda and outcomes-based education standards',
      year: '2025',
    },
    {
      id: 3,
      title: 'ISO-Certified Quality Management',
      description: 'Quality Management System certification for institutional processes',
      year: '2025',
    },
    {
      id: 4,
      title: 'Institutional Sustainability Assessment (ISA) Ready',
      description: 'Prepared for long-term institutional sustainability evaluation',
      year: '2025',
    },
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'Level IV':
        return 'bg-purple-100 text-purple-700 border-purple-500';
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
            Gatekeeping for Competence & Excellence
          </p>
        </div>

        {/* Overview */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 mb-12 text-white">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-2">4</div>
              <div className="text-blue-100">Accredited Programs</div>
            </div>
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <div className="text-3xl font-bold mb-2">Level IV</div>
              <div className="text-blue-100">Highest Accreditation Attained</div>
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
              Accreditation is a quality assurance process that certifies educational institutions and programs meet established standards of excellence. The College of Education of Cebu Technological University &ndash; Argao Campus is recognized as an <strong>AACCUP Level 3 &amp; 4 Re-Accredited Teacher Education Institution (TEI)</strong> and a fully <strong>CHEd Compliant College</strong>.
            </p>
            <p>
              The success of the College is more than numbers&mdash;it is the result of systems thinking and values-based leadership, anchored on CHED-mandated outcomes-based education (OBE), ISO-certified quality management, and Institutional Sustainability Assessment (ISA) readiness. Together, these commitments have allowed the College to attain Level IV AACCUP accreditation, the highest level attainable for program-level quality assurance, while continuing to embody its motto: &ldquo;Quality is a race without a finish line.&rdquo;
            </p>
          </div>
        </div>

        {/* Accreditation Levels */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            Understanding Accreditation Levels
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="border-2 border-yellow-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  Level I
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Candidate Status &ndash; Program meets basic standards and shows potential for development
              </p>
            </div>
            <div className="border-2 border-blue-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  Level II
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Fully Accredited &ndash; Program demonstrates quality education and continuous improvement
              </p>
            </div>
            <div className="border-2 border-green-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  Level III
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Re-Accredited Status &ndash; Program exemplifies best practices and outstanding quality
              </p>
            </div>
            <div className="border-2 border-purple-500 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
                  Level IV
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Highest Distinction &ndash; The highest level attainable for program-level quality assurance
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
                    <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{program.status}</span>
                      <span className="text-gray-400">•</span>
                      <span>Accredited by {program.accreditor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">CMO Reference</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {program.cmoReference}
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
          <div className="grid md:grid-cols-4 gap-6">
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