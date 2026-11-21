
import { supabase } from '../../supabaseClient';

/*
=========================================================
API CONFIGURATION
=========================================================
*/

const API_BASE_URL = 'http://localhost:5000/api';

/*
=========================================================
API REQUEST HELPER
=========================================================
*/


async function aboutApiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');

  console.log('ABOUT API AUTH CHECK:', {
    tokenExists: !!token,
    tokenLength: token?.length || 0,
    endpoint,
  });

  if (!token) {
    throw new Error(
      'Authentication token is missing. Please sign in again.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/about${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('ABOUT API ERROR:', {
      status: response.status,
      result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Request failed: ${response.status}`
    );
  }

  return result;
}

/*
=========================================================
LOAD FUNCTIONS
=========================================================
*/

// Load About Page Content
export async function getAboutContent() {
  return await supabase
    .from('about_page_content')
    .select('*');
}

// Load About Statistics
export async function getAboutStats() {
  return await supabase
    .from('about_statistics')
    .select('*')
    .order('display_order');
}

// Load Premier Values
export async function getCoreValues() {
  return await supabase
    .from('premier_values')
    .select('*')
    .order('display_order');
}

// Load Core Value Cards
export async function getCoreValueCards() {
  return await supabase
    .from('core_values')
    .select('*')
    .order('display_order');
}

// Load Faculty Members
export async function getFacultyMembers() {
  return await supabase
    .from('faculty_members')
    .select('*')
    .order('display_order');
}

/*
=========================================================
SAVE FUNCTIONS
=========================================================
*/

// Save all About Page sections through Express
export async function saveAboutPageData(data: {
  aboutContent?: any;
  aboutStats?: any[];
  coreValues?: any[];
  coreValueCards?: any[];
  facultyMembers?: any[];
}) {
  return await aboutApiRequest('/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Save About Page Content
export async function saveAboutContent(
  aboutContent: any
) {
  return await saveAboutPageData({
    aboutContent,
  });
}

// Save About Statistics
export async function saveAboutStats(
  aboutStats: any[]
) {
  return await saveAboutPageData({
    aboutStats,
  });
}

// Save Premier Values
export async function saveCoreValues(
  coreValues: any[]
) {
  return await saveAboutPageData({
    coreValues,
  });
}

// Save Core Value Cards
export async function saveCoreValueCards(
  coreValueCards: any[]
) {
  return await saveAboutPageData({
    coreValueCards,
  });
}

// Save Faculty Members
export async function saveFacultyMembers(
  facultyMembers: any[]
) {
  console.log(
    'SAVING FACULTY:',
    JSON.stringify(facultyMembers, null, 2)
  );

  return await saveAboutPageData({
    facultyMembers,
  });
}

/*
=========================================================
DELETE FACULTY MEMBER
=========================================================
*/

export async function deleteFacultyMember(
  id: string
) {
  if (!id) {
    throw new Error('Faculty member ID is required.');
  }

  const result = await aboutApiRequest(
    `/faculty/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );

  console.log('FACULTY DELETED:', result);

  return result;
}

/*
=========================================================
FILE TO BASE64 HELPER
=========================================================
*/

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(
          new Error('Unable to read the selected image.')
        );
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(
        new Error('Failed to read the selected image.')
      );
    };

    reader.readAsDataURL(file);
  });
}

/*
=========================================================
UPLOAD IMAGE THROUGH EXPRESS BACKEND
=========================================================
*/

async function uploadImage(
  file: File,
  bucket: 'about-images' | 'faculty_images',
  folder: string
): Promise<string> {
  if (!file) {
    throw new Error('Please select an image.');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'Only JPG, PNG, and WEBP images are allowed.'
    );
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      'Image size must not exceed 5 MB.'
    );
  }

  const base64Image = await fileToBase64(file);

  const result = await aboutApiRequest(
    '/upload-image',
    {
      method: 'POST',
      body: JSON.stringify({
        image: base64Image,
        bucket,
        folder,
      }),
    }
  );

  if (!result.imageUrl) {
    throw new Error(
      'Image uploaded, but no public image URL was returned.'
    );
  }

  console.log(
    'IMAGE UPLOAD SUCCESSFUL:',
    result.imageUrl
  );

  return result.imageUrl;
}

/*
=========================================================
UPLOAD ABOUT PAGE IMAGE
=========================================================
*/

export async function uploadAboutImage(
  file: File,
  folder: string = 'history'
) {
  return await uploadImage(
    file,
    'about-images',
    folder
  );
}

/*
=========================================================
UPLOAD FACULTY IMAGE
=========================================================
*/

export async function uploadFacultyImage(
  file: File,
  folder: string = 'faculty'
) {
  return await uploadImage(
    file,
    'faculty_images',
    folder
  );
}
