import { supabase } from './supabaseClient';

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

export async function getTracerSurvey(alumniId: string) {
  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .select('*')
    .eq('alumni_id', alumniId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveTracerSurvey(data: TracerSurveyData) {
  const { error } = await supabase
    .from('graduate_tracer_survey')
    .insert([{ ...data, is_completed: true }]);
  if (error) throw error;
}

export async function updateTracerSurvey(alumniId: string, data: Partial<TracerSurveyData>) {
  const { error } = await supabase
    .from('graduate_tracer_survey')
    .update(data)
    .eq('alumni_id', alumniId);
  if (error) throw error;
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

export async function getDashboardStats(alumniId: string) {
  const { data, error } = await supabase
    .from('graduate_tracer_survey')
    .select('employment_status, is_completed, updated_at')
    .eq('alumni_id', alumniId)
    .maybeSingle();

  if (error) throw error;

  return {
    surveyStatus: data?.is_completed ? 'Completed' : 'Not Started',
    employmentStatus: data?.employment_status
      ? data.employment_status.charAt(0).toUpperCase() + data.employment_status.slice(1)
      : 'Not Set',
    lastUpdated: data?.updated_at || null,
    membershipStatus: 'Active',
  };
}