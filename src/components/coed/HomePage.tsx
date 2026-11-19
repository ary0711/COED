
import {
  ChevronRight,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Trophy,
  UserRound,
  Building2,
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
  X,
  Search,
  type LucideIcon,
} from 'lucide-react';

import { useState, useEffect } from 'react';

import {
  getProfileStatistics,
  getProgramStatistics,
  debugProfileStatistics,
  debugSupabaseSession,
} from '../../landing-page/services/homepageService';

import { supabase } from '../../supabaseClient';

// =====================================================
// TYPES
// =====================================================

interface HomePageProps {
  onNavigate?: (page: string) => void;
  previewMode?: boolean;
  previewContent?: any;
  previewFeatures?: any[];
  previewStats?: any[];
  previewAnnouncements?: any[];
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
  image_url?: string;
}

interface Announcement {
  id: string;
  announcement_date: string;
  title: string;
  description: string;
  color: string;
  image_url?: string;
}

interface AboutStatistic {
  id: string;
  label: string;
  count: string;
  display_order: number;
}

// =====================================================
// FEATURE ICON MAPPING
// =====================================================

const FEATURE_ICONS: Record<string, LucideIcon> = {
  UserRound,
  Building2,
  Trophy,
  GraduationCap,
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
};

const DEFAULT_FEATURE_ICON = BookOpen;

// =====================================================
// HOME PAGE
// =====================================================

export function HomePage({
  onNavigate,
  previewMode,
  previewContent,
  previewFeatures,
  previewStats,
  previewAnnouncements,
}: HomePageProps) {

  // ===================================================
  // CONTENT
  // ===================================================

  const [content, setContent] = useState<any>({});

  const source = previewMode ? previewContent || {} : content;

  const hero = source['Hero Section'];
  const about = source['About Section'];
  const statsSection = source['Stats Section'];
  const announcementsSection = source['Announcements Section'];
  const cta = source['CTA Section'];

  // ===================================================
  // DATA STATES
  // ===================================================

  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);

  const [profileStats, setProfileStats] = useState({
    students: 0,
    faculty: 0,
    programs: 0,
  });

  // ===================================================
  // ALL ANNOUNCEMENTS MODAL
  // ===================================================

  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState('');

  // ===================================================
  // LOAD HOME PAGE
  // ===================================================

  // ===================================================
// LOAD HOME PAGE
// ===================================================

useEffect(() => {
  if (!previewMode) {
     loadHomePage();
    debugProfileStatistics();
    debugSupabaseSession();
  }
}, [previewMode]);

  async function loadHomePage() {
    setLoading(true);

    await Promise.all([
      loadFeatures(),
      loadStats(),
      loadAnnouncements(),
      loadHomepageContent(),
      loadProfileStatistics(),
      loadProgramStatistics(),
    ]);

    setLoading(false);
  }

  // ===================================================
  // DISPLAY DATA
  // ===================================================

  const displayFeatures =
    previewMode && previewFeatures ? previewFeatures : features;

  const displayAnnouncements =
    previewMode && previewAnnouncements
      ? previewAnnouncements
      : announcements;

  
