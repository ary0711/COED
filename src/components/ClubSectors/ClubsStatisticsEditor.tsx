import React from "react";
import {
  Users,
  GraduationCap,
  Award,
  Star,
  Trophy,
  BookOpen,
  Building2,
  UserRound,
  BriefcaseBusiness,
  Heart,
  Target,
  Medal,
} from "lucide-react";

interface ClubStatistic {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  display_order: number;
}

interface Props {
  statistics: ClubStatistic[];
  setStatistics: React.Dispatch<
    React.SetStateAction<ClubStatistic[]>
  >;
}

// =====================================================
// ICON OPTIONS
// These VALUES are saved to Supabase.
// =====================================================

const ICON_OPTIONS = [
  {
    name: "Users",
    value: "users",
    Icon: Users,
  },
  {
    name: "Graduation",
    value: "graduation",
    Icon: GraduationCap,
  },
  {
    name: "Award",
    value: "award",
    Icon: Award,
  },
  {
    name: "Star",
    value: "star",
    Icon: Star,
  },
  {
    name: "Trophy",
    value: "trophy",
    Icon: Trophy,
  },
  {
    name: "Book",
    value: "book",
    Icon: BookOpen,
  },
  {
    name: "Building",
    value: "building",
    Icon: Building2,
  },
  {
    name: "Person",
    value: "person",
    Icon: UserRound,
  },
  {
    name: "Work",
    value: "work",
    Icon: BriefcaseBusiness,
  },
  {
    name: "Heart",
    value: "heart",
    Icon: Heart,
  },
  {
    name: "Target",
    value: "target",
    Icon: Target,
  },
  {
    name: "Medal",
    value: "medal",
    Icon: Medal,
  },
];

// =====================================================
// COLOR OPTIONS
// These VALUES are saved to Supabase.
// =====================================================

const COLOR_OPTIONS = [
  {
    name: "Blue",
    value: "blue",
    className:
      "bg-gradient-to-r from-blue-500 to-blue-400",
  },
  {
    name: "Green",
    value: "green",
    className:
      "bg-gradient-to-r from-emerald-500 to-green-400",
  },
  {
    name: "Purple",
    value: "purple",
    className:
      "bg-gradient-to-r from-purple-500 to-purple-400",
  },
  {
    name: "Orange",
    value: "orange",
    className:
      "bg-gradient-to-r from-orange-500 to-amber-400",
  },
  {
    name: "Red",
    value: "red",
    className:
      "bg-gradient-to-r from-red-500 to-rose-400",
  },
  {
    name: "Cyan",
    value: "cyan",
    className:
      "bg-gradient-to-r from-cyan-500 to-blue-400",
  },
];

// =====================================================
// GET COLOR CLASS
// =====================================================

const getColorClass = (color: string) => {
  switch (color) {
    case "blue":
      return "bg-gradient-to-r from-blue-500 to-blue-400";

    case "green":
      return "bg-gradient-to-r from-emerald-500 to-green-400";

    case "purple":
      return "bg-gradient-to-r from-purple-500 to-purple-400";

    case "orange":
      return "bg-gradient-to-r from-orange-500 to-amber-400";

    case "red":
      return "bg-gradient-to-r from-red-500 to-rose-400";

    case "cyan":
      return "bg-gradient-to-r from-cyan-500 to-blue-400";

    default:
      return "bg-gradient-to-r from-blue-500 to-blue-400";
  }
};

// =====================================================
// GET ICON
// =====================================================

const getIconComponent = (icon: string) => {
  const found = ICON_OPTIONS.find(
    (item) => item.value === icon
  );

  return found?.Icon || Users;
};

// =====================================================
// COMPONENT
// =====================================================

