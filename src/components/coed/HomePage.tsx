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
  type LucideIcon,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import {
  getProfileStatistics,
  getProgramStatistics,
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
  // LOAD HOME PAGE
  // ===================================================

  useEffect(() => {
    if (!previewMode) {
      loadHomePage();
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

  const displayFeatures = previewMode && previewFeatures ? previewFeatures : features;
  const displayAnnouncements = previewMode && previewAnnouncements ? previewAnnouncements : announcements;

  const displayStats = previewMode && previewStats
    ? previewStats
    : stats.map((stat) => {
        const label = stat.label?.trim().toLowerCase();

        if (label === 'active students') {
          return { ...stat, value: profileStats.students.toLocaleString() };
        }
        if (label === 'programs offered') {
          return { ...stat, value: profileStats.programs.toLocaleString() };
        }
        if (label === 'expert faculty') {
          return { ...stat, value: profileStats.faculty.toLocaleString() };
        }
        return stat;
      });

  // ===================================================
  // DATABASE FETCHING
  // ===================================================

  async function loadHomepageContent() {
    const { data, error } = await supabase.from('homepage_content').select('*');
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
        console.error('Error loading profile statistics:', result.error);
        return;
      }
      setProfileStats((current) => ({
        ...current,
        students: result.students,
        faculty: result.faculty,
      }));
    } catch (error) {
      console.error('Unexpected error loading profile statistics:', error);
    }
  }

  async function loadProgramStatistics() {
    try {
      const result = await getProgramStatistics();
      if (result.error) {
        console.error('Error loading program statistics:', result.error);
        return;
      }
      setProfileStats((current) => ({
        ...current,
        programs: result.programs,
      }));
    } catch (error) {
      console.error('Unexpected error loading program statistics:', error);
    }
  }

  async function loadStats() {
    const { data, error } = await supabase.from('homepage_stats').select('*').order('sort_order');
    if (error) {
      console.error('Error loading homepage stats:', error);
      return;
    }
    setStats(data || []);
  }

  async function loadFeatures() {
    const { data, error } = await supabase.from('homepage_features').select('*').order('sort_order');
    if (error) {
      console.error('Error loading homepage features:', error);
      return;
    }
    setFeatures(data || []);
  }

  async function loadAnnouncements() {
    const { data, error } = await supabase.from('homepage_announcements').select('*').order('sort_order');
    if (error) {
      console.error('Error loading homepage announcements:', error);
      return;
    }
    setAnnouncements(data || []);
  }

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (!previewMode && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1E3A8A]">Loading Home...</h2>
          <p className="text-gray-500 mt-2">Please wait while we load the homepage.</p>
        </div>
      </div>
    );
  }

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
            <span className="text-sm font-semibold text-white">{hero?.badge_text}</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight drop-shadow-lg">
            {hero?.title}
            <br />
            <span className="text-blue-400">{hero?.highlight_text}</span>
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
      <section id="about" className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
              <GraduationCap className="w-4 h-4" />
              {about?.badge_text}
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {about?.heading} <span className="text-blue-600">{about?.highlight_text}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {about?.description}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {displayFeatures.map((feature, index) => {
              const styles = [
                { gradient: "from-amber-50 to-orange-50", borderColor: "border-amber-200" },
                { gradient: "from-blue-50 to-cyan-50", borderColor: "border-blue-200" },
                { gradient: "from-purple-50 to-pink-50", borderColor: "border-purple-200" },
              ];
              return (
                <FeatureCard
                  key={feature.id}
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  gradient={styles[index]?.gradient || "from-blue-50 to-cyan-50"}
                  borderColor={styles[index]?.borderColor || "border-blue-200"}
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
            <h2 className="text-5xl font-bold text-blue-600 mb-2">{statsSection?.title}</h2>
            <p className="text-gray-600">{statsSection?.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayStats.map((stat) => (
              <StatCard key={stat.id} value={stat.value} label={stat.label} image={stat.image_url} />
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
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-medium mb-3">
                {announcementsSection?.badge_text}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">{announcementsSection?.title}</h2>
              <p className="text-gray-600">{announcementsSection?.subtitle}</p>
            </div>
            <button
              onClick={() => onNavigate?.('achievements')}
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 font-medium text-gray-700 hover:text-blue-600"
            >
              View All
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
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>
            <div className="relative text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-semibold">{cta?.badge_text}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">{cta?.title}</h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">{cta?.description}</p>
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
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ value, label, image }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105 aspect-[3/4] drop-shadow-lg">
      <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/40 to-[#1E3A8A]/10" />
      <div className="relative h-full flex flex-col justify-end p-5">
        <div className="text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-md">{value}</div>
        <div className="text-base font-semibold text-white drop-shadow-sm">{label}</div>
      </div>
    </div>
  );
}

// =====================================================
// FEATURE CARD
// =====================================================

function FeatureCard({ title, description, icon, gradient, borderColor }: any) {
  const Icon = FEATURE_ICONS[icon] || DEFAULT_FEATURE_ICON;
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${borderColor} hover:-translate-y-2`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
      <div className="relative">
        <div className="w-16 h-16 mb-5 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <Icon size={34} strokeWidth={2} className="text-blue-600 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// =====================================================
// ANNOUNCEMENT CARD & PRESENTABLE MODAL
// =====================================================

function AnnouncementCard({ date, title, description, color, image_url }: any) {
  const [showModal, setShowModal] = useState(false);

  // Admin color selection mappings
  const colorClasses: Record<string, { gradient: string, border: string }> = {
    blue: { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200' },
    purple: { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200' },
    green: { gradient: 'from-green-500 to-green-600', border: 'border-green-200' },
    orange: { gradient: 'from-orange-500 to-orange-600', border: 'border-orange-200' },
    red: { gradient: 'from-red-500 to-red-600', border: 'border-red-200' },
    yellow: { gradient: 'from-yellow-400 to-yellow-500', border: 'border-yellow-200' }, 
    cyan: { gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-200' },
    pink: { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200' },
    indigo: { gradient: 'from-indigo-500 to-indigo-600', border: 'border-indigo-200' },
    teal: { gradient: 'from-teal-500 to-teal-600', border: 'border-teal-200' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <>
      {/* ------------------------------------------------- */}
      {/* CARD INTERFACE */}
      {/* ------------------------------------------------- */}
      <div
        onClick={() => setShowModal(true)}
        className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border ${colors.border} cursor-pointer flex flex-col`}
      >
        {/* Top Color Bar */}
        <div className={`h-2 w-full bg-gradient-to-r ${colors.gradient} shrink-0`} />

        {/* Image on Card Face */}
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
            <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold shadow-sm`}>
              {date || "New"}
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:opacity-80 transition-opacity">
            {title}
          </h3>
          <p className="text-slate-600 mb-4 line-clamp-3 flex-1">
            {description}
          </p>
          <button className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all mt-auto">
            Read More <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------- */}
      {/* PREMIUM MODAL POPUP */}
      {/* ------------------------------------------------- */}
      {showModal && (
        <div 
          className="!fixed !top-0 !left-0 !right-0 !bottom-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Decorative Admin Color Line */}
            <div className={`h-2 w-full bg-gradient-to-r ${colors.gradient} shrink-0`} />

            {/* Floating Close Button */}
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-100 p-2 rounded-full text-slate-600 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
              title="Close Announcement"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto w-full flex-1">
              
              {/* Showcase Image Area */}
              {image_url && (
                <div className="w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6 sm:p-8 relative">
                  <img 
                    src={image_url} 
                    alt={title} 
                    className="w-full h-auto max-h-[350px] object-contain drop-shadow-md rounded-xl"
                  />
                  {/* Subtle gradient overlay at the bottom of the image container to blend into content */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>
              )}

              {/* Text Layout */}
              <div className="p-8 sm:p-12">
                {/* Badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold shadow-sm uppercase tracking-wider`}>
                    {date || "Announcement"}
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                  {title}
                </h2>
                
                {/* Dynamic Divider based on Admin Color */}
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${colors.gradient} mb-8`} />
                
                {/* Description Body */}
                <p className="text-slate-700 text-[16px] sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>

            </div>

            {/* Sticky Action Footer */}
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