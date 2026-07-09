import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';

interface Award {
  id: string;
  title: string;
  recipient: string;
  year: string;
  organization: string;
  display_order: number;
}

interface Props {
  awards: Award[];
  setAwards: React.Dispatch<
    React.SetStateAction<Award[]>
  >;
}

export function ResearchAwardsEditor({
  awards,
  setAwards,
}: Props) {
  const [showAwardModal, setShowAwardModal] =
  useState(false);

const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [awardToDelete, setAwardToDelete] =
  useState<string | null>(null);

const [newAward, setNewAward] =
  useState({
    title: '',
    recipient: '',
    year: '',
    organization: '',
  });
  const saveAward = () => {
  setAwards([
    ...awards,
    {
      id: crypto.randomUUID(),
      title: newAward.title,
      recipient: newAward.recipient,
      year: newAward.year,
      organization:
        newAward.organization,
      display_order:
        awards.length + 1,
    },
  ]);

  setNewAward({
    title: '',
    recipient: '',
    year: '',
    organization: '',
  });

  setShowAwardModal(false);
};

  const openDeleteModal = (
  id: string
) => {
  setAwardToDelete(id);
  setShowDeleteModal(true);
};

const confirmDeleteAward =
  () => {
    if (!awardToDelete)
      return;

    setAwards(
      awards.filter(
        (award) =>
          award.id !==
          awardToDelete
      )
    );

    setShowDeleteModal(false);
    setAwardToDelete(null);
  };
  return (
     <div className="bg-white rounded-xl p-6 shadow mb-6">

     <div className="flex justify-between items-center mb-6">
  <h2 className="text-xl font-bold">
    Awards & Recognition
  </h2>

  <button
    onClick={() => setShowAwardModal(true)}
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
      shrink-0
    "
  >
    <Plus size={18} />
    Add Award
  </button>
</div>

      {awards.length === 0 && (
        <div className="text-center text-gray-500 py-6 border rounded-lg">
          No awards added yet.
        </div>
      )}

      {awards.map((award, index) => (
        <div
  key={award.id}
  className="
    relative
    bg-white
    border
    border-gray-200
    rounded-xl
    p-5
    mb-5
    shadow-sm
    hover:shadow-md
    transition-all
  "
>
          <div className="flex justify-between items-center mb-3">
             <button
  onClick={() =>
    openDeleteModal(award.id)
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
    border
    border-red-100
    text-red-500
    hover:bg-red-100
    hover:text-red-700
    transition-all
    duration-200
    shadow-sm
  "
  title="Delete Award"
>
  <Trash2 size={16} />
</button>

  <h3 className="font-semibold">
    Award #{index + 1}
  </h3>
          </div>

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Award Title"
            value={award.title}
            onChange={(e) => {
              const updated = [...awards];
              updated[index].title =
                e.target.value;
              setAwards(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Recipient"
            value={award.recipient}
            onChange={(e) => {
              const updated = [...awards];
              updated[index].recipient =
                e.target.value;
              setAwards(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded mb-2"
            placeholder="Awarding Organization"
            value={award.organization}
            onChange={(e) => {
              const updated = [...awards];
              updated[index].organization =
                e.target.value;
              setAwards(updated);
            }}
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Year"
            value={award.year}
            onChange={(e) => {
              const updated = [...awards];
              updated[index].year =
                e.target.value;
              setAwards(updated);
            }}
          />
        </div>
      ))}
      {showAwardModal && (
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
          Add Award
        </h2>

        <button
          onClick={() =>
            setShowAwardModal(
              false
            )
          }
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">

        <input
          placeholder="Award Title"
          value={newAward.title}
          onChange={(e) =>
            setNewAward({
              ...newAward,
              title:
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
          placeholder="Recipient"
          value={
            newAward.recipient
          }
          onChange={(e) =>
            setNewAward({
              ...newAward,
              recipient:
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
          placeholder="Organization"
          value={
            newAward.organization
          }
          onChange={(e) =>
            setNewAward({
              ...newAward,
              organization:
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
          placeholder="Year"
          value={newAward.year}
          onChange={(e) =>
            setNewAward({
              ...newAward,
              year:
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
            setShowAwardModal(
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
          onClick={saveAward}
          className="
            bg-blue-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Add Award
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
        Delete Award
      </h2>

      <p className="text-gray-500">
        Are you sure you want to
        delete this award?
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
            setShowDeleteModal(
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
          onClick={
            confirmDeleteAward
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