interface Committee {
  id: string;
  committee_code: string;
  full_name: string;
  description: string;
  focus: string;
  display_order: number;
}

interface Props {
  committees: Committee[];
  setCommittees: React.Dispatch<
    React.SetStateAction<Committee[]>
  >;
}

export function CommitteeEditor({
  committees,
  setCommittees,
}: Props) {
  function updateCommittee(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...committees];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setCommittees(updated);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        Committees
      </h2>

      {committees.map(
        (committee, index) => (
          <div
            key={committee.id}
            className="border rounded p-4 mb-4"
          >
            <input
              className="w-full border p-2 rounded mb-2"
              value={
                committee.committee_code
              }
              placeholder="Committee Code"
              onChange={(e) =>
                updateCommittee(
                  index,
                  'committee_code',
                  e.target.value
                )
              }
            />

            <input
              className="w-full border p-2 rounded mb-2"
              value={committee.full_name}
              placeholder="Full Name"
              onChange={(e) =>
                updateCommittee(
                  index,
                  'full_name',
                  e.target.value
                )
              }
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              rows={4}
              value={
                committee.description
              }
              onChange={(e) =>
                updateCommittee(
                  index,
                  'description',
                  e.target.value
                )
              }
            />

            <input
              className="w-full border p-2 rounded"
              value={committee.focus}
              placeholder="Focus Area"
              onChange={(e) =>
                updateCommittee(
                  index,
                  'focus',
                  e.target.value
                )
              }
            />
          </div>
        )
      )}
    </div>
  );
}