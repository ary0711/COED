export interface TracerSurveyData {
  alumni_id: string;
  employment_status: string;
  job_title: string;
  employer: string;
  years_employed: number;
  monthly_salary: string;
  relevance: string;
  updated_at?: string;
}

// All reads/writes go through the Express API (JWT-authenticated) now,
// not straight to Supabase. The server derives the alumnus's own
// alumni_id from the token — alumniId parameters below are only used
// for the existing function signatures (kept so AlumniDashboard.tsx
// doesn't need to change); the server never trusts them.
const TRACER_API_URL = 'http://localhost:5000/api/tracer-survey';

function getToken() {
  return localStorage.getItem('token');
}

async function parseErrorOrThrow(res: Response) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || res.statusText);
}

export async function getTracerSurvey(_alumniId: string) {
  const res = await fetch(`${TRACER_API_URL}/mine`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) await parseErrorOrThrow(res);
  return res.json();
}

export async function saveTracerSurvey(data: TracerSurveyData) {
  const { alumni_id, ...payload } = data; // alumni_id is derived server-side, not sent
  const res = await fetch(TRACER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

export async function updateTracerSurvey(_alumniId: string, data: Partial<TracerSurveyData>) {
  const { alumni_id, ...payload } = data as TracerSurveyData;
  const res = await fetch(TRACER_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseErrorOrThrow(res);
}

export function validateTracerSurvey(data: Partial<TracerSurveyData>): string[] {
  const errors: string[] = [];
  if (!data.employment_status) errors.push('Employment status is required.');
  if (data.employment_status === 'employed' || data.employment_status === 'self-employed') {
    if (!data.job_title) errors.push('Job title is required.');
    if (!data.employer) errors.push('Employer/company is required.');
  }
  return errors;
}

export async function getDashboardStats(_alumniId: string) {
  const res = await fetch(`${TRACER_API_URL}/dashboard-stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) await parseErrorOrThrow(res);
  return res.json();
}