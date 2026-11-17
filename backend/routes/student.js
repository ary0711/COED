
const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// =========================================================
// AUTHORIZATION
// =========================================================

function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin'];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Not authorized'
    });
  }

  next();
}

// =========================================================
// GENERAL STUDENT APPROVALS
// GET /api/students
// =========================================================

router.get('/', authenticate, requireChairRole, async (req, res) => {
  try {
    const isChairScoped = req.user.role === 'department_chair';

    if (
      isChairScoped &&
      (!req.user.departmentIds ||
        req.user.departmentIds.length === 0)
    ) {
      return res.status(400).json({
        error: 'Your chair account has no department assigned. Contact the dean/admin.'
      });
    }

    let query = supabase
      .from('profiles')
      .select(
        isChairScoped
          ? `id, full_name, email, status, created_at,
             student_profiles!inner (
               student_no, program, department_id, year_level
             )`
          : `id, full_name, email, status, created_at,
             student_profiles (
               student_no, program, department_id, year_level
             )`
      )
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (isChairScoped) {
      query = query.in(
        'student_profiles.department_id',
        req.user.departmentIds
      );
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.json(data || []);

  } catch (error) {
    console.error('Load students error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to load students.'
    });
  }
});

// =========================================================
// UPDATE STUDENT ACCOUNT STATUS
// PATCH /api/students/:id/status
// =========================================================

router.patch('/:id/status', authenticate, requireChairRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status value'
      });
    }

    if (req.user.role === 'department_chair') {
      if (
        !req.user.departmentIds ||
        req.user.departmentIds.length === 0
      ) {
        return res.status(400).json({
          error: 'Your chair account has no department assigned. Contact the dean/admin.'
        });
      }

      const { data: studentProfile, error: fetchError } =
        await supabase
          .from('student_profiles')
          .select('department_id')
          .eq('user_id', id)
          .single();

      if (fetchError || !studentProfile) {
        return res.status(404).json({
          error: 'Student not found.'
        });
      }

      if (
        !req.user.departmentIds.includes(
          studentProfile.department_id
        )
      ) {
        return res.status(403).json({
          error: 'You can only manage students in your own department(s).'
        });
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.json(data);

  } catch (error) {
    console.error('Update student status error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to update student status.'
    });
  }
});


// =========================================================
// GRADUATION MANAGEMENT
// =========================================================

// Accept different fourth-year formats.
function isFourthYear(value) {
  const year = String(value ?? '')
    .trim()
    .toLowerCase();

  return [
    '4',
    '4th',
    'fourth',
    'fourth year',
    '4th year'
  ].includes(year);
}

// Handle Supabase embedded relation as either object or array.
function getEmbeddedStudentProfile(profileRow) {
  if (Array.isArray(profileRow?.student_profiles)) {
    return profileRow.student_profiles[0] ?? null;
  }

  return profileRow?.student_profiles ?? null;
}

// =========================================================
// GET STUDENT GRADUATION PROFILE
// year_level comes from profiles.
// Graduation fields come from student_profiles.
// =========================================================

async function getStudentProfileForGraduation(userId) {
  const [
    { data: studentProfile, error: studentError },
    { data: profile, error: profileError }
  ] = await Promise.all([
    supabase
      .from('student_profiles')
      .select(`
        user_id,
        department_id,
        graduation_eligible,
        graduation_status,
        graduation_year
      `)
      .eq('user_id', userId)
      .maybeSingle(),

    supabase
      .from('profiles')
      .select('year_level, role, status')
      .eq('id', userId)
      .maybeSingle()
  ]);

  if (studentError) throw studentError;
  if (profileError) throw profileError;

  if (!studentProfile || !profile) {
    return null;
  }

  return {
    ...studentProfile,
    year_level: profile.year_level,
    profile_role: profile.role,
    profile_status: profile.status
  };
}

// =========================================================
// DEPARTMENT AUTHORIZATION
// =========================================================

async function authorizeDepartmentScope(req, userId) {
  if (req.user.role !== 'department_chair') {
    return true;
  }

  const departmentIds = req.user.departmentIds || [];

  if (departmentIds.length === 0) {
    return false;
  }

  const student = await getStudentProfileForGraduation(userId);

  return Boolean(
    student &&
    departmentIds.includes(student.department_id)
  );
}


