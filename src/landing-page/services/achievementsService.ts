import { supabase } from '../../supabaseClient';

export const achievementsService = {

  async getTopnotchers() {
    const { data, error } =
      await supabase
        .from('achievements_topnotchers')
        .select('*')
        .order('display_order');

    if (error) throw error;

    return data;
  },

  async getCollegeAchievements() {
    const { data, error } =
      await supabase
        .from('achievements_college')
        .select('*')
        .order('display_order');

    if (error) throw error;

    return data;
  },

 async getStatistics() {
    const { data, error } =
      await supabase
        .from('achievements_statistics')
        .select('*')
        .order('display_order');

    if (error) throw error;

    return data;
  },

  async getBannerStats() {
    const { data, error } =
      await supabase
        .from('achievements_banner_stats')
        .select('*')
        .order('display_order');

    if (error) throw error;

    return data;
  },
  async getBanner() {
  const { data, error } =
    await supabase
      .from('achievements_banner')
      .select('*')
      .single();

  if (error) throw error;

  return data;
},
async getPageContent() {
  const { data, error } =
    await supabase
      .from('achievements_page_content')
      .select('*')
      .single();

  if (error) throw error;

  return data;
},

savePageContent: async (data: any) => {
  return supabase
    .from('achievement_page_content')
    .upsert(data);
},

saveBanner: async (data: any) => {
  return supabase
    .from('achievement_banner')
    .upsert(data);
},

saveBannerStats: async (data: any[]) => {
  return supabase
    .from('achievement_banner_stats')
    .upsert(data);
},

saveStatistics: async (data: any[]) => {
  return supabase
    .from('achievement_statistics')
    .upsert(data);
},

saveTopnotchers: async (data: any[]) => {
  return supabase
    .from('achievement_topnotchers')
    .upsert(data);
},

saveCollegeAchievements: async (data: any[]) => {
  return supabase
    .from('achievement_college_achievements')
    .upsert(data);
},

}