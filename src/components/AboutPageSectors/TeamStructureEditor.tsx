
import { useState } from 'react';
import {
  Trash2,
  Plus,
  X,
  Pencil,
   CheckCircle,
} from 'lucide-react';
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
  const [isEditing, setIsEditing] =
  useState(false);
const [showUploadSuccessModal, setShowUploadSuccessModal] =
  useState(false);
const [editingIndex, setEditingIndex] =
  useState<number | null>(null);
  const [showFacultyModal, setShowFacultyModal] =
  useState(false);
const [searchTerm, setSearchTerm] =
  useState('');
const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [facultyToDelete, setFacultyToDelete] =
  useState<number | null>(null);

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
const editFaculty = (
  member: any,
  index: number
) => {
  setNewFaculty({
    name: member.name || '',
    role: member.role || '',
    academic_rank:
      member.academic_rank || '',
    education:
      member.education || '',
    experience:
      member.experience || '',
    department_id:
      member.department_id || '',
    member_type:
      member.member_type || 'teacher',
    image: member.image || '',
  });

  setEditingIndex(index);
  setIsEditing(true);
  setShowFacultyModal(true);
};
  
const resetFacultyForm = () => {
  setNewFaculty({
    name: '',
    role: '',
    academic_rank: '',
    education: '',
    experience: '',
    department_id: '',
    member_type: 'teacher',
    image: '',
  });

  setEditingIndex(null);
  setIsEditing(false);
};
const saveFaculty = () => {
  console.log(
  "SAVE FACULTY IMAGE:",
  newFaculty.image
);
  if (
  !isEditing &&
  newFaculty.member_type === 'dean'
) {
  const existingDean =
    facultyMembers.find(
      member =>
        member.member_type === 'dean'
    );

  if (existingDean) {
    alert(
      'Only one Dean is allowed.'
    );
    return;
  }
}
  if (
  newFaculty.member_type !== 'dean' &&
  !newFaculty.department_id
) {
  alert('Please select a department.');
  return;
}

  if (
    isEditing &&
    editingIndex !== null
  ) {
    const updated = [
      ...facultyMembers,
    ];

    updated[editingIndex] = {
      ...updated[editingIndex],
      ...newFaculty,

      
    };
   console.log(
  "EDITING FACULTY",
  facultyMembers[editingIndex]
);

console.log(
  "NEW FACULTY",
  newFaculty
);

    setFacultyMembers(updated);
  } else {
    setFacultyMembers([
      ...facultyMembers,
      {
        id: crypto.randomUUID(),
        ...newFaculty,
        display_order:
          facultyMembers.length + 1,
      },
    ]);
  }

  setNewFaculty({
    name: '',
    role: '',
    academic_rank: '',
    education: '',
    experience: '',
    department_id: '',
    member_type: 'teacher',
    image: '',
  });

  setEditingIndex(null);
  setIsEditing(false);
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
const dean =
  facultyMembers.find(
    member =>
      member.member_type === 'dean'
  );
  const groupedFaculty =
  departments.map((dept) => ({
    ...dept,
    members: facultyMembers.filter(
      (member) =>
        member.department_id === dept.id &&
        member.member_type !== 'dean' &&
        member.name
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
    ),
  }));
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
{/* DEAN MANAGEMENT */}

<div className="bg-white rounded-2xl shadow-md border p-8 mb-8">

  <div className="flex justify-between items-center mb-6">

    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Dean Information
      </h2>

      <p className="text-gray-500 mt-2">
        Manage the current College Dean.
      </p>
    </div>

    {dean && (
      <button
        onClick={() => {
          const deanIndex =
            facultyMembers.findIndex(
              (member) =>
                member.member_type === 'dean'
            );

          editFaculty(
            dean,
            deanIndex
          );
        }}
        className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded-xl
          flex
          items-center
          gap-2
          hover:bg-blue-700
        "
      >
        <Pencil size={16} />
        Edit Dean
      </button>
    )}

  </div>

  {!dean ? (

    <div className="text-center py-10">

      <p className="text-gray-500 mb-4">
        No Dean has been assigned yet.
      </p>

      <button
        onClick={() => {

          setNewFaculty({
            name: '',
            role: '',
            academic_rank: '',
            education: '',
            experience: '',
            department_id: '',
            member_type: 'dean',
            image: '',
          });

          setEditingIndex(null);
          setIsEditing(false);
          setShowFacultyModal(true);
        }}
        className="
          bg-gradient-to-r
          from-blue-700
          to-blue-500
          text-white
          px-6
          py-3
          rounded-xl
        "
      >
        Add Dean
      </button>

    </div>

  ) : (

    <div
      className="
        flex
        flex-col
        md:flex-row
        gap-8
        items-center
      "
    >

      <img
        src={
          dean.image ||
          'https://via.placeholder.com/150'
        }
        alt={dean.name}
        className="
          w-40
          h-40
          rounded-full
          object-cover
          border-4
          border-blue-100
        "
      />

      <div className="flex-1">

        <h3 className="text-3xl font-bold text-gray-800">
          {dean.name}
        </h3>

        <p className="text-blue-600 text-lg font-medium mt-1">
          {dean.role}
        </p>
<p className="text-sm text-gray-500 mt-2">
  {
    departments.find(
      d => d.id === dean.department_id
    )?.name
  }
</p>
        <p className="text-gray-500 mt-2">
          {dean.academic_rank}
        </p>

        <p className="text-gray-500 mt-2">
          {dean.experience}
        </p>

        <p className="text-gray-400 mt-3">
          {dean.education}
        </p>

      </div>

      <div className="flex gap-3">

        <button
          onClick={() => {
            const deanIndex =
              facultyMembers.findIndex(
                (member) =>
                  member.member_type ===
                  'dean'
              );

            editFaculty(
              dean,
              deanIndex
            );
          }}
          className="
            p-3
            rounded-lg
            bg-blue-50
            border
            border-blue-200
            hover:bg-blue-100
          "
        >
          <Pencil
            size={20}
            className="text-blue-600"
          />
        </button>

        <button
          onClick={() => {
            const deanIndex =
              facultyMembers.findIndex(
                (member) =>
                  member.member_type ===
                  'dean'
              );

            openDeleteModal(
              deanIndex
            );
          }}
          className="
            p-3
            rounded-lg
            bg-red-50
            border
            border-red-200
            hover:bg-red-100
          "
        >
          <Trash2
            size={20}
            className="text-red-600"
          />
        </button>

      </div>

    </div>

  )}

</div>
      {/* FACULTY MEMBERS */}

      <div className="bg-white rounded-2xl shadow-md border p-8">

        <div className="flex justify-between items-center mb-8">
          <div className="mb-8">

  <h2 className="text-2xl font-bold text-gray-800">
    Faculty Members
  </h2>

  <p className="text-gray-500 mt-2">
    Manage Dean, Chairmen and Teachers.
  </p>

  <input
    type="text"
    placeholder="Search Faculty..."
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(e.target.value)
    }
    className="
      mt-4
      border
      rounded-xl
      px-4
      py-2
      w-full
      md:w-96
    "
  />

