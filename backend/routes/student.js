const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only department chairs (or dean/admin) can view/manage student approvals
function requireChairRole(req, res, next) {
  const allowedRoles = ['department_chair', 'dean', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

// GET all student profiles with their student_profiles info.
// Chairs only see students in one of their assigned departments (from
// the JWT's `departmentIds` array — a chair can cover more than one
// department, e.g. BSED-Math and BSED-English at once). Scoping is by
// department_id (a real foreign key), not the free-text `program`
// column, since that field has no validation and drifts out of sync
// (e.g. "BEEd" vs "BEED") — department_id is always reliable.
router.get('/', authenticate, requireChairRole, async (req, res) => {
  const isChairScoped = req.user.role === 'department_chair';

  if (isChairScoped && (!req.user.departmentIds || req.user.departmentIds.length === 0)) {
    return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
  }

  // !inner is required when filtering on the embedded relation's column —
  // without it, PostgREST filters the embedded array's *contents* but
  // still returns the parent profile row even when nothing matches,
  // which would leak students from other departments into the response.
  let query = supabase
    .from('profiles')
    .select(
      isChairScoped
        ? `id, full_name, email, status, created_at, student_profiles!inner ( student_no, program, department_id, year_level )`
        : `id, full_name, email, status, created_at, student_profiles ( student_no, program, department_id, year_level )`
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (isChairScoped) {
    query = query.in('student_profiles.department_id', req.user.departmentIds);
  }

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH a single student's status: 'active' | 'rejected'.
// Chairs can only act on students in one of their assigned departments.
router.patch('/:id/status', authenticate, requireChairRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  if (req.user.role === 'department_chair') {
    if (!req.user.departmentIds || req.user.departmentIds.length === 0) {
      return res.status(400).json({ error: 'Your chair account has no department assigned. Contact the dean/admin.' });
    }

    // Query student_profiles directly by user_id instead of embedding
    // through profiles. student_profiles.user_id has no UNIQUE constraint
    // (only `id` [pkey] and `student_no` are unique), so PostgREST can't
    // infer a one-to-one relationship and would return student_profiles
    // as an ARRAY when embedded via `profiles.select('student_profiles(...)')`.
    // Reading `.department_id` off that array silently returns undefined,
    // which made every chair's departmentIds.includes(undefined) check
    // fail — a 403 for every student, regardless of actual department.
    const { data: studentProfile, error: fetchError } = await supabase
      .from('student_profiles')
      .select('department_id')
      .eq('user_id', id)
      .single();

    if (fetchError || !studentProfile) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const studentDepartmentId = studentProfile.department_id;
    if (!req.user.departmentIds.includes(studentDepartmentId)) {
      return res.status(403).json({ error: 'You can only manage students in your own department(s).' });
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// =========================================================
// GRADUATION MANAGEMENT
// Requires these columns in student_profiles:
// graduation_eligible BOOLEAN
// graduation_status TEXT
// graduation_year INTEGER
// =========================================================

async function getStudentProfileForGraduation(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select(`
      user_id,
      department_id,
      year_level,
      graduation_eligible,
      graduation_status,
      graduation_year
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

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

// GET /api/students/graduation
router.get('/graduation', authenticate, requireChairRole, async (req, res) => {
  try {
    const isChairScoped = req.user.role === 'department_chair';

    if (
      isChairScoped &&
      (!req.user.departmentIds || req.user.departmentIds.length === 0)
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
               student_no, program, department_id, year_level,
               graduation_eligible, graduation_status, graduation_year
             )`
          : `id, full_name, email, status, created_at,
             student_profiles (
               student_no, program, department_id, year_level,
               graduation_eligible, graduation_status, graduation_year
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
      return res.status(400).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (error) {
    console.error('Load graduation students error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to load graduation students.'
    });
  }
});

// PATCH /api/students/:id/graduation-eligibility
// Manually mark a student eligible or not eligible.
router.patch(
  '/:id/graduation-eligibility',
  authenticate,
  requireChairRole,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { eligible } = req.body;

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

      const student = await getStudentProfileForGraduation(id);

      if (!student) {
        return res.status(404).json({
          error: 'Student profile not found.'
        });
      }

      if (student.graduation_status === 'graduated') {
        return res.status(409).json({
          error: 'Graduated students cannot have eligibility changed.'
        });
      }

      const { data, error } = await supabase
        .from('student_profiles')
        .update({ graduation_eligible: eligible })
        .eq('user_id', id)
        .select(`
          user_id,
          graduation_eligible,
          graduation_status,
          graduation_year
        `)
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({
        success: true,
        student: data
      });
    } catch (error) {
      console.error('Update graduation eligibility error:', error);

      return res.status(500).json({
        error: error.message || 'Unable to update graduation eligibility.'
      });
    }
  }
);

// POST /api/students/:id/graduate
// Confirm graduation for an eligible fourth-year student.


router.post('/:id/graduate', authenticate, requireChairRole, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body?.confirm !== true) {
      return res.status(400).json({
        error: 'Graduation confirmation is required.'
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

    const student = await getStudentProfileForGraduation(id);

    if (!student) {
      return res.status(404).json({
        error: 'Student profile not found.'
      });
    }

    const yearLevel = String(student.year_level ?? '')
      .trim()
      .toLowerCase();

    if (!['4', '4th', 'fourth', 'fourth year', '4th year'].includes(yearLevel)) {
      return res.status(400).json({
        error: 'Only fourth-year students can be graduated through this action.'
      });
    }

    if (student.graduation_status === 'graduated') {
      return res.status(409).json({
        error: 'This student is already marked as graduated.'
      });
    }

    const graduationYear = new Date().getFullYear();

    // STEP 1: Update the student's graduation information.
    const { data: updatedStudent, error: graduationError } = await supabase
      .from('student_profiles')
      .update({
        graduation_eligible: true,
        graduation_status: 'graduated',
        graduation_year: graduationYear
      })
      .eq('user_id', id)
      .neq('graduation_status', 'graduated')
      .select(`
        user_id,
        graduation_eligible,
        graduation_status,
        graduation_year
      `)
      .maybeSingle();

    if (graduationError) {
      return res.status(400).json({
        error: graduationError.message
      });
    }

    if (!updatedStudent) {
      return res.status(409).json({
        error: 'The student may already be graduated or their record could not be updated.'
      });
    }

    // STEP 2: Change the shared profile role to alumni.
    const { data: updatedProfile, error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'alumni' })
      .eq('id', id)
      .eq('role', 'student')
      .select('id, full_name, email, role')
      .maybeSingle();

    if (roleError || !updatedProfile) {
      // Restore the graduation information if the profile role update fails.
      const { error: rollbackError } = await supabase
        .from('student_profiles')
        .update({
          graduation_eligible: student.graduation_eligible ?? false,
          graduation_status: student.graduation_status ?? null,
          graduation_year: student.graduation_year ?? null
        })
        .eq('user_id', id);

      if (rollbackError) {
        console.error('Graduation rollback failed:', rollbackError);
      }

      return res.status(500).json({
        error: roleError?.message ||
          'Could not update the student role to alumni. Graduation changes were rolled back where possible.'
      });
    }

    // STEP 3: Synchronize the users table.
    // The profiles table remains the authoritative role source for login.
    const { error: userRoleError } = await supabase
      .from('users')
      .update({ role: 'alumni' })
      .eq('id', id);

    if (userRoleError) {
      console.error(
        'Graduation succeeded, but users.role synchronization failed:',
        userRoleError.message
      );
    }

    return res.json({
      success: true,
      message: userRoleError
        ? 'Graduation confirmed. The profile role is alumni, but the users table role needs synchronization.'
        : 'Graduation confirmed. The student role is now alumni.',
      student: updatedStudent,
      profile: updatedProfile,
      usersRoleSynchronized: !userRoleError
    });
  } catch (error) {
    console.error('Confirm graduation error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to confirm graduation.'
    });
  }
});



router.post('/batch-graduate', authenticate, requireChairRole, async (req, res) => {
  try {
    if (req.body?.confirm !== true) {
      return res.status(400).json({
        error: 'Batch graduation confirmation is required.'
      });
    }

    const studentIds = req.body?.studentIds;

    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      studentIds.some(id => typeof id !== 'string' || !id.trim())
    ) {
      return res.status(400).json({
        error: 'Provide a non-empty array of valid student IDs.'
      });
    }

    const uniqueIds = [...new Set(studentIds.map(id => id.trim()))];

    if (uniqueIds.length > 200) {
      return res.status(400).json({
        error: 'A maximum of 200 students can be processed per batch.'
      });
    }

    const results = [];

    for (const studentId of uniqueIds) {
      try {
        const inScope = await authorizeDepartmentScope(req, studentId);

        if (!inScope) {
          results.push({
            studentId,
            success: false,
            error: 'Student not found or outside your assigned department(s).'
          });
          continue;
        }

        const student = await getStudentProfileForGraduation(studentId);

        if (!student) {
          results.push({
            studentId,
            success: false,
            error: 'Student profile not found.'
          });
          continue;
        }

        const yearLevel = String(student.year_level ?? '')
          .trim()
          .toLowerCase();

        if (!['4', '4th', 'fourth', 'fourth year', '4th year'].includes(yearLevel)) {
          results.push({
            studentId,
            success: false,
            error: 'Only fourth-year students can be graduated.'
          });
          continue;
        }

        if (student.graduation_status === 'graduated') {
          results.push({
            studentId,
            success: false,
            error: 'Student is already graduated.'
          });
          continue;
        }

        // STEP 1: Update graduation information.
        const { data: updatedStudent, error: graduationError } = await supabase
          .from('student_profiles')
          .update({
            graduation_eligible: true,
            graduation_status: 'graduated',
            graduation_year: new Date().getFullYear()
          })
          .eq('user_id', studentId)
          .neq('graduation_status', 'graduated')
          .select('user_id, graduation_eligible, graduation_status, graduation_year')
          .maybeSingle();

        if (graduationError || !updatedStudent) {
          results.push({
            studentId,
            success: false,
            error: graduationError?.message ||
              'Could not update graduation status.'
          });
          continue;
        }

        // STEP 2: Update the shared profile role.
        const { data: updatedProfile, error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'alumni' })
          .eq('id', studentId)
          .eq('role', 'student')
          .select('id, full_name, email, role')
          .maybeSingle();

        if (roleError || !updatedProfile) {
          const { error: rollbackError } = await supabase
            .from('student_profiles')
            .update({
              graduation_eligible: student.graduation_eligible ?? false,
              graduation_status: student.graduation_status ?? null,
              graduation_year: student.graduation_year ?? null
            })
            .eq('user_id', studentId);

          if (rollbackError) {
            console.error(
              'Batch graduation rollback failed:',
              rollbackError
            );
          }

          results.push({
            studentId,
            success: false,
            error: roleError?.message ||
              'Could not change the profile role to alumni.'
          });
          continue;
        }

        // STEP 3: Synchronize users.role.
        const { error: userRoleError } = await supabase
          .from('users')
          .update({ role: 'alumni' })
          .eq('id', studentId);

        if (userRoleError) {
          console.error(
            `Could not synchronize users.role for ${studentId}:`,
            userRoleError.message
          );
        }

        results.push({
          studentId,
          success: true,
          name: updatedProfile.full_name,
          role: updatedProfile.role,
          graduationYear: updatedStudent.graduation_year,
          usersRoleSynchronized: !userRoleError,
          warning: userRoleError
            ? 'Graduation succeeded, but users.role synchronization failed.'
            : null
        });
      } catch (studentError) {
        results.push({
          studentId,
          success: false,
          error: studentError.message ||
            'Unexpected error processing this student.'
        });
      }
    }

    const succeeded = results.filter(result => result.success).length;
    const failed = results.length - succeeded;
    const syncWarnings = results.filter(
      result => result.success && result.usersRoleSynchronized === false
    ).length;

    return res.status(200).json({
      success: failed === 0,
      message: `${succeeded} student(s) graduated successfully; ${failed} failed.`,
      succeeded,
      failed,
      syncWarnings,
      results
    });
  } catch (error) {
    console.error('Batch graduation error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to process batch graduation.'
    });
  }
});


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

    // =====================================================
    // GET SHARED PROFILE
    // SAME public.profiles TABLE USED BY DEAN AND CHAIR
    // =====================================================
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
        error:
          'Your profile record could not be found.'
      });
    }

        // Kuhaa ang username gikan sa users table
    const { data: userRow } = await supabase
      .from('users')
      .select('username')
      .eq('id', profile.id)
      .maybeSingle();

    // =====================================================
    // GET STUDENT-SPECIFIC INFORMATION
    // =====================================================
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

    if (
      studentProfileError &&
      studentProfileError.code !== 'PGRST116'
    ) {
      console.error(
        'GET /api/me student profile error:',
        studentProfileError
      );

      return res.status(500).json({
        error:
          studentProfileError.message
      });
    }

    // =====================================================
    // DEPARTMENT
    // =====================================================
    let departmentName = null;

    if (studentProfile?.department_id) {

      const {
        data: department,
        error: departmentError
      } = await supabase
        .from('departments')
        .select('id, name')
        .eq(
          'id',
          studentProfile.department_id
        )
        .maybeSingle();

      if (
        !departmentError &&
        department
      ) {
        departmentName =
          department.name;
      }
    }

    // =====================================================
    // STUDENT ID
    //
    // Student-specific value first:
    // student_profiles.student_no
    //
    // Fallback:
    // profiles.id_number
    // =====================================================
    const studentNo =
      studentProfile?.student_no ||
      profile.id_number ||
      '';

    // =====================================================
    // RESPONSE
    // =====================================================
    res.json({

      // Shared profile information
      userId:
        profile.id,

      username: userRow?.username || '',

      fullName:
        profile.full_name ||
        studentProfile?.full_name ||
        '',

      email:
        profile.email ||
        '',

      idNumber:
        profile.id_number ||
        '',

      role:
        profile.role ||
        'student',

      status:
        profile.status ||
        '',

      // Student information
      studentNo,

      yearLevel:
        studentProfile?.year_level ??
        0,

      program:
        studentProfile?.program ||
        '',

      gpa:
        studentProfile?.gpa ??
        null,

      academicStanding:
        studentProfile?.academic_standing ||
        '—',

      enrollmentStatus:
        studentProfile?.enrollment_status ||
        '—',

      departmentId:
        studentProfile?.department_id ||
        null,

      departmentName,

      departmentNames:
        departmentName
          ? [departmentName]
          : [],

      // Keep nested information too
      profile,

      studentProfile:
        studentProfile || null
    });

  } catch (error) {

    console.error(
      'GET /api/me ERROR:',
      error
    );

    res.status(500).json({
      error:
        'Server error while loading your profile.'
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

    // =====================================================
    // USE THE PROFILE ID FROM THE JWT
    // profiles.id = auth.users.id = public.users.id
    // =====================================================
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

    // =====================================================
    // VALIDATE
    // =====================================================
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

    const cleanName =
      full_name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanStudentNo =
      student_no.trim();

    // =====================================================
    // SAVE USERNAME (users table = source of truth)
    // =====================================================
    if (typeof username === 'string' && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();

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
        .update({ username: cleanUsername })
        .eq('id', profileId);

      if (usernameError) {
        return res.status(400).json({
          error: usernameError.message
        });
      }

      await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', profileId);
    }

    // =====================================================
    // STEP 1
    // FIND PROFILE
    //
    // IMPORTANT:
    // Use maybeSingle(), NOT single()
    // =====================================================
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
        error:
          profileLookupError.message
      });
    }

    if (!existingProfile) {
      return res.status(404).json({
        error:
          'Your profile record could not be found.'
      });
    }

    // =====================================================
    // STEP 2
    // UPDATE public.profiles
    //
    // DO NOT USE .single()
    // =====================================================
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

      if (
        profileUpdateError.code ===
        '23505'
      ) {
        return res.status(409).json({
          error:
            'The email address or Student ID is already being used.'
        });
      }

      return res.status(500).json({
        error:
          profileUpdateError.message
      });
    }

    if (
      !profileRows ||
      profileRows.length === 0
    ) {
      return res.status(404).json({
        error:
          'The profile could not be updated.'
      });
    }

    const updatedProfile =
      profileRows[0];

    // =====================================================
    // STEP 3
    // FIND STUDENT PROFILE
    //
    // IMPORTANT:
    // Use maybeSingle(), NOT single()
    // =====================================================
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
        error:
          studentLookupError.message
      });
    }

    // =====================================================
    // STEP 4
    // UPDATE STUDENT-SPECIFIC PROFILE ONLY IF IT EXISTS
    // =====================================================
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

        if (
          studentUpdateError.code ===
          '23505'
        ) {
          return res.status(409).json({
            error:
              'The Student ID is already being used.'
          });
        }

        return res.status(500).json({
          error:
            studentUpdateError.message
        });
      }

      updatedStudentProfile =
        studentRows?.[0] ?? null;
    }

    // =====================================================
    // STEP 5
    // RETURN SUCCESS
    // =====================================================
    return res.status(200).json({

      success: true,

      message:
        'Student profile updated successfully.',

      userId:
        updatedProfile.id,

      fullName:
        updatedProfile.full_name,

      email:
        updatedProfile.email,

      idNumber:
        updatedProfile.id_number || '',

      studentNo:
        updatedStudentProfile?.student_no ||
        updatedProfile.id_number ||
        '',

      profile:
        updatedProfile,

      studentProfile:
        updatedStudentProfile
    });

  } catch (error) {

    console.error(
      'PATCH /api/me ERROR:',
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        'Server error while updating your profile.'
    });
  }
});
module.exports = router;