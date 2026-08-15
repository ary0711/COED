import { useState } from 'react';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Alumni {
  id: string;
  name: string;
  graduation_year: string;
  position: string;
  achievement: string;
  image_url: string;
  display_order: number;
}

interface Props {
  alumni: Alumni[];
  setAlumni: React.Dispatch<
    React.SetStateAction<Alumni[]>
  >;
}

export function FeaturedAlumniEditor({
  alumni,
  setAlumni,
}: Props) {
  const [showAddModal, setShowAddModal] =
  useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [alumniToDelete, setAlumniToDelete] =
  useState<string | null>(null);

const [newAlumni, setNewAlumni] =
  useState({
    name: '',
    graduation_year: '',
    position: '',
    achievement: '',
    image_url: '',
  });
  const saveAlumni = () => {
  setAlumni([
    ...alumni,
    {
      id: crypto.randomUUID(),
      name: newAlumni.name,
      graduation_year:
        newAlumni.graduation_year,
      position: newAlumni.position,
      achievement:
        newAlumni.achievement,
      image_url:
        newAlumni.image_url,
      display_order:
        alumni.length + 1,
    },
  ]);

  setNewAlumni({
    name: '',
    graduation_year: '',
    position: '',
    achievement: '',
    image_url: '',
  });

  setShowAddModal(false);
};

  const openDeleteModal = (
  id: string
) => {
  setAlumniToDelete(id);
  setShowDeleteModal(true);
};

const confirmDeleteAlumni =
  () => {
    if (!alumniToDelete)
      return;

    setAlumni(
      alumni.filter(
        (item) =>
          item.id !==
          alumniToDelete
      )
    );

    setShowDeleteModal(false);
    setAlumniToDelete(null);
  };

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('research-alumni-images')
      .upload(fileName, file);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('research-alumni-images')
      .getPublicUrl(fileName);

    const updated = [...alumni];

    updated[index].image_url =
      publicUrl;

    setAlumni(updated);
  };
const handleChange = (
  index: number,
  field: keyof Alumni,
  value: any
) => {
  const updated = [...alumni];

  updated[index] = {
    ...updated[index],
    [field]: value,
  };

  setAlumni(updated);
};
  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">

      <div className="flex justify-between items-center mb-6">

  <h2 className="text-xl font-bold">
    Featured Alumni
  </h2>

  <button
    onClick={() =>
      setShowAddModal(true)
    }
    className="
      flex
      items-center
      gap-2
      bg-blue-600
      text-white
      px-4
      py-2
      rounded-lg
      hover:bg-blue-700
    "
  >
    <Plus size={18} />
    Add Alumni
  </button>

</div>

      {alumni.map(
        (person, index) => (
          <div
  key={person.id}
  className="
    border
    rounded-2xl
    p-6
    mb-6
    bg-gray-50
    shadow-sm
  "
>

  {/* Header */}
  <div className="flex justify-between items-center mb-5">

    <div>
      <h3 className="font-semibold text-lg text-gray-800">
        Alumni #{index + 1}
      </h3>

      <p className="text-sm text-gray-500">
        Featured Alumni Information
      </p>
    </div>

    <button
      onClick={() =>
        openDeleteModal(person.id)
      }
      className="
        flex
        items-center
        justify-center
        w-10
        h-10
        rounded-full
        bg-red-50
        text-red-500
        hover:bg-red-100
        transition
      "
      title="Delete Alumni"
    >
      <Trash2 size={18} />
    </button>

  </div>
            <div className="grid md:grid-cols-2 gap-4">

              <input
                className="border p-3 rounded"
                placeholder="Name"
                value={person.name}
                onChange={(e) =>
                  handleChange(
                    index,
                    'name',
                    e.target.value
                  )
                }
              />

              <input
                className="border p-3 rounded"
                placeholder="Graduation Year"
                value={
                  person.graduation_year
                }
                onChange={(e) =>
                  handleChange(
                    index,
                    'graduation_year',
                    e.target.value
                  )
                }
              />

              <input
                className="border p-3 rounded"
                placeholder="Position"
                value={person.position}
                onChange={(e) =>
                  handleChange(
                    index,
                    'position',
                    e.target.value
                  )
                }
              />

              <input
                className="border p-3 rounded"
                placeholder="Display Order"
                type="number"
                value={
                  person.display_order
                }
                onChange={(e) =>
                  handleChange(
                    index,
                    'display_order',
                    e.target.value
                  )
                }
              />
            </div>

            <textarea
              className="w-full border p-3 rounded mt-4"
              rows={4}
              placeholder="Achievement"
              value={
                person.achievement
              }
              onChange={(e) =>
                handleChange(
                  index,
                  'achievement',
                  e.target.value
                )
              }
            />

            <div className="mt-4">

              <label className="block font-medium mb-2">
                Alumni Photo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadImage(
                    e,
                    index
                  )
                }
              />

              {person.image_url && (
                <img
                  src={
                    person.image_url
                  }
                  alt={
                    person.name
                  }
                  className="mt-4 w-40 h-40 rounded-lg object-cover border"
                />
              )}
            </div>
          </div>
        )
      )}
      {showAddModal && (
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
        rounded-2xl
        p-6
        w-full
        max-w-xl
      "
    >
      <div
        className="
          flex
          justify-between
          items-center
          mb-6
        "
      >
        <h2 className="text-xl font-bold">
          Add Alumni
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
          placeholder="Name"
          value={newAlumni.name}
          onChange={(e) =>
            setNewAlumni({
              ...newAlumni,
              name: e.target.value,
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
          placeholder="Graduation Year"
          value={
            newAlumni.graduation_year
          }
          onChange={(e) =>
            setNewAlumni({
              ...newAlumni,
              graduation_year:
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
          placeholder="Position"
          value={
            newAlumni.position
          }
          onChange={(e) =>
            setNewAlumni({
              ...newAlumni,
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

        <textarea
          rows={4}
          placeholder="Achievement"
          value={
            newAlumni.achievement
          }
          onChange={(e) =>
            setNewAlumni({
              ...newAlumni,
              achievement:
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

      <div
        className="
          flex
          justify-end
          gap-3
          mt-6
        "
      >
        <button
          onClick={() =>
            setShowAddModal(false)
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
          onClick={saveAlumni}
          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Save Alumni
        </button>
      </div>
    </div>
  </div>
)}{showDeleteModal && (
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
        rounded-2xl
        p-8
        max-w-md
        w-full
        text-center
      "
    >
      <div
        className="
          flex
          justify-center
          mb-4
        "
      >
        <div
          className="
            bg-red-100
            p-4
            rounded-full
          "
        >
          <Trash2
            size={40}
            className="
              text-red-600
            "
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
        Delete Alumni
      </h2>

      <p className="text-gray-500">
        Are you sure you want to
        delete this alumni?
      </p>

      <div
        className="
          flex
          justify-center
          gap-3
          mt-6
        "
      >
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
            confirmDeleteAlumni
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