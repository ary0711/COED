import React from "react";
import {
  GraduationCap,
  Building2,
  Trophy,
  UserRound,
  BookOpen,
  Library,
  Users,
  Lightbulb,
  Star,
  Target,
  ScrollText,
  Monitor,
  Globe,
  Heart,
  Check,
  type LucideIcon,
} from "lucide-react";

interface Props {
  features: any[];
  setFeatures: React.Dispatch<
    React.SetStateAction<any[]>
  >;
}

// =====================================================
// ICON OPTIONS
// The `value` is what will be saved to the database.
// The `icon` is the actual Lucide icon component.
// =====================================================

const ICON_OPTIONS: {
  name: string;
  value: string;
  icon: LucideIcon;
}[] = [
  {
    name: "Teacher",
    value: "UserRound",
    icon: UserRound,
  },
  {
    name: "University",
    value: "Building2",
    icon: Building2,
  },
  {
    name: "Achievement",
    value: "Trophy",
    icon: Trophy,
  },
  {
    name: "Student",
    value: "GraduationCap",
    icon: GraduationCap,
  },
  {
    name: "Book",
    value: "BookOpen",
    icon: BookOpen,
  },
  {
    name: "Education",
    value: "Library",
    icon: Library,
  },
  {
    name: "People",
    value: "Users",
    icon: Users,
  },
  {
    name: "Ideas",
    value: "Lightbulb",
    icon: Lightbulb,
  },
  {
    name: "Star",
    value: "Star",
    icon: Star,
  },
  {
    name: "Target",
    value: "Target",
    icon: Target,
  },
  {
    name: "Certificate",
    value: "ScrollText",
    icon: ScrollText,
  },
  {
    name: "Computer",
    value: "Monitor",
    icon: Monitor,
  },
  {
    name: "Global",
    value: "Globe",
    icon: Globe,
  },
  {
    name: "Community",
    value: "Heart",
    icon: Heart,
  },
];

// =====================================================
// HELPER
// Finds the Lucide icon based on the saved database value.
// =====================================================

const getIconOption = (value: string) => {
  return (
    ICON_OPTIONS.find(
      (option) => option.value === value
    ) || ICON_OPTIONS[0]
  );
};

// =====================================================
// COMPONENT
// =====================================================

export function FeaturesEditor({
  features,
  setFeatures,
}: Props) {

  // ===================================================
  // UPDATE FEATURE
  // ===================================================

  const updateFeature = (
    index: number,
    field: string,
    value: string
  ) => {
    setFeatures((prev) =>
      prev.map((feature, i) =>
        i === index
          ? {
              ...feature,
              [field]: value,
            }
          : feature
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
          Features
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Edit your feature information and choose an
          icon for each feature.
        </p>
      </div>

      {/* ================================================= */}
      {/* FEATURES */}
      {/* ================================================= */}

      {features.map((feature, index) => {

        const currentIcon =
          feature.icon || "BookOpen";

        const selectedIcon =
          getIconOption(currentIcon);

        const CurrentIcon =
          selectedIcon.icon;

        return (
          <div
            key={feature.id}
            className="border border-gray-200 rounded-xl p-5 mb-5 bg-gray-50"
          >

            {/* =========================================== */}
            {/* TITLE */}
            {/* =========================================== */}

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Feature Title
            </label>

            <input
              className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={feature.title || ""}
              placeholder="Feature title"
              onChange={(e) =>
                updateFeature(
                  index,
                  "title",
                  e.target.value
                )
              }
            />

            {/* =========================================== */}
            {/* DESCRIPTION */}
            {/* =========================================== */}

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>

            <textarea
              className="w-full border border-gray-300 bg-white p-2.5 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              value={
                feature.description || ""
              }
              placeholder="Feature description"
              onChange={(e) =>
                updateFeature(
                  index,
                  "description",
                  e.target.value
                )
              }
            />

            {/* =========================================== */}
            {/* ICON */}
            {/* =========================================== */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Feature Icon
            </label>

            {/* =========================================== */}
            {/* CURRENT ICON PREVIEW */}
            {/* =========================================== */}

            <div className="flex items-center gap-3 mb-4 bg-white border border-gray-200 rounded-lg p-3">

              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                <CurrentIcon
                  size={26}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Selected Icon
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {selectedIcon.name}
                </p>
              </div>

            </div>

            {/* =========================================== */}
            {/* ICON CHOICES */}
            {/* =========================================== */}

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">

              {ICON_OPTIONS.map((option) => {

                const Icon =
                  option.icon;

                const isSelected =
                  currentIcon ===
                  option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    title={option.name}
                    onClick={() =>
                      updateFeature(
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
                      hover:scale-105
                      hover:bg-blue-50
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200"
                      }
                    `}
                  >

                    <Icon
                      size={25}
                      strokeWidth={
                        isSelected
                          ? 2.5
                          : 2
                      }
                      className={
                        isSelected
                          ? "text-blue-600"
                          : "text-gray-600"
                      }
                    />

                    {/* SELECTED CHECK */}

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow">

                        <Check
                          size={12}
                          strokeWidth={3}
                        />

                      </span>
                    )}

                  </button>
                );
              })}

            </div>

            {/* =========================================== */}
            {/* DATABASE VALUE */}
            {/* =========================================== */}

            <div className="mt-4">

              <p className="text-xs font-medium text-gray-500 mb-1">
                Database icon value
              </p>

              <code className="inline-block bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                {currentIcon}
              </code>

            </div>

            {/* =========================================== */}
            {/* FEATURE PREVIEW */}
            {/* =========================================== */}

            <div className="mt-5">

              <p className="text-sm font-semibold text-gray-700 mb-2">
                Preview
              </p>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

                <div className="flex items-start gap-4">

                  <div className="w-14 h-14 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">

                    <CurrentIcon
                      size={30}
                      strokeWidth={2}
                    />

                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {feature.title ||
                        "Feature Title"}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      {feature.description ||
                        "Feature description will appear here."}
                    </p>
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

      {features.length === 0 && (
        <div className="text-center py-10 text-gray-500">

          <div className="flex justify-center mb-3">
            <Library
              size={40}
              className="text-gray-400"
            />
          </div>

          <p className="font-medium">
            No features available.
          </p>

          <p className="text-sm mt-1">
            Add a feature to see it here.
          </p>

        </div>
      )}

    </div>
  );
}