import { supabase } from '../../supabaseClient';

export const contactService = {

  async getPageContent() {
    const { data, error } = await supabase
      .from('contact_page_content')
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  },

  // ============================
  // GET OFFICE HOURS
  // ============================

  async getOfficeHours() {
    const { data, error } = await supabase
      .from('contact_office_hours')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  },

  // ============================
  // GET SOCIAL LINKS
  // ============================

  async getSocialLinks() {
    const { data, error } = await supabase
      .from('contact_social_links')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  },

  // ============================
  // SAVE PAGE CONTENT
  // ============================

  async savePageContent(content: any) {

    const { error } = await supabase
      .from('contact_page_content')
      .update({
        page_title: content.page_title,
        page_subtitle: content.page_subtitle,

        address_title: content.address_title,
        address_content: content.address_content,

        phone_title: content.phone_title,
        phone_content: content.phone_content,

        email_title: content.email_title,
        email_content: content.email_content,

        office_hours_title:
          content.office_hours_title,

        social_title:
          content.social_title,

        form_title:
          content.form_title,

        map_embed_url:
          content.map_embed_url,
      })
      .eq('id', content.id);

    if (error) {
      throw error;
    }
  },

  // ============================
  // SAVE OFFICE HOURS
  // ============================

  async saveOfficeHours(hours: any[]) {

    for (const item of hours) {

      const { error } = await supabase
        .from('contact_office_hours')
        .update({
          day_name: item.day_name,
          hours: item.hours,
          sort_order: item.sort_order,
        })
        .eq('id', item.id);

      if (error) {
        throw error;
      }
    }
  },

  // ============================
  // SAVE SOCIAL LINKS
  // ============================

  async saveSocialLinks(links: any[]) {

    for (const item of links) {

      const { error } = await supabase
        .from('contact_social_links')
        .update({
          platform: item.platform,
          url: item.url,
          sort_order: item.sort_order,
        })
        .eq('id', item.id);

      if (error) {
        throw error;
      }
    }
  },
};