const normalizeLabel = (label: string) =>
  label?.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const displayStats =
  previewMode && previewStats
    ? previewStats
    : stats.map((stat) => {
        const label = normalizeLabel(stat.label);

        if (['active students', 'total students', 'students'].includes(label)) {
          return {
            ...stat,
            value: profileStats.students.toLocaleString(),
          };
        }

        if (['programs offered', 'total programs', 'programs'].includes(label)) {
          return {
            ...stat,
            value: profileStats.programs.toLocaleString(),
          };
        }

        if (['expert faculty', 'total faculty', 'faculty members', 'faculty'].includes(label)) {
          return {
            ...stat,
            value: profileStats.faculty.toLocaleString(),
          };
        }

        return stat;
      });


  // ===================================================
  // DATABASE FETCHING
  // ===================================================

  async function loadHomepageContent() {
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*');

    if (error) {
      console.error('Error loading homepage content:', error);
      return;
    }

    const formatted: any = {};

    data?.forEach((item) => {
      formatted[item.section_name] = item;
    });

    setContent(formatted);
  }

  async function loadProfileStatistics() {
    try {
      const result = await getProfileStatistics();

      if (result.error) {
        console.error(
          'Error loading profile statistics:',
          result.error
        );
        return;
      }

      setProfileStats((current) => ({
        ...current,
        students: result.students,
        faculty: result.faculty,
      }));
    } catch (error) {
      console.error(
        'Unexpected error loading profile statistics:',
        error
      );
    }
  }

  async function loadProgramStatistics() {
    try {
      const result = await getProgramStatistics();

      if (result.error) {
        console.error(
          'Error loading program statistics:',
          result.error
        );
        return;
      }

      setProfileStats((current) => ({
        ...current,
        programs: result.programs,
      }));
    } catch (error) {
      console.error(
        'Unexpected error loading program statistics:',
        error
      );
    }
  }

  async function loadStats() {
    const { data, error } = await supabase
      .from('homepage_stats')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error loading homepage stats:', error);
      return;
    }

    setStats(data || []);
  }

  async function loadFeatures() {
    const { data, error } = await supabase
      .from('homepage_features')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error loading homepage features:', error);
      return;
    }

    setFeatures(data || []);
  }

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from('homepage_announcements')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error(
        'Error loading homepage announcements:',
        error
      );
      return;
    }

    setAnnouncements(data || []);
  }

  // ===================================================
  // CLOSE MODAL WITH ESCAPE
  // ===================================================

  useEffect(() => {
    if (!showAllAnnouncements) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAllAnnouncements(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAllAnnouncements]);

  // ===================================================
  // LOCK BODY SCROLL WHEN MODAL IS OPEN
  // ===================================================

  useEffect(() => {
    if (showAllAnnouncements) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showAllAnnouncements]);

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (!previewMode && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">

          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-[#1E3A8A]">
            Loading Home...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we load the homepage.
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // HOME PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-white">

      {/* ================================================= */}
      {/* HERO SECTION */}
      {/* ================================================= */}

      <section className="relative w-full h-screen overflow-hidden">

        <img
          src={hero?.image_url || '/COED home.jpg'}
          alt="Campus"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/10 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-8 sm:px-12 lg:px-20 max-w-7xl mx-auto">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-5 w-fit">

            <Sparkles className="w-4 h-4 text-white" />

            <span className="text-sm font-semibold text-white">
              {hero?.badge_text}
            </span>

          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight drop-shadow-lg">

            {hero?.title}

            <br />

            <span className="text-blue-400">
              {hero?.highlight_text}
            </span>

          </h1>

          <p className="text-lg text-white/80 max-w-xl leading-relaxed mb-8">
            {hero?.subtitle}
          </p>

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => onNavigate?.('login')}
              className="group px-8 py-4 bg-white text-[#1E3A8A] rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              {hero?.button_text}

              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate?.('about')}
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/40 text-white rounded-full font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              Explore COED

              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ABOUT / FEATURES SECTION */}
      {/* ================================================= */}

      <section
        id="about"
        className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50/20 relative overflow-hidden"
      >

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">

              <GraduationCap className="w-4 h-4" />

              {about?.badge_text}

            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">

              {about?.heading}{' '}

              <span className="text-blue-600">
                {about?.highlight_text}
              </span>

            </h2>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {about?.description}
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {displayFeatures.map((feature, index) => {

              const styles = [
                {
                  gradient: 'from-amber-50 to-orange-50',
                  borderColor: 'border-amber-200',
                },
                {
                  gradient: 'from-blue-50 to-cyan-50',
                  borderColor: 'border-blue-200',
                },
                {
                  gradient: 'from-purple-50 to-pink-50',
                  borderColor: 'border-purple-200',
                },
              ];

              return (
                <FeatureCard
                  key={feature.id}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  gradient={
                    styles[index]?.gradient ||
                    'from-blue-50 to-cyan-50'
                  }
                  borderColor={
                    styles[index]?.borderColor ||
                    'border-blue-200'
                  }
                />
              );
            })}

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* STATS SECTION */}
      {/* ================================================= */}

      <section className="py-24 px-4 mt-12 bg-white relative overflow-hidden">

        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

        <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">

          <div className="text-center mb-12">

            <h2 className="text-5xl font-bold text-blue-600 mb-2">
              {statsSection?.title}
            </h2>

            <p className="text-gray-600">
              {statsSection?.subtitle}
            </p>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            {displayStats.map((stat) => (
              <StatCard
                key={stat.id}
                value={stat.value}
                label={stat.label}
                image={stat.image_url}
              />
            ))}

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ANNOUNCEMENTS SECTION */}
      {/* ================================================= */}

      <section className="py-24 px-4 mt-12 bg-white relative overflow-hidden">

        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <div className="max-w-7xl mx-auto relative">

          <div className="flex items-center justify-between mb-12 gap-6">

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-medium mb-3">

                {announcementsSection?.badge_text}

              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {announcementsSection?.title}
              </h2>

              <p className="text-gray-600">
                {announcementsSection?.subtitle}
              </p>

            </div>

            {/* ========================================= */}
            {/* VIEW ALL BUTTON */}
            {/* ========================================= */}

            <button
              onClick={() => {
                setAnnouncementSearch('');
                setShowAllAnnouncements(true);
              }}
              className="group shrink-0 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 font-semibold text-gray-700 hover:text-blue-600 flex items-center gap-2"
            >

              View All

              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

            </button>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {displayAnnouncements.map((item) => (
              <AnnouncementCard
                key={item.id}
                date={item.announcement_date}
                title={item.title}
                description={item.description}
                color={item.color}
                image_url={item.image_url}
              />
            ))}

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* CTA SECTION */}
      {/* ================================================= */}

      <section className="py-24 px-4 bg-gradient-to-br from-white to-blue-50/40">

        <div className="max-w-5xl mx-auto">

          <div className="relative overflow-hidden rounded-3xl bg-[#1E3A8A] p-12 lg:p-16 text-white shadow-2xl">

            <div className="absolute inset-0 opacity-10">

              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

            </div>

            <div className="relative text-center space-y-6">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">

                <Trophy className="w-4 h-4" />

                <span className="text-sm font-semibold">
                  {cta?.badge_text}
                </span>

              </div>

              <h2 className="text-4xl lg:text-5xl font-bold">
                {cta?.title}
              </h2>

              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                {cta?.description}
              </p>

              <button
                onClick={() => onNavigate?.('contact')}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                {cta?.button_text}
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ALL LATEST UPDATES MODAL */}
      {/* ================================================= */}

      {showAllAnnouncements && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-8"
          onClick={() => setShowAllAnnouncements(false)}
        >

          <div
            className="relative w-full max-w-7xl max-h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >

            {/* =========================================== */}
            {/* MODAL HEADER */}
            {/* =========================================== */}

            <div className="relative bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-blue-500 text-white px-6 sm:px-8 lg:px-10 py-7 sm:py-8 overflow-hidden shrink-0">

              {/* Decorative background */}
              <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-white/10" />

              <div className="absolute -bottom-36 -left-20 w-80 h-80 rounded-full bg-white/10" />

              <div className="absolute top-10 right-1/3 w-20 h-20 rounded-full bg-white/5 blur-xl" />

              <div className="relative">

                <div className="flex items-start justify-between gap-5">

                  <div className="min-w-0">

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm mb-4">

                      <Sparkles className="w-4 h-4" />

                      <span className="text-xs font-semibold uppercase tracking-wider">
                        College of Education
                      </span>

                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                      Latest Updates
                    </h2>

                    <p className="mt-3 text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl">
                      Stay updated with the latest announcements,
                      activities, events, and important information
                      from the College of Education.
                    </p>

                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setShowAllAnnouncements(false)}
                    className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                    title="Close"
                    aria-label="Close latest updates"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                </div>

                {/* ======================================= */}
                {/* SEARCH BAR */}
                {/* ======================================= */}

                <div className="relative mt-7">

                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />

                  <input
                    type="text"
                    value={announcementSearch}
                    onChange={(event) =>
                      setAnnouncementSearch(event.target.value)
                    }
                    placeholder="Search announcements, events, activities..."
                    className="w-full bg-white text-slate-800 placeholder:text-slate-400 rounded-2xl pl-12 pr-5 py-4 outline-none shadow-xl border border-white/20 focus:ring-4 focus:ring-white/20 transition-all"
                  />

                </div>

              </div>

            </div>

            {/* =========================================== */}
            {/* MODAL BODY */}
            {/* =========================================== */}

            <div className="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-7 lg:p-9">

              {(() => {

                const filteredAnnouncements =
                  displayAnnouncements.filter((item) => {

                    const search =
                      announcementSearch.trim().toLowerCase();

                    if (!search) {
                      return true;
                    }

                    return (
                      item.title
                        ?.toLowerCase()
                        .includes(search) ||

                      item.description
                        ?.toLowerCase()
                        .includes(search) ||

                      item.announcement_date
                        ?.toLowerCase()
                        .includes(search)
                    );

                  });

                return (
                  <>

                    {/* =================================== */}
                    {/* RESULTS HEADER */}
                    {/* =================================== */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

                      <div>

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>

                          <div>

                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                              All Updates
                            </h3>

                            <p className="text-sm text-slate-500">
                              {filteredAnnouncements.length}{' '}
                              {filteredAnnouncements.length === 1
                                ? 'announcement'
                                : 'announcements'}{' '}
                              available
                            </p>

                          </div>

                        </div>

                      </div>

                      {announcementSearch && (
                        <button
                          onClick={() => setAnnouncementSearch('')}
                          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          Clear Search
                        </button>
                      )}

                    </div>

                    {/* =================================== */}
                    {/* ANNOUNCEMENT GRID */}
                    {/* =================================== */}

                    {filteredAnnouncements.length > 0 ? (

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

                        {filteredAnnouncements.map((item) => (

                          <AnnouncementCard
                            key={item.id}
                            date={item.announcement_date}
                            title={item.title}
                            description={item.description}
                            color={item.color}
                            image_url={item.image_url}
                          />

                        ))}

                      </div>

                    ) : (

                      /* ================================= */
                      /* EMPTY STATE */
                      /* ================================= */

                      <div className="min-h-[400px] flex items-center justify-center">

                        <div className="text-center max-w-md">

                          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">

                            <Search className="w-9 h-9 text-blue-500" />

                          </div>

                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                            No Updates Found
                          </h3>

                          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                            We couldn't find any announcements
                            matching your search. Try using a
                            different keyword.
                          </p>

                          {announcementSearch && (
                            <button
                              onClick={() =>
                                setAnnouncementSearch('')
                              }
                              className="mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                            >
                              Clear Search
                            </button>
                          )}

                        </div>

                      </div>

                    )}

                  </>
                );

              })()}

            </div>

            {/* =========================================== */}
            {/* MODAL FOOTER */}
            {/* =========================================== */}

            <div className="px-6 sm:px-8 lg:px-10 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">

                <div className="w-2 h-2 rounded-full bg-green-500" />

                <span>
                  College of Education Information System
                </span>

              </div>

              <button
                onClick={() => setShowAllAnnouncements(false)}
                className="ml-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  value,
  label,
  image,
}: any) {

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105 aspect-[3/4] drop-shadow-lg">

      {image?.trim() && (
  <img
    src={image.trim()}
    alt={label || 'Statistic'}
    className="absolute inset-0 w-full h-full object-cover object-center"
  />
)}

      <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/40 to-[#1E3A8A]/10" />

      <div className="relative h-full flex flex-col justify-end p-5">

        <div className="text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
          {value}
        </div>

        <div className="text-base font-semibold text-white drop-shadow-sm">
          {label}
        </div>

      </div>

    </div>
  );
}