// =========================================================
// GET FOURTH-YEAR STUDENTS
// GET /api/students/graduation
// =========================================================

router.get(
  '/graduation',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      const isChairScoped =
        req.user.role === 'department_chair';

      if (
        isChairScoped &&
        (!req.user.departmentIds ||
          req.user.departmentIds.length === 0)
      ) {
        return res.status(400).json({
          error: 'Your chair account has no department assigned. Contact the dean/admin.'
        });
      }

      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          id_number,
          status,
          created_at,
          year_level,
          student_profiles!inner (
            student_no,
            program,
            department_id,
            graduation_eligible,
            graduation_status,
            graduation_year
          )
        `)
        .eq('role', 'student')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (isChairScoped) {
        query = query.in(
          'student_profiles.department_id',
          req.user.departmentIds
        );
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      // Filter fourth-year students using profiles.year_level.
      const fourthYearRows = (data || []).filter(row =>
        isFourthYear(row.year_level)
      );

      const studentIds = fourthYearRows.map(row => row.id);

      let evaluations = [];

      // Load saved Regular / Irregular standing.
      if (studentIds.length > 0) {
        const {
          data: evaluationRows,
          error: evaluationError
        } = await supabase
          .from('graduation_evaluations')
          .select('id, student_id, standing, updated_at')
          .in('student_id', studentIds);

        if (evaluationError) {
          return res.status(400).json({
            error: evaluationError.message
          });
        }

        evaluations = evaluationRows || [];
      }

      const evaluationMap = new Map(
        evaluations.map(item => [
          item.student_id,
          item
        ])
      );

      return res.json(
        fourthYearRows.map(row => ({
          ...row,
          evaluation: evaluationMap.get(row.id) || null
        }))
      );

    } catch (error) {
      console.error('Load graduation students error:', error);

      return res.status(500).json({
        error: error.message ||
          'Unable to load graduation students.'
      });
    }
  }
);


// =========================================================
// MANUAL GRADUATION ELIGIBILITY
// PATCH /api/students/:id/graduation-eligibility
// =========================================================

router.patch(
  '/:id/graduation-eligibility',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { eligible } = req.body || {};

      if (typeof eligible !== 'boolean') {
        return res.status(400).json({
          error: '`eligible` must be true or false.'
        });
      }

      const inScope = await authorizeDepartmentScope(req, id);

      if (!inScope) {
        return res.status(
          req.user.role === 'department_chair' ? 403 : 404
        ).json({
          error: 'Student not found or outside your assigned department(s).'
        });
      }

      const student =
        await getStudentProfileForGraduation(id);

      if (!student) {
        return res.status(404).json({
          error: 'Student profile not found.'
        });
      }

      if (
        student.profile_role !== 'student' ||
        student.profile_status !== 'active' ||
        !isFourthYear(student.year_level)
      ) {
        return res.status(400).json({
          error: 'Only active fourth-year students can have graduation eligibility changed.'
        });
      }

      if (student.graduation_status === 'graduated') {
        return res.status(409).json({
          error: 'Graduated students cannot have eligibility changed.'
        });
      }

      const { data, error } = await supabase
        .from('student_profiles')
        .update({
          graduation_eligible: eligible
        })
        .eq('user_id', id)
        .select(`
          user_id,
          graduation_eligible,
          graduation_status,
          graduation_year
        `)
        .maybeSingle();

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          error: 'Student graduation record was not found.'
        });
      }

      return res.json({
        success: true,
        message: eligible
          ? 'Student marked as eligible.'
          : 'Student marked as not eligible.',
        student: data
      });

    } catch (error) {
      console.error('Update graduation eligibility error:', error);

      return res.status(500).json({
        error: error.message ||
          'Unable to update graduation eligibility.'
      });
    }
  }
);


// =========================================================
// SAVE ACADEMIC STANDING
// PUT /api/students/:id/graduation-evaluation
// Only Regular / Irregular is required.
// =========================================================

router.put(
  '/:id/graduation-evaluation',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { standing } = req.body || {};

      if (!['regular', 'irregular'].includes(standing)) {
        return res.status(400).json({
          error: 'Standing must be regular or irregular.'
        });
      }

      const inScope = await authorizeDepartmentScope(req, id);

      if (!inScope) {
        return res.status(
          req.user.role === 'department_chair' ? 403 : 404
        ).json({
          error: 'Student not found or outside your assigned department(s).'
        });
      }

      const student =
        await getStudentProfileForGraduation(id);

      if (!student) {
        return res.status(404).json({
          error: 'Student profile not found.'
        });
      }

      if (
        student.profile_role !== 'student' ||
        student.profile_status !== 'active' ||
        !isFourthYear(student.year_level)
      ) {
        return res.status(400).json({
          error: 'Only active fourth-year students can be updated.'
        });
      }

      if (student.graduation_status === 'graduated') {
        return res.status(409).json({
          error: 'Graduated students cannot be updated.'
        });
      }

      const payload = {
        student_id: id,
        standing,

        // Legacy database fields retained for compatibility.
        curriculum_complete: false,
        clearance_complete: false,
        academic_requirements_complete: false,
        notes: null,

        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('graduation_evaluations')
        .upsert(payload, {
          onConflict: 'student_id'
        })
        .select('id, student_id, standing, updated_at')
        .single();

      if (error) {
        return res.status(400).json({
          error: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Academic standing saved successfully.',
        evaluation: data
      });

    } catch (error) {
      console.error('Save academic standing error:', error);

      return res.status(500).json({
        error: error.message ||
          'Unable to save academic standing.'
      });
    }
  }
);


// =========================================================
// GRADUATE ONE ELIGIBLE STUDENT
// Shared by individual and batch graduation.
// =========================================================

async function graduateEligibleStudent(req, studentId) {
  const inScope = await authorizeDepartmentScope(
    req,
    studentId
  );

  if (!inScope) {
    return {
      success: false,
      error: 'Student not found or outside your assigned department(s).'
    };
  }

  const student =
    await getStudentProfileForGraduation(studentId);

  if (!student) {
    return {
      success: false,
      error: 'Student profile not found.'
    };
  }

  if (
    student.profile_role !== 'student' ||
    student.profile_status !== 'active'
  ) {
    return {
      success: false,
      error: 'This account is not an active student account.'
    };
  }

  if (!isFourthYear(student.year_level)) {
    return {
      success: false,
      error: 'Only fourth-year students can be graduated.'
    };
  }

  // The chairperson must have manually approved eligibility.
  if (student.graduation_eligible !== true) {
    return {
      success: false,
      error: 'Student has not been marked eligible for graduation.'
    };
  }

  if (student.graduation_status === 'graduated') {
    return {
      success: false,
      error: 'Student is already graduated.'
    };
  }

  const graduationYear = new Date().getFullYear();

  // STEP 1: Record graduation.
  const {
    data: updatedStudent,
    error: graduationError
  } = await supabase
    .from('student_profiles')
    .update({
      graduation_status: 'graduated',
      graduation_year: graduationYear
    })
    .eq('user_id', studentId)
    .eq('graduation_eligible', true)
    .select(`
      user_id,
      graduation_eligible,
      graduation_status,
      graduation_year
    `)
    .maybeSingle();

  if (graduationError) {
    return {
      success: false,
      error: graduationError.message
    };
  }

  if (!updatedStudent) {
    return {
      success: false,
      error: 'The student is no longer eligible or their graduation record could not be updated.'
    };
  }

  // STEP 2: Change profile role to alumni.
  const {
    data: updatedProfile,
    error: roleError
  } = await supabase
    .from('profiles')
    .update({
      role: 'alumni'
    })
    .eq('id', studentId)
    .eq('role', 'student')
    .select('id, full_name, email, role')
    .maybeSingle();

  if (roleError || !updatedProfile) {
    // Roll back the graduation fields if the role update fails.
    const { error: rollbackError } = await supabase
      .from('student_profiles')
      .update({
        graduation_status:
          student.graduation_status ?? null,
        graduation_year:
          student.graduation_year ?? null
      })
      .eq('user_id', studentId);

    if (rollbackError) {
      console.error(
        'Graduation rollback failed:',
        rollbackError
      );
    }

    return {
      success: false,
      error: roleError?.message ||
        'Could not change the student role to alumni.'
    };
  }

  // STEP 3: Synchronize users.role.
  const { error: userRoleError } = await supabase
    .from('users')
    .update({
      role: 'alumni'
    })
    .eq('id', studentId);

  if (userRoleError) {
    console.error(
      `Could not synchronize users.role for ${studentId}:`,
      userRoleError.message
    );
  }

  return {
    success: true,
    studentId,
    name: updatedProfile.full_name,
    role: updatedProfile.role,
    graduationYear,
    usersRoleSynchronized: !userRoleError,
    warning: userRoleError
      ? 'Graduation succeeded, but users.role synchronization failed.'
      : null
  };
}


// =========================================================
// GRADUATE ONE STUDENT
// POST /api/students/:id/graduate
// =========================================================

router.post(
  '/:id/graduate',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      if (req.body?.confirm !== true) {
        return res.status(400).json({
          error: 'Graduation confirmation is required.'
        });
      }

      const result = await graduateEligibleStudent(
        req,
        req.params.id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json({
        success: true,
        message: 'Graduation confirmed. The student role is now alumni.',
        student: result
      });

    } catch (error) {
      console.error('Confirm graduation error:', error);

      return res.status(500).json({
        error: error.message ||
          'Unable to confirm graduation.'
      });
    }
  }
);


// =========================================================
// BATCH GRADUATION
// POST /api/students/batch-graduate
//
// Backend independently finds all currently eligible
// fourth-year students within the chairperson's department.
// =========================================================

router.post(
  '/batch-graduate',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      if (req.body?.confirm !== true) {
        return res.status(400).json({
          error: 'Batch graduation confirmation is required.'
        });
      }

      const isChairScoped =
        req.user.role === 'department_chair';

      if (
        isChairScoped &&
        (!req.user.departmentIds ||
          req.user.departmentIds.length === 0)
      ) {
        return res.status(400).json({
          error: 'Your chair account has no department assigned. Contact the dean/admin.'
        });
      }

      // Query all manually eligible active students.
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          year_level,
          status,
          student_profiles!inner (
            user_id,
            department_id,
            graduation_eligible,
            graduation_status
          )
        `)
        .eq('role', 'student')
        .eq('status', 'active')
        .eq('student_profiles.graduation_eligible', true);

      if (isChairScoped) {
        query = query.in(
          'student_profiles.department_id',
          req.user.departmentIds
        );
      }

      const {
        data: candidates,
        error: candidateError
      } = await query;

      if (candidateError) {
        return res.status(400).json({
          error: candidateError.message
        });
      }

      // Keep only fourth-year students who are not already graduated.
      const eligibleCandidates = (candidates || []).filter(
        profileRow => {
          const studentProfile =
            getEmbeddedStudentProfile(profileRow);

          return (
            isFourthYear(profileRow.year_level) &&
            studentProfile?.graduation_eligible === true &&
            studentProfile?.graduation_status !== 'graduated'
          );
        }
      );

      if (eligibleCandidates.length === 0) {
        return res.json({
          success: true,
          message: 'There are no eligible fourth-year students available for graduation.',
          total: 0,
          succeeded: 0,
          failed: 0,
          syncWarnings: 0,
          results: []
        });
      }

      const results = [];

      // Graduate students individually so failures can be reported.
      for (const candidate of eligibleCandidates) {
        try {
          const result = await graduateEligibleStudent(
            req,
            candidate.id
          );

          results.push({
            ...result,
            studentId: candidate.id,
            name:
              result.name ||
              candidate.full_name ||
              'Unnamed student'
          });

        } catch (studentError) {
          results.push({
            studentId: candidate.id,
            name: candidate.full_name || 'Unnamed student',
            success: false,
            error:
              studentError.message ||
              'Unexpected error processing this student.'
          });
        }
      }

      const succeeded = results.filter(
        result => result.success
      ).length;

      const failed = results.length - succeeded;

      const syncWarnings = results.filter(
        result =>
          result.success &&
          result.usersRoleSynchronized === false
      ).length;

      return res.status(200).json({
        success: failed === 0,
        message:
          `${succeeded} student(s) graduated successfully; ${failed} failed.`,
        total: results.length,
        succeeded,
        failed,
        syncWarnings,
        results
      });

    } catch (error) {
      console.error('Batch graduation error:', error);

      return res.status(500).json({
        error: error.message ||
          'Unable to process batch graduation.'
      });
    }
  }
);


