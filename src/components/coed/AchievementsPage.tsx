import { Trophy, Award, TrendingUp, Medal } from 'lucide-react';

export function AchievementsPage() {
  const topnotchers = [
    {
      id: 1,
      name: 'Maria Gabriela Santos',
      rank: '1st Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2025',
      rating: '96.8%',
    },
    {
      id: 2,
      name: 'John Michael Reyes',
      rank: '3rd Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary',
      date: 'September 2025',
      rating: '95.2%',
    },
    {
      id: 3,
      name: 'Ana Marie Cruz',
      rank: '5th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'March 2025',
      rating: '94.8%',
    },
    {
      id: 4,
      name: 'Rafael Antonio Lopez',
      rank: '8th Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary',
      date: 'March 2025',
      rating: '93.5%',
    },
  ];

  const collegeAchievements = [
    {
      id: 1,
      title: 'Level III Accreditation Status',
      description: 'All undergraduate programs receive highest accreditation level',
      year: '2025',
      category: 'Accreditation',
    },
    {
      id: 2,
      title: '98% LET Passing Rate',
      description: 'Consistently above national average for 10 consecutive years',
      year: '2025',
      category: 'Academic Excellence',
    },
    {
      id: 3,
      title: 'Best College of Education Award',
      description: 'Recognized by National Association of Teacher Education',
      year: '2024',
      category: 'Recognition',
    },
    {
      id: 4,
      title: 'International Research Partnership',
      description: 'Collaborative projects with universities in 5 countries',
      year: '2024',
      category: 'Research',
    },
    {
      id: 5,
      title: 'Center of Excellence',
      description: 'Designated by CHED for Teacher Education Programs',
      year: '2023',
      category: 'Recognition',
    },
    {
      id: 6,
      title: 'Community Impact Award',
      description: 'Outstanding extension services benefiting 50+ communities',
      year: '2025',
      category: 'Extension',
    },
  ];

  const statistics = [
    {
      label: 'LET Passing Rate',
      value: '98%',
      description: '10-year average',
      color: 'from-[#10B981] to-[#34D399]',
    },
    {
      label: 'Topnotchers Produced',
      value: '47',
      description: 'Last 5 years',
      color: 'from-[#F59E0B] to-[#FBBF24]',
    },
    {
      label: 'Research Publications',
      value: '285',
      description: 'Since 2020',
      color: 'from-[#8B5CF6] to-[#A78BFA]',
    },
    {
      label: 'Alumni Employed',
      value: '99%',
      description: 'Within 6 months',
      color: 'from-[#2563EB] to-[#60A5FA]',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Accreditation':
        return 'bg-blue-100 text-blue-700';
      case 'Academic Excellence':
        return 'bg-green-100 text-green-700';
      case 'Recognition':
        return 'bg-purple-100 text-purple-700';
      case 'Research':
        return 'bg-orange-100 text-orange-700';
      case 'Extension':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">Achievements</h1>
          <p className="text-xl text-gray-600">
            Celebrating excellence and success in education
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {statistics.map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.color} rounded-xl shadow-lg p-6 text-white`}
            >
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-1 opacity-90">{stat.label}</div>
              <div className="text-sm opacity-80">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Topnotchers Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              Recent Topnotchers
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {topnotchers.map((topnotcher, index) => (
              <div
                key={topnotcher.id}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {topnotcher.name}
                      </h3>
                      <p className="text-sm font-medium text-yellow-600">
                        {topnotcher.rank}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2563EB]">
                      {topnotcher.rating}
                    </div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Examination:</strong> {topnotcher.exam}
                  </p>
                  <p>
                    <strong>Date:</strong> {topnotcher.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* College Achievements */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              College Achievements
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {collegeAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      achievement.category
                    )}`}
                  >
                    {achievement.category}
                  </span>
                  <span className="text-sm text-gray-600">{achievement.year}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recognition Banner */}
        <div className="mt-12 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8 items-center">
            <div className="text-white">
              <Medal className="w-12 h-12 mb-4 opacity-90" />
              <h2 className="text-2xl font-semibold mb-3">
                Excellence is Our Tradition
              </h2>
              <p className="text-blue-100 mb-6 leading-relaxed">
                For over 32 years, COED has been producing top-performing graduates who excel in their careers and make significant contributions to education and society.
              </p>
              <button className="px-6 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
                Join Our Legacy
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">32+</div>
                <div className="text-sm opacity-90">Years of Excellence</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">150+</div>
                <div className="text-sm opacity-90">Awards Received</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">5,000+</div>
                <div className="text-sm opacity-90">Graduates</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <Medal className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">Level III</div>
                <div className="text-sm opacity-90">Accreditation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
