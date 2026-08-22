import React from "react";

interface Props {
  announcements: any[];
  setAnnouncements: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

// =====================================================
// COLOR OPTIONS
//
// IMPORTANT:
// The "value" is what will be saved to Supabase.
//
// Examples:
// blue
// purple
// green
// orange
// red
// yellow
// cyan
// pink
// indigo
// teal
// =====================================================

const COLOR_OPTIONS = [
  {
    name: "Blue",
    value: "blue",
    className:
      "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  {
    name: "Purple",
    value: "purple",
    className:
      "bg-gradient-to-r from-purple-500 to-purple-600",
  },
  {
    name: "Green",
    value: "green",
    className:
      "bg-gradient-to-r from-green-500 to-green-600",
  },
  {
    name: "Orange",
    value: "orange",
    className:
      "bg-gradient-to-r from-orange-500 to-orange-600",
  },
  {
    name: "Red",
    value: "red",
    className:
      "bg-gradient-to-r from-red-500 to-red-600",
  },
  {
    name: "Yellow",
    value: "yellow",
    className:
      "bg-gradient-to-r from-yellow-400 to-yellow-500",
  },
  {
    name: "Cyan",
    value: "cyan",
    className:
      "bg-gradient-to-r from-cyan-500 to-cyan-600",
  },
  {
    name: "Pink",
    value: "pink",
    className:
      "bg-gradient-to-r from-pink-500 to-pink-600",
  },
  {
    name: "Indigo",
    value: "indigo",
    className:
      "bg-gradient-to-r from-indigo-500 to-indigo-600",
  },
  {
    name: "Teal",
    value: "teal",
    className:
      "bg-gradient-to-r from-teal-500 to-teal-600",
  },
];

// =====================================================
// GET COLOR CLASS
// =====================================================

const getColorClass = (color: string) => {
  switch (color) {
    case "blue":
      return "bg-gradient-to-r from-blue-500 to-blue-600";

    case "purple":
      return "bg-gradient-to-r from-purple-500 to-purple-600";

    case "green":
      return "bg-gradient-to-r from-green-500 to-green-600";

    case "orange":
      return "bg-gradient-to-r from-orange-500 to-orange-600";

    case "red":
      return "bg-gradient-to-r from-red-500 to-red-600";

    case "yellow":
      return "bg-gradient-to-r from-yellow-400 to-yellow-500";

    case "cyan":
      return "bg-gradient-to-r from-cyan-500 to-cyan-600";

    case "pink":
      return "bg-gradient-to-r from-pink-500 to-pink-600";

    case "indigo":
      return "bg-gradient-to-r from-indigo-500 to-indigo-600";

    case "teal":
      return "bg-gradient-to-r from-teal-500 to-teal-600";

    default:
      return "bg-gradient-to-r from-blue-500 to-blue-600";
  }
};

// =====================================================
// COMPONENT
// =====================================================

export function AnnouncementsEditor({
  announcements,
  setAnnouncements,
}: Props) {

  // ===================================================
  // UPDATE ANNOUNCEMENT
  // ===================================================

  const updateAnnouncement = (
    index: number,
    field: string,
    value: string
  ) => {
    setAnnouncements((prev) =>
      prev.map((announcement, i) =>
        i === index
          ? {
              ...announcement,
              [field]: value,
            }
          : announcement
      )
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow mb-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          Announcements
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Edit your announcement content and choose a
          color for each announcement.
        </p>
      </div>

      {/* ================================================= */}
      {/* ANNOUNCEMENTS */}
      {/* ================================================= */}

      {announcements.map(
        (announcement, index) => {

          // If the database value is empty/null,
          // use blue as the default.
          const currentColor =
            announcement.color || "blue";

          return (
            <div
              key={announcement.id}
              className="border border-gray-200 rounded-xl p-5 mb-5 bg-gray-50"
            >

              {/* ========================================= */}
              {/* TITLE */}
              {/* ========================================= */}

              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title
              </label>

              <input
                type="text"
                className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={
                  announcement.title || ""
                }
                placeholder="Announcement title"
                onChange={(e) =>
                  updateAnnouncement(
                    index,
                    "title",
                    e.target.value
                  )
                }
              />

              {/* ========================================= */}
              {/* DESCRIPTION */}
              {/* ========================================= */}

              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>

              <textarea
                className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                value={
                  announcement.description || ""
                }
                placeholder="Announcement description"
                onChange={(e) =>
                  updateAnnouncement(
                    index,
                    "description",
                    e.target.value
                  )
                }
              />

              {/* ========================================= */}
              {/* COLOR */}
              {/* ========================================= */}

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Announcement Color
              </label>

             {/* ========================================= */}
{/* COLOR OPTIONS */}
{/* ========================================= */}

<div className="flex flex-wrap items-center gap-4 mb-4">
  {COLOR_OPTIONS.map((option) => {
    const isSelected = currentColor === option.value;

    return (
      <button
        key={option.value}
        type="button"
        title={option.name}
        aria-label={`Select ${option.name} color`}
        onClick={() =>
          updateAnnouncement(
            index,
            "color",
            option.value
          )
        }
        className={`
          relative
          w-11
          h-11
          rounded-full
          ${option.className}
          transition-all
          duration-200
          hover:scale-110
          active:scale-95
          focus:outline-none
          focus:ring-2
          focus:ring-blue-300
          focus:ring-offset-2
          ${
            isSelected
              ? "ring-4 ring-blue-300 ring-offset-2 scale-110"
              : "ring-1 ring-gray-200"
          }
        `}
      >
        {isSelected && (
          <span
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
            "
          >
            <span
              className="
                w-5
                h-5
                bg-white
                text-blue-600
                rounded-full
                flex
                items-center
                justify-center
                text-xs
                font-bold
                shadow
              "
            >
              ✓
            </span>
          </span>
        )}
      </button>
    );
  })}
</div>

              {/* ========================================= */}
              {/* CURRENT DATABASE VALUE */}
              {/* ========================================= */}

              <div className="mb-5">

                <p className="text-xs font-medium text-gray-500 mb-1">
                  Database color value
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">

                  {/* COLOR DOT */}

                  <span
                    className={`
                      w-3
                      h-3
                      rounded-full
                      ${getColorClass(currentColor)}
                    `}
                  />

                  <span className="text-sm font-semibold text-gray-700">
                    {currentColor}
                  </span>

                </div>

              </div>

              {/* ========================================= */}
              {/* LIVE PREVIEW */}
              {/* ========================================= */}

              <div>

                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Live Preview
                </p>

                <div
                  className={`
                    ${getColorClass(currentColor)}
                    rounded-xl
                    p-5
                    text-white
                    shadow-md
                    transition-all
                    duration-300
                  `}
                >

                  <h3 className="text-lg font-bold">
                    {announcement.title ||
                      "Announcement Title"}
                  </h3>

                  <p className="text-sm text-white/90 mt-1">
                    {announcement.description ||
                      "Announcement description will appear here."}
                  </p>

                </div>

              </div>

            </div>
          );
        }
      )}

      {/* ================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================= */}

      {announcements.length === 0 && (
        <div className="text-center py-10 text-gray-500">

          <p className="font-medium">
            No announcements available.
          </p>

          <p className="text-sm mt-1">
            Add an announcement to see it here.
          </p>

        </div>
      )}

    </div>
  );
}