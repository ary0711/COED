import SectionDropdown from "../common/SectionDropdown";

import { DepartmentHeaderEditor } from "../DepartmentSectors/DepartmentHeaderEditor";
import {CollegeEditor} from "../DepartmentSectors/CollegeEditor";
import {ProgramEditor} from "../DepartmentSectors/ProgramEditor";
import {ProgramFacultyEditor }from "../DepartmentSectors/ProgramFacultyEditor";
import {DepartmentCTAEditor} from "../DepartmentSectors/DepartmentCTAEditor";

interface Props {
  departmentContent: any;
  updateDepartmentField: any;

  colleges: any[];
  setColleges: any;
}

export default function DepartmentsPageEditor({
  departmentContent,
  updateDepartmentField,
  colleges,
  setColleges,
}: Props) {
  return (
    <>
      <SectionDropdown title="Department Header">
        <DepartmentHeaderEditor
          content={departmentContent}
          updateField={updateDepartmentField}
        />
      </SectionDropdown>

      <SectionDropdown title="Colleges">
        <CollegeEditor
          colleges={colleges}
          setColleges={setColleges}
        />
      </SectionDropdown>

      <SectionDropdown title="Programs">
        <ProgramEditor
          colleges={colleges}
          setColleges={setColleges}
        />
      </SectionDropdown>

      <SectionDropdown title="Program Faculty">
        <ProgramFacultyEditor
          colleges={colleges}
          setColleges={setColleges}
        />
      </SectionDropdown>

      <SectionDropdown title="Call To Action">
        <DepartmentCTAEditor
          content={departmentContent}
          updateField={updateDepartmentField}
        />
      </SectionDropdown>
    </>
  );
}