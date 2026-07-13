import { ChevronRight, Award, Users, BookOpen, TrendingUp, ArrowRight, Sparkles, GraduationCap, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
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
}

interface Announcement {
  id: string;
  announcement_date: string;
  title: string;
  description: string;
  color: string;
}

interface AboutStatistic {
  id: string;
  label: string;
  count: string;
  display_order: number;
}

export function HomePage({
  onNavigate,
  previewMode,
  previewContent,
  previewFeatures,
  previewStats,
  previewAnnouncements,
}: HomePageProps) {
  
  const [content, setContent] = useState<any>({});
  const source = previewMode
  ? previewContent
  : content;

  const hero = source['Hero Section'];
  const about = source['About Section'];
  const statsSection = source['Stats Section'];
  const announcementsSection =
  source['Announcements Section'];
  const cta = source['CTA Section'];
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  
  const [announcements, setAnnouncements] =
  useState<Announcement[]>([]);
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
  ]);

  setLoading(false);
}
const [loading, setLoading] = useState(true);
  const displayFeatures =
  previewMode && previewFeatures
    ? previewFeatures
    : features;

const displayStats =
  previewMode && previewStats
    ? previewStats
    : stats;

const displayAnnouncements =
  previewMode && previewAnnouncements
    ? previewAnnouncements
    : announcements;
async function loadHomepageContent() {
  const { data, error } = await supabase
    .from('homepage_content')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  const formatted: any = {};

  data?.forEach(item => {
    formatted[item.section_name] = item;
  });

  setContent(formatted);
}
async function loadStats() {
  const { data } = await supabase
    .from('homepage_stats')
    .select('*')
    .order('sort_order');

  setStats(data || []);
}

async function loadFeatures() {
  const { data } = await supabase
    .from('homepage_features')
    .select('*')
    .order('sort_order');

  setFeatures(data || []);
}
async function loadAnnouncements() {
  const { data } = await supabase
    .from('homepage_announcements')
    .select('*')
    .order('sort_order');

  setAnnouncements(data || []);
}
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
  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════════════════════════════════════════
          HERO — Full-bleed image, content overlaid on top
      ═══════════════════════════════════════════════════ */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Full-bleed background image */}
       <img
       
           src="/COED home.jpg"
         alt="Campus"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark overlay — subtle, like the reference image */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Optional: soft bottom fade so content below feels connected */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/10 to-transparent" />

        {/* ── Content overlaid on the image ── */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-8 sm:px-12 lg:px-20 max-w-7xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-5 w-fit">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white"> {hero?.badge_text}</span>
          </div>

          {/* Big headline — like "WANDER" in the reference */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight drop-shadow-lg">
             {hero?.title}<br />
            <span className="text-blue-400"> {hero?.highlight_text}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-white/80 max-w-xl leading-relaxed mb-8">
             {hero?.subtitle}
          </p>

          {/* CTA Buttons */}
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
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/40 text-white rounded-full font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              Explore COED
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ABOUT SECTION
      ═══════════════════════════════════════ */}
      <section id="about" className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
              <GraduationCap className="w-4 h-4" />
                {about?.badge_text}
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
               {about?.heading}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
      gradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
    },
    {
      gradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
    },
    {
      gradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <FeatureCard
      key={feature.id}
      title={feature.title}
      description={feature.description}
      icon={feature.icon}
      gradient={styles[index]?.gradient}
      borderColor={styles[index]?.borderColor}
    />
  );
})}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-blue-50/30 to-white relative">
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2"> {statsSection?.title}</h2>
            <p className="text-gray-600">  {statsSection?.subtitle}
</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayStats.map((stat, index) => {
  const styles = [
    {
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
    },
    {
      gradient: "from-pink-500 to-pink-600",
      bgGradient: "from-pink-50 to-pink-100",
    },
    {
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
    },
  ];

  return (
    <StatCard
      key={stat.id}
      value={stat.value}
      label={stat.label}
      icon={Users}
      gradient={styles[index % styles.length].gradient}
      bgGradient={styles[index % styles.length].bgGradient}
    />
  );
})}
            
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ANNOUNCEMENTS SECTION
      ═══════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-3">
                 {announcementsSection?.badge_text}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2"> {announcementsSection?.title}</h2>
              <p className="text-gray-600"> {announcementsSection?.subtitle}</p>
            </div>
            <button
              onClick={() => onNavigate?.('achievements')}
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 font-medium text-gray-700 hover:text-blue-600"
            >
              View All
            </button>

          </div>

          <div className="grid md:grid-cols-3 gap-6">
           {displayAnnouncements.map(item => (
    <AnnouncementCard
      key={item.id}
      date={item.announcement_date}
      title={item.title}
      description={item.description}
      color={item.color}
    />
  ))}
            
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-br from-white to-blue-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-[#1E3A8A] p-12 lg:p-16 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>
            <div className="relative text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-semibold"> {cta?.badge_text}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold"> {cta?.title}</h2>
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
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label, icon: Icon, gradient, bgGradient }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white group hover:scale-105`}>
      <div className="relative">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon, gradient, borderColor }: any) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${borderColor} hover:-translate-y-2`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
      <div className="relative">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function AnnouncementCard({ date, title, description, color }: any) {
  const colorClasses = {
    blue:   { gradient: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50',   border: 'border-blue-200'   },
    purple: { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    green:  { gradient: 'from-green-500 to-green-600',   bg: 'bg-green-50',  border: 'border-green-200'  },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border ${colors.border}`}>
      <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold shadow-md`}>
            {date}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <button className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
          Read More
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}