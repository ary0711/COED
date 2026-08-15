import { supabase } from '../../supabaseClient';

export async function getHomepageContent() {
  const { data, error } = await supabase
    .from('homepage_content')
    .select('*');

  return { data, error };
}

export async function getHomepageStats() {
  const { data, error } = await supabase
    .from('homepage_stats')
    .select('*')
    .order('sort_order');

  return { data, error };
}

export async function getHomepageFeatures() {
  const { data, error } = await supabase
    .from('homepage_features')
    .select('*')
    .order('sort_order');

  return { data, error };
}

export async function getHomepageAnnouncements() {
  const { data, error } = await supabase
    .from('homepage_announcements')
    .select('*')
    .order('sort_order');

  return { data, error };
}

export async function saveHomepageContent(
  homeContent: any
) {
  const updates = Object.entries(homeContent).map(
    ([section_name, values]: any) => ({
      section_name,
      ...values,
    })
  );

  return await supabase
    .from('homepage_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });

    
}
export async function uploadHomepageImage(
  file: File,
  folder: string = 'stats'
) {
  const fileExt = file.name.split('.').pop();

  const fileName =
    `${folder}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('homepage-images')
    .upload(fileName, file, {
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('homepage-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
export async function saveHomepageStats(
  stats: any[]
) {
  return await supabase
    .from('homepage_stats')
    .upsert(stats);
}