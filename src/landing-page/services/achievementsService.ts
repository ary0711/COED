
const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function achievementsRequest(
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
      `${API_BASE}/api/achievements${endpoint}`,
      {
        method,
        headers,
        ...(body !== undefined
          ? { body: JSON.stringify(body) }
          : {}),
      }
    );
  } catch (error) {
    console.error('ACHIEVEMENTS NETWORK ERROR:', error);
    throw new Error('Cannot connect to the backend server.');
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('ACHIEVEMENTS API ERROR:', {
      endpoint,
      status: response.status,
      response: result,
    });

    throw new Error(
      result.error ||
      result.message ||
      `Achievements request failed: ${response.status}`
    );
  }

  return result.data;
}

export const achievementsService = {
  // ==============================
  // LOAD FUNCTIONS
  // ==============================

  async getTopnotchers() {
    return (
      (await achievementsRequest('/public/topnotchers')) || []
    );
  },

  async getCollegeAchievements() {
    return (
      (await achievementsRequest('/public/college-achievements')) || []
    );
  },

  async getStatistics() {
    return (
      (await achievementsRequest('/public/statistics')) || []
    );
  },

  async getBannerStats() {
    return (
      (await achievementsRequest('/public/banner-stats')) || []
    );
  },

  async getBanner() {
    return await achievementsRequest('/public/banner');
  },

  async getPageContent() {
    return await achievementsRequest('/public/page-content');
  },

  // ==============================
  // SAVE FUNCTIONS
  // These require authentication
  // ==============================

  async savePageContent(data: any) {
    return await achievementsRequest(
      '/save/page-content',
      'POST',
      data
    );
  },

  async saveBanner(data: any) {
    return await achievementsRequest(
      '/save/banner',
      'POST',
      data
    );
  },

  async saveBannerStats(data: any[]) {
    return await achievementsRequest(
      '/save/banner-stats',
      'POST',
      data
    );
  },

  async saveStatistics(data: any[]) {
    return await achievementsRequest(
      '/save/statistics',
      'POST',
      data
    );
  },

  async saveTopnotchers(data: any[]) {
    return await achievementsRequest(
      '/save/topnotchers',
      'POST',
      data
    );
  },

  async saveCollegeAchievements(data: any[]) {
    return await achievementsRequest(
      '/save/college-achievements',
      'POST',
      data
    );
  },
};