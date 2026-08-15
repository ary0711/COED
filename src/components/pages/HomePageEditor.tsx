import SectionDropdown from "../common/SectionDropdown";

import { HeroSectionEditor } from "../HomePageSectors/HeroSectionEditor";
import {AboutSectionEditor} from "../HomePageSectors/AboutSectionEditor";
import {FeaturesEditor} from "../HomePageSectors/FeaturesEditor";
import {StatsEditor }from "../HomePageSectors/StatsEditor";
import {AnnouncementsEditor} from "../HomePageSectors/AnnouncementsEditor";
import {CTASectionEditor} from "../HomePageSectors/CTASectionEditor";

interface Props {

  homeContent:any;
  updateHomepageField:any;

  features:any[];
  setFeatures:any;

  stats:any[];
  setStats:any;

  announcements:any[];
  setAnnouncements:any;
}

export default function HomePageEditor({

  homeContent,
  updateHomepageField,

  features,
  setFeatures,

  stats,
  setStats,

  announcements,
  setAnnouncements,

}: Props) {

  return (
    <>

      <SectionDropdown title="Hero Section">

        <HeroSectionEditor
          content={homeContent}
          updateField={updateHomepageField}
        />

      </SectionDropdown>

      <SectionDropdown title="About Section">

        <AboutSectionEditor
          content={homeContent}
          updateField={updateHomepageField}
        />

      </SectionDropdown>

      <SectionDropdown title="Features">

        <FeaturesEditor
          features={features}
          setFeatures={setFeatures}
        />

      </SectionDropdown>

      <SectionDropdown title="Statistics">

        <StatsEditor
          stats={stats}
          setStats={setStats}
        />

      </SectionDropdown>

      <SectionDropdown title="Announcements">

        <AnnouncementsEditor
          announcements={announcements}
          setAnnouncements={setAnnouncements}
        />

      </SectionDropdown>

      <SectionDropdown title="Call To Action">

        <CTASectionEditor
          content={homeContent}
          updateField={updateHomepageField}
        />

      </SectionDropdown>

    </>
  );
}