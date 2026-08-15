import { supabase } from './supabaseClient';

export interface InquiryData {
  alumni_id: string;
  subject: string;
  category: string;
  message: string;
}

export interface InquiryItem extends InquiryData {
  id: string;
  status: string;
  created_at: string;
}

export async function submitInquiry(data: InquiryData) {
  const { error } = await supabase
    .from('alumni_inquiries')
    .insert([{ ...data }]); 
  if (error) throw error;
}

export async function getInquiryHistory(alumniId: string) {
  const { data, error } = await supabase
    .from('alumni_inquiries')
    .select('*')
    .eq('alumni_id', alumniId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as InquiryItem[];
}
export async function getAllInquiries() {
  const { data, error } = await supabase
    .from('alumni_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InquiryItem[];
}