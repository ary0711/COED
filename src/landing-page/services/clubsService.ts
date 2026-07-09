import { supabase } from '../../supabaseClient';

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getClubsContent() {
  return await supabase
    .from('clubs_page_content')
    .select('*');
}

export async function getClubStatistics() {
  return await supabase
    .from('clubs_statistics')
    .select('*')
    .order('display_order');
}

export async function getOrganizations() {
  return await supabase
    .from('organizations')
    .select('*')
    .order('display_order');
}

export async function getCommittees() {
  return await supabase
    .from('committees')
    .select('*')
    .order('display_order');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveClubsContent(
  clubsContent: any
) {
  const updates = Object.entries(
    clubsContent
  ).map(([section_name, values]: any) => ({
    section_name,
    title: values.title,
    description: values.description,
    content: values.content,
  }));

  return await supabase
    .from('clubs_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}

export async function saveClubStatistics(
  statistics: any[]
) {
  return await supabase
    .from('clubs_statistics')
    .upsert(statistics);
}

export async function saveOrganizations(
  organizations: any[]
) {
  return await supabase
    .from('organizations')
    .upsert(organizations);
}

export async function saveCommittees(
  committees: any[]
) {
  return await supabase
    .from('committees')
    .upsert(committees);
}