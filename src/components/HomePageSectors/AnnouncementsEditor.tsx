import React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

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

  // ===================================================
  // HANDLE IMAGE UPLOAD
  // ===================================================

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert the file to a Base64 string for preview and saving
    // Note: If you prefer to upload to Supabase Storage first, 
    // you would place your Supabase upload logic here instead.
    const reader = new FileReader();
    reader.onloadend = () => {
      updateAnnouncement(index, "image_url", reader.result as string);
    };
    reader.readAsDataURL(file);
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
          Edit your announcement content, upload a photo, and choose a color for each announcement.
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
              {/* IMAGE UPLOAD */}
              {/* ========================================= */}

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Announcement Photo (Optional)
              </label>

              {announcement.image_url ? (
                <div className="relative mb-4 w-full rounded-lg overflow-hidden border border-gray-200 group bg-white flex justify-center">
                  <img 
                    src={announcement.image_url} 
                    alt="Announcement Preview" 
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => updateAnnouncement(index, "image_url", "")}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" /> Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-10 h-10 mb-2 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        <span className="text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, or GIF</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(index, e)} 
                    />
                  </label>
                </div>
              )}

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

                  {/* PREVIEW IMAGE */}
                  {announcement.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-white/20 shadow-sm bg-white/10 flex justify-center">
                      <img 
                        src={announcement.image_url} 
                        alt="Preview" 
                        className="w-full h-auto max-h-[600px] object-contain"
                      />
                    </div>
                  )}

                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {!announcement.image_url && <ImageIcon className="w-5 h-5 opacity-70" />}
                    {announcement.title ||
                      "Announcement Title"}
                  </h3>

                  <p className="text-sm text-white/90 mt-2">
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
        <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">

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