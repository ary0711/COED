interface Props {
  programs: any[];
  setPrograms: (data: any[]) => void;
}

export function AccreditationProgramsEditor({
  programs,
  setPrograms,
}: Props) {

  const updateProgram = (
    id: string,
    field: string,
    value: string
  ) => {
    setPrograms(
      programs.map(program =>
        program.id === id
          ? {
              ...program,
              [field]: value,
            }
          : program
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">

      <h2 className="text-xl font-bold mb-4">
        Programs
      </h2>

      {programs.map((program) => (

        <div
          key={program.id}
          className="border rounded-lg p-4 mb-3"
        >

          <input
            value={program.name || ''}
            onChange={(e) =>
              updateProgram(
                program.id,
                'name',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
            placeholder="Program Name"
          />

          <input
            value={program.status || ''}
            onChange={(e) =>
              updateProgram(
                program.id,
                'status',
                e.target.value
              )
            }
            className="w-full border p-2 mb-2"
            placeholder="Status"
          />

          <input
            value={program.accreditor || ''}
            onChange={(e) =>
              updateProgram(
                program.id,
                'accreditor',
                e.target.value
              )
            }
            className="w-full border p-2"
            placeholder="Accreditor"
          />

        </div>

      ))}

    </div>
  );
}