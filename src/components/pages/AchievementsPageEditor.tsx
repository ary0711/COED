import SectionDropdown from "../common/SectionDropdown";

import { AchievementsPageContentEditor } from "../AchievementSectors/AchievementsPageContentEditor";
import {AchievementsStatisticsEditor }from "../AchievementSectors//AchievementsStatisticsEditor";
import {AchievementsTopnotchersEditor }from "../AchievementSectors//AchievementsTopnotchersEditor";
import {AchievementsCollegeEditor }from "../AchievementSectors//AchievementsCollegeEditor";
import {AchievementsBannerEditor }from "../AchievementSectors//AchievementsBannerEditor";
import {AchievementsBannerStatsEditor }from "../AchievementSectors//AchievementsBannerStatsEditor";

interface Props {
  content: any;
  setContent: any;

  statistics: any[];
  setStatistics: any;

  topnotchers: any[];
  setTopnotchers: any;

  achievements: any[];
  setAchievements: any;

  banner: any;
  setBanner: any;

  bannerStats: any[];
  setBannerStats: any;
}

export default function AchievementsPageEditor({
  content,
  setContent,

  statistics,
  setStatistics,

  topnotchers,
  setTopnotchers,

  achievements,
  setAchievements,

  banner,
  setBanner,

  bannerStats,
  setBannerStats,
}: Props) {
  return (
    <>
      <SectionDropdown title="Page Content">
        <AchievementsPageContentEditor
          content={content}
          setContent={setContent}
        />
      </SectionDropdown>

      <SectionDropdown title="Statistics">
        <AchievementsStatisticsEditor
          statistics={statistics}
          setStatistics={setStatistics}
        />
      </SectionDropdown>

      <SectionDropdown title="Topnotchers">
        <AchievementsTopnotchersEditor
          topnotchers={topnotchers}
          setTopnotchers={setTopnotchers}
        />
      </SectionDropdown>

      <SectionDropdown title="College Achievements">
        <AchievementsCollegeEditor
          achievements={achievements}
          setAchievements={setAchievements}
        />
      </SectionDropdown>

      <SectionDropdown title="Banner">
        <AchievementsBannerEditor
          banner={banner}
          setBanner={setBanner}
        />
      </SectionDropdown>

      <SectionDropdown title="Banner Statistics">
        <AchievementsBannerStatsEditor
          stats={bannerStats}
          setStats={setBannerStats}
        />
      </SectionDropdown>
    </>
  );
}