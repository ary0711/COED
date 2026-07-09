import { useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';

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
  const [showAddModal, setShowAddModal] =
  useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [selectedProgram, setSelectedProgram] =
  useState<{
    collegeIndex: number;
    programIndex: number;
  } | null>(null);

const [selectedFaculty, setSelectedFaculty] =
  useState<{
    collegeIndex: number;
    programIndex: number;
    facultyIndex: number;
  } | null>(null);

const [newFaculty, setNewFaculty] =
  useState({
    faculty_name: '',
    position: '',
  });
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
const addFaculty = () => {

  if (
    !selectedProgram ||
    !newFaculty.faculty_name.trim()
  ) {
    return;
  }

  const updated = [...colleges];

  updated[
    selectedProgram.collegeIndex
  ].programs[
    selectedProgram.programIndex
  ].program_faculty.push({
    id: crypto.randomUUID(),
    faculty_name:
      newFaculty.faculty_name,
    position:
      newFaculty.position,
  });

  setColleges(updated);

  setNewFaculty({
    faculty_name: '',
    position: '',
  });

  setShowAddModal(false);
};

const deleteFaculty = () => {

  if (!selectedFaculty) return;

  const updated = [...colleges];

  updated[
    selectedFaculty.collegeIndex
  ]
    .programs[
      selectedFaculty.programIndex
    ]
    .program_faculty.splice(
      selectedFaculty.facultyIndex,
      1
    );

  setColleges(updated);

  setShowDeleteModal(false);

  setSelectedFaculty(null);
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
                <div className="flex justify-between items-center mb-4">

  <div>
    <h2 className="text-xl font-bold">
      Faculty - {program.program_name}
    </h2>

    <p className="text-sm text-gray-500">
      Total Faculty:
      {' '}
      {program.program_faculty?.length || 0}
    </p>
  </div>

  <button
    onClick={() => {

      setSelectedProgram({
        collegeIndex,
        programIndex,
      });

      setNewFaculty({
        faculty_name: '',
        position: '',
      });

      setShowAddModal(true);

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
    Add Faculty
  </button>

</div>

                {program.program_faculty?.map(
                  (
                    faculty: any,
                    facultyIndex: number
                  ) => (
                    <div
  key={faculty.id}
  className="
    border
    rounded-xl
    p-4
    mb-3
    bg-gray-50
  "
>
  <div className="flex justify-between mb-3">

  <div className="flex items-center gap-2">

    <Users
      size={18}
      className="text-blue-600"
    />

    <span className="font-medium">
      Faculty Member
    </span>

  </div>

  <button
    onClick={() => {

      setSelectedFaculty({
        collegeIndex,
        programIndex,
        facultyIndex,
      });

      setShowDeleteModal(true);

    }}
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
      {showAddModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

    <div className="bg-white rounded-xl p-6 w-full max-w-lg">

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-bold">
          Add Faculty
        </h2>

        <button
          onClick={() =>
            setShowAddModal(false)
          }
        >
          <X size={20} />
        </button>

      </div>

      <div className="space-y-4">

        <input
          type="text"
          placeholder="Faculty Name"
          value={
            newFaculty.faculty_name
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              faculty_name:
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

        <input
          type="text"
          placeholder="Position"
          value={
            newFaculty.position
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              position:
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

      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() =>
            setShowAddModal(false)
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
          onClick={addFaculty}
          className="
            px-4
            py-2
            bg-blue-600
            text-white
            rounded-lg
          "
        >
          Save Faculty
        </button>

      </div>

    </div>

  </div>
)}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

    <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
      <h2 className="text-xl font-bold mb-3">
        Delete Faculty?
      </h2>

      <p className="text-gray-500 mb-6">
        Are you sure you want to remove this faculty member?
      </p>

      <div className="flex justify-end gap-3">

        <button
          onClick={() =>
            setShowDeleteModal(false)
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
          onClick={deleteFaculty}
          className="
            px-4
            py-2
            bg-red-600
            text-white
            rounded-lg
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