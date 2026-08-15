import SectionDropdown from "../common/SectionDropdown";

import { ResearchHeaderEditor } from "../ResearchSectors/ResearchHeaderEditor";
import {ResearchPublicationsEditor }from "../ResearchSectors/ResearchPublicationsEditor";
import {ResearchAwardsEditor }from "../ResearchSectors/ResearchAwardsEditor";
import {FeaturedAlumniEditor }from "../ResearchSectors/FeaturedAlumniEditor";
import {ResearchCTAEditor }from "../ResearchSectors/ResearchCTAEditor";

interface Props {
  researchContent: any;
  updateResearchField: any;

  publications: any[];
  setPublications: any;

  awards: any[];
  setAwards: any;

  alumni: any[];
  setAlumni: any;
}

export default function ResearchPageEditor({
  researchContent,
  updateResearchField,

  publications,
  setPublications,

  awards,
  setAwards,

  alumni,
  setAlumni,
}: Props) {
  return (
    <>
      <SectionDropdown title="Header">
        <ResearchHeaderEditor
          content={researchContent}
          updateField={updateResearchField}
        />
      </SectionDropdown>

      <SectionDropdown title="Research Publications">
        <ResearchPublicationsEditor
          publications={publications}
          setPublications={setPublications}
        />
      </SectionDropdown>

      <SectionDropdown title="Research Awards">
        <ResearchAwardsEditor
          awards={awards}
          setAwards={setAwards}
        />
      </SectionDropdown>

      <SectionDropdown title="Featured Alumni">
        <FeaturedAlumniEditor
          alumni={alumni}
          setAlumni={setAlumni}
        />
      </SectionDropdown>

      <SectionDropdown title="Call To Action">
        <ResearchCTAEditor
          content={researchContent}
          updateField={updateResearchField}
        />
      </SectionDropdown>
    </>
  );
}