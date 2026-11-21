import {
  BookOpen,
  Award,
  Users,
  ExternalLink,
  X,
  Calendar,
  UserRound,
  Building2,
  FileText,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface ResearchPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewPublications?: any[];
  previewAchievements?: any[];
  previewAlumni?: any[];
}

export function ResearchPage({
  previewMode = false,
  previewContent,
  previewPublications,
  previewAchievements,
  previewAlumni,
}: ResearchPageProps) {
  const [pageContent, setPageContent] = useState<any>({});

  const [publications, setPublications] = useState<any[]>([]);

  const [achievements, setAchievements] = useState<any[]>([]);

  const [alumni, setAlumni] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedAlumni, setSelectedAlumni] =
    useState<any>(null);

  const [selectedResearch, setSelectedResearch] =
    useState<any>(null);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (previewMode) {
      setPageContent(previewContent || {});

      setPublications(previewPublications || []);

      setAchievements(previewAchievements || []);

      setAlumni(previewAlumni || []);

      setLoading(false);

      return;
    }

    loadData();
  }, [
    previewMode,
    previewContent,
    previewPublications,
    previewAchievements,
    previewAlumni,
  ]);

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadPageContent(),
        loadPublications(),
        loadAchievements(),
        loadAlumni(),
      ]);
    } catch (error) {
      console.error('Failed to load Research Page:', error);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD PAGE CONTENT
  // =====================================================

  async function loadPageContent() {
    try {
      const { data, error } = await supabase
        .from('research_page_content')
        .select('*');

      if (error) {
        console.error(
          'Failed to load research page content:',
          error
        );

        return;
      }

      const formatted: any = {};

      (data || []).forEach((item: any) => {
        formatted[item.section_name] = item;
      });

      setPageContent(formatted);
    } catch (error) {
      console.error(
        'Research page content error:',
        error
      );
    }
  }

  // =====================================================
  // LOAD ALL APPROVED RESEARCH
  // =====================================================

  const RESEARCH_PUBLIC_API =
    'http://localhost:5000/api/research-submissions/public/approved';

  async function loadPublications() {
    try {
      console.log(
        'Loading approved research from:',
        RESEARCH_PUBLIC_API
      );

      const response = await fetch(
        RESEARCH_PUBLIC_API,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          'Approved research API error:',
          response.status,
          errorText
        );

        throw new Error(
          `Failed to load approved research (${response.status})`
        );
      }

      const data = await response.json();

      console.log(
        'ALL APPROVED RESEARCH:',
        data
      );

      // Make sure we always work with an array.
      const researchList = Array.isArray(data)
        ? data
        : [];

      const formatted = researchList.map(
        (item: any) => ({
          id: item.id,

          title:
            item.title ||
            'Untitled Research',

          authors:
            item.authors ||
            item.submitter?.full_name ||
            'COED Faculty Research Team',

          category:
            item.category ||
            'Research',

          year: item.created_at
            ? new Date(
                item.created_at
              ).getFullYear()
            : '',

          journal: item.publication_link
            ? 'Published Research / DOI'
            : 'College of Education Research',

          link:
            item.publication_link ||
            '',

          description:
            item.description ||
            'No research description was provided.',

          department:
            item.submitter?.department ||
            'College of Education',

          created_at:
            item.created_at || null,

          updated_at:
            item.updated_at || null,
        })
      );

      setPublications(formatted);
    } catch (error) {
      console.error(
        'Failed to load approved research:',
        error
      );

      setPublications([]);
    }
  }

  // =====================================================
  // LOAD AWARDS
  // =====================================================

  async function loadAchievements() {
    try {
      const { data, error } = await supabase
        .from('research_awards')
        .select('*')
        .order('display_order');

      if (error) {
        console.error(
          'Failed to load research awards:',
          error
        );

        return;
      }

      setAchievements(data || []);
    } catch (error) {
      console.error(
        'Research awards error:',
        error
      );
    }
  }

  // =====================================================
  // LOAD FEATURED ALUMNI
  // =====================================================

  async function loadAlumni() {
    try {
      const { data, error } = await supabase
        .from('featured_alumni')
        .select('*')
        .order('display_order');

      if (error) {
        console.error(
          'Failed to load featured alumni:',
          error
        );

        return;
      }

      setAlumni(data || []);
    } catch (error) {
      console.error(
        'Featured alumni error:',
        error
      );
    }
  }

  // =====================================================
  // OPEN RESEARCH
  // =====================================================

  function handleResearchClick(
    research: any
  ) {
    // If there is a publication link,
    // open the actual research.
    if (
      research.link &&
      research.link.trim() !== ''
    ) {
      window.open(
        research.link,
        '_blank',
        'noopener,noreferrer'
      );

      return;
    }

    // If there is NO publication link,
    // show the research details modal.
    setSelectedResearch(research);
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (!previewMode && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4"></div>

          <h2 className="text-xl font-semibold text-[#1E3A8A]">
            Loading Research...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we load the page.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            {pageContent.header?.title ||
              ''}
          </h1>

          <p className="text-xl text-gray-600">
            {pageContent.header?.description ||
              ''}
          </p>
        </div>

        {/* =================================================
            PUBLICATIONS
        ================================================= */}

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#2563EB]" />
            </div>

            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              {pageContent.publications?.title ||
                'Published Research & Extension'}
            </h2>

          </div>

          {/* NO RESEARCH MESSAGE */}

          {publications.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />

              <h3 className="text-lg font-semibold text-gray-700">
                No approved research available
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Approved research submissions will
                appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">

              {publications.map(
                (research) => (
                  <div
                    key={research.id}
                    onClick={() =>
                      handleResearchClick(
                        research
                      )
                    }
                    className="
                      bg-white
                      rounded-xl
                      shadow-md
                      p-6
                      border
                      border-gray-100
                      hover:shadow-lg
                      hover:border-blue-300
                      transition-all
                      cursor-pointer
                    "
                  >

                    {/* TOP INFORMATION */}

                    <div className="flex items-center gap-3 mb-3">

                      <span
                        className={`
                          px-3
                          py-1
                          rounded-full
                          text-xs
                          font-medium
                          ${
                            research.category
                              ?.toLowerCase()
                              .includes(
                                'extension'
                              )
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        `}
                      >
                        {research.category}
                      </span>

                      {research.year && (
                        <span className="text-sm text-gray-500">
                          {research.year}
                        </span>
                      )}

                    </div>

                    {/* TITLE */}

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {research.title}
                    </h3>

                    {/* AUTHORS */}

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">

                      <p className="flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-[#2563EB]" />

                        <span>
                          <strong>
                            Authors:
                          </strong>{' '}
                          {research.authors}
                        </span>
                      </p>

                      {research.department && (
                        <p className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#2563EB]" />

                          <span>
                            <strong>
                              Department:
                            </strong>{' '}
                            {research.department}
                          </span>
                        </p>
                      )}

                    </div>

                    {/* JOURNAL */}

                    <p className="text-sm text-gray-600 mt-2">
                      <strong>
                        Published in:
                      </strong>{' '}
                      {research.journal}
                    </p>

                    {/* DESCRIPTION PREVIEW */}

                    {research.description && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {research.description}
                      </p>
                    )}

                    {/* ACTION */}

                    <div className="mt-5">

                      {research.link ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            window.open(
                              research.link,
                              '_blank',
                              'noopener,noreferrer'
                            );
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            bg-[#2563EB]
                            text-white
                            rounded-lg
                            hover:bg-[#1D4ED8]
                            transition
                            font-medium
                            text-sm
                          "
                        >
                          <BookOpen className="w-4 h-4" />

                          Read Research

                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedResearch(
                              research
                            );
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            bg-gray-100
                            text-gray-700
                            rounded-lg
                            hover:bg-gray-200
                            transition
                            font-medium
                            text-sm
                          "
                        >
                          <FileText className="w-4 h-4" />

                          View Research Details
                        </button>
                      )}

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            ACHIEVEMENTS
        ================================================= */}

        <section className="mb-12">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>

            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              {pageContent.achievements?.title ||
                'Awards & Recognition'}
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {achievements.map(
              (achievement) => (
                <div
                  key={achievement.id}
                  className="
                    bg-white
                    rounded-xl
                    shadow-md
                    p-6
                    border-l-4
                    border-yellow-500
                  "
                >

                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {achievement.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">

                    <p>
                      <strong>
                        Recipient:
                      </strong>{' '}
                      {achievement.recipient}
                    </p>

                    <p>
                      <strong>
                        Awarded by:
                      </strong>{' '}
                      {achievement.organization}
                    </p>

                    <p>
                      <strong>
                        Year:
                      </strong>{' '}
                      {achievement.year}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            ALUMNI
        ================================================= */}

        <section>

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>

            <h2 className="text-2xl font-semibold text-[#1E3A8A]">
              {pageContent.alumni?.title ||
                'Featured Alumni'}
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {alumni.map(
              (person) => (
                <div
                  key={person.id}
                  onClick={() =>
                    setSelectedAlumni(
                      person
                    )
                  }
                  className="
                    bg-white
                    rounded-xl
                    shadow-md
                    overflow-hidden
                    hover:shadow-xl
                    transition-shadow
                    cursor-pointer
                  "
                >

                  <div className="h-48 overflow-hidden">

                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  <div className="p-6">

                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {person.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                      Class of {person.year}
                    </p>

                    <p className="text-sm font-medium text-[#2563EB] mb-3">
                      {person.position}
                    </p>

                    <p className="text-sm text-gray-700">
                      {person.achievement}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          RESEARCH DETAILS MODAL
      ===================================================== */}

      {selectedResearch && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/50
            flex
            items-center
            justify-center
            p-4
          "
          onClick={() =>
            setSelectedResearch(null)
          }
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              max-w-3xl
              w-full
              max-h-[90vh]
              overflow-y-auto
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between p-6 border-b">

              <div className="pr-6">

                <span
                  className="
                    inline-flex
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-medium
                    bg-blue-100
                    text-blue-700
                    mb-3
                  "
                >
                  {selectedResearch.category ||
                    'Research'}
                </span>

                <h2 className="text-2xl font-bold text-[#1E3A8A]">
                  {selectedResearch.title}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedResearch(
                    null
                  )
                }
                className="
                  flex-shrink-0
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-500
                  hover:bg-gray-100
                  hover:text-gray-700
                  transition
                "
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="p-6">

              {/* DETAILS GRID */}

              <div className="grid sm:grid-cols-2 gap-4 mb-6">

                <div className="bg-gray-50 rounded-lg p-4">

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <UserRound className="w-4 h-4" />

                    Authors
                  </div>

                  <p className="font-medium text-gray-900">
                    {selectedResearch.authors ||
                      'COED Faculty Research Team'}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Building2 className="w-4 h-4" />

                    Department
                  </div>

                  <p className="font-medium text-gray-900">
                    {selectedResearch.department ||
                      'College of Education'}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />

                    Year
                  </div>

                  <p className="font-medium text-gray-900">
                    {selectedResearch.year ||
                      'N/A'}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <BookOpen className="w-4 h-4" />

                    Published In
                  </div>

                  <p className="font-medium text-gray-900">
                    {selectedResearch.journal ||
                      'College of Education Research'}
                  </p>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-3">
                  About the Research
                </h3>

                <div className="bg-gray-50 rounded-xl p-5">

                  <p className="text-gray-700 leading-7 whitespace-pre-line">
                    {selectedResearch.description ||
                      'No research description was provided.'}
                  </p>

                </div>

              </div>

              {/* PUBLICATION LINK IF AVAILABLE */}

              {selectedResearch.link && (
                <div className="mt-6">

                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        selectedResearch.link,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-5
                      py-3
                      bg-[#2563EB]
                      text-white
                      rounded-lg
                      hover:bg-[#1D4ED8]
                      transition
                      font-medium
                    "
                  >
                    <BookOpen className="w-5 h-5" />

                    Read Full Research

                    <ExternalLink className="w-4 h-4" />
                  </button>

                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setSelectedResearch(
                    null
                  )
                }
                className="
                  px-5
                  py-2.5
                  bg-white
                  border
                  border-gray-300
                  text-gray-700
                  rounded-lg
                  hover:bg-gray-100
                  transition
                  font-medium
                "
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ALUMNI MODAL
      ===================================================== */}

      {selectedAlumni && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
            p-4
          "
          onClick={() =>
            setSelectedAlumni(null)
          }
        >

          <div
            className="
              bg-white
              rounded-xl
              max-w-2xl
              w-full
              max-h-[90vh]
              overflow-y-auto
              p-6
              relative
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              onClick={() =>
                setSelectedAlumni(null)
              }
              className="
                absolute
                top-4
                right-4
                w-9
                h-9
                rounded-lg
                flex
                items-center
                justify-center
                text-gray-500
                hover:bg-gray-100
                z-10
              "
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedAlumni.image}
              alt={selectedAlumni.name}
              className="
                w-full
                h-72
                object-cover
                rounded-lg
                mb-6
              "
            />

            <h2 className="text-3xl font-bold mb-2">
              {selectedAlumni.name}
            </h2>

            <p className="text-blue-600 font-semibold mb-4">
              {selectedAlumni.position}
            </p>

            <p className="mb-3">
              <strong>Batch:</strong>{' '}
              {selectedAlumni.year}
            </p>

            <p className="text-gray-700">
              {selectedAlumni.achievement}
            </p>

          </div>

        </div>
      )}
    </div>
  );
}