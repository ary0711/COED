
import { useState } from 'react';
import {Trash2,Plus,X} from 'lucide-react';
import { supabase } from '../../supabaseClient';
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
  const [showFacultyModal, setShowFacultyModal] =
  useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [facultyToDelete, setFacultyToDelete] =
  useState<number | null>(null);

const [currentPage, setCurrentPage] =
  useState(1);

const itemsPerPage = 5;

const [newFaculty, setNewFaculty] =
  useState({
    name: '',
    role: '',
    academic_rank: '',
    education: '',
    experience: '',
    department_id: '',
    member_type: 'teacher',
    image: '',
  });
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

  async function uploadFacultyImage(
  file: File,
  index: number
) {
  try {
    const fileExt =
      file.name.split('.').pop();

    const fileName =
      `faculty-${Date.now()}.${fileExt}`;

    const filePath =
      `faculty/${fileName}`;

    const { error } =
      await supabase.storage
        .from('landing-page-images')
        .upload(filePath, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } =
      supabase.storage
        .from('landing-page-images')
        .getPublicUrl(filePath);

    updateFaculty(
      startIndex + index,
      'image',
      data.publicUrl
    );

    alert('Upload Successful');
  } catch (error) {
    console.error(error);
  }
}

  const startIndex =
  (currentPage - 1) *
  itemsPerPage;

const paginatedFaculty =
  facultyMembers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

const totalPages =
  Math.ceil(
    facultyMembers.length /
    itemsPerPage
  );
const saveFaculty = () => {
  setFacultyMembers([
    ...facultyMembers,
    {
      id: crypto.randomUUID(),
      ...newFaculty,
      display_order:
        facultyMembers.length + 1,
    },
  ]);

  setNewFaculty({
    name: '',
    role: '',
    education: '',
    experience: '',
    academic_rank: '',
    image: '',
    department_id: '',
    member_type: 'teacher',
  });

  setShowFacultyModal(false);
};
const openDeleteModal = (
  index: number
) => {
  setFacultyToDelete(index);
  setShowDeleteModal(true);
};

