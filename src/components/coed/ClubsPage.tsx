import { Users, Award, Star } from 'lucide-react';

export function ClubsPage() {
  const organizations = [
    {
      id: 1,
      name: 'United Educators Club (UnEC)',
      type: 'Main Student Organization',
      description:
        'The governing body of the teacher education students of CTU Argao Campus. UnEC serves as the voice of students, promotes unity and cooperation, and fosters physical, intellectual, cultural, and social development among education majors.',
      members: 'All Education Students',
      motto: 'Unity, Service, and Educational Excellence',
    },
  ];

  const committees = [
    {
      id: 1,
      name: 'EDUPANUHID',
      fullName: 'UnEC Committee on Research and Development',
      description:
        'Dedicated to advancing research within the College, fostering an effective research culture, supporting academic inquiry, and promoting innovation and knowledge dissemination.',
      focus: 'Research & Innovation',
    },
    {
      id: 2,
      name: 'EDUKAABAG',
      fullName: 'UnEC Committee on Community Extension Services',
      description:
        'Serves as a bridge between the academic realm and the community by conceptualizing, implementing, and evaluating extension programs and projects.',
      focus: 'Community Outreach & Service',
    },
    {
      id: 3,
      name: 'EDUKOMUNIKASYON',
      fullName: 'UnEC Committee on Literature, Publication, and Communication',
      description:
        'Nurtures literacy talents, enhances publication skills, and promotes effective communication among students. Facilitates workshops, writing contests, and publishing opportunities.',
      focus: 'Communication & Publishing',
    },
    {
      id: 4,
      name: 'EDUPATIGAYON',
      fullName: 'UnEC Committee on Production and Resource Generation',
      description:
        'Tasked with generating resources and developing innovative projects. Explores sustainable income-generating activities and fosters resourcefulness and self-sufficiency.',
      focus: 'Resource Generation & Projects',
    },
    {
      id: 5,
      name: 'EDU-AMPO',
      fullName: 'UnEC Committee on College Ministry',
      description:
        'Focused on promoting spiritual life development in educators. Provides experiences for spiritual growth, mentorship, and collaboration fostering shared faith journeys.',
      focus: 'Spiritual Development',
    },
    {
      id: 6,
      name: 'EDUKAHIMSOG',
      fullName: 'UnEC Committee on Sports and Wellness',
      description:
        'Fosters a culture of physical activity, health, and well-being. Cultivates athletic talents, promotes healthy lifestyles, and emphasizes sportsmanship and teamwork.',
      focus: 'Sports & Health & Wellness',
    },
    {
      id: 7,
      name: 'EDUKANTA',
      fullName: 'UnEC Committee on Music',
      description:
        'Cultivates and promotes musical talents among students. Provides a structured environment for those interested in performance, composition, and musical appreciation.',
      focus: 'Music & Performance',
    },
    {
      id: 8,
      name: 'EDUSAYAW',
      fullName: 'UnEC Committee on Performing Arts',
      description:
        'Dedicated to cultivating a dance community within the College. Organizes dance workshops, competitions, and performances fostering artistic enrichment.',
      focus: 'Dance & Performing Arts',
    },
    {
      id: 9,
      name: 'EDUDEBUHO',
      fullName: 'UnEC Committee on Visual Arts',
      description:
        'Encourages and advances visual arts among educators. Develops creative minds and talents while building a supportive community of art enthusiasts.',
      focus: 'Visual Arts & Design',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            United Educators Club (UnEC)
          </h1>
          <p className="text-xl text-gray-600">
            Explore our dynamic committees and get involved in the College of Education community
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#2563EB] to-[#60A5FA] rounded-xl shadow-lg p-6 text-white">
            <Users className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">1</div>
            <div className="text-blue-100">Main Organization</div>
          </div>

          <div className="bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-xl shadow-lg p-6 text-white">
            <Award className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">9</div>
            <div className="text-green-100">Active Committees</div>
          </div>

          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg p-6 text-white">
            <Star className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">All CTU Students</div>
            <div className="text-purple-100">Members Welcome</div>
          </div>
        </div>

        {/* Main Organization */}
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
                  <p className="text-gray-500 font-medium mb-1">Membership</p>
                  <p className="text-gray-900 font-semibold">{org.members}</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 font-medium mb-1">Motto</p>
                  <p className="text-gray-900 font-semibold italic">{org.motto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Committees */}
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
                    {committee.name}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2563EB]">
                    {committee.fullName}
                  </h3>
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {committee.description}
                </p>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">FOCUS AREA</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {committee.focus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-3">
            Get Involved with UnEC!
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join any of our committees and develop leadership, collaboration, and innovation skills while making a positive impact on the College of Education.
          </p>
          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            Learn More About UnEC
          </button>
        </div>

      </div>
    </div>
  );
}