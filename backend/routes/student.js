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