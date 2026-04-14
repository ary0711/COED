import { Users, Award, Star } from 'lucide-react';

export function ClubsPage() {
  const organizations = [
    {
      id: 1,
      name: 'Future Educators Organization (FEO)',
      type: 'Main Education Organization',
      description:
        'The official student organization for education majors that promotes leadership, professional growth, and service.',
      members: 420,
      adviser: 'Dr. Angela Rivera',
    },
  ];

  const clubs = [
    { id: 1, name: 'Reading Advocates Club', focus: 'Literacy & Storytelling' },
    { id: 2, name: 'Math Wizards Club', focus: 'Mathematics Enrichment' },
    { id: 3, name: 'Science Explorers Club', focus: 'STEM Learning' },
    { id: 4, name: 'Teaching Arts Club', focus: 'Creative Teaching Strategies' },
    { id: 5, name: 'Inclusive Education Club', focus: 'Special Education Awareness' },
    { id: 6, name: 'Digital Educators Club', focus: 'Educational Technology' },
    { id: 7, name: 'Physical Wellness Club', focus: 'Health & Fitness Education' },
    { id: 8, name: 'Community Outreach Club', focus: 'Extension & Service' },
    { id: 9, name: 'Research & Innovation Club', focus: 'Academic Research' },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            Clubs & Organizations
          </h1>
          <p className="text-xl text-gray-600">
            Engage, lead, and grow through our student organizations and clubs
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
            <div className="text-green-100">Active Clubs</div>
          </div>

          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg p-6 text-white">
            <Star className="w-10 h-10 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">10</div>
            <div className="text-purple-100">Total Groups</div>
          </div>
        </div>

        {/* Main Organization */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-4">
            Education Organization
          </h2>

          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold text-[#2563EB] mb-2">
                {org.name}
              </h3>

              <p className="text-gray-600 mb-3">{org.description}</p>

              <div className="flex gap-6 text-sm text-gray-700">
                <span><strong>Members:</strong> {org.members}</span>
                <span><strong>Adviser:</strong> {org.adviser}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Clubs */}
        <div>
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
            Academic & Co-Curricular Clubs
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-[#2563EB] mb-2">
                  {club.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  Focus: {club.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-semibold mb-3">
            Join a Club Today!
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Develop leadership, collaboration, and innovation skills beyond the classroom.
          </p>
          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
            View Membership Options
          </button>
        </div>

      </div>
    </div>
  );
}