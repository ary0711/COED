import {
  BookOpen,
  Award,
  Users,
  ExternalLink
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

  const [pageContent, setPageContent] =
    useState<any>({});

  const [publications, setPublications] =
    useState<any[]>([]);

  const [achievements, setAchievements] =
    useState<any[]>([]);

  const [alumni, setAlumni] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedAlumni, setSelectedAlumni] =
  useState<any>(null);
  useEffect(() => {

    if (previewMode) {

      setPageContent(
        previewContent || {}
      );

      setPublications(
        previewPublications || []
      );

      setAchievements(
        previewAchievements || []
      );

      setAlumni(
        previewAlumni || []
      );

      setLoading(false);
      return;
    }

    loadData();

  }, []);

  async function loadData() {

    await Promise.all([
      loadPageContent(),
      loadPublications(),
      loadAchievements(),
      loadAlumni(),
    ]);

    setLoading(false);
  }

  async function loadPageContent() {

    const { data } = await supabase
      .from('research_page_content')
      .select('*');

    const formatted: any = {};

    data?.forEach(item => {
      formatted[item.section_name] = item;
    });

    setPageContent(formatted);
  }

  async function loadPublications() {

    const { data } = await supabase
      .from('research_publications')
      .select('*')
      .order('display_order');

    setPublications(data || []);
  }

  async function loadAchievements() {

    const { data } = await supabase
      .from('research_awards')
      .select('*')
      .order('display_order');

    setAchievements(data || []);
  }

  async function loadAlumni() {

    const { data } = await supabase
      .from('featured_alumni')
      .select('*')
      .order('display_order');

    setAlumni(data || []);
  }

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

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-12">

          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            {pageContent.header?.title}
          </h1>

          <p className="text-xl text-gray-600">
            {pageContent.header?.description}
          </p>

        </div>

        {/* PUBLICATIONS */}

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

          <div className="grid gap-4">

            {publications.map((research) => (

              <div
  key={research.id}
  onClick={() =>
    window.open(research.link, '_blank')
  }
  className="
    bg-white
    rounded-xl
    shadow-md
    p-6
    hover:shadow-lg
    transition-shadow
    cursor-pointer
    hover:border-blue-500
    border
    border-transparent
  "
>
  <div className="mt-4 mb-4">
  <button
    onClick={(e) => {
      e.stopPropagation();
      window.open(research.link, '_blank');
    }}
    className="
      px-4 py-3
      bg-blue-600
      text-white
      rounded-lg
      hover:bg-blue-700
    "
  >
    Read Research
  </button>
</div>

                <div className="flex items-start justify-between">

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-2">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          research.category === 'Research'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {research.category}
                      </span>

                      <span className="text-sm text-gray-600">
                        {research.year}
                      </span>

                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {research.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Authors:</strong> {research.authors}
                    </p>

                    <p className="text-sm text-gray-600">
                      <strong>Published in:</strong> {research.journal}
                    </p>

                  </div>

                  <a
                    href={research.link}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-4 p-2 text-[#2563EB] hover:bg-blue-50 rounded-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* ACHIEVEMENTS */}

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

            {achievements.map((achievement) => (

              <div
                key={achievement.id}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500"
              >

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {achievement.title}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">

                  <p>
                    <strong>Recipient:</strong>
                    {' '}
                    {achievement.recipient}
                  </p>

                  <p>
                    <strong>Awarded by:</strong>
                    {' '}
                    {achievement.organization}
                  </p>

                  <p>
                    <strong>Year:</strong>
                    {' '}
                    {achievement.year}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* ALUMNI */}

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

            {alumni.map((person) => (
  <div
    key={person.id}
    onClick={() =>
      setSelectedAlumni(person)
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

            ))}

          </div>

        </section>

        {/* CTA */}

        <div className="mt-12 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 text-center text-white">

          <h2 className="text-2xl font-semibold mb-3">
            {pageContent.cta?.title}
          </h2>

          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {pageContent.cta?.description}
          </p>

          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            {pageContent.cta?.content}
          </button>

        </div>

      </div>
{selectedAlumni && (
  <div className="
    fixed inset-0
    bg-black/50
    flex items-center justify-center
    z-50
  ">

    <div className="
      bg-white
      rounded-xl
      max-w-2xl
      w-full
      p-6
      relative
    ">

      <button
        onClick={() =>
          setSelectedAlumni(null)
        }
        className="
          absolute
          top-4
          right-4
          text-gray-500
        "
      >
        ✕
      </button>

      <img
        src={selectedAlumni.image}
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