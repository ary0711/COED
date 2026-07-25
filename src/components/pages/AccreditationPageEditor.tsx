import SectionDropdown from "../common/SectionDropdown";

import { AccreditationContentEditor } from "../AccreditationSectors/AccreditationContentEditor";
import {AccreditationOverviewEditor }from "../AccreditationSectors/AccreditationOverviewEditor";
import {AccreditationLevelsEditor }from "../AccreditationSectors/AccreditationLevelsEditor";
import {AccreditationProgramsEditor }from "../AccreditationSectors/AccreditationProgramsEditor";
import {AccreditationCertificationsEditor }from "../AccreditationSectors/AccreditationCertificationsEditor";

interface Props {
  content: any;
  setContent: any;

  overview: any[];
  setOverview: any;

  levels: any[];
  setLevels: any;

  programs: any[];
  setPrograms: any;

  certifications: any[];
  setCertifications: any;
}

export default function AccreditationPageEditor({
  content,
  setContent,

  overview,
  setOverview,

  levels,
  setLevels,

  programs,
  setPrograms,

  certifications,
  setCertifications,
}: Props) {
  return (
    <>
      <SectionDropdown title="Page Content">
        <AccreditationContentEditor
          content={content}
          setContent={setContent}
        />
      </SectionDropdown>

      <SectionDropdown title="Overview">
        <AccreditationOverviewEditor
          overview={overview}
          setOverview={setOverview}
        />
      </SectionDropdown>

      <SectionDropdown title="Accreditation Levels">
        <AccreditationLevelsEditor
          levels={levels}
          setLevels={setLevels}
        />
      </SectionDropdown>

      <SectionDropdown title="Programs">
        <AccreditationProgramsEditor
          programs={programs}
          setPrograms={setPrograms}
        />
      </SectionDropdown>

      <SectionDropdown title="Certifications">
        <AccreditationCertificationsEditor
          certifications={certifications}
          setCertifications={setCertifications}
        />
      </SectionDropdown>
    </>
  );
}