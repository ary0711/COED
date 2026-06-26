import { Trophy, Award, TrendingUp, Medal, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function AchievementsPage() {
  const [selectedYear, setSelectedYear] = useState('2025');

  // Complete topnotchers list (sourced from official college records table)
  const topnotchersData = [
    {
      id: 1,
      name: 'Jima S. Bejagan',
      rank: '4th Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary',
      date: 'August 1998',
      rating: '84.00%',
      year: '1998',
      level: 'Secondary',
    },
    {
      id: 2,
      name: 'Jerome L. Abregana',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2012',
      rating: '86.40%',
      year: '2012',
      level: 'Elementary',
    },
    {
      id: 3,
      name: 'Marichu F. Abregana',
      rank: '3rd Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2023',
      rating: '94.00%',
      year: '2023',
      level: 'Elementary',
    },
    {
      id: 4,
      name: 'Era Zaira S. Lizardo',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2023',
      rating: '92.60%',
      year: '2023',
      level: 'Elementary',
    },
    {
      id: 5,
      name: 'Rhea C. Pino',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2023',
      rating: '92.60%',
      year: '2023',
      level: 'Elementary',
    },
    {
      id: 6,
      name: 'Fritzie Mae S. Unabia',
      rank: '1st Place - National Topnotcher',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'March 2022',
      rating: '92.22%',
      year: '2022',
      level: 'Elementary',
    },
    {
      id: 7,
      name: 'Rizalie Jan Cabrera',
      rank: '7th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2024',
      rating: '92.80%',
      year: '2024',
      level: 'Elementary',
    },
    {
      id: 8,
      name: 'Gleziel Jardin Ludovice',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2024',
      rating: '92.20%',
      year: '2024',
      level: 'Elementary',
    },
    {
      id: 9,
      name: 'Diana Rose M. Ponce',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2024',
      rating: '92.20%',
      year: '2024',
      level: 'Elementary',
    },
    {
      id: 10,
      name: 'Sheen S. Montezon',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary (BSEd Math)',
      date: 'March 2025',
      rating: '92.20%',
      year: '2025',
      level: 'Secondary',
    },
    {
      id: 11,
      name: 'Kassandra Cristina E. Amancio',
      rank: '8th Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary (BTLED)',
      date: 'September 2025',
      rating: '92.60%',
      year: '2025',
      level: 'Secondary',
    },
    {
      id: 12,
      name: 'Leendon S. Gelborion',
      rank: '10th Place',
      exam: 'Licensure Examination for Teachers (LET) - Secondary (BTLED)',
      date: 'September 2025',
      rating: '93.00%',
      year: '2025',
      level: 'Secondary',
    },
    {
      id: 13,
      name: 'Clyde Zeph F. Payusan',
      rank: '9th Place',
      exam: 'Licensure Examination for Teachers (LET) - Elementary',
      date: 'September 2025',
      rating: '92.40%',
      year: '2025',
      level: 'Elementary',
    },
  ];

  const collegeAchievements = [
    {
      id: 1,
      title: 'Level IV AACCUP Accreditation Status',
      description: 'Highest level of program-level accreditation achieved',
      year: '2025',
      category: 'Accreditation',
    },
    {
      id: 2,
      title: 'Rank 2 Top Performing School (Elementary)',
      description: 'National ranking with 97.10% passing rate',
      year: '2025',
      category: 'Academic Excellence',
    },
    {
      id: 3,
      title: '1st National Topnotcher',
      description: 'Fritzie Mae S. Unabia - Elementary Level',
      year: '2022',
      category: 'Recognition',
    },
    {
      id: 4,
      title: 'Center of Excellence',
      description: 'Designated by CHED for Teacher Education Programs',
      year: '2023',
      category: 'Recognition',
    },
    {
      id: 5,
      title: 'Consistent Top Performer Status',
      description: 'Producing LET topnotchers across multiple decades',
      year: '2025',
      category: 'Excellence',
    },
  ];

  const statistics = [
    {
      label: 'LET Passing Rate (Sept 2025)',
      value: '97.10%',
      description: 'Elementary Level',
      color: 'from-[#10B981] to-[#34D399]',
    },
    {
      label: 'Topnotchers Produced',
      value: '13',
      description: 'Since 1998',
      color: 'from-[#F59E0B] to-[#FBBF24]',
    },
    {
      label: 'Highest Ranking',
      value: '1st',
      description: 'National Topnotcher 2022',
      color: 'from-[#8B5CF6] to-[#A78BFA]',
    },
    {
      label: 'Years of Excellence',
      value: '32+',
      description: 'Since Inception',
      color: 'from-[#2563EB] to-[#60A5FA]',
    },
  ];

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Accreditation':
        return 'bg-blue-100 text-blue-700';
      case 'Academic Excellence':
        return 'bg-green-100 text-green-700';
      case 'Recognition':
        return 'bg-purple-100 text-purple-700';
      case 'Excellence':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRankColor = (rank) => {
    if (rank.includes('1st') || rank.includes('National')) {
      return 'from-yellow-400 to-yellow-600';
    } else if (rank.includes('2') || rank.includes('3') || rank.includes('4')) {
      return 'from-slate-300 to-slate-500';
    }
    return 'from-orange-300 to-orange-500';
  };

  // Years sorted most recent first
  const years = Array.from(new Set(topnotchersData.map((t) => t.year))).sort(
    (a, b) => Number(b) - Number(a)
  );

  const filteredTopnotchers = topnotchersData.filter(
    (topnotcher) => topnotcher.year === selectedYear
  );

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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold text-[#1E3A8A]">
                LET Topnotchers
              </h2>
            </div>

            {/* Year Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                Filter by Year:
              </label>
              <div className="relative">
                <select
                  id="year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-lg font-medium bg-white text-[#1E3A8A] border-2 border-[#1E3A8A] hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E3A8A] pointer-events-none" />
              </div>
            </div>
          </div>

          {filteredTopnotchers.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTopnotchers.map((topnotcher, index) => (
                <div
                  key={topnotcher.id}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${getRankColor(
                          topnotcher.rank
                        )} rounded-full flex items-center justify-center text-white font-bold text-sm text-center p-1`}
                      >
                        {topnotcher.rank.split(' ')[0]}
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
                    <div className="mt-3 inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        topnotcher.level === 'Elementary'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {topnotcher.level} Level
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">
                No topnotchers found for the selected year.
              </p>
            </div>
          )}
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
                For over 32 years, CTU-Argao's College of Education has been forging educators who excel in their profession and make significant contributions to the nation's educational landscape.
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
                <div className="text-2xl font-bold">13</div>
                <div className="text-sm opacity-90">Topnotchers (Since 1998)</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">97.10%</div>
                <div className="text-sm opacity-90">Passing Rate 2025</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white">
                <Medal className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">Level IV</div>
                <div className="text-sm opacity-90">AACCUP Accreditation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}