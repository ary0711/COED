
const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function accreditationRequest(
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
      `${API_BASE}/api/accreditation${endpoint}`,
      {
        method,
        headers,
        ...(body !== undefined
          ? { body: JSON.stringify(body) }
          : {}),
      }
    );
  } catch (error) {
    console.error('ACCREDITATION NETWORK ERROR:', error);
    throw new Error('Cannot connect to the backend server.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('ACCREDITATION API ERROR:', {
      endpoint,
      status: response.status,
      response: result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Accreditation request failed: ${response.status}`
    );
  }

  return result.data;
}

export const accreditationService = {
  // =================================
  // LOAD FUNCTIONS
  // =================================

  getPageContent: async () => {
    return await accreditationRequest('/public/page-content');
  },

  getOverview: async () => {
    return (
      (await accreditationRequest('/public/overview')) || []
    );
  },

  getLevels: async () => {
    return (
      (await accreditationRequest('/public/levels')) || []
    );
  },

  getPrograms: async () => {
    return (
      (await accreditationRequest('/public/programs')) || []
    );
  },

  getCertifications: async () => {
    return (
      (await accreditationRequest('/public/certifications')) || []
    );
  },

  // =================================
  // SAVE FUNCTIONS
  // =================================

  savePageContent: async (data: any) => {
    return await accreditationRequest(
      '/save/page-content',
      'POST',
      data
    );
  },

  saveOverview: async (items: any[]) => {
    return await accreditationRequest(
      '/save/overview',
      'POST',
      items
    );
  },

  saveLevels: async (items: any[]) => {
    return await accreditationRequest(
      '/save/levels',
      'POST',
      items
    );
  },

  savePrograms: async (items: any[]) => {
    return await accreditationRequest(
      '/save/programs',
      'POST',
      items
    );
  },

  saveCertifications: async (items: any[]) => {
    return await accreditationRequest(
      '/save/certifications',
      'POST',
      items
    );
  },
};
