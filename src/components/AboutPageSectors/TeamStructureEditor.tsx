import { Trash2, Plus } from 'lucide-react';

interface Props {
  content: any;
  updateField: any;

  facultyMembers: any[];
  setFacultyMembers: any;

  departments: any[];
}

export default function TeamStructureEditor({
  content,
  updateField,
  facultyMembers,
  setFacultyMembers,
  departments,
}: Props) {

  const teamData =
    content?.team_structure || {};

  const updateFaculty = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...facultyMembers];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setFacultyMembers(updated);
  };

  const addFacultyMember = () => {
    setFacultyMembers([
      ...facultyMembers,
      {
        id: crypto.randomUUID(),
        name: '',
        role: '',
        education: '',
        experience: '',
        academic_rank: '',
        image: '',
        department_id: '',
        member_type: 'teacher',
        display_order: facultyMembers.length + 1,
      },
    ]);
  };

  const deleteFacultyMember = (
    index: number
  ) => {
    setFacultyMembers(
      facultyMembers.filter(
        (_: any, i: number) =>
          i !== index
      )
    );
  };

  return (
    <div className="space-y-8">

      {/* TEAM STRUCTURE CONTENT */}

      <div className="bg-white rounded-2xl shadow-md border p-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Team Structure Section
          </h2>

          <p className="text-gray-500 mt-2">
            Manage the heading displayed above
            the Dean, Chairmen and Faculty Members.
          </p>
        </div>

        {/* Small Header */}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Small Header
          </label>

          <input
            type="text"
            value={teamData.title || ''}
            onChange={(e) =>
              updateField(
                'team_structure',
                'title',
                e.target.value
              )
            }
            placeholder="Our Team Structure"
            className="
              w-full
              border
              rounded-xl
              p-4
              focus:ring-2
              focus:ring-blue-500
              outline-none
            "
          />
        </div>

        {/* Main Heading */}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Main Heading
          </label>

          <input
            type="text"
            value={
              teamData.description || ''
            }
            onChange={(e) =>
              updateField(
                'team_structure',
                'description',
                e.target.value
              )
            }
            placeholder="The People Behind the Programs"
            className="
              w-full
              border
              rounded-xl
              p-4
              focus:ring-2
              focus:ring-blue-500
              outline-none
            "
          />
        </div>

        {/* Description */}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>

          <textarea
            rows={5}
            value={teamData.content || ''}
            onChange={(e) =>
              updateField(
                'team_structure',
                'content',
                e.target.value
              )
            }
            placeholder="Our team is a blend of visionaries..."
            className="
              w-full
              border
              rounded-xl
              p-4
              resize-none
              focus:ring-2
              focus:ring-blue-500
              outline-none
            "
          />
        </div>

      </div>

      {/* FACULTY MEMBERS */}

      <div className="bg-white rounded-2xl shadow-md border p-8">

        <div className="flex justify-between items-center mb-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Faculty Members
            </h2>

            <p className="text-gray-500 mt-2">
              Manage Dean, Chairmen and Teachers.
            </p>
          </div>

          <button
            onClick={addFacultyMember}
            className="
              flex items-center gap-2
              bg-blue-600
              text-white
              px-5
              py-3
              rounded-xl
              hover:bg-blue-700
            "
          >
            <Plus size={18} />
            Add Faculty
          </button>

        </div>

        <div className="space-y-6">

          {facultyMembers.map(
            (
              member: any,
              index: number
            ) => (
              <div
                key={member.id}
                className="
                  border
                  rounded-2xl
                  p-6
                  bg-gray-50
                "
              >

                <div className="flex justify-between items-center mb-4">

                  <h3 className="font-semibold text-lg">
                    Faculty Member #
                    {index + 1}
                  </h3>

                  <button
                    onClick={() =>
                      deleteFacultyMember(
                        index
                      )
                    }
                    className="
                      text-red-600
                      hover:text-red-800
                    "
                  >
                    <Trash2 size={20} />
                  </button>

                </div>

                <div className="grid md:grid-cols-2 gap-4">

                  <input
                    value={member.name || ''}
                    placeholder="Full Name"
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'name',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  />

                  <input
                    value={member.role || ''}
                    placeholder="Role"
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'role',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  />

                  <input
                    value={
                      member.academic_rank ||
                      ''
                    }
                    placeholder="Academic Rank"
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'academic_rank',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  />

                  <input
                    value={
                      member.experience || ''
                    }
                    placeholder="Years of Experience"
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'experience',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  />

                  <select
                    value={
                      member.member_type ||
                      'teacher'
                    }
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'member_type',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  >
                    <option value="dean">
                      Dean
                    </option>

                    <option value="chairman">
                      Chairman
                    </option>

                    <option value="teacher">
                      Teacher
                    </option>
                  </select>

                  <select
                    value={
                      member.department_id ||
                      ''
                    }
                    onChange={(e) =>
                      updateFaculty(
                        index,
                        'department_id',
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-3"
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (dept: any) => (
                        <option
                          key={dept.id}
                          value={dept.id}
                        >
                          {dept.name}
                        </option>
                      )
                    )}
                  </select>

                </div>

                <textarea
                  rows={3}
                  value={
                    member.education || ''
                  }
                  placeholder="Educational Attainment"
                  onChange={(e) =>
                    updateFaculty(
                      index,
                      'education',
                      e.target.value
                    )
                  }
                  className="
                    mt-4
                    w-full
                    border
                    rounded-lg
                    p-3
                  "
                />

                <input
                  value={member.image || ''}
                  placeholder="Image URL"
                  onChange={(e) =>
                    updateFaculty(
                      index,
                      'image',
                      e.target.value
                    )
                  }
                  className="
                    mt-4
                    w-full
                    border
                    rounded-lg
                    p-3
                  "
                />

              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}