export function ClubsStatisticsEditor({
  statistics,
  setStatistics,
}: Props) {

  // ===================================================
  // UPDATE STATISTIC
  // ===================================================

  function updateStatistic(
    index: number,
    field: keyof ClubStatistic,
    value: string
  ) {
    setStatistics((prev) =>
      prev.map((stat, i) =>
        i === index
          ? {
              ...stat,
              [field]: value,
            }
          : stat
      )
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Club Statistics
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Customize the title, value, icon, and color
          of each statistic.
        </p>
      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      {statistics.map((stat, index) => {

        // Keep existing database values.
        const currentIcon =
          stat.icon || "users";

        const currentColor =
          stat.color || "blue";

        const PreviewIcon =
          getIconComponent(currentIcon);

        return (
          <div
            key={stat.id}
            className="border border-gray-200 rounded-xl p-5 mb-5 bg-gray-50"
          >

            {/* ========================================= */}
            {/* TITLE */}
            {/* ========================================= */}

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Statistic Title
            </label>

            <input
              type="text"
              className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={stat.title || ""}
              placeholder="Statistic title"
              onChange={(e) =>
                updateStatistic(
                  index,
                  "title",
                  e.target.value
                )
              }
            />

            {/* ========================================= */}
            {/* VALUE */}
            {/* ========================================= */}

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Statistic Value
            </label>

            <input
              type="text"
              className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={stat.value || ""}
              placeholder="Statistic value"
              onChange={(e) =>
                updateStatistic(
                  index,
                  "value",
                  e.target.value
                )
              }
            />

            {/* ========================================= */}
            {/* ICON SELECTOR */}
            {/* ========================================= */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statistic Icon
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-5">
              {ICON_OPTIONS.map((option) => {
                const IconComponent =
                  option.Icon;

                const selected =
                  currentIcon === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    title={option.name}
                    onClick={() =>
                      updateStatistic(
                        index,
                        "icon",
                        option.value
                      )
                    }
                    className={`
                      relative
                      h-14
                      rounded-lg
                      border
                      flex
                      items-center
                      justify-center
                      bg-white
                      transition-all
                      duration-200
                      hover:bg-blue-50
                      hover:scale-105
                      ${
                        selected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }
                    `}
                  >
                    <IconComponent
                      size={25}
                      strokeWidth={2}
                      className={
                        selected
                          ? "text-blue-600"
                          : "text-gray-700"
                      }
                    />

                    {selected && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ========================================= */}
            {/* COLOR SELECTOR */}
            {/* ========================================= */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statistic Color
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {COLOR_OPTIONS.map((option) => {
                const selected =
                  currentColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateStatistic(
                        index,
                        "color",
                        option.value
                      )
                    }
                    className={`
                      relative
                      h-11
                      rounded-lg
                      ${option.className}
                      text-white
                      font-semibold
                      transition-all
                      duration-200
                      hover:scale-[1.02]
                      ${
                        selected
                          ? "ring-4 ring-blue-300 ring-offset-2"
                          : "ring-1 ring-gray-200"
                      }
                    `}
                  >
                    {option.name}

                    {selected && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ========================================= */}
            {/* CURRENT VALUES */}
            {/* ========================================= */}

            <div className="flex flex-wrap gap-2 mb-5">

              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">
                  Saved Icon
                </p>

                <p className="text-sm font-semibold text-gray-700">
                  {currentIcon}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">
                  Saved Color
                </p>

                <p className="text-sm font-semibold text-gray-700">
                  {currentColor}
                </p>
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
                  min-h-[140px]
                  transition-all
                  duration-300
                `}
              >
                <div className="flex flex-col justify-between min-h-[100px]">

                  {/* ICON */}

                  <PreviewIcon
                    size={38}
                    strokeWidth={2}
                  />

                  {/* VALUE */}

                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      {stat.value || "0"}
                    </div>

                    <div className="text-base font-medium text-white/90">
                      {stat.title ||
                        "Statistic Title"}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        );
      })}

      {/* ================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================= */}

      {statistics.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p className="font-medium">
            No statistics available.
          </p>

          <p className="text-sm mt-1">
            Add a statistic to see it here.
          </p>
        </div>
      )}

    </div>
  );
}