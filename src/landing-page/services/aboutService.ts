import { supabase } from '../../supabaseClient';

/* =========================
   BACKEND CONFIG
========================= */

const API_URL = 'https://coed.onrender.com';

// ⚠️ Change this to the localStorage key where your app stores the login token.
// Check: F12 → Application → Local Storage → your site.
const TOKEN_KEY = 'token';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function cmsUpsert(
  table: string,
  row: any,
  onConflict?: string
) {
  const res = await fetch(`${API_URL}/api/cms/${table}/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ row, onConflict })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Save failed');
  return json.data;
}

async function cmsDelete(table: string, id: string) {
  const res = await fetch(`${API_URL}/api/cms/${table}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Delete failed');
  return json;
}

async function cmsUpload(
  file: File,
  bucket: string,
  folder: string
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', bucket);
  form.append('folder', folder);

  const res = await fetch(`${API_URL}/api/cms/upload`, {
    method: 'POST',
    headers: authHeaders(), // do NOT set Content-Type for FormData
    body: form
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.publicUrl;
}

// Keeps the { data, error } shape your components already expect
async function wrap(fn: () => Promise<any>) {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error: any) {
    console.error('CMS SAVE ERROR:', error);
    return { data: null, error };
  }
}

/* =========================
   LOAD FUNCTIONS (unchanged)
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
   SAVE FUNCTIONS (via backend)
========================= */

export async function saveAboutContent(aboutContent: any) {
  const updates = Object.entries(aboutContent).map(
    ([section_name, values]: any) => ({
      section_name,
      title: values.title,
      description: values.description,
      content: values.content,
      image: values.image,
      badge_number: values.badge_number
    })
  );

  return wrap(() =>
    cmsUpsert('about_page_content', updates, 'section_name')
  );
}

export async function saveAboutStats(aboutStats: any[]) {
  return wrap(() => cmsUpsert('about_statistics', aboutStats));
}

export async function saveCoreValues(coreValues: any[]) {
  return wrap(() => cmsUpsert('premier_values', coreValues));
}

export async function saveCoreValueCards(coreValueCards: any[]) {
  return wrap(() => cmsUpsert('core_values', coreValueCards));
}

export async function saveFacultyMembers(facultyMembers: any[]) {
  const data = await cmsUpsert('faculty_members', facultyMembers, 'id');
  return { data, error: null };
}

export async function deleteFacultyMember(id: string) {
  const data = await cmsDelete('faculty_members', id);
  return { data, error: null };
}

/* =========================
   UPLOAD FUNCTIONS (via backend)
========================= */

export async function uploadAboutImage(
  file: File,
  folder: string = 'history'
) {
  try {
    return await cmsUpload(file, 'about-images', folder);
  } catch (error: any) {
    console.error('UPLOAD ERROR:', error);
    alert(error.message);
    throw error;
  }
}

export async function uploadFacultyImage(
  file: File,
  folder: string = 'faculty'
) {
  return await cmsUpload(file, 'faculty_images', folder);
}