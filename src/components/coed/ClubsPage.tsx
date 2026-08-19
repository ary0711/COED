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

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

// =====================================================
// CLUB STATISTIC
// IMPORTANT:
// These fields must match your Supabase table.
// =====================================================

interface ClubStatistic {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  display_order: number;
}

// =====================================================
// ORGANIZATION
// =====================================================

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  members: string;
  motto: string;
  display_order: number;
}

// =====================================================
// COMMITTEE
// =====================================================

interface Committee {
  id: string;
  committee_code: string;
  full_name: string;
  description: string;
  focus: string;
  display_order: number;
}

// =====================================================
// PAGE PROPS
// =====================================================

interface ClubsPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewStatistics?: ClubStatistic[];
  previewOrganizations?: Organization[];
  previewCommittees?: Committee[];
}

// =====================================================
// ICON MAPPING
// Database stores simple text values such as:
// users, award, star, trophy, etc.
// =====================================================

const STATISTIC_ICONS: Record<string, any> = {
  users: Users,
  graduation: GraduationCap,
  award: Award,
  star: Star,
  trophy: Trophy,
  book: BookOpen,
  building: Building2,
  person: UserRound,
  work: BriefcaseBusiness,
  heart: Heart,
  target: Target,
  medal: Medal,
};

// =====================================================
// COLOR MAPPING
// Database stores simple values:
// blue, green, purple, orange, red, cyan
// =====================================================

const STATISTIC_COLORS: Record<string, string> = {
  blue: "bg-gradient-to-br from-[#2563EB] to-[#60A5FA]",

  green:
    "bg-gradient-to-br from-[#10B981] to-[#34D399]",

  purple:
    "bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]",

  orange:
    "bg-gradient-to-br from-[#F97316] to-[#FBBF24]",

  red:
    "bg-gradient-to-br from-[#EF4444] to-[#FB7185]",

  cyan:
    "bg-gradient-to-br from-[#06B6D4] to-[#60A5FA]",
};

// =====================================================
// CLUBS PAGE
// =====================================================

