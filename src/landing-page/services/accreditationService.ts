import { supabase } from '../../supabaseClient';

export const accreditationService = {

  getPageContent: async () => {
    const { data } = await supabase
      .from('accreditation_page_content')
      .select('*')
      .single();

    return data;
  },

  getOverview: async () => {
    const { data } = await supabase
      .from('accreditation_overview')
      .select('*')
      .order('display_order');

    return data;
  },

  getLevels: async () => {
    const { data } = await supabase
      .from('accreditation_levels')
      .select('*')
      .order('display_order');

    return data;
  },

  getPrograms: async () => {
    const { data } = await supabase
      .from('accredited_programs')
      .select('*')
      .order('display_order');

    return data;
  },

  getCertifications: async () => {
    const { data } = await supabase
      .from('accreditation_certifications')
      .select('*')
      .order('display_order');

    return data;
  },
savePageContent: async (data: any) => {
  return supabase
    .from('accreditation_page_content')
    .update(data)
    .eq('id', data.id);
},
saveOverview: async (items: any[]) => {
  return supabase
    .from('accreditation_overview')
    .upsert(items);
},
saveLevels: async (items: any[]) => {
  return supabase
    .from('accreditation_levels')
    .upsert(items);
},

savePrograms: async (items: any[]) => {
  return supabase
    .from('accreditation_programs')
    .upsert(items);
},
saveCertifications: async (items: any[]) => {
  return supabase
    .from('accreditation_certifications')
    .upsert(items);
},
};