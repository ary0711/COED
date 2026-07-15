import {Trophy,Award,TrendingUp,Medal,ChevronDown,} from 'lucide-react';

import {useState,useEffect,} from 'react';

import { achievementsService } from '../../landing-page/services/achievementsService';
interface Topnotcher {
  id: string;
  name: string;
  rank: string;
  exam: string;
  exam_date: string;
  rating: string;
  year: string;
  level: string;
  display_order: number;
}

interface CollegeAchievement {
  id: string;
  title: string;
  description: string;
  year: string;
  category: string;
  display_order: number;
}

interface Statistic {
  id: string;
  label: string;
  value: string;
  description: string;
  color: string;
  display_order: number;
}
interface AchievementBanner {
  id: string;

  title: string;
  description: string;

}
interface BannerStat {
  id: string;
  title: string;
  value: string;
  display_order: number;
}

interface AchievementPageContent {
  id: string;

  page_title: string;
  page_subtitle: string;

  topnotchers_title: string;
  topnotchers_filter_label: string;

  college_achievements_title: string;

  button_text: string;
}
interface AchievementPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewBanner?: any;
  previewBannerStats?: any[];
  previewStatistics?: any[];
  previewTopnotchers?: any[];
  previewCollegeAchievements?: any[];
}

export function AchievementsPage({
  previewMode = false,
  previewContent,
  previewBanner,
  previewBannerStats,
  previewStatistics,
  previewTopnotchers,
  previewCollegeAchievements,
}: AchievementPageProps) {

  
  
  const [selectedYear, setSelectedYear] = useState('2025');
  const [pageContent, setPageContent] =
  useState<AchievementPageContent | null>(
    null
  );
  const [bannerStats, setBannerStats] =
  useState<BannerStat[]>([]);
  const [banner, setBanner] =
  useState<AchievementBanner | null>(
    null
  );
const [topnotchersData, setTopnotchersData] =
  useState<Topnotcher[]>([]);

const [
  collegeAchievements,
  setCollegeAchievements,
] = useState<CollegeAchievement[]>([]);

const [statistics, setStatistics] =
  useState<Statistic[]>([]);
  // Complete topnotchers list (sourced from official college records table)
const [loading, setLoading] =
  useState(true);
  useEffect(() => {
  loadAchievements();
}, []);
  const displayPageContent = previewMode
  ? previewContent
  : pageContent;

const displayBanner = previewMode
  ? previewBanner
  : banner;

const displayBannerStats = previewMode
  ? previewBannerStats
  : bannerStats;

const displayStatistics = previewMode
  ? previewStatistics
  : statistics;

const displayTopnotchers = previewMode
  ? previewTopnotchers
  : topnotchersData;

const displayCollegeAchievements = previewMode
  ? previewCollegeAchievements
  : collegeAchievements;
const loadAchievements =
  async () => {
    try {

      const [
        topnotchers,
        achievements,
        stats,
         bannerData,
         bannerStatsData,
        pageContentData,
      ] = await Promise.all([
        achievementsService.getTopnotchers(),
        achievementsService.getCollegeAchievements(),
        achievementsService.getStatistics(),
        achievementsService.getBanner(),
        achievementsService.getBannerStats(),
          achievementsService.getPageContent(),
      ]);

      setTopnotchersData(
        topnotchers || []
      );

      setCollegeAchievements(
        achievements || []
      );

      setStatistics(
        stats || []
      );
      setBanner(bannerData);
      setPageContent(pageContentData);
      setBannerStats(
  bannerStatsData || []
);


      if (
        topnotchers &&
        topnotchers.length > 0
      ) {
        setSelectedYear(
          topnotchers[0].year
        );

      }

    } catch (error) {
      console.error(
        'Failed loading achievements:',
        error
      );
    } finally {
      setLoading(false);
    }
  };
const getCategoryColor = (
  category: string
) => {
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
  const getRankColor = (
  rank: string
) => {
    if (rank.includes('1st') || rank.includes('National')) {
      return 'from-yellow-400 to-yellow-600';
    } else if (rank.includes('2') || rank.includes('3') || rank.includes('4')) {
      return 'from-slate-300 to-slate-500';
    }
    return 'from-orange-300 to-orange-500';
  };

  // Years sorted most recent first
  const years = Array.from(
  new Set(
    (displayTopnotchers || []).map(
      (t) => t.year
    )
  )
).sort(
  (a, b) =>
    Number(b) - Number(a)
);

  const filteredTopnotchers =
  (displayTopnotchers || []).filter(
    (topnotcher) =>
      topnotcher.year === selectedYear
  );
if (!previewMode && loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-[#1E3A8A]">
          Loading Achievements...
        </h2>

        <p className="text-gray-500 mt-2">
          Please wait while we load the page.
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4"> {displayPageContent?.page_title}</h1>
          <p className="text-xl text-gray-600">
            {displayPageContent?.page_subtitle}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {displayStatistics?.map((stat, index) => (
           <div
  key={index}
  className="rounded-xl shadow-lg p-6 text-white"
  style={{
    background: stat.color
      ? `linear-gradient(135deg, ${stat.color.split(',')[0]}, ${stat.color.split(',')[1]})`
      : '#2563EB'
  }}
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
               {displayPageContent?.topnotchers_title}
              </h2>
            </div>

            {/* Year Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
              {displayPageContent?.topnotchers_filter_label}
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
                      <strong>Date:</strong> {topnotcher.exam_date}
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
             {displayPageContent?.college_achievements_title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {displayCollegeAchievements?.map((achievement) => (
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
               {displayBanner?.title}
              </h2>
              <p className="text-blue-100 mb-6 leading-relaxed">
 {displayBanner?.description}              </p>
              <button className="px-6 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
              {displayPageContent?.button_text}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">

  {displayBannerStats?.map(
    (stat, index) => {

      const icons = [
        <TrendingUp
          key="trend"
          className="w-8 h-8 mx-auto mb-2"
        />,
        <Trophy
          key="trophy"
          className="w-8 h-8 mx-auto mb-2"
        />,
        <Award
          key="award"
          className="w-8 h-8 mx-auto mb-2"
        />,
        <Medal
          key="medal"
          className="w-8 h-8 mx-auto mb-2"
        />,
      ];

      return (
        <div
          key={stat.id}
          className="
            bg-white/10
            backdrop-blur-sm
            rounded-lg
            p-4
            text-center
            text-white
          "
        >
          {icons[index]}

          <div className="text-2xl font-bold">
            {stat.value}
          </div>

          <div className="text-sm opacity-90">
            {stat.title}
          </div>
        </div>
      );
    }
  )}

</div>
          </div>
        </div>
      </div>
    </div>
  );
}