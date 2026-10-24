import type { Committee } from './landingPageTypes';
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
    .order('display_order', { ascending: true });
}

export async function getOrganizations() {
  return await supabase
    .from('organizations')
    .select('*')
    .order('display_order', { ascending: true });
}

export async function getCommittees() {
  return await supabase
    .from('committees')
    .select('*')
    .order('display_order', { ascending: true });
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveClubsContent(clubsContent: any) {
  const updates = Object.entries(clubsContent).map(
    ([section_name, values]: any) => ({
      section_name,
      title: values.title,
      description: values.description,
      content: values.content,
    })
  );

  return await supabase
    .from('clubs_page_content')
    .upsert(updates, {
      onConflict: 'section_name',
    });
}

export async function saveClubStatistics(statistics: any[]) {
  return await supabase
    .from('clubs_statistics')
    .upsert(statistics);
}

export async function saveOrganizations(organizations: any[]) {
  return await supabase
    .from('organizations')
    .upsert(organizations);
}

/* =========================
   SAVE COMMITTEES
========================= */

export async function saveCommittees(committees: Committee[]) {
  try {
    const validCommittees = committees
      .filter(
        (c) => c.committee_code?.trim() && c.full_name?.trim()
      )
      .map((c, index) => ({
        id: c.id,
        committee_code: c.committee_code.trim(),
        full_name: c.full_name.trim(),
        description: c.description?.trim() || null,
        focus: c.focus?.trim() || null,
        logo_url: c.logo_url || null,
        president_name: c.president_name?.trim() || null,
        adviser_name: c.adviser_name?.trim() || null,
        display_order: c.display_order ?? index + 1,
      }));

    const existing = validCommittees.filter(
      (c) => c.id && !c.id.startsWith('new-')
    );

    const newRecords = validCommittees
      .filter((c) => !c.id || c.id.startsWith('new-'))
      .map(({ id, ...record }) => record);

    // Save existing committees in small batches.
    for (let i = 0; i < existing.length; i += 3) {
      const batch = existing.slice(i, i + 3);

      const { error } = await supabase
        .from('committees')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error('Committee update failed:', error);
        throw new Error(
          `Updating committees failed: ${error.message}`
        );
      }
    }

    // Insert new committees in small batches.
    for (let i = 0; i < newRecords.length; i += 3) {
      const batch = newRecords.slice(i, i + 3);

      const { error } = await supabase
        .from('committees')
        .insert(batch);

      if (error) {
        console.error('Committee insert failed:', error);
        throw new Error(
          `Inserting committees failed: ${error.message}`
        );
      }
    }

    // Do not run another SELECT after saving.
    // This avoids an unnecessary database request.
    return {
      data: validCommittees,
      error: null,
    };
  } catch (error: any) {
    console.error('Failed to save committees:', error);

    return {
      data: null,
      error: {
        message:
          error?.message || 'Unable to save committees.',
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
    };
  }
}