</div>

          
        </div>

        <div className="space-y-6">

          {groupedFaculty.map((dept) => (
  <div
    key={dept.id}
    className="border rounded-2xl overflow-hidden mb-8"
  >
    {/* Department Header */}
    <div
      className="
        bg-gradient-to-r
        from-blue-700
        to-blue-500
        text-white
        px-6
        py-4
        flex
        justify-between
        items-center
      "
    >
      <div>
        <h3 className="font-bold text-lg">
          {dept.name}
        </h3>

        <p className="text-blue-100 text-sm">
          {dept.members.length} Faculty Members
        </p>
      </div>

      <button
        onClick={() => {
          setNewFaculty({
  name: '',
  role: '',
  academic_rank: '',
  education: '',
  experience: '',
  department_id: dept.id,
  member_type: 'teacher',
  image: '',
});

setEditingIndex(null);
setIsEditing(false);
setShowFacultyModal(true);
        }}
        className="
          bg-white
          text-blue-600
          px-4
          py-2
          rounded-xl
        "
      >
        Add Faculty
      </button>
    </div>

    {/* Department Body */}
    <div className="p-6">

      {dept.members.length === 0 ? (

        <div
          className="
            text-center
            text-gray-400
            py-10
          "
        >
          No faculty members assigned.
        </div>

      ) : (

        <div
          className="
            grid
            md:grid-cols-2
            lg:grid-cols-3
            gap-6
          "
        >
          {dept.members.map((member: any) => (

            <div
  key={member.id}
  className="
    bg-gray-50
    border
    rounded-xl
    p-4
    h-[450px]
    flex
    flex-col
    transition-all
    duration-300
    hover:shadow-xl
    hover:-translate-y-1
    hover:border-blue-300
  "
>
              <img
  src={
    member.image
      ? `${member.image}?t=${Date.now()}`
      : 'https://via.placeholder.com/150'
  }
  alt={member.name}
  className="
    w-32
    h-32
    rounded-full
    object-cover
    mx-auto
    border-4
    border-blue-100
  "
/>

              <h4
  className="
    text-center
    font-bold
    mt-3
    min-h-[60px]
  "
>
  {member.name}
</h4>

<p className="
    text-center
    line-clamp-2
    min-h-[48px]
  ">
  {member.role}
</p>

<p
  className="
    text-center
    text-sm
    text-gray-500
  "
>
  {member.academic_rank}
</p>

<p
   className="
    text-center
    text-xs
    text-gray-500
    mt-2
    min-h-[20px]
  "
>
  {member.experience}
</p>

<p
   className="
    text-center
    text-xs
    text-gray-400
    mt-1
    line-clamp-3
    min-h-[60px]
  "
  title={member.education}
>
  {member.education}
</p>

<div className="flex justify-center gap-3 mt-auto pt-4">

                <button
  onClick={() => {
    const actualIndex =
      facultyMembers.findIndex(
        (f) => f.id === member.id
      );

    editFaculty(member, actualIndex);
  }}
  className="
    p-2
    rounded-lg
    bg-blue-50
    border
    border-blue-200
    hover:bg-blue-100
    hover:scale-105
    transition-all
  "
  title="Edit Faculty"
>
  <Pencil
    size={18}
    className="text-blue-600"
  />
</button>

                 <button
  onClick={() => {
    const actualIndex =
      facultyMembers.findIndex(
        (f) => f.id === member.id
      );

    openDeleteModal(actualIndex);
  }}
  className="
    p-2
    rounded-lg
    bg-red-50
    border
    border-red-200
    hover:bg-red-100
    hover:scale-105
    transition-all
  "
  title="Delete Faculty"
>
  <Trash2
    size={18}
    className="text-red-600"
  />
</button>

              </div>

            </div>

          ))}
        </div>

      )}

    </div>

  </div>
))}

        </div>

      </div>
{showFacultyModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-6">

    <div className="bg-white rounded-2xl w-full max-w-3xl p-8">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
  {newFaculty.member_type === 'dean'
  ? isEditing
    ? 'Edit Dean'
    : 'Add Dean'
  : isEditing
    ? 'Edit Faculty Member'
    : 'Add Faculty Member'}
</h2>

        <button
          onClick={() => {
  resetFacultyForm();
  setShowFacultyModal(false);
}}
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

        {newFaculty.member_type !== 'dean' && (
  <select
    value={newFaculty.department_id}
    onChange={(e) =>
      setNewFaculty({
        ...newFaculty,
        department_id: e.target.value,
      })
    }
    className="border rounded-lg p-3"
  >
    <option value="">
      Select Department
    </option>

    {departments.map((dept: any) => (
      <option
        key={dept.id}
        value={dept.id}
      >
        {dept.name}
      </option>
    ))}
  </select>
)}

        {/* DEPARTMENT */}

        

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
                  'faculty_images'
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
                  'faculty_images'
                )
                .getPublicUrl(
                  filePath
                );

            setNewFaculty(prev => ({
  ...prev,
  image: data.publicUrl,
}));

setShowUploadSuccessModal(true);
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
    src={`${newFaculty.image}?t=${Date.now()}`}
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
           bg-gradient-to-r
from-blue-700
to-blue-500
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
{isEditing
  ? 'Update Faculty'
  : 'Save Faculty'}
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
{showUploadSuccessModal && (
  <div
    className="
      fixed inset-0
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
        rounded-2xl
        p-8
        w-full
        max-w-md
        text-center
      "
    >
      <div className="flex justify-center mb-4">
        <div
          className="
            bg-green-100
            p-4
            rounded-full
          "
        >
          <CheckCircle
            size={40}
            className="text-green-600"
          />
        </div>
      </div>

      <h2
        className="
          text-xl
          font-bold
          mb-2
        "
      >
        Upload Successful
      </h2>

      <p className="text-gray-500">
        Faculty photo has been uploaded
        successfully.
      </p>

      <button
        onClick={() =>
          setShowUploadSuccessModal(false)
        }
        className="
          mt-6
          px-6
          py-2
          bg-gradient-to-r
          from-green-600
          to-green-500
          text-white
          rounded-lg
        "
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
  );
}