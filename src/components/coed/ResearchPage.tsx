import { BookOpen, Award, Users, ExternalLink } from 'lucide-react';

export function ResearchPage() {
  const researches = [
    {
      id: 1,
      title: 'Innovative Teaching Strategies in the Digital Age',
      authors: 'Dr. Sarah Johnson, Dr. Michael Chen',
      journal: 'Journal of Educational Technology',
      year: '2025',
      category: 'Research',
    },
    {
      id: 2,
      title: 'Impact of Inclusive Education on Student Achievement',
      authors: 'Dr. Patricia Williams',
      journal: 'International Journal of Special Education',
      year: '2025',
      category: 'Research',
    },
    {
      id: 3,
      title: 'Leadership Practices in High-Performing Schools',
      authors: 'Dr. Robert Anderson, Dr. Jennifer Lee',
      journal: 'Educational Management Review',
      year: '2024',
      category: 'Research',
    },
    {
      id: 4,
      title: 'Community Literacy Program: A Year in Review',
      authors: 'COED Extension Office',
      journal: 'University Extension Report',
      year: '2025',
      category: 'Extension',
    },
    {
      id: 5,
      title: 'Teacher Training Workshops for Rural Schools',
      authors: 'Dr. David Martinez, Extension Team',
      journal: 'Community Outreach Initiative',
      year: '2025',
      category: 'Extension',
    },
  ];

  const achievements = [
    {
      id: 1,
      title: 'Excellence in Teacher Education Award',
      recipient: 'College of Education',
      year: '2025',
      organization: 'National Commission on Higher Education',
    },
    {
      id: 2,
      title: 'Outstanding Research Publication',
      recipient: 'Dr. Sarah Johnson',
      year: '2025',
      organization: 'Philippine Educational Research Association',
    },
    {
      id: 3,
      title: 'Best Community Extension Program',
      recipient: 'COED Extension Office',
      year: '2024',
      organization: 'University Awards',
    },
    {
      id: 4,
      title: 'Innovation in Educational Technology',
      recipient: 'Dr. Jennifer Lee',
      year: '2024',
      organization: 'Asian EdTech Conference',
    },
  ];

  const alumni = [
    {
      id: 1,
      name: 'Maria Santos',
      year: '2018',
      position: 'Principal, Metropolitan High School',
      achievement: 'Led school to receive National Excellence Award',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      year: '2015',
      position: 'Division Superintendent, Department of Education',
      achievement: 'Implemented innovative district-wide literacy program',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    },
    {
      id: 3,
      name: 'Ana Reyes',
      year: '2020',
      position: 'Master Teacher, Science Department',
      achievement: 'National Top 1 Licensure Examination Topnotcher',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            Research, Extension & Achievements
          </h1>
          <p className="text-xl text-gray-600">
            Showcasing our contributions to education and community development
          </p>
        </div>

        {/* Published Research */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              Published Research & Extension
            </h2>
          </div>
          <div className="grid gap-4">
            {researches.map((research) => (
              <div
                key={research.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          research.category === 'Research'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {research.category}
                      </span>
                      <span className="text-sm text-gray-600">{research.year}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {research.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Authors:</strong> {research.authors}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Published in:</strong> {research.journal}
                    </p>
                  </div>
                  <button className="ml-4 p-2 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Awards & Recognition */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              Awards & Recognition
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {achievement.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Recipient:</strong> {achievement.recipient}
                  </p>
                  <p>
                    <strong>Awarded by:</strong> {achievement.organization}
                  </p>
                  <p>
                    <strong>Year:</strong> {achievement.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alumni Highlights */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              Featured Alumni
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {alumni.map((alumnus) => (
              <div
                key={alumnus.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] overflow-hidden">
                  <img
                    src={alumnus.image}
                    alt={alumnus.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {alumnus.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Class of {alumnus.year}
                  </p>
                  <p className="text-sm font-medium text-[#2563EB] mb-3">
                    {alumnus.position}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {alumnus.achievement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-3">
            Be Part of Our Success Story
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our community of educators making a difference. Start your journey with COED today.
          </p>
          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
