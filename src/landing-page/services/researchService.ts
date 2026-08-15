import { supabase } from '../../supabaseClient';

export async function loadResearchContent() {
  const { data } = await supabase
    .from('research_page_content')
    .select('*');

  const formatted: any = {};

  data?.forEach(item => {
    formatted[item.section_name] = item;
  });

  return formatted;
}

export async function loadResearchPublications() {
  const { data } = await supabase
    .from('research_publications')
    .select('*')
    .order('display_order');

  return data || [];
}

export async function loadAwards() {
  const { data } = await supabase
    .from('research_awards')
    .select('*')
    .order('display_order');

  return data || [];
}

export async function loadFeaturedAlumni() {
  const { data } = await supabase
    .from('featured_alumni')
    .select('*')
    .order('display_order');

  return data || [];
}

export async function saveResearchPage(
  researchContent: any,
  publications: any[],
  achievements: any[],
  alumni: any[]
) {
  const updates = Object.entries(researchContent).map(
    ([section_name, values]: any) => ({
      section_name,
      title: values.title,
      description: values.description,
      content: values.content,
    })
  );

  await supabase
    .from('research_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });

  await supabase
    .from('research_publications')
    .upsert(publications);

  await supabase
    .from('research_achievements_landingpage')
    .upsert(achievements);

  await supabase
    .from('featured_alumni')
    .upsert(alumni);
}