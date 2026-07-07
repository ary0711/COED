interface Props {
  colleges: any[];
  setColleges: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

export function ProgramEditor({
  colleges,
  setColleges,
}: Props) {
  const updateProgram = (
    collegeIndex: number,
    programIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...colleges];

    updated[collegeIndex]
      .programs[programIndex][field] =
      value;

    setColleges(updated);
  };

  const addProgram = (
    collegeIndex: number
  ) => {
    const updated = [...colleges];

    updated[collegeIndex].programs.push({
      program_name: '',
      description: '',
      program_faculty: [],
    });

    setColleges(updated);
  };

  return (
    <>
      {colleges.map(
        (college, collegeIndex) => (
          <div
            key={college.id}
            className="bg-white p-6 rounded-xl shadow mb-6"
          >
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-xl">
                Programs -
                {college.college_name}
              </h2>

              <button
                onClick={() =>
                  addProgram(
                    collegeIndex
                  )
                }
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Add Program
              </button>
            </div>

            {college.programs?.map(
              (
                program: any,
                programIndex: number
              ) => (
                <div
                  key={programIndex}
                  className="border rounded-lg p-4 mb-4"
                >
                  <input
                    type="text"
                    value={
                      program.program_name
                    }
                    onChange={(e) =>
                      updateProgram(
                        collegeIndex,
                        programIndex,
                        'program_name',
                        e.target.value
                      )
                    }
                    className="w-full border p-2 rounded mb-3"
                  />

                  <textarea
                    value={
                      program.description
                    }
                    onChange={(e) =>
                      updateProgram(
                        collegeIndex,
                        programIndex,
                        'description',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full border p-2 rounded"
                  />
                </div>
              )
            )}
          </div>
        )
      )}
    </>
  );
}