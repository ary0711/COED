import SectionDropdown from "../common/SectionDropdown";

import AboutHeaderEditor from "../AboutPageSectors/AboutHeaderEditor";
import HistoryEditor from "../AboutPageSectors/HistoryEditor";
import VisionMissionGoalsEditor from "../AboutPageSectors/VisionMissionGoalsEditor";
import CoreValuesEditor from "../AboutPageSectors/CoreValuesEditor";
import TeamStructureEditor from "../AboutPageSectors/TeamStructureEditor";
import AboutStatsEditor from "../AboutPageSectors/AboutStatsEditor";
import AboutOurCoreValuesEditor from "../AboutPageSectors/AboutOurCoreValuesEditor";

interface Props{

  aboutContent:any;
  updateAboutField:any;

  coreValues:any[];
  setCoreValues:any;

  facultyMembers:any[];
  setFacultyMembers:any;

  departments:any[];

  aboutStats:any[];
  setAboutStats:any;

  coreValueCards:any[];
  setCoreValueCards:any;
}

export default function AboutPageEditor(props:Props){

return(

<>

<SectionDropdown title="Header">
<AboutHeaderEditor
content={props.aboutContent}
updateField={props.updateAboutField}
/>
</SectionDropdown>

<SectionDropdown title="History">
<HistoryEditor
content={props.aboutContent}
updateField={props.updateAboutField}
/>
</SectionDropdown>

<SectionDropdown title="Vision Mission Goals">
<VisionMissionGoalsEditor
content={props.aboutContent}
updateField={props.updateAboutField}
/>
</SectionDropdown>

<SectionDropdown title="Core Values">
<CoreValuesEditor
values={props.coreValues}
setValues={props.setCoreValues}
/>
</SectionDropdown>

<SectionDropdown title="Team Structure">

<TeamStructureEditor
content={props.aboutContent}
updateField={props.updateAboutField}
facultyMembers={props.facultyMembers}
setFacultyMembers={props.setFacultyMembers}
departments={props.departments}
/>

</SectionDropdown>

<SectionDropdown title="Statistics">

<AboutStatsEditor
stats={props.aboutStats}
setStats={props.setAboutStats}
/>

</SectionDropdown>

<SectionDropdown title="Core Value Cards">

<AboutOurCoreValuesEditor
values={props.coreValueCards}
setValues={props.setCoreValueCards}
/>

</SectionDropdown>

</>

)

}