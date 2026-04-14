import { ChevronRight, Award, Users, BookOpen, TrendingUp, ArrowRight, Sparkles, GraduationCap, Target, Trophy } from 'lucide-react';

interface HomePageProps {
  onNavigate?: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with background image and blue gradient overlay - NO TOP PADDING */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1758270705482-cee87ea98738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMGNhbXB1cyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzA5NTQ0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080)`
          }}
        ></div>
        
        {/* Blue Gradient Overlay from left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB]/95 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-32">
          {/* Content aligned to left side */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Excellence in Education Since 1993</span>
            </div>

            {/* Main heading - Left aligned */}
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Welcome to the
              <br />
              College of Education
            </h1>
            
            <p className="text-xl text-blue-50 leading-relaxed mb-8">
              Shaping tomorrow's educators at Cebu Technological University - Argao Campus. 
              Join us in our mission to develop passionate and skilled teachers.
            </p>

            {/* CTA Buttons - Functional */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onNavigate ? onNavigate('departments') : scrollToSection('about')}
                className="group px-8 py-4 bg-white text-[#1E3A8A] rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Explore Programs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate ? onNavigate('about') : scrollToSection('about')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with soft blue gradient background */}
      <section id="about" className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
              <GraduationCap className="w-4 h-4" />
              About COED
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Empowering Future <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Educators</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For over three decades, we've been at the forefront of teacher education, 
              producing passionate and skilled educators who transform lives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Accredited Programs"
              description="All programs maintain Level III AACCUP accreditation status"
              icon="🏆"
              gradient="from-amber-50 to-orange-50"
              borderColor="border-amber-200"
            />
            <FeatureCard
              title="Expert Faculty"
              description="Learn from experienced educators with advanced degrees and industry expertise"
              icon="👨‍🏫"
              gradient="from-blue-50 to-cyan-50"
              borderColor="border-blue-200"
            />
            <FeatureCard
              title="Modern Facilities"
              description="State-of-the-art classrooms and learning resources for optimal education"
              icon="🏛️"
              gradient="from-purple-50 to-pink-50"
              borderColor="border-purple-200"
            />
          </div>
        </div>
      </section>

      {/* Quick Stats Section with Shaped Cards */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-blue-50/30 to-white relative">
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">COED at a Glance</h2>
            <p className="text-gray-600">Our impact in numbers</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard 
              value="3,847" 
              label="Active Students" 
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              bgGradient="from-blue-50 to-blue-100"
            />
            <StatCard 
              value="22" 
              label="Programs Offered" 
              icon={BookOpen}
              gradient="from-purple-500 to-purple-600"
              bgGradient="from-purple-50 to-purple-100"
            />
            <StatCard 
              value="142" 
              label="Expert Faculty" 
              icon={Award}
              gradient="from-pink-500 to-pink-600"
              bgGradient="from-pink-50 to-pink-100"
            />
            <StatCard 
              value="98%" 
              label="Employment Rate" 
              icon={TrendingUp}
              gradient="from-green-500 to-green-600"
              bgGradient="from-green-50 to-green-100"
            />
          </div>
        </div>
      </section>

      {/* Announcements Section with colored background */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50/30 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-blue-100 text-blue-600 font-semibold text-sm mb-3">
                Latest News
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Latest Updates</h2>
              <p className="text-gray-600">Stay informed with our recent announcements</p>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('achievements')}
              className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 font-medium text-gray-700 hover:text-blue-600"
            >
              View All
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <AnnouncementCard
              date="Feb 13"
              title="Enrollment for Summer 2026"
              description="Online enrollment now open for all programs"
              color="blue"
            />
            <AnnouncementCard
              date="Feb 10"
              title="Faculty Development Seminar"
              description="Professional development workshop this March"
              color="purple"
            />
            <AnnouncementCard
              date="Feb 8"
              title="Dean's List Released"
              description="Congratulations to all honor students"
              color="green"
            />
          </div>
        </div>
      </section>

      {/* CTA Section with gradient background */}
      <section className="py-24 px-4 bg-gradient-to-br from-white to-blue-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] p-12 lg:p-16 text-white shadow-2xl">
            {/* Decorative grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            </div>
            
            <div className="relative text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-semibold">Start Your Journey Today</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">Ready to Start Your Journey?</h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Join thousands of successful educators who started their career at COED
              </p>
              <button 
                onClick={() => onNavigate && onNavigate('contact')}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, icon: Icon, gradient, bgGradient }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white group hover:scale-105`}>
      {/* Icon background circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${gradient}"></div>
      
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
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
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
    blue: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    purple: { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    green: { gradient: 'from-green-500 to-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border ${colors.border}`}>
      <div className={`h-2 bg-gradient-to-r ${colors.gradient}`}></div>
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
