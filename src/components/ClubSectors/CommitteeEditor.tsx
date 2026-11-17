
interface Committee {
  id: string;
  committee_code: string;
  full_name: string;
  description: string;
  focus: string;
  logo_url: string | null;
  president_name: string | null;
  adviser_name: string | null;
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
    field: keyof Committee,
    value: string
  ) {
    const updated = [...committees];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setCommittees(updated);
  }

  function addEmptyCommittees() {
    if (committees.length >= 10) return;

    const newCommittees: Committee[] = [
      ...committees,
      ...Array.from(
        { length: 10 - committees.length },
        (_, index) => ({
          id: `new-${Date.now()}-${index}`,
          committee_code: "",
          full_name: "",
          description: "",
          focus: "",
          logo_url: "",
          president_name: "",
          adviser_name: "",
          display_order: committees.length + index + 1,
        })
      ),
    ];

    setCommittees(newCommittees);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1E3A8A]">
            UnEC Committees
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage club logos, names, presidents, advisers,
            and focus areas.
          </p>
        </div>

        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
          {committees.length} / 10 clubs
        </span>
      </div>

      {committees.slice(0, 10).map(
        (committee, index) => (
          <div
            key={committee.id}
            className="border border-gray-200 rounded-xl p-5 mb-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Club {String(index + 1).padStart(2, "0")}
              </h3>

              <span className="text-xs text-gray-500">
                Display order: {committee.display_order}
              </span>
            </div>

            {/* CLUB LOGO */}
            {/* CLUB LOGO UPLOAD */}
<label className="block text-sm font-medium mb-1">
  Club Logo
</label>

<input
  type="file"
  accept="image/*"
  className="w-full border p-2 rounded-lg mb-3"
  onChange={(e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      updateCommittee(
        index,
        "logo_url",
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  }}
/>

{committee.logo_url && (
  <div className="mb-4">
    <p className="text-xs text-gray-500 mb-2">
      Logo preview
    </p>

    <img
      src={committee.logo_url}
      alt="Club logo preview"
      className="w-20 h-20 object-contain rounded-lg border p-1"
    />
  </div>
)}

            {/* COMMITTEE CODE */}
            <label className="block text-sm font-medium mb-1">
              Club / Committee Code
            </label>

            <input
              className="w-full border p-2 rounded-lg mb-3"
              value={committee.committee_code}
              placeholder="e.g. COM-01"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "committee_code",
                  e.target.value
                )
              }
            />

            {/* FULL NAME */}
            <label className="block text-sm font-medium mb-1">
              Club Name
            </label>

            <input
              className="w-full border p-2 rounded-lg mb-3"
              value={committee.full_name}
              placeholder="Enter club name"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "full_name",
                  e.target.value
                )
              }
            />

            {/* DESCRIPTION */}
            <label className="block text-sm font-medium mb-1">
              Description
            </label>

            <textarea
              className="w-full border p-2 rounded-lg mb-3"
              rows={4}
              value={committee.description}
              placeholder="Describe the club and its activities"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "description",
                  e.target.value
                )
              }
            />

            {/* CLUB PRESIDENT */}
            <label className="block text-sm font-medium mb-1">
              Club President
            </label>

            <input
              className="w-full border p-2 rounded-lg mb-3"
              value={committee.president_name ?? ""}
              placeholder="Enter president's full name"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "president_name",
                  e.target.value
                )
              }
            />

            {/* CLUB ADVISER */}
            <label className="block text-sm font-medium mb-1">
              Club Adviser
            </label>

            <input
              className="w-full border p-2 rounded-lg mb-3"
              value={committee.adviser_name ?? ""}
              placeholder="Enter adviser's full name"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "adviser_name",
                  e.target.value
                )
              }
            />

            {/* FOCUS AREA */}
            <label className="block text-sm font-medium mb-1">
              Focus Area
            </label>

            <input
              className="w-full border p-2 rounded-lg"
              value={committee.focus}
              placeholder="Enter club focus area"
              onChange={(e) =>
                updateCommittee(
                  index,
                  "focus",
                  e.target.value
                )
              }
            />
          </div>
        )
      )}

      {/* ADD EMPTY SLOTS */}
      {committees.length < 10 && (
        <button
          type="button"
          onClick={addEmptyCommittees}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-lg border border-blue-200 transition-colors"
        >
          + Add Empty Club Slots (
          {10 - committees.length} remaining)
        </button>
      )}

      {committees.length >= 10 && (
        <p className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          All 10 club editor slots are ready.
        </p>
      )}
    </div>
  );
}
