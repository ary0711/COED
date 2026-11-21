
const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function footerRequest(
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
      `${API_BASE}/api/footer${endpoint}`,
      {
        method,
        headers,
        ...(body !== undefined
          ? { body: JSON.stringify(body) }
          : {}),
      }
    );
  } catch (error) {
    console.error('FOOTER NETWORK ERROR:', error);
    throw new Error('Cannot connect to the backend server.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('FOOTER API ERROR:', {
      endpoint,
      status: response.status,
      response: result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Footer request failed: ${response.status}`
    );
  }

  return result.data;
}

export const footerService = {
  // =================================
  // LOAD FUNCTIONS
  // =================================

  getFooterContent: async () => {
    return await footerRequest('/public/content');
  },

  getQuickLinks: async () => {
    return (
      (await footerRequest('/public/quick-links')) || []
    );
  },

  getSocialLinks: async () => {
    return (
      (await footerRequest('/public/social-links')) || []
    );
  },

  // =================================
  // SAVE FUNCTIONS
  // =================================

  saveFooterContent: async (content: any) => {
    return await footerRequest(
      '/save/content',
      'POST',
      content
    );
  },

  saveQuickLinks: async (links: any[]) => {
    return await footerRequest(
      '/save/quick-links',
      'POST',
      links
    );
  },

  saveSocialLinks: async (socials: any[]) => {
    return await footerRequest(
      '/save/social-links',
      'POST',
      socials
    );
  },
};
