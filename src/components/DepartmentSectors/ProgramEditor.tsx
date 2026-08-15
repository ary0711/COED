import { Plus, Trash2 } from 'lucide-react';
  
import { useState } from 'react'; 
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

  const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [programToDelete, setProgramToDelete] =
  useState<{
    collegeIndex: number;
    programIndex: number;
  } | null>(null);
  const [showModal, setShowModal] =
  useState(false);

const [selectedCollegeIndex, setSelectedCollegeIndex] =
  useState<number | null>(null);

const [newProgram, setNewProgram] =
  useState({
    program_name: '',
    description: '',
  });

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

  const saveNewProgram = () => {

  if (
    selectedCollegeIndex === null ||
    !newProgram.program_name.trim()
  ) {
    return;
  }

  const updated = [...colleges];

  updated[selectedCollegeIndex]
    .programs.push({
      id: crypto.randomUUID(),
      program_name:
        newProgram.program_name,
      description:
        newProgram.description,
      program_faculty: [],
    });

  setColleges(updated);

  setNewProgram({
    program_name: '',
    description: '',
  });

  setShowModal(false);
};

  const openDeleteModal = (
  collegeIndex: number,
  programIndex: number
) => {

  setProgramToDelete({
    collegeIndex,
    programIndex,
  });

  setShowDeleteModal(true);
};

const confirmDeleteProgram = () => {

  if (!programToDelete) return;

  const updated = [...colleges];

  updated[
    programToDelete.collegeIndex
  ].programs.splice(
    programToDelete.programIndex,
    1
  );

  setColleges(updated);

  setShowDeleteModal(false);

  setProgramToDelete(null);
};

  return (
    <>
      {colleges.map(
        (college, collegeIndex) => (
          <div
            key={college.id}
            className="bg-white p-6 rounded-xl shadow mb-6"
          >
            <div className="flex justify-between items-center mb-4">

              <div>
                <h2 className="font-bold text-xl">
                  Programs - {college.college_name}
                </h2>

                <p className="text-sm text-gray-500">
                  Total Programs:{' '}
                  {college.programs?.length || 0}
                </p>
              </div>

              <button
  onClick={() => {

    setSelectedCollegeIndex(
      collegeIndex
    );

    setNewProgram({
      program_name: '',
      description: '',
    });

    setShowModal(true);

  }}
  className="
    flex
    items-center
    gap-2
    bg-blue-600
    text-white
    px-4
    py-2
    rounded-lg
  "
>
  <Plus size={18} />
  Add Program
</button>

            </div>

            {college.programs?.length > 0 ? (
              college.programs.map(
                (
                  program: any,
                  programIndex: number
                ) => (
                  <div
                    key={
                      program.id ||
                      programIndex
                    }
                    className="
                      border
                      rounded-lg
                      p-4
                      mb-4
                      bg-gray-50
                    "
                  >

                    <div className="flex justify-between items-center mb-3">

                      <h3 className="font-semibold">
                        Program #{programIndex + 1}
                      </h3>

                      <button
                        onClick={() =>
                           openDeleteModal(
                            collegeIndex,
                            programIndex
                          )
                        }
                        className="
                          p-2
                          rounded-lg
                          text-red-600
                          hover:bg-red-100
                        "
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                    <input
                      type="text"
                      placeholder="Program Name"
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
                      className="
                        w-full
                        border
                        p-2
                        rounded
                        mb-3
                      "
                    />

                    <textarea
                      value={
                        program.description
                      }
                      placeholder="Program Description"
                      onChange={(e) =>
                        updateProgram(
                          collegeIndex,
                          programIndex,
                          'description',
                          e.target.value
                        )
                      }
                      rows={3}
                      className="
                        w-full
                        border
                        p-2
                        rounded
                      "
                    />

                  </div>
                )
              )
            ) : (
              <div className="text-center py-6 text-gray-500 border rounded-lg">
                No programs available.
              </div>
            )}
          </div>
        )
      )}
      {showModal && (
  <div
    className="
      fixed
      inset-0
      bg-black/50
      z-50
      flex
      items-center
      justify-center
    "
  >
    <div
      className="
        bg-white
        rounded-xl
        w-full
        max-w-lg
        p-6
      "
    >

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-bold">
          Add New Program
        </h2>

        <button
          onClick={() =>
            setShowModal(false)
          }
        >
          ✕
        </button>

      </div>

      <div className="space-y-4">

        <div>
          <label className="block mb-2 font-medium">
            Program Name
          </label>

          <input
            type="text"
            value={
              newProgram.program_name
            }
            onChange={(e) =>
              setNewProgram({
                ...newProgram,
                program_name:
                  e.target.value,
              })
            }
            className="
              w-full
              border
              rounded-lg
              p-3
            "
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Description
          </label>

          <textarea
            rows={4}
            value={
              newProgram.description
            }
            onChange={(e) =>
              setNewProgram({
                ...newProgram,
                description:
                  e.target.value,
              })
            }
            className="
              w-full
              border
              rounded-lg
              p-3
            "
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() =>
            setShowModal(false)
          }
          className="
            px-4
            py-2
            border
            rounded-lg
          "
        >
          Cancel
        </button>

        <button
          onClick={saveNewProgram}
          className="
            px-4
            py-2
            bg-green-600
            text-white
            rounded-lg
          "
        >
          Save Program
        </button>

      </div>

    </div>
  </div>
)}
{showDeleteModal && (
  <div
    className="
      fixed
      inset-0
      bg-black/50
      z-50
      flex
      items-center
      justify-center
    "
  >
    <div
      className="
        bg-white
        rounded-xl
        w-full
        max-w-md
        p-6
      "
    >

      <div className="text-center">

        <div
          className="
            mx-auto
            w-14
            h-14
            rounded-full
            bg-red-100
            flex
            items-center
            justify-center
            mb-4
          "
        >
          <Trash2
            size={24}
            className="text-red-600"
          />
        </div>

        <h2 className="text-xl font-bold mb-2">
          Delete Program?
        </h2>

        <p className="text-gray-500 mb-6">
          This action cannot be undone.
        </p>

      </div>

      <div className="flex justify-end gap-3">

        <button
          onClick={() => {
            setShowDeleteModal(false);
            setProgramToDelete(null);
          }}
          className="
            px-4
            py-2
            border
            rounded-lg
          "
        >
          Cancel
        </button>

        <button
          onClick={confirmDeleteProgram}
          className="
            px-4
            py-2
            bg-red-600
            text-white
            rounded-lg
            hover:bg-red-700
          "
        >
          Delete
        </button>

      </div>

    </div>
  </div>
)}
    </>
  );
}