// =====================================================
// FEATURE CARD
// =====================================================

function FeatureCard({
  title,
  description,
  icon,
  gradient,
  borderColor,
}: any) {

  const Icon =
    FEATURE_ICONS[icon] || DEFAULT_FEATURE_ICON;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${borderColor} hover:-translate-y-2`}
    >

      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative">

        <div className="w-16 h-16 mb-5 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">

          <Icon
            size={34}
            strokeWidth={2}
            className="text-blue-600 transition-transform duration-300 group-hover:scale-110"
          />

        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {title}
        </h3>

        <p className="text-gray-700 leading-relaxed">
          {description}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// ANNOUNCEMENT CARD
// =====================================================

function AnnouncementCard({
  date,
  title,
  description,
  color,
  image_url,
}: any) {

  const [showModal, setShowModal] = useState(false);

  // ===================================================
  // ADMIN COLOR MAPPINGS
  // ===================================================

  const colorClasses: Record<
    string,
    {
      gradient: string;
      border: string;
    }
  > = {

    blue: {
      gradient: 'from-blue-500 to-blue-600',
      border: 'border-blue-200',
    },

    purple: {
      gradient: 'from-purple-500 to-purple-600',
      border: 'border-purple-200',
    },

    green: {
      gradient: 'from-green-500 to-green-600',
      border: 'border-green-200',
    },

    orange: {
      gradient: 'from-orange-500 to-orange-600',
      border: 'border-orange-200',
    },

    red: {
      gradient: 'from-red-500 to-red-600',
      border: 'border-red-200',
    },

    yellow: {
      gradient: 'from-yellow-400 to-yellow-500',
      border: 'border-yellow-200',
    },

    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      border: 'border-cyan-200',
    },

    pink: {
      gradient: 'from-pink-500 to-pink-600',
      border: 'border-pink-200',
    },

    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      border: 'border-indigo-200',
    },

    teal: {
      gradient: 'from-teal-500 to-teal-600',
      border: 'border-teal-200',
    },

  };

  const colors =
    colorClasses[color] || colorClasses.blue;

  // ===================================================
  // ANNOUNCEMENT CARD
  // ===================================================

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border ${colors.border} cursor-pointer flex flex-col`}
      >

        {/* Top Color Bar */}

        <div
          className={`h-2 w-full bg-gradient-to-r ${colors.gradient} shrink-0`}
        />

        {/* Image */}

        {image_url && (
          <div className="w-full h-48 overflow-hidden bg-slate-50 border-b border-slate-100 shrink-0">

            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">

          {/* Date */}

          <div className="flex items-center gap-2 mb-4">

            <div
              className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold shadow-sm`}
            >
              {date || 'New'}
            </div>

          </div>

          {/* Title */}

          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:opacity-80 transition-opacity">

            {title}

          </h3>

          {/* Description */}

          <p className="text-slate-600 mb-4 line-clamp-3 flex-1">

            {description}

          </p>

          {/* Read More */}

          <button
            type="button"
            className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all mt-auto"
          >

            Read More

            <ChevronRight className="w-4 h-4" />

          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* ANNOUNCEMENT DETAIL MODAL */}
      {/* ================================================= */}

      {showModal && (

        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >

          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col relative overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Top Color Line */}

            <div
              className={`h-2 w-full bg-gradient-to-r ${colors.gradient} shrink-0`}
            />

            {/* Close Button */}

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-100 p-2 rounded-full text-slate-600 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
              title="Close Announcement"
              aria-label="Close announcement"
            >

              <X className="w-5 h-5" />

            </button>

            {/* Scrollable Content */}

            <div className="overflow-y-auto w-full flex-1">

              {/* Showcase Image */}

              {image_url && (

                <div className="w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 sm:p-8 relative">

                  <img
                    src={image_url}
                    alt={title}
                    className="w-full h-auto max-h-[350px] object-contain drop-shadow-md rounded-xl"
                  />

                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />

                </div>

              )}

              {/* Text */}

              <div className="p-8 sm:p-12">

                {/* Badge */}

                <div className="flex items-center gap-3 mb-6">

                  <div
                    className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold shadow-sm uppercase tracking-wider`}
                  >
                    {date || 'Announcement'}
                  </div>

                </div>

                {/* Title */}

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">

                  {title}

                </h2>

                {/* Divider */}

                <div
                  className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${colors.gradient} mb-8`}
                />

                {/* Description */}

                <p className="text-slate-700 text-[16px] sm:text-lg leading-relaxed whitespace-pre-wrap">

                  {description}

                </p>

              </div>

            </div>

            {/* Footer */}

            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">

              <button
                onClick={() => setShowModal(false)}
                className={`px-8 py-3 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r ${colors.gradient}`}
              >
                Close Window
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