// =========================================================
// GET CURRENT LOGGED-IN STUDENT
// GET /api/students/me
// =========================================================

router.get('/me', authenticate, async (req, res) => {
  try {
    const profileId =
      req.user.profileId ||
      req.user.userId;

    if (!profileId) {
      return res.status(401).json({
        error: 'Authenticated user ID is missing.'
      });
    }

    console.log(
      'GET /api/me profileId:',
      profileId
    );

    // GET SHARED PROFILE
    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        id_number,
        status
      `)
      .eq('id', profileId)
      .maybeSingle();

    console.log(
      'GET /api/me profile:',
      profile
    );

    if (profileError) {
      console.error(
        'GET /api/me profile error:',
        profileError
      );

      return res.status(500).json({
        error: profileError.message
      });
    }

    if (!profile) {
      return res.status(404).json({
        error: 'Your profile record could not be found.'
      });
    }

    // Get username from users table.
    const { data: userRow } = await supabase
      .from('users')
      .select('username')
      .eq('id', profile.id)
      .maybeSingle();

    // GET STUDENT-SPECIFIC INFORMATION
    const {
      data: studentProfile,
      error: studentProfileError
    } = await supabase
      .from('student_profiles')
      .select(`
        user_id,
        full_name,
        student_no,
        year_level,
        program,
        gpa,
        academic_standing,
        enrollment_status,
        department_id
      `)
      .eq('user_id', profile.id)
      .maybeSingle();

    console.log(
      'GET /api/me student profile:',
      studentProfile
    );

    if (studentProfileError) {
      console.error(
        'GET /api/me student profile error:',
        studentProfileError
      );

      return res.status(500).json({
        error: studentProfileError.message
      });
    }

    // GET DEPARTMENT
    let departmentName = null;

    if (studentProfile?.department_id) {
      const {
        data: department,
        error: departmentError
      } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', studentProfile.department_id)
        .maybeSingle();

      if (!departmentError && department) {
        departmentName = department.name;
      }
    }

    // STUDENT ID
    const studentNo =
      studentProfile?.student_no ||
      profile.id_number ||
      '';

    return res.json({
      userId: profile.id,

      username: userRow?.username || '',

      fullName:
        profile.full_name ||
        studentProfile?.full_name ||
        '',

      email: profile.email || '',

      idNumber: profile.id_number || '',

      role: profile.role || 'student',

      status: profile.status || '',

      studentNo,

      yearLevel:
        studentProfile?.year_level ?? 0,

      program:
        studentProfile?.program || '',

      gpa:
        studentProfile?.gpa ?? null,

      academicStanding:
        studentProfile?.academic_standing || '—',

      enrollmentStatus:
        studentProfile?.enrollment_status || '—',

      departmentId:
        studentProfile?.department_id || null,

      departmentName,

      departmentNames:
        departmentName ? [departmentName] : [],

      profile,

      studentProfile:
        studentProfile || null
    });

  } catch (error) {
    console.error('GET /api/me ERROR:', error);

    return res.status(500).json({
      error: 'Server error while loading your profile.'
    });
  }
});


// =========================================================
// UPDATE CURRENT LOGGED-IN STUDENT
// PATCH /api/students/me
// =========================================================

router.patch('/me', authenticate, async (req, res) => {
  try {
    console.log('====================================');
    console.log('PATCH /api/me CALLED');
    console.log('JWT USER:', req.user);
    console.log('BODY:', req.body);
    console.log('====================================');

    const profileId =
      req.user.profileId ||
      req.user.userId;

    if (!profileId) {
      return res.status(401).json({
        error: 'Authenticated user ID is missing.'
      });
    }

    const {
      full_name,
      email,
      student_no,
      username
    } = req.body;

    // VALIDATION
    if (
      typeof full_name !== 'string' ||
      !full_name.trim()
    ) {
      return res.status(400).json({
        error: 'Full name is required.'
      });
    }

    if (
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: 'Email address is required.'
      });
    }

    if (
      typeof student_no !== 'string' ||
      !student_no.trim()
    ) {
      return res.status(400).json({
        error: 'Student ID is required.'
      });
    }

    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentNo = student_no.trim();

    // SAVE USERNAME
    if (
      typeof username === 'string' &&
      username.trim()
    ) {
      const cleanUsername = username
        .trim()
        .toLowerCase();

      const { data: taken } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', profileId)
        .maybeSingle();

      if (taken) {
        return res.status(409).json({
          error: 'This username is already taken.'
        });
      }

      const { error: usernameError } = await supabase
        .from('users')
        .update({
          username: cleanUsername
        })
        .eq('id', profileId);

      if (usernameError) {
        return res.status(400).json({
          error: usernameError.message
        });
      }

      await supabase
        .from('profiles')
        .update({
          username: cleanUsername
        })
        .eq('id', profileId);
    }

    // STEP 1: FIND PROFILE
    const {
      data: existingProfile,
      error: profileLookupError
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        id_number,
        status
      `)
      .eq('id', profileId)
      .maybeSingle();

    console.log(
      'Existing public.profiles row:',
      existingProfile
    );

    if (profileLookupError) {
      console.error(
        'Profile lookup error:',
        profileLookupError
      );

      return res.status(500).json({
        error: profileLookupError.message
      });
    }

    if (!existingProfile) {
      return res.status(404).json({
        error: 'Your profile record could not be found.'
      });
    }

    // STEP 2: UPDATE public.profiles
    const {
      data: profileRows,
      error: profileUpdateError
    } = await supabase
      .from('profiles')
      .update({
        full_name: cleanName,
        email: cleanEmail,
        id_number: cleanStudentNo
      })
      .eq('id', profileId)
      .select(`
        id,
        full_name,
        email,
        role,
        id_number,
        status
      `);

    console.log(
      'Updated profiles rows:',
      profileRows
    );

    if (profileUpdateError) {
      console.error(
        'Profile update error:',
        profileUpdateError
      );

      if (profileUpdateError.code === '23505') {
        return res.status(409).json({
          error: 'The email address or Student ID is already being used.'
        });
      }

      return res.status(500).json({
        error: profileUpdateError.message
      });
    }

    if (!profileRows || profileRows.length === 0) {
      return res.status(404).json({
        error: 'The profile could not be updated.'
      });
    }

    const updatedProfile = profileRows[0];

    // STEP 3: FIND STUDENT PROFILE
    const {
      data: existingStudentProfile,
      error: studentLookupError
    } = await supabase
      .from('student_profiles')
      .select(`
        user_id,
        full_name,
        student_no,
        year_level,
        program,
        gpa,
        academic_standing,
        enrollment_status,
        department_id
      `)
      .eq('user_id', profileId)
      .maybeSingle();

    console.log(
      'Existing student_profiles row:',
      existingStudentProfile
    );

    if (studentLookupError) {
      console.error(
        'Student profile lookup error:',
        studentLookupError
      );

      return res.status(500).json({
        error: studentLookupError.message
      });
    }

    // STEP 4: UPDATE STUDENT PROFILE IF IT EXISTS
    let updatedStudentProfile =
      existingStudentProfile;

    if (existingStudentProfile) {
      const {
        data: studentRows,
        error: studentUpdateError
      } = await supabase
        .from('student_profiles')
        .update({
          full_name: cleanName,
          student_no: cleanStudentNo
        })
        .eq('user_id', profileId)
        .select(`
          user_id,
          full_name,
          student_no,
          year_level,
          program,
          gpa,
          academic_standing,
          enrollment_status,
          department_id
        `);

      console.log(
        'Updated student_profiles rows:',
        studentRows
      );

      if (studentUpdateError) {
        console.error(
          'Student profile update error:',
          studentUpdateError
        );

        if (studentUpdateError.code === '23505') {
          return res.status(409).json({
            error: 'The Student ID is already being used.'
          });
        }

        return res.status(500).json({
          error: studentUpdateError.message
        });
      }

      updatedStudentProfile =
        studentRows?.[0] ?? null;
    }

    // STEP 5: RETURN SUCCESS
    return res.status(200).json({
      success: true,

      message: 'Student profile updated successfully.',

      userId: updatedProfile.id,

      fullName: updatedProfile.full_name,

      email: updatedProfile.email,

      idNumber: updatedProfile.id_number || '',

      studentNo:
        updatedStudentProfile?.student_no ||
        updatedProfile.id_number ||
        '',

      profile: updatedProfile,

      studentProfile: updatedStudentProfile
    });

  } catch (error) {
    console.error('PATCH /api/me ERROR:', error);

    return res.status(500).json({
      error:
        error?.message ||
        'Server error while updating your profile.'
    });
  }
});

module.exports = router;
