import { supabase } from '../../supabaseClient';

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getAboutContent() {
  return await supabase
    .from('about_page_content')
    .select('*');
}

export async function getAboutStats() {
  return await supabase
    .from('about_statistics')
    .select('*')
    .order('display_order');
}

export async function getCoreValues() {
  return await supabase
    .from('premier_values')
    .select('*')
    .order('display_order');
}

export async function getCoreValueCards() {
  return await supabase
    .from('core_values')
    .select('*')
    .order('display_order');
}

export async function getFacultyMembers() {
  return await supabase
    .from('faculty_members')
    .select('*')
    .order('display_order');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveAboutContent(
  aboutContent: any
) {
  const updates = Object.entries(
    aboutContent
  ).map(([section_name, values]: any) => ({
    section_name,
    title: values.title,
    description: values.description,
    content: values.content,
  }));

  return await supabase
    .from('about_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}

export async function saveAboutStats(
  aboutStats: any[]
) {
  return await supabase
    .from('about_statistics')
    .upsert(aboutStats);
}

export async function saveCoreValues(
  coreValues: any[]
) {
  return await supabase
    .from('premier_values')
    .upsert(coreValues);
}

export async function saveCoreValueCards(
  coreValueCards: any[]
) {
  return await supabase
    .from('core_values')
    .upsert(coreValueCards);
}

export async function saveFacultyMembers(
  facultyMembers: any[]
) {
  return await supabase
    .from('faculty_members')
    .upsert(facultyMembers);
}