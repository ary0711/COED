import { supabase } from '../../supabaseClient';

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getDepartmentContent() {
  return await supabase
    .from('department_page_content')
    .select('*');
}

export async function getColleges() {
  return await supabase
    .from('colleges')
    .select(`
      *,
      programs (
        *,
        program_faculty (*)
      )
    `)
    .order('display_order');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveDepartmentContent(
  departmentContent: any
) {
  const updates = Object.entries(
    departmentContent
  ).map(([section_name, values]: any) => ({
    section_name,
    title: values.title,
    description: values.description,
    content: values.content,
  }));

  return await supabase
    .from('department_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}

export async function saveColleges(
  colleges: any[]
) {
  return await supabase
    .from('colleges')
    .upsert(colleges);
}