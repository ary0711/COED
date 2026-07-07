import { Users, Award, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';


interface ClubStatistic {
  id: string;
  label: string;
  value: string;
  display_order: number;
}

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  members: string;
  motto: string;
  display_order: number;
}

interface Committee {
  id: string;
  committee_code: string;
  full_name: string;
  description: string;
  focus: string;
  display_order: number;
}

interface ClubsPageProps {
  previewMode?: boolean;
  previewContent?: any;
  previewStatistics?: ClubStatistic[];
  previewOrganizations?: Organization[];
  previewCommittees?: Committee[];
}
export function ClubsPage({
  previewMode = false,
  previewContent,
  previewStatistics,
  previewOrganizations,
  previewCommittees,
}: ClubsPageProps) {
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
 useEffect(() => {
}, []);
useEffect(() => {
  if (previewMode) {
    if (previewContent)
      setPageContent(previewContent);

    if (previewStatistics)
      setStatistics(previewStatistics);

    if (previewOrganizations)
      setOrganizations(previewOrganizations);

    if (previewCommittees)
      setCommittees(previewCommittees);

    setLoading(false);
    return;
  }

  loadData();
}, []);
async function loadData() {
  await Promise.all([
    loadPageContent(),
    loadStatistics(),
    loadOrganizations(),
    loadCommittees(),
  ]);

  setLoading(false);
}
async function loadPageContent() {
  const { data } = await supabase
    .from('clubs_page_content')
    .select('*');

  const formatted: any = {};

  data?.forEach(item => {
    formatted[item.section_name] = item;
  });

  setPageContent(formatted);
}
async function loadStatistics() {
  const { data } = await supabase
    .from('clubs_statistics')
    .select('*')
    .order('display_order');

  setStatistics(data || []);
}

async function loadOrganizations() {
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .order('display_order');

  setOrganizations(data || []);
}

async function loadCommittees() {
  const { data } = await supabase
    .from('committees')
    .select('*')
    .order('display_order');

  setCommittees(data || []);

  setLoading(false);
}
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#F1F5F9] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A8A] mb-4">
            {pageContent.header?.title}
          </h1>
          <p className="text-xl text-gray-600">
  {pageContent.header?.description}          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
  {statistics.map((stat, index) => (
    <div
      key={stat.id}
      className={`rounded-xl shadow-lg p-6 text-white ${
        index === 0
          ? 'bg-gradient-to-br from-[#2563EB] to-[#60A5FA]'
          : index === 1
          ? 'bg-gradient-to-br from-[#10B981] to-[#34D399]'
          : 'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]'
      }`}
    >
      {index === 0 && (
        <Users className="w-10 h-10 mb-3 opacity-90" />
      )}

      {index === 1 && (
        <Award className="w-10 h-10 mb-3 opacity-90" />
      )}

      {index === 2 && (
        <Star className="w-10 h-10 mb-3 opacity-90" />
      )}

      <div className="text-3xl font-bold mb-1">
        {stat.value}
      </div>

      <div>
        {stat.label}
      </div>
    </div>
  ))}
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
               {pageContent.cta?.title}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
    {pageContent.cta?.description}          </p>
          <button className="px-8 py-3 bg-white text-[#1E3A8A] rounded-lg hover:bg-blue-50 transition-colors font-semibold">
 {pageContent.cta?.content}          </button>
        </div>

      </div>
    </div>
  );
}