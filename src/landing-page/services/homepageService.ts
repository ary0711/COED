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

export async function saveHomepageContent(homeContent: any) {
  const updates = Object.entries(homeContent).map(
    ([section_name, values]: [string, any]) => ({
      section_name,
      ...values,
    })
  );

  console.log('Saving homepage content:', updates);

  return await supabase
    .from('homepage_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}
export async function getProgramStatistics() {
  const { count, error } = await supabase
    .from('programs')
    .select('*', {
      count: 'exact',
      head: true,
    });

  console.log('Programs count:', count);
  console.log('Programs error:', error);

  return {
    programs: error ? 0 : count ?? 0,
    error,
  };
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

export async function saveHomepageFeatures(features: any[]) {
  try {
    for (const feature of features) {
      const { error } = await supabase
        .from('homepage_features')
        .update({
          title: feature.title,
          description: feature.description,
          icon: feature.icon,
        })
        .eq('id', feature.id);

      if (error) {
        console.error(
          'Error saving homepage feature:',
          error
        );

        return {
          success: false,
          error,
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      'Unexpected error saving homepage features:',
      error
    );

    return {
      success: false,
      error,
    };
  }
}
export async function debugProfileStatistics() {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, status');

  console.log('All profile records:', data);
  console.log('Profiles error:', error);

  return { data, error };
}

export async function debugSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();

  console.log('Current session:', data.session);
  console.log('Session error:', error);

  return { data, error };
}
export async function saveHomepageStats(
  stats: any[]
) {
  return await supabase
    .from('homepage_stats')
    .upsert(stats);
}

// ============================================================
// PROFILE STATISTICS
// Gets the current number of active students and faculty
// from the profiles table.
// ============================================================

export async function getProfileStatistics() {
  const { data, error } = await supabase.rpc(
    'get_public_homepage_counts'
  );

  if (error) {
    console.error('Error fetching profile statistics:', error);

    return {
      students: 0,
      faculty: 0,
      error,
    };
  }

  return {
    students: Number(data?.[0]?.students ?? 0),
    faculty: Number(data?.[0]?.faculty ?? 0),
    error: null,
  };
}
export async function checkHomepageAuth() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('================================');
  console.log('HOMEPAGE AUTHENTICATION CHECK');
  console.log('User:', user);
  console.log('User ID:', user?.id);
  console.log('Email:', user?.email);
  console.log('Error:', error);
  console.log('================================');

  return { user, error };
}


// ============================================================
// SAVE ANNOUNCEMENTS
// Handles base64 image uploads during the save process and 
// upserts the data into the homepage_announcements table.
// ============================================================

export async function saveHomepageAnnouncements(announcements: any[]) {
  try {
    const processedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        let finalImageUrl = announcement.image_url;

        // If the image_url is a new Base64 string (newly uploaded photo)
        if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
          // Convert Base64 to a Blob for Supabase upload
          const response = await fetch(finalImageUrl);
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'jpeg';
          
          // Generate a unique filename
          const fileName = `announcements/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

          // Upload to the 'announcements' bucket
          const { error: uploadError } = await supabase.storage
            .from('announcements')
            .upload(fileName, blob, {
              contentType: blob.type,
              upsert: true,
            });

          if (uploadError) {
            console.error('Error uploading announcement image:', uploadError);
            throw uploadError;
          }

          // Get the permanent public URL
          const { data: { publicUrl } } = supabase.storage
            .from('announcements')
            .getPublicUrl(fileName);

          finalImageUrl = publicUrl;
        }

        // Return the clean object to be saved to the database
        return {
          id: announcement.id,
          title: announcement.title,
          description: announcement.description,
          color: announcement.color,
          // If finalImageUrl is empty (user clicked X), save as null
          image_url: finalImageUrl || null,
          announcement_date: announcement.announcement_date,
          sort_order: announcement.sort_order,
        };
      })
    );

    const { error } = await supabase
      .from('homepage_announcements')
      .upsert(processedAnnouncements);

    if (error) {
      console.error('Error saving homepage announcements:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving homepage announcements:', error);
    return { success: false, error };
  }
}