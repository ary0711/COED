
const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* =========================================
   RESEARCH API REQUEST
========================================= */

async function researchRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error(
      'Authentication token is missing. Please log in again.'
    );
  }

  const response = await fetch(
    `${API_BASE}/api/research${endpoint}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('RESEARCH API ERROR:', {
      endpoint,
      status: response.status,
      response: result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Research request failed: ${response.status}`
    );
  }

  return result.data;
}

/* =========================================
   LOAD RESEARCH CONTENT
========================================= */

export async function loadResearchContent() {
  return await researchRequest('/content');
}

/* =========================================
   LOAD RESEARCH PUBLICATIONS
========================================= */

export async function loadResearchPublications() {
  return (await researchRequest('/publications')) || [];
}

/* =========================================
   LOAD RESEARCH AWARDS
========================================= */

export async function loadAwards() {
  return (await researchRequest('/awards')) || [];
}

/* =========================================
   LOAD FEATURED ALUMNI
========================================= */

export async function loadFeaturedAlumni() {
  return (await researchRequest('/alumni')) || [];
}

/* =========================================
   SAVE RESEARCH PAGE
========================================= */

export async function saveResearchPage(
  researchContent: any,
  publications: any[],
  achievements: any[],
  alumni: any[]
) {
  return await researchRequest('/save', 'POST', {
    researchContent,
    publications,
    achievements,
    alumni,
  });
}
