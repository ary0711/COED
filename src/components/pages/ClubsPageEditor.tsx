import SectionDropdown from "../common/SectionDropdown";

import { ClubsHeaderEditor } from "../ClubSectors/ClubsHeaderEditor";
import {ClubsStatisticsEditor }from "../ClubSectors/ClubsStatisticsEditor";
import {OrganizationEditor }from "../ClubSectors/OrganizationEditor";
import {CommitteeEditor } from "../ClubSectors/CommitteeEditor";
import {ClubsCTAEditor }from "../ClubSectors/ClubsCTAEditor";

interface Props {
  clubsContent: any;
  updateClubsField: any;

  statistics: any[];
  setStatistics: any;

  organizations: any[];
  setOrganizations: any;

  committees: any[];
  setCommittees: any;
}

export default function ClubsPageEditor({
  clubsContent,
  updateClubsField,

  statistics,
  setStatistics,

  organizations,
  setOrganizations,

  committees,
  setCommittees,
}: Props) {
  return (
    <>
      <SectionDropdown title="Header">
        <ClubsHeaderEditor
          content={clubsContent}
          updateField={updateClubsField}
        />
      </SectionDropdown>

      <SectionDropdown title="Statistics">
        <ClubsStatisticsEditor
          statistics={statistics}
          setStatistics={setStatistics}
        />
      </SectionDropdown>

      <SectionDropdown title="Organizations">
        <OrganizationEditor
          organizations={organizations}
          setOrganizations={setOrganizations}
        />
      </SectionDropdown>

      <SectionDropdown title="Committees">
        <CommitteeEditor
          committees={committees}
          setCommittees={setCommittees}
        />
      </SectionDropdown>

      <SectionDropdown title="Call To Action">
        <ClubsCTAEditor
          content={clubsContent}
          updateField={updateClubsField}
        />
      </SectionDropdown>
    </>
  );
}