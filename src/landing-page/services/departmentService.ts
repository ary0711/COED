import { supabase } from '../../supabaseClient';

/* ========================================
   API CONFIGURATION
======================================== */

const API_BASE_URL = 'http://localhost:5000/api';

/* ========================================
   BACKEND API HELPER
======================================== */

async function departmentApiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error(
      'Authentication token is missing. Please log in again.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/department${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('DEPARTMENT API ERROR:', {
      status: response.status,
      result
    });

    throw new Error(
      result.error ||
      result.message ||
      `Request failed with status ${response.status}`
    );
  }

  return result;
}

/* ========================================
   LOAD FUNCTIONS
======================================== */

export async function getDepartmentContent() {
  return await supabase
    .from('department_page_content')
    .select('*');
}

export async function getColleges() {
  return await supabase
    .from('colleges')
    .select(`
      *,
      programs (
        *,
        program_faculty (*)
      )
    `)
    .order('display_order');
}

/* ========================================
   SAVE FUNCTIONS
======================================== */

// Save Department Page content
export async function saveDepartmentContent(
  departmentContent: any
) {
  return await departmentApiRequest('/save', {
    method: 'POST',
    body: JSON.stringify({
      departmentContent
    })
  });
}

// Save college records
export async function saveColleges(
  colleges: any[]
) {
  return await departmentApiRequest('/save', {
    method: 'POST',
    body: JSON.stringify({
      colleges
    })
  });
}

// Save both in one request
export async function saveDepartmentPageData(data: {
  departmentContent?: any;
  colleges?: any[];
}) {
  return await departmentApiRequest('/save', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}