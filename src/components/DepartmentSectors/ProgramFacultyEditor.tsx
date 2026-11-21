
import { useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function departmentRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');

  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Your login session is missing. Please log in again.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/department${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || result.message || `Request failed: ${response.status}`
    );
  }

  return result;
}
interface Props {
  colleges: any[];
  setColleges: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ProgramFacultyEditor({
  colleges,
  setColleges,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedProgram, setSelectedProgram] = useState<{
    collegeIndex: number;
    programIndex: number;
  } | null>(null);

  const [selectedFaculty, setSelectedFaculty] = useState<{
    collegeIndex: number;
    programIndex: number;
    facultyIndex: number;
  } | null>(null);

  const [newFaculty, setNewFaculty] = useState({
    faculty_name: '',
    position: '',
  });

  // Update local React state without directly mutating the original data.
  const updateLocalFaculty = (
    collegeIndex: number,
    programIndex: number,
    facultyIndex: number,
    field: string,
    value: string
  ) => {
    setColleges(previous =>
      previous.map((college, ci) => {
        if (ci !== collegeIndex) return college;

        return {
          ...college,
          programs: college.programs.map(
            (program: any, pi: number) => {
              if (pi !== programIndex) return program;

              return {
                ...program,
                program_faculty:
                  program.program_faculty.map(
                    (faculty: any, fi: number) =>
                      fi === facultyIndex
                        ? { ...faculty, [field]: value }
                        : faculty
                  ),
              };
            }
          ),
        };
      })
    );
  };

  // Save edited faculty information to Supabase.
const saveFaculty = async (
  facultyId: string,
  field: string,
  value: string
) => {
  if (!['faculty_name', 'position'].includes(field)) {
    return;
  }

  try {
    await departmentRequest(
      `/program-faculty/${encodeURIComponent(facultyId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          [field]: value,
        }),
      }
    );

    console.log('FACULTY UPDATED:', facultyId, field);

  } catch (error: any) {
    console.error('UPDATE FACULTY ERROR:', error);

    setErrorMessage(
      error.message || 'Failed to update faculty.'
    );

    alert(error.message || 'Failed to update faculty.');
  }
};

  // Add a faculty member to Supabase.
 const addFaculty = async () => {
  if (!selectedProgram || !newFaculty.faculty_name.trim()) {
    setErrorMessage('Please enter the faculty name.');
    return;
  }

  const college = colleges[selectedProgram.collegeIndex];

  const program =
    college?.programs?.[selectedProgram.programIndex];

  if (!program?.id) {
    setErrorMessage('Program ID not found.');
    return;
  }

  setSaving(true);
  setErrorMessage('');

  try {
    const result = await departmentRequest(
      '/program-faculty',
      {
        method: 'POST',
        body: JSON.stringify({
          program_id: program.id,
          faculty_name: newFaculty.faculty_name.trim(),
          position: newFaculty.position.trim(),
        }),
      }
    );

    const savedFaculty = result.data;

    // Update the editor immediately.
    setColleges(previous =>
      previous.map((college, ci) => {
        if (ci !== selectedProgram.collegeIndex) {
          return college;
        }

        return {
          ...college,
          programs: (college.programs || []).map(
            (item: any, pi: number) =>
              pi === selectedProgram.programIndex
                ? {
                    ...item,
                    program_faculty: [
                      ...(item.program_faculty || []),
                      savedFaculty,
                    ],
                  }
                : item
          ),
        };
      })
    );

    setNewFaculty({
      faculty_name: '',
      position: '',
    });

    setShowAddModal(false);
    setSelectedProgram(null);

    console.log('FACULTY ADDED:', savedFaculty);

  } catch (error: any) {
    console.error('ADD FACULTY ERROR:', error);

    setErrorMessage(
      error.message || 'Failed to add faculty.'
    );

  } finally {
    setSaving(false);
  }
};
  // Delete faculty from Supabase.
 const deleteFaculty = async () => {
  if (!selectedFaculty) return;

  const college = colleges[selectedFaculty.collegeIndex];

  const faculty =
    college?.programs?.[selectedFaculty.programIndex]
      ?.program_faculty?.[selectedFaculty.facultyIndex];

  if (!faculty?.id) {
    alert('Faculty ID not found.');
    return;
  }

  setSaving(true);

  try {
    await departmentRequest(
      `/program-faculty/${encodeURIComponent(faculty.id)}`,
      {
        method: 'DELETE',
      }
    );

    // Update the editor immediately.
    setColleges(previous =>
      previous.map((college, ci) => {
        if (ci !== selectedFaculty.collegeIndex) {
          return college;
        }

        return {
          ...college,
          programs: (college.programs || []).map(
            (program: any, pi: number) =>
              pi === selectedFaculty.programIndex
                ? {
                    ...program,
                    program_faculty: (
                      program.program_faculty || []
                    ).filter(
                      (_: any, fi: number) =>
                        fi !== selectedFaculty.facultyIndex
                    ),
                  }
                : program
          ),
        };
      })
    );

    setShowDeleteModal(false);
    setSelectedFaculty(null);

    console.log('FACULTY DELETED:', faculty.id);

  } catch (error: any) {
    console.error('DELETE FACULTY ERROR:', error);

    alert(error.message || 'Failed to delete faculty.');

  } finally {
    setSaving(false);
  }
};
  return (
    <>
      {colleges.map((college, collegeIndex) =>
        college.programs?.map(
          (program: any, programIndex: number) => (
            <div
              key={program.id}
              className="bg-white p-6 rounded-xl shadow mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Faculty - {program.program_name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Total Faculty:{' '}
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

                    setErrorMessage('');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  <Plus size={18} />
                  Add Faculty
                </button>
              </div>

              {program.program_faculty?.map(
                (faculty: any, facultyIndex: number) => (
                  <div
                    key={faculty.id}
                    className="border rounded-xl p-4 mb-3 bg-gray-50"
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
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={faculty.faculty_name || ''}
                      onChange={e =>
                        updateLocalFaculty(
                          collegeIndex,
                          programIndex,
                          facultyIndex,
                          'faculty_name',
                          e.target.value
                        )
                      }
                      onBlur={e =>
                        saveFaculty(
                          faculty.id,
                          'faculty_name',
                          e.currentTarget.value
                        )
                      }
                      placeholder="Faculty Name"
                      className="w-full border p-2 rounded mb-3"
                    />

                    <input
                      type="text"
                      value={faculty.position || ''}
                      onChange={e =>
                        updateLocalFaculty(
                          collegeIndex,
                          programIndex,
                          facultyIndex,
                          'position',
                          e.target.value
                        )
                      }
                      onBlur={e =>
                        saveFaculty(
                          faculty.id,
                          'position',
                          e.currentTarget.value
                        )
                      }
                      placeholder="Position"
                      className="w-full border p-2 rounded"
                    />
                  </div>
                )
              )}
            </div>
          )
        )
      )}

      {/* ADD FACULTY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Add Faculty
              </h2>

              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Faculty Name"
                value={newFaculty.faculty_name}
                onChange={e =>
                  setNewFaculty({
                    ...newFaculty,
                    faculty_name: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />

              <input
                type="text"
                placeholder="Position"
                value={newFaculty.position}
                onChange={e =>
                  setNewFaculty({
                    ...newFaculty,
                    position: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />

              {errorMessage && (
                <p className="text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={addFaculty}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE FACULTY MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedFaculty(null);
                }}
                disabled={saving}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={deleteFaculty}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
