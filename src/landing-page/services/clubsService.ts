
import type { Committee } from './landingPageTypes';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ApiResult<T = any> = {
  data: T | null;
  error: {
    message: string;
    code?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null;
};

async function clubsRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<ApiResult<T>> {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        data: null,
        error: {
          message: 'Authentication token is missing. Please log in again.',
          code: 'MISSING_TOKEN',
        },
      };
    }

    const response = await fetch(`${API_BASE}/api/clubs${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        return {
          data: null,
          error: {
            message:
              result.error ||
              'Your session has expired. Please log in again.',
            code: result.code || 'UNAUTHORIZED',
          },
        };
      }

      return {
        data: null,
        error: {
          message: result.error || 'Request failed.',
          code: result.code || 'REQUEST_FAILED',
          details: result.details || null,
          hint: result.hint || null,
        },
      };
    }

    return {
      data: result.data ?? null,
      error: null,
    };
  } catch (error: any) {
    console.error('Clubs API request failed:', error);

    return {
      data: null,
      error: {
        message: error.message || 'Unable to connect to the server.',
      },
    };
  }
}

/* =========================
   LOAD FUNCTIONS
========================= */

export async function getClubsContent() {
  return clubsRequest('/content');
}

export async function getClubStatistics() {
  return clubsRequest('/statistics');
}

export async function getOrganizations() {
  return clubsRequest('/organizations');
}

export async function getCommittees() {
  return clubsRequest('/committees');
}

/* =========================
   SAVE FUNCTIONS
========================= */

export async function saveClubsContent(clubsContent: any) {
  return clubsRequest('/content', 'POST', clubsContent);
}

export async function saveClubStatistics(statistics: any[]) {
  return clubsRequest('/statistics', 'POST', statistics);
}

export async function saveOrganizations(organizations: any[]) {
  return clubsRequest('/organizations', 'POST', organizations);
}

/* =========================
   SAVE COMMITTEES
========================= */

export async function saveCommittees(committees: Committee[]) {
  return clubsRequest('/committees', 'POST', committees);
}