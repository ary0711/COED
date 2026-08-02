import { supabase } from './supabaseClient';

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size_label: string;
  file_url: string;
  created_at: string;
}

// RETRIEVE — display downloadable files
export async function getDocuments() {
  const { data, error } = await supabase
    .from('alumni_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DocumentItem[];
}

// DOWNLOAD — handle secure file downloads (open the stored file URL)
export function downloadDocument(fileUrl: string, name: string) {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}