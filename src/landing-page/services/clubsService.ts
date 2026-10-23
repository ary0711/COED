import { supabase } from '../../supabaseClient';

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getClubsContent() {
  return await supabase
    .from('clubs_page_content')
    .select('*');
}

export async function getClubStatistics() {
  return await supabase
    .from('clubs_statistics')
    .select('*')
    .order('display_order');
}

export async function getOrganizations() {
  return await supabase
    .from('organizations')
    .select('*')
    .order('display_order');
}

export async function getCommittees() {
  return await supabase
    .from('committees')
    .select('*')
    .order('display_order');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveClubsContent(
  clubsContent: any
) {
  const updates = Object.entries(
    clubsContent
  ).map(([section_name, values]: any) => ({
    section_name,
    title: values.title,
    description: values.description,
    content: values.content,
  }));

  return await supabase
    .from('clubs_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}

export async function saveClubStatistics(
  statistics: any[]
) {
  return await supabase
    .from('clubs_statistics')
    .upsert(statistics);
}

export async function saveOrganizations(
  organizations: any[]
) {
  return await supabase
    .from('organizations')
    .upsert(organizations);
}



export async function saveCommittees(committees: any[]) {
  try {
    // Ignore completely empty editor slots.
    const validCommittees = committees.filter(
      (committee) =>
        committee.committee_code.trim() &&
        committee.full_name.trim()
    );

    const existingCommittees = validCommittees
      .filter((committee) => !committee.id.startsWith('new-'))
      .map((committee) => ({
        id: committee.id,
        committee_code: committee.committee_code,
        full_name: committee.full_name,
        description: committee.description || null,
        focus: committee.focus || null,
        logo_url: committee.logo_url || null,
        president_name: committee.president_name || null,
        adviser_name: committee.adviser_name || null,
        display_order: committee.display_order,
      }));

    const newCommittees = validCommittees
      .filter((committee) => committee.id.startsWith('new-'))
      .map((committee) => ({
        committee_code: committee.committee_code,
        full_name: committee.full_name,
        description: committee.description || null,
        focus: committee.focus || null,
        logo_url: committee.logo_url || null,
        president_name: committee.president_name || null,
        adviser_name: committee.adviser_name || null,
        display_order: committee.display_order,
      }));

    const savedRecords: any[] = [];

    // Update existing database records.
    if (existingCommittees.length > 0) {
      const { data, error } = await supabase
        .from('committees')
        .upsert(existingCommittees, { onConflict: 'id' })
        .select();

      if (error) throw error;

      savedRecords.push(...(data || []));
    }

    // Insert new records; Supabase generates their UUIDs.
    if (newCommittees.length > 0) {
      const { data, error } = await supabase
        .from('committees')
        .insert(newCommittees)
        .select();

      if (error) throw error;

      savedRecords.push(...(data || []));
    }

    return { data: savedRecords, error: null };
  } catch (error) {
    console.error('Error saving committees:', error);

    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error('Failed to save committees.'),
    };
  }
}
