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
  const [studentResult, facultyResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('role', 'student')
        .eq('status', 'active'),

      supabase
        .from('profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('role', 'faculty')
        .eq('status', 'active'),
    ]);

  if (studentResult.error) {
    console.error(
      'Error counting students:',
      studentResult.error
    );

    return {
      students: 0,
      faculty: 0,
      error: studentResult.error,
    };
  }

  if (facultyResult.error) {
    console.error(
      'Error counting faculty:',
      facultyResult.error
    );

    return {
      students: 0,
      faculty: 0,
      error: facultyResult.error,
    };
  }

  return {
    students: studentResult.count ?? 0,
    faculty: facultyResult.count ?? 0,
    error: null,
  };
}
export async function getProgramStatistics() {
  const { count, error } = await supabase
    .from('programs')
    .select('*', {
      count: 'exact',
      head: true,
    });

  if (error) {
    console.error(
      'Error counting programs:',
      error
    );

    return {
      programs: 0,
      error,
    };
  }

  return {
    programs: count ?? 0,
    error: null,
  };
}