export function ClubsPage({
  previewMode = false,
  previewContent,
  previewStatistics,
  previewOrganizations,
  previewCommittees,
}: ClubsPageProps) {

  // ===================================================
  // STATE
  // ===================================================

  const [pageContent, setPageContent] =
    useState<Record<string, any>>({});

  const [statistics, setStatistics] =
    useState<ClubStatistic[]>([]);

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [committees, setCommittees] =
    useState<Committee[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // LOAD DATA
  // ===================================================

  useEffect(() => {

    // -----------------------------------------------
    // PREVIEW MODE
    // -----------------------------------------------

    if (previewMode) {

      if (previewContent) {
        setPageContent(previewContent);
      }

      if (previewStatistics) {
        setStatistics(previewStatistics);
      }

      if (previewOrganizations) {
        setOrganizations(previewOrganizations);
      }

      if (previewCommittees) {
        setCommittees(previewCommittees);
      }

      setLoading(false);

      return;
    }

    // -----------------------------------------------
    // NORMAL PAGE
    // -----------------------------------------------

    loadData();

  }, [
    previewMode,
    previewContent,
    previewStatistics,
    previewOrganizations,
    previewCommittees,
  ]);

  // ===================================================
  // LOAD ALL DATA
  // ===================================================

  async function loadData() {

    setLoading(true);

    await Promise.all([
      loadPageContent(),
      loadStatistics(),
      loadOrganizations(),
      loadCommittees(),
    ]);

    setLoading(false);
  }

  // ===================================================
  // LOAD PAGE CONTENT
  // ===================================================

  async function loadPageContent() {

    const { data, error } =
      await supabase
        .from("clubs_page_content")
        .select("*");

    if (error) {
      console.error(
        "Error loading clubs page content:",
        error
      );

      return;
    }

    const formatted: Record<string, any> = {};

    data?.forEach((item) => {
      formatted[item.section_name] = item;
    });

    setPageContent(formatted);
  }

  // ===================================================
  // LOAD STATISTICS
  // ===================================================

  async function loadStatistics() {

    const { data, error } =
      await supabase
        .from("clubs_statistics")
        .select(
          "id, title, value, icon, color, display_order"
        )
        .order("display_order", {
          ascending: true,
        });

    if (error) {

      console.error(
        "Error loading club statistics:",
        error
      );

      return;
    }

    console.log(
      "Loaded club statistics:",
      data
    );

    setStatistics(data || []);
  }

  // ===================================================
  // LOAD ORGANIZATIONS
  // ===================================================

  async function loadOrganizations() {

    const { data, error } =
      await supabase
        .from("organizations")
        .select("*")
        .order("display_order", {
          ascending: true,
        });

    if (error) {

      console.error(
        "Error loading organizations:",
        error
      );

      return;
    }

    setOrganizations(data || []);
  }

  // ===================================================
  // LOAD COMMITTEES
  // ===================================================

  async function loadCommittees() {

    const { data, error } =
      await supabase
        .from("committees")
        .select("*")
        .order("display_order", {
          ascending: true,
        });

    if (error) {

      console.error(
        "Error loading committees:",
        error
      );

      return;
    }

    setCommittees(data || []);
  }

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (!previewMode && loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-[#1E3A8A]">
            Loading Organization...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we load the page.
          </p>

        </div>

      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-white py-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-12">

          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            {pageContent.header?.title}
          </h1>

          <p className="text-xl text-gray-600">
            {pageContent.header?.description}
          </p>

        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="grid md:grid-cols-3 gap-6 mb-12">

          {statistics.map((stat) => {

            // ---------------------------------------------
            // GET ICON FROM DATABASE
            // ---------------------------------------------

            const StatisticIcon =
              STATISTIC_ICONS[
                stat.icon || "users"
              ] || Users;

            // ---------------------------------------------
            // GET COLOR FROM DATABASE
            // ---------------------------------------------

            const statisticColor =
              STATISTIC_COLORS[
                stat.color || "blue"
              ] || STATISTIC_COLORS.blue;

            return (
              <div
                key={stat.id}
                className={`
                  ${statisticColor}
                  rounded-xl
                  shadow-lg
                  p-6
                  text-white
                  transition-all
                  duration-300
                `}
              >

                {/* ICON */}

                <StatisticIcon
                  className="w-10 h-10 mb-3 opacity-90"
                  strokeWidth={2}
                />

                {/* VALUE */}

                <div className="text-3xl font-bold mb-1">
                  {stat.value}
                </div>

                {/* TITLE */}

                <div className="font-medium">
                  {stat.title}
                </div>

              </div>
            );
          })}

        </div>

        {/* ================================================= */}
        {/* MAIN ORGANIZATION */}
        {/* ================================================= */}

        <div className="mb-14">

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 pb-3 border-b-4 border-[#2563EB]">
            Main Organization
          </h2>

          {organizations.map((org) => (

            <div
              key={org.id}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow"
            >

              <h3 className="text-2xl font-semibold text-[#2563EB] mb-2">
                {org.name}
              </h3>

              <p className="text-sm text-gray-500 font-medium mb-4 uppercase tracking-wide">
                {org.type}
              </p>

              <p className="text-gray-700 leading-relaxed mb-6">
                {org.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 text-sm">

                <div className="flex-1">

                  <p className="text-gray-500 font-medium mb-1">
                    Membership
                  </p>

                  <p className="text-gray-900 font-semibold">
                    {org.members}
                  </p>

                </div>

                <div className="flex-1">

                  <p className="text-gray-500 font-medium mb-1">
                    Motto
                  </p>

                  <p className="text-gray-900 font-semibold italic">
                    {org.motto}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* ================================================= */}
        {/* COMMITTEES */}
        {/* ================================================= */}

        <div>

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 pb-3 border-b-4 border-[#2563EB]">
            UnEC Committees
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {committees.map((committee) => (

              <div
                key={committee.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >

                <div className="mb-4">

                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-3">
                    {committee.committee_code}
                  </div>

                  <h3 className="text-lg font-semibold text-[#2563EB]">
                    {committee.full_name}
                  </h3>

                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {committee.description}
                </p>

                <div className="pt-4 border-t border-gray-200">

                  <p className="text-xs text-gray-500 font-medium mb-1">
                    FOCUS AREA
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {committee.focus}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}