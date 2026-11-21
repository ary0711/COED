
const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function contactRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(body !== undefined
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE}/api/contact${endpoint}`,
      {
        method,
        headers,
        ...(body !== undefined
          ? { body: JSON.stringify(body) }
          : {}),
      }
    );
  } catch (error) {
    console.error('CONTACT NETWORK ERROR:', error);
    throw new Error('Cannot connect to the backend server.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('CONTACT API ERROR:', {
      endpoint,
      status: response.status,
      response: result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Contact request failed: ${response.status}`
    );
  }

  return result.data;
}

export const contactService = {
  // ============================
  // LOAD FUNCTIONS
  // ============================

  getPageContent: async () => {
    return await contactRequest('/public/page-content');
  },

  getOfficeHours: async () => {
    return (
      (await contactRequest('/public/office-hours')) || []
    );
  },

  getSocialLinks: async () => {
    return (
      (await contactRequest('/public/social-links')) || []
    );
  },

  // ============================
  // SAVE FUNCTIONS
  // ============================

  savePageContent: async (content: any) => {
    return await contactRequest(
      '/save/page-content',
      'POST',
      content
    );
  },

  saveOfficeHours: async (hours: any[]) => {
    return await contactRequest(
      '/save/office-hours',
      'POST',
      hours
    );
  },

  saveSocialLinks: async (links: any[]) => {
    return await contactRequest(
      '/save/social-links',
      'POST',
      links
    );
  },
};