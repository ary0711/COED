import { supabase } from '../../supabaseClient';

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getAboutContent() {
  return await supabase
    .from('about_page_content')
    .select('*');
}

export async function getAboutStats() {
  return await supabase
    .from('about_statistics')
    .select('*')
    .order('display_order');
}

export async function getCoreValues() {
  return await supabase
    .from('premier_values')
    .select('*')
    .order('display_order');
}

export async function getCoreValueCards() {
  return await supabase
    .from('core_values')
    .select('*')
    .order('display_order');
}

export async function getFacultyMembers() {
  return await supabase
    .from('faculty_members')
    .select('*')
    .order('display_order');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveAboutContent(
  aboutContent: any
) {
  const updates = Object.entries(
    aboutContent
  ).map(([section_name, values]: any) => ({
    section_name,
    title: values.title,
    description: values.description,
    content: values.content,
    image: values.image,
    badge_number: values.badge_number
  }));

  console.log("ABOUT CONTENT", aboutContent);
  console.log("UPDATES", updates);

  return await supabase
    .from('about_page_content')
    .upsert(updates, {
      onConflict: 'section_name'
    });
}
export async function saveAboutStats(
  aboutStats: any[]
) {
  return await supabase
    .from('about_statistics')
    .upsert(aboutStats);
}

export async function saveCoreValues(
  coreValues: any[]
) {
  return await supabase
    .from('premier_values')
    .upsert(coreValues);
}

export async function saveCoreValueCards(
  coreValueCards: any[]
) {
  return await supabase
    .from('core_values')
    .upsert(coreValueCards);
}

export async function saveFacultyMembers(
  facultyMembers: any[]
) {
  console.log(
    'SAVING FACULTY:',
    JSON.stringify(
      facultyMembers,
      null,
      2
    )
  );

  const {
    data,
    error,
  } = await supabase
    .from('faculty_members')
    .upsert(
      facultyMembers,
      {
        onConflict: 'id',
      }
    )
    .select();

  if (error) {
    console.error(
      'SAVE FACULTY ERROR:',
      error
    );

    throw error;
  }

  return {
    data,
    error: null,
  };
}

export async function deleteFacultyMember(
  id: string
) {
  const { data, error } =
    await supabase
      .from('faculty_members')
      .delete()
      .eq('id', id)
      .select();

  if (error) {
    console.error(
      'DELETE FACULTY ERROR:',
      error
    );

    throw error;
  }

  console.log(
    'FACULTY DELETED:',
    data
  );

  return {
    data,
    error: null,
  };
}
export async function uploadAboutImage(
  file: File,
  folder: string = 'history'
) {
  const extension =
    file.name.split('.').pop();

  const fileName =
    `${folder}/${Date.now()}.${extension}`;

  const { data, error } =
    await supabase.storage
      .from('about-images')
      .upload(fileName, file, {
        upsert: true
      });

  console.log('UPLOAD DATA:', data);
  console.log('UPLOAD ERROR:', error);

  if (error) {
    alert(error.message);
    throw error;
  }

  const {
    data: { publicUrl }
  } = supabase.storage
    .from('about-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
export async function uploadFacultyImage(
  file: File,
  folder: string = 'faculty'
) {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase() || 'jpg';

  const fileName =
    `${crypto.randomUUID()}.${extension}`;

  const filePath =
    `${folder}/${fileName}`;

  console.log(
    'Uploading image to:',
    filePath
  );

  const {
    data,
    error,
  } = await supabase.storage
    .from('faculty_images')
    .upload(
      filePath,
      file,
      {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      }
    );

  if (error) {
    console.error(
      'Storage upload error:',
      error
    );

    throw error;
  }

  console.log(
    'Storage upload successful:',
    data
  );

  const {
    data: publicUrlData,
  } =
    supabase.storage
      .from('faculty_images')
      .getPublicUrl(filePath);

  const publicUrl =
    publicUrlData?.publicUrl;

  if (!publicUrl) {
    throw new Error(
      'Unable to generate public image URL.'
    );
  }

  console.log(
    'Generated public URL:',
    publicUrl
  );

  return publicUrl;
}