const confirmDeleteFaculty =
  () => {
    if (
      facultyToDelete === null
    )
      return;

    setFacultyMembers(
      facultyMembers.filter(
        (_: any, i: number) =>
          i !== facultyToDelete
      )
    );

    setShowDeleteModal(false);
    setFacultyToDelete(null);
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
  onClick={() =>
    setShowFacultyModal(true)
  }
  className="
    flex items-center gap-2
    bg-blue-600
    text-white
    px-5 py-3
    rounded-xl
  "
>
  <Plus size={18} />
  Add Faculty
</button>

        </div>

        <div className="space-y-6">

          {paginatedFaculty.map(
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
                  </h3><div className="
  flex
  justify-center
  items-center
  gap-4
  mt-8
">
  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage(
        currentPage - 1
      )
    }
    className="
      border
      px-4
      py-2
      rounded-lg
    "
  >
    Previous
  </button>

  <span>
    Page {currentPage} of{' '}
    {totalPages}
  </span>

  <button
    disabled={
      currentPage === totalPages
    }
    onClick={() =>
      setCurrentPage(
        currentPage + 1
      )
    }
    className="
      border
      px-4
      py-2
      rounded-lg
    "
  >
    Next
  </button>
</div>
                  <button
  onClick={() =>
    openDeleteModal(
      startIndex + index
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

                <div className="mt-4">

  <label className="block mb-2 font-semibold">
    Faculty Photo
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file =
        e.target.files?.[0];

      if (file) {
        uploadFacultyImage(
          file,
          index
        );
      }
    }}
    className="
      w-full
      border
      rounded-lg
      p-3
    "
  />

  {member.image && (
    <img
      src={member.image}
      alt={member.name}
      className="
        mt-4
        w-32
        h-32
        rounded-lg
        object-cover
        border
      "
    />
  )}

</div>

              </div>
            )
          )}

        </div>

      </div>
{showFacultyModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-6">

    <div className="bg-white rounded-2xl w-full max-w-3xl p-8">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Add Faculty Member
        </h2>

        <button
          onClick={() =>
            setShowFacultyModal(false)
          }
        >
          <X />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* NAME */}

        <input
          placeholder="Full Name"
          value={newFaculty.name}
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              name: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* ROLE */}

        <input
          placeholder="Role"
          value={newFaculty.role}
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              role: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* RANK */}

        <input
          placeholder="Academic Rank"
          value={
            newFaculty.academic_rank
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              academic_rank:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* EXPERIENCE */}

        <input
          placeholder="Years of Experience"
          value={
            newFaculty.experience
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              experience:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* MEMBER TYPE */}

        <select
          value={
            newFaculty.member_type
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              member_type:
                e.target.value,
            })
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

        {/* DEPARTMENT */}

        <select
          value={
            newFaculty.department_id
          }
          onChange={(e) =>
            setNewFaculty({
              ...newFaculty,
              department_id:
                e.target.value,
            })
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

      {/* EDUCATION */}

      <textarea
        rows={4}
        placeholder="Educational Attainment"
        value={
          newFaculty.education
        }
        onChange={(e) =>
          setNewFaculty({
            ...newFaculty,
            education:
              e.target.value,
          })
        }
        className="
          mt-4
          w-full
          border
          rounded-lg
          p-3
        "
      />

      {/* IMAGE */}

      <div className="mt-4">

        <label className="font-semibold block mb-2">
          Faculty Photo
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {

            const file =
              e.target.files?.[0];

            if (!file) return;

            const fileExt =
              file.name
                .split('.')
                .pop();

            const fileName =
              `faculty-${Date.now()}.${fileExt}`;

            const filePath =
              `faculty/${fileName}`;

            const { error } =
              await supabase.storage
                .from(
                  'landing-page-images'
                )
                .upload(
                  filePath,
                  file
                );

            if (error) {
              alert(
                error.message
              );
              return;
            }

            const { data } =
              supabase.storage
                .from(
                  'landing-page-images'
                )
                .getPublicUrl(
                  filePath
                );

            setNewFaculty({
              ...newFaculty,
              image:
                data.publicUrl,
            });
          }}
          className="
            w-full
            border
            rounded-lg
            p-3
          "
        />

        {newFaculty.image && (
          <img
            src={
              newFaculty.image
            }
            alt="Preview"
            className="
              mt-4
              w-32
              h-32
              rounded-lg
              object-cover
              border
            "
          />
        )}

      </div>

      {/* BUTTONS */}

      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() =>
            setShowFacultyModal(
              false
            )
          }
          className="
            border
            px-4
            py-2
            rounded-lg
          "
        >
          Cancel
        </button>

        <button
          onClick={saveFaculty}
          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Save Faculty
        </button>

      </div>

    </div>

  </div>

)}{showDeleteModal && (
  <div className="
    fixed inset-0
    bg-black/50
    z-50
    flex
    items-center
    justify-center
  ">
    <div className="
      bg-white
      rounded-2xl
      p-8
      w-full
      max-w-md
      text-center
    ">
      <div className="
        flex
        justify-center
        mb-4
      ">
        <div className="
          bg-red-100
          p-4
          rounded-full
        ">
          <Trash2
            size={40}
            className="text-red-600"
          />
        </div>
      </div>

      <h2 className="
        text-xl
        font-bold
        mb-2
      ">
        Delete Faculty
      </h2>

      <p className="text-gray-500">
        Are you sure you want to
        delete this faculty member?
      </p>

      <div className="
        flex
        justify-center
        gap-3
        mt-6
      ">
        <button
          onClick={() =>
            setShowDeleteModal(false)
          }
          className="
            border
            px-4
            py-2
            rounded-lg
          "
        >
          Cancel
        </button>

        <button
          onClick={
            confirmDeleteFaculty
          }
          className="
            bg-red-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}