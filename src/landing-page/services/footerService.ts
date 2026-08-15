import { supabase } from '../../supabaseClient';

export const footerService = {

  async getFooterContent() {

    const { data, error } = await supabase
      .from('footer_content')
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  },

  async getQuickLinks() {

    const { data, error } = await supabase
      .from('footer_quick_links')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  },

  async getSocialLinks() {

    const { data, error } = await supabase
      .from('footer_social_links')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  },
async saveFooterContent(content: any) {

  const { error } = await supabase
    .from('footer_content')
    .update({
      about_title: content.about_title,
      about_description: content.about_description,
      contact_title: content.contact_title,
      address: content.address,
      phone: content.phone,
      email: content.email,
      social_title: content.social_title,
      copyright_text: content.copyright_text,
    })
    .eq('id', content.id);

  if (error) throw error;
},
async saveQuickLinks(
  links: any[]
) {

  for (const link of links) {

    const { error } = await supabase
      .from('footer_quick_links')
      .update({
        label: link.label,
        url: link.url,
        sort_order: link.sort_order,
      })
      .eq('id', link.id);

    if (error) throw error;
  }
},async saveSocialLinks(
  socials: any[]
) {

  for (const social of socials) {

    const { error } = await supabase
      .from('footer_social_links')
      .update({
        platform: social.platform,
        url: social.url,
        sort_order: social.sort_order,
      })
      .eq('id', social.id);

    if (error) throw error;
  }
},
};