import { supabase } from './supabaseClient';

export interface AlumniNewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image_url?: string;
  is_published: boolean;
  published_at: string;
}

// Retrieve Alumni News — fetch all published news
export async function getAlumniNews() {
  const { data, error } = await supabase
    .from('alumni_news')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data as AlumniNewsItem[];
}

// Retrieve Single News Article — open complete news article
export async function getSingleNewsArticle(newsId: string) {
  const { data, error } = await supabase
    .from('alumni_news')
    .select('*')
    .eq('id', newsId)
    .maybeSingle();
  if (error) throw error;
  return data as AlumniNewsItem | null;
}