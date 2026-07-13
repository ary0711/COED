import { useState } from 'react';
import {Trash2,Plus,X} from 'lucide-react';
interface Publication {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  category: string;
  external_link: string;
  display_order: number;
}

interface Props {
  publications: Publication[];
  setPublications: React.Dispatch<
    React.SetStateAction<Publication[]>
  >;
}

export function ResearchPublicationsEditor({
  publications,
  setPublications,
}: Props) {
  const [showAddModal, setShowAddModal] =
  useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [publicationToDelete, setPublicationToDelete] =
  useState<string | null>(null);

const [newPublication, setNewPublication] =
  useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    category: 'Research',
    external_link: '',
  });
  const savePublication = () => {

  if (!newPublication.title.trim())
    return;

  setPublications([
    ...publications,
    {
      id: crypto.randomUUID(),
      ...newPublication,
      display_order:
        publications.length + 1,
    },
  ]);

  setNewPublication({
    title: '',
    authors: '',
    journal: '',
    year: '',
    category: 'Research',
    external_link: '',
  });

  setShowAddModal(false);
};

  const openDeleteModal = (
  id: string
) => {
  setPublicationToDelete(id);
  setShowDeleteModal(true);
};

const confirmDeletePublication =
  () => {

    if (!publicationToDelete)
      return;

    setPublications(
      publications.filter(
        (item) =>
          item.id !==
          publicationToDelete
      )
    );

    setPublicationToDelete(null);

    setShowDeleteModal(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">

      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">
          Research Publications
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
  Add Publication
</button>
      </div>

      {publications.map((pub, index) => (
        <div
  key={pub.id}
  className="
  relative
  border
  rounded-xl
  p-5
  pt-14
  mb-4
  bg-gray-50
  hover:shadow-md
  transition-shadow
"
>
  <div className="flex items-center justify-between mb-4 pb-3 border-b">
  <div>
    <h3 className="font-semibold text-gray-900">
      Publication #{index + 1}
    </h3>

    <p className="text-sm text-gray-500">
      Research Publication Information
    </p>
    </div> 
      <button
  onClick={() =>
    openDeleteModal(pub.id)
  }
  className="
    absolute
    top-4
    right-4
    w-9
    h-9
    flex
    items-center
    justify-center
    rounded-full
    bg-red-50
    text-red-500
    border
    border-red-100
    hover:bg-red-100
    hover:text-red-700
    transition-all
    duration-200
    shadow-sm
    z-10
  "
  title="Delete Publication"
>
  <Trash2 size={16} />
</button>
      </div>
          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Title"
            value={pub.title}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].title =
                e.target.value;
              setPublications(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Authors"
            value={pub.authors}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].authors =
                e.target.value;
              setPublications(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Journal"
            value={pub.journal}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].journal =
                e.target.value;
              setPublications(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Year"
            value={pub.year}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].year =
                e.target.value;
              setPublications(updated);
            }}
          />

          <select
            className="w-full border p-2 rounded mb-2"
            value={pub.category}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].category =
                e.target.value;
              setPublications(updated);
            }}
          >
            <option>
              Research
            </option>

            <option>
              Extension
            </option>
          </select>

          <input
            className="w-full border p-2 rounded mb-3"
            placeholder="External Link"
            value={pub.external_link}
            onChange={(e) => {
              const updated = [...publications];
              updated[index].external_link =
                e.target.value;
              setPublications(updated);
            }}
          />
          

           </div>
      ))}
      {showAddModal && (
  <div className="
    fixed
    inset-0
    bg-black/50
    z-50
    flex
    items-center
    justify-center
  ">

    <div className="
      bg-white
      rounded-2xl
      w-full
      max-w-2xl
      p-6
    ">

      <div className="
        flex
        justify-between
        items-center
        mb-6
      ">
        <h2 className="
          text-xl
          font-bold
        ">
          Add Publication
        </h2>

        <button
          onClick={() =>
            setShowAddModal(false)
          }
        >
          <X />
        </button>
      </div>

      <div className="
        grid
        md:grid-cols-2
        gap-4
      ">

        <input
          placeholder="Title"
          value={newPublication.title}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              title:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        <input
          placeholder="Authors"
          value={newPublication.authors}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              authors:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        <input
          placeholder="Journal"
          value={newPublication.journal}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              journal:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        <input
          placeholder="Year"
          value={newPublication.year}
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              year:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        <select
          value={
            newPublication.category
          }
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              category:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        >
          <option value="Research">
            Research
          </option>

          <option value="Extension">
            Extension
          </option>
        </select>

        <input
          placeholder="External Link"
          value={
            newPublication.external_link
          }
          onChange={(e) =>
            setNewPublication({
              ...newPublication,
              external_link:
                e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

      </div>

      <div className="
        flex
        justify-end
        gap-3
        mt-6
      ">
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
          onClick={savePublication}
          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Add Publication
        </button>
      </div>

    </div>

  </div>
)}
{showDeleteModal && (
  <div className="
    fixed
    inset-0
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
            className="
              text-red-600
            "
          />
        </div>
      </div>

      <h2 className="
        text-xl
        font-bold
        mb-2
      ">
        Delete Publication
      </h2>

      <p className="text-gray-500">
        Are you sure you want to
        delete this publication?
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
            confirmDeletePublication
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