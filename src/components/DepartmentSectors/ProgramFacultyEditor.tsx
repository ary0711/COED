interface Props {
  colleges: any[];
  setColleges: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

export function ProgramFacultyEditor({
  colleges,
  setColleges,
}: Props) {
  const updateFaculty = (
    collegeIndex: number,
    programIndex: number,
    facultyIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...colleges];

    updated[collegeIndex]
      .programs[programIndex]
      .program_faculty[
        facultyIndex
      ][field] = value;

    setColleges(updated);
  };

  return (
    <>
      {colleges.map(
        (college, collegeIndex) =>
          college.programs?.map(
            (
              program: any,
              programIndex: number
            ) => (
              <div
                key={
                  program.id
                }
                className="bg-white p-6 rounded-xl shadow mb-6"
              >
                <h2 className="text-xl font-bold mb-4">
                  Faculty -
                  {program.program_name}
                </h2>

                {program.program_faculty?.map(
                  (
                    faculty: any,
                    facultyIndex: number
                  ) => (
                    <div
                      key={
                        faculty.id
                      }
                      className="border p-4 rounded-lg mb-3"
                    >
                      <input
                        type="text"
                        value={
                          faculty.faculty_name
                        }
                        onChange={(
                          e
                        ) =>
                          updateFaculty(
                            collegeIndex,
                            programIndex,
                            facultyIndex,
                            'faculty_name',
                            e.target.value
                          )
                        }
                        className="w-full border p-2 rounded mb-3"
                      />

                      <input
                        type="text"
                        value={
                          faculty.position
                        }
                        onChange={(
                          e
                        ) =>
                          updateFaculty(
                            collegeIndex,
                            programIndex,
                            facultyIndex,
                            'position',
                            e.target.value
                          )
                        }
                        className="w-full border p-2 rounded"
                      />
                    </div>
                  )
                )}
              </div>
            )
          )
      )}
    </>
  );
}