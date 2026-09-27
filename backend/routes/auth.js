const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

console.log('✅ AUTH.JS LOADED:', __filename);

// Exact mapping from frontend program codes to database UUIDs & names
const PROGRAM_TO_DEPARTMENT = {
  'BEEd': {
    id: '41fffef4-b5fc-4bdf-8a30-1a53097113c7',
    name: 'Bachelor of Elementary Education Program',
  },
  'BTLEd': {
    id: '428c2fc6-cca9-49ae-88c7-1c74232d2e30',
    name: 'Bachelor of Technology and Livelihood Education Program',
  },
  'BSEd-Math': {
    id: '46bb2177-22f3-43d1-9e01-de0964d539b3',
    name: 'Bachelor of Secondary Education Major in Mathematics & English Program',
  },
  'BSEd-English': {
    id: '46bb2177-22f3-43d1-9e01-de0964d539b3',
    name: 'Bachelor of Secondary Education Major in Mathematics & English Program',
  },
};

// =========================================================
// ATOMIC REGISTRATION ROUTE
// =========================================================
router.post('/register', async (req, res) => {
  let createdAuthUserId = null;
  let createdPublicUserId = null;
  let createdProfileId = null;
  let createdRoleProfileTable = null;

  try {
    const {
      username,
      password,
      role,
      email,
      full_name,
      id_number,
      department,
      status,
      graduation_year,
    } = req.body;

    // Phase 1: Pre-validation
    if (!username || !password || !role || !full_name || !id_number || !email) {
      return res.status(400).json({
        success: false,
        error: 'All required fields (Username, Password, Role, Full Name, ID Number, Email) must be filled.',
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFullName = full_name.trim();
    const trimmedIdNumber = id_number.trim();
    const programCode = department?.trim() || null;
    const accountStatus = status || 'pending';

    const allowedRoles = ['student', 'faculty', 'staff', 'alumni', 'dean', 'admin'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid role selected. Allowed roles: ${allowedRoles.join(', ')}.`,
      });
    }

    if (!/^\d+$/.test(trimmedIdNumber)) {
      return res.status(400).json({
        success: false,
        error: 'ID number must contain digits only.',
      });
    }

    if (role === 'student' && trimmedIdNumber.length !== 7) {
      return res.status(400).json({
        success: false,
        error: 'Student ID number must contain exactly 7 digits.',
      });
    }
    if (role === 'alumni' && trimmedIdNumber.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Alumni ID number must contain exactly 8 digits.',
      });
    }
    if (role === 'faculty' && trimmedIdNumber.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Faculty ID number must contain exactly 6 digits.',
      });
    }

    let parsedGraduationYear = null;
    if (role === 'alumni') {
      if (!graduation_year) {
        return res.status(400).json({
          success: false,
          error: 'Graduation year is required for alumni registration.',
        });
      }
      parsedGraduationYear = parseInt(graduation_year, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(parsedGraduationYear) || parsedGraduationYear < 1900 || parsedGraduationYear > currentYear + 1) {
        return res.status(400).json({
          success: false,
          error: `Please enter a valid graduation year (1900–${currentYear + 1}).`,
        });
      }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    let resolvedDepartmentId = null;
    if (programCode) {
      const mapped = PROGRAM_TO_DEPARTMENT[programCode];
      if (mapped) {
        resolvedDepartmentId = mapped.id;
      } else {
        const { data: deptRow } = await supabase
          .from('departments')
          .select('id')
          .or(`id.eq.${programCode},name.ilike.%${programCode}%`)
          .maybeSingle();

        if (deptRow) {
          resolvedDepartmentId = deptRow.id;
        }
      }

      if (!resolvedDepartmentId) {
        return res.status(400).json({
          success: false,
          error: 'Could not match your selected program to a valid department in the system.',
        });
      }
    }

    if (role === 'student' && !resolvedDepartmentId) {
      return res.status(400).json({
        success: false,
        error: 'A valid department is required to create a student profile.',
      });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'This username is already taken. Please choose another.' });
    }

    const { data: existingEmailUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingEmailUser) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id_number', trimmedIdNumber)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({ success: false, error: 'This ID number is already registered.' });
    }

    // Phase 2: Atomic writes
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      return res.status(400).json({
        success: false,
        error: authError?.message || 'Unable to create the authentication account.',
      });
    }
    createdAuthUserId = authData.user.id;

    const password_hash = await bcrypt.hash(password, 10);
    const { data: createdUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: createdAuthUserId,
          username: normalizedUsername,
          password_hash,
          role,
          email: normalizedEmail,
        },
      ])
      .select()
      .single();

    if (userError || !createdUser) {
      throw new Error(`Failed to create application user record: ${userError?.message}`);
    }
    createdPublicUserId = createdUser.id;

    const { data: createdProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: createdAuthUserId,
          full_name: trimmedFullName,
          email: normalizedEmail,
          role: role === 'faculty' ? 'faculty' : role,
          program: programCode,
          id_number: trimmedIdNumber,
          department: programCode,
          status: accountStatus,
        },
      ])
      .select()
      .single();

    if (profileError || !createdProfile) {
      throw new Error(`Failed to create base profile record: ${profileError?.message}`);
    }
    createdProfileId = createdProfile.id;

    if (role === 'student') {
      createdRoleProfileTable = 'student_profiles';
      const { error: studentErr } = await supabase
        .from('student_profiles')
        .insert([
          {
            user_id: createdAuthUserId,
            department_id: resolvedDepartmentId,
            full_name: trimmedFullName,
            student_no: trimmedIdNumber,
            year_level: 1,
            program: programCode,
            gpa: 0.00,
            academic_standing: 'Good Standing',
            enrollment_status: 'Active',
          },
        ]);
      if (studentErr) throw new Error(`Failed to create student profile: ${studentErr.message}`);
    } else if (role === 'faculty') {
      createdRoleProfileTable = 'faculty_profiles';
      const { error: facultyErr } = await supabase
        .from('faculty_profiles')
        .insert([
          {
            user_id: createdAuthUserId,
            department_id: resolvedDepartmentId,
            full_name: trimmedFullName,
            contact_email: normalizedEmail,
            status: 'Active',
          },
        ]);
      if (facultyErr) throw new Error(`Failed to create faculty profile: ${facultyErr.message}`);
    } else if (role === 'alumni') {
      createdRoleProfileTable = 'alumni_profiles';
      const { error: alumniErr } = await supabase
        .from('alumni_profiles')
        .insert([
          {
            user_id: createdAuthUserId,
            department_id: resolvedDepartmentId,
            full_name: trimmedFullName,
            graduation_year: parsedGraduationYear,
            program: programCode,
            contact_email: normalizedEmail,
            employment_status: 'Unemployed',
            tracer_completed: false,
          },
        ]);
      if (alumniErr) throw new Error(`Failed to create alumni profile: ${alumniErr.message}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please wait for department approval.',
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
      },
      profile: createdProfile,
    });
  } catch (error) {
    console.error('Registration failed. Executing atomic rollback...', error.message);

    try {
      if (createdRoleProfileTable && createdAuthUserId) {
        await supabase.from(createdRoleProfileTable).delete().eq('user_id', createdAuthUserId);
      }
      if (createdProfileId) {
        await supabase.from('profiles').delete().eq('id', createdProfileId);
      }
      if (createdPublicUserId) {
        await supabase.from('users').delete().eq('id', createdPublicUserId);
      }
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      console.log('Rollback completed. No orphaned records remain.');
    } catch (cleanupErr) {
      console.error('Rollback cleanup error:', cleanupErr);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed and changes were rolled back. Please try again.',
    });
  }
});

// =========================================================
// LOGIN
// =========================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required.'
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid username or password.'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid username or password.'
      });
    }

    let fullName = normalizedUsername;
    let idNumber = '';
    let profileId = null;
    let profileStatus = null;
    let department = null;
    let profileEmail = user.email || '';

    // =====================================================
    // FIND PROFILE USING EMAIL
    // =====================================================
    if (user.email) {
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, email, id_number, status, department, role'
          )
          .eq('email', user.email.trim().toLowerCase())
          .maybeSingle();

      if (profileError) {
        console.error(
          'Profile lookup error:',
          profileError
        );

        return res.status(500).json({
          error: 'Unable to load your profile.'
        });
      }

      if (profile) {
        profileId = profile.id;
        fullName =
          profile.full_name || normalizedUsername;
        idNumber =
          profile.id_number || '';
        profileStatus =
          profile.status;
        department =
          profile.department || null;
        profileEmail =
          profile.email || user.email || '';
      }
    }

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================
    if (profileStatus === 'pending') {
      return res.status(403).json({
        error:
          'Your account is pending approval from your department chair.'
      });
    }

    if (profileStatus === 'rejected') {
      return res.status(403).json({
        error:
          'Your registration was not approved. Please contact your department chair.'
      });
    }

    if (profileStatus === 'inactive') {
      return res.status(403).json({
        error:
          'Your account is currently inactive.'
      });
    }

    // =====================================================
    // DEPARTMENT INFORMATION
    // =====================================================
    const departmentIds =
      user.department_ids ?? [];

    let departmentNames = [];

    if (departmentIds.length > 0) {
      const { data: depRows } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      departmentNames = (depRows ?? []).map(
        (d) => d.name
      );
    }

    // =====================================================
    // CREATE JWT
    // =====================================================
    const token = jwt.sign(
      {
        userId: user.id,
        profileId,
        username: user.username,
        role: user.role,
        fullName,
        idNumber,
        email: profileEmail,
        department,
        alumniId: user.alumni_id ?? null,
        departmentIds,
        departmentNames
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    // =====================================================
    // LOGIN RESPONSE
    // =====================================================
    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        profileId,
        username: user.username,
        role: user.role,
        fullName,
        idNumber,
        email: profileEmail,
        department
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// =========================================================
// GET CURRENT AUTHENTICATED USER / PROFILE
// =========================================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const jwtUsername = req.user?.username;
    const jwtEmail = req.user?.email;
    const jwtUserId = req.user?.userId;

    let currentUser = null;

    // 1. Username
    if (jwtUsername) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq(
          'username',
          jwtUsername.trim().toLowerCase()
        )
        .maybeSingle();

      if (data) {
        currentUser = data;
      }
    }

    // 2. User ID
    if (!currentUser && jwtUserId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', jwtUserId)
        .maybeSingle();

      if (data) {
        currentUser = data;
      }
    }

    // 3. Email
    if (!currentUser && jwtEmail) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq(
          'email',
          jwtEmail.trim().toLowerCase()
        )
        .maybeSingle();

      if (data) {
        currentUser = data;
      }
    }

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error:
          'Your user account could not be found.'
      });
    }

    // Find matching profile
    let profile = null;

    const { data: profileById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileById) {
      profile = profileById;
    }

    if (!profile && currentUser.email) {
      const { data: profileByEmail } =
        await supabase
          .from('profiles')
          .select('*')
          .eq(
            'email',
            currentUser.email.trim().toLowerCase()
          )
          .maybeSingle();

      if (profileByEmail) {
        profile = profileByEmail;
      }
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error:
          'Your profile record could not be found.'
      });
    }

    return res.json({
      success: true,
      user: currentUser,
      profile
    });

  } catch (error) {
    console.error(
      'GET /me ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        'Unable to load your profile.'
    });
  }
});

// =========================================================
// UPDATE CURRENT USER'S PERSONAL INFORMATION
// =========================================================
router.put('/profile', authenticate, async (req, res) => {
  try {
    const jwtUserId = req.user?.userId;
    const jwtUsername = req.user?.username;
    const jwtEmail = req.user?.email;

    const { full_name, email } = req.body;

    const trimmedName =
      String(full_name || '').trim();

    const trimmedEmail =
      String(email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({
        success: false,
        error: 'Full Name and Email are required.'
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    let currentUser = null;

    if (jwtUsername) {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, username, email, role, department_ids, alumni_id'
        )
        .eq(
          'username',
          jwtUsername.trim().toLowerCase()
        )
        .maybeSingle();

      if (error) {
        console.error('User lookup by username error:', error);
      }
      if (data) currentUser = data;
    }

    if (!currentUser && jwtUserId) {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, username, email, role, department_ids, alumni_id'
        )
        .eq('id', jwtUserId)
        .maybeSingle();

      if (error) {
        console.error('User lookup by ID error:', error);
      }
      if (data) currentUser = data;
    }

    if (!currentUser && jwtEmail) {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, username, email, role, department_ids, alumni_id'
        )
        .eq(
          'email',
          jwtEmail.trim().toLowerCase()
        )
        .maybeSingle();

      if (error) {
        console.error('User lookup by email error:', error);
      }
      if (data) currentUser = data;
    }

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Your account could not be found in the system.'
      });
    }

    let profile = null;

    const { data: profileById, error: profileIdError } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (profileIdError) {
      console.error('Profile lookup by ID error:', profileIdError);
    }
    if (profileById) profile = profileById;

    if (!profile && currentUser.email) {
      const {
        data: profileByEmail,
        error: profileEmailError
      } = await supabase
        .from('profiles')
        .select('*')
        .eq(
          'email',
          currentUser.email.trim().toLowerCase()
        )
        .maybeSingle();

      if (profileEmailError) {
        console.error('Profile lookup by email error:', profileEmailError);
      }
      if (profileByEmail) profile = profileByEmail;
    }

    if (!profile && jwtEmail) {
      const {
        data: profileByJwtEmail,
        error: profileJwtEmailError
      } = await supabase
        .from('profiles')
        .select('*')
        .eq(
          'email',
          jwtEmail.trim().toLowerCase()
        )
        .maybeSingle();

      if (profileJwtEmailError) {
        console.error('Profile JWT email lookup error:', profileJwtEmailError);
      }
      if (profileByJwtEmail) profile = profileByJwtEmail;
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Your profile record could not be found.'
      });
    }

    const {
      data: duplicateUser,
      error: duplicateUserError
    } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .neq('id', currentUser.id)
      .maybeSingle();

    if (duplicateUserError) {
      return res.status(500).json({
        success: false,
        error: duplicateUserError.message
      });
    }

    if (duplicateUser) {
      return res.status(409).json({
        success: false,
        error: 'This email address is already being used by another account.'
      });
    }

    const {
      data: duplicateProfile,
      error: duplicateProfileError
    } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', trimmedEmail)
      .neq('id', profile.id)
      .maybeSingle();

    if (duplicateProfileError) {
      return res.status(500).json({
        success: false,
        error: duplicateProfileError.message
      });
    }

    if (duplicateProfile) {
      return res.status(409).json({
        success: false,
        error: 'This email address is already being used by another account.'
      });
    }

    const {
      data: updatedProfile,
      error: profileUpdateError
    } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
        email: trimmedEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select(
        'id, full_name, email, role, id_number, department, status, username'
      )
      .single();

    if (profileUpdateError) {
      return res.status(400).json({
        success: false,
        error: profileUpdateError.message
      });
    }

    const {
      error: usersUpdateError
    } = await supabase
      .from('users')
      .update({
        email: trimmedEmail
      })
      .eq('id', currentUser.id);

    if (usersUpdateError) {
      await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      return res.status(400).json({
        success: false,
        error: usersUpdateError.message
      });
    }

    if (currentUser.role === 'faculty') {
      await supabase
        .from('faculty_profiles')
        .update({
          full_name: trimmedName,
          contact_email: trimmedEmail
        })
        .eq('user_id', currentUser.id);
    }

    if (currentUser.role === 'student') {
      await supabase
        .from('student_profiles')
        .update({
          full_name: trimmedName
        })
        .eq('user_id', currentUser.id);
    }

    if (currentUser.role === 'alumni') {
      await supabase
        .from('alumni_profiles')
        .update({
          full_name: trimmedName,
          contact_email: trimmedEmail
        })
        .eq('user_id', currentUser.id);
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updatedProfile,
      user: {
        id: currentUser.id,
        profileId: updatedProfile.id,
        username: currentUser.username,
        role: currentUser.role,
        fullName: updatedProfile.full_name,
        email: updatedProfile.email,
        idNumber: updatedProfile.id_number || '',
        department: updatedProfile.department || null
      }
    });

  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile.'
    });
  }
});

// =========================================================
// FORGOT PASSWORD
// =========================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body;
    const trimmedUsername = username?.trim().toLowerCase();
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedUsername || !trimmedEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your username and email address.',
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', trimmedUsername)
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (userError) {
      console.error('Account lookup error:', userError);
      return res.status(500).json({
        success: false,
        error: 'Unable to process request. Please try again later.',
      });
    }

    if (user) {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`;
      await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo: resetUrl });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account matches those details, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    });
  }
});

// =========================================================
// SYNC PASSWORD AFTER RECOVERY
// =========================================================
router.post('/sync-reset-password', async (req, res) => {
  try {
    const { accessToken, password } = req.body;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Password reset session is missing or expired.',
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!\%*?&.#_-]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Your password needs at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.',
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Your password reset link is invalid or has expired.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .or(`id.eq.${user.id},email.eq.${user.email}`);

    if (updateError) {
      console.error('Password sync error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Could not synchronize password with your account.',
      });
    }

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('SYNC RESET PASSWORD ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating your password.',
    });
  }
});

// =========================================================
// DIRECTORY & COUNTS
// =========================================================
router.get('/faculty', async (req, res) => {
  try {
    // 1. Fetch active faculty, department chairs, and deans from public.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, programs, department_ids, created_at')
      .in('role', ['faculty', 'department_chair', 'dept_chair', 'dean', 'college_dean']);

    if (usersError) throw usersError;

    const userIds = (users || []).map((u) => u.id);
    if (userIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Fetch corresponding profile records
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (profilesError) throw profilesError;

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    // 3. Merge profiles with user roles and program assignments
    const merged = (profiles || []).map((p) => {
      const u = userMap.get(p.id) || {};
      const actualRole = u.role || p.role || 'faculty';
      const fallbackDept = Array.isArray(u.programs) && u.programs.length > 0 ? u.programs[0] : null;

      return {
        ...p,
        role: actualRole,
        department: p.department || p.program || fallbackDept || 'General Academic',
        program: p.program || p.department || fallbackDept || 'General Academic',
        position:
          p.position ||
          (['department_chair', 'dept_chair'].includes(actualRole)
            ? 'Department Chair'
            : ['dean', 'college_dean'].includes(actualRole)
            ? 'College Dean'
            : 'Faculty Member'),
      };
    });

    return res.json({ success: true, data: merged });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load faculty', error: error.message });
  }
});

router.get('/faculty-count', async (req, res) => {
  try {
    // 1. Fetch IDs of all academic personnel (faculty, department chairs, deans)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('role', ['faculty', 'department_chair', 'dept_chair', 'dean', 'college_dean']);

    if (usersError) throw usersError;

    const userIds = (users || []).map((u) => u.id);
    if (userIds.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    // 2. Count active profiles matching those user IDs
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('id', userIds)
      .eq('status', 'active');

    if (error) throw error;
    return res.json({ success: true, count: count ?? 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get faculty count', error: error.message });
  }
});

router.get('/staff-count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'staff')
      .eq('status', 'active');

    if (error) throw error;
    return res.json({ success: true, count: count ?? 0 });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get staff count', error: error.message });
  }
});

router.get('/student-count', async (req, res) => {
  try {
    const { data, count, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, status', { count: 'exact' })
      .eq('role', 'student')
      .eq('status', 'active');

    if (error) throw error;
    return res.json({
      success: true,
      count: count ?? data?.length ?? 0,
      students: data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load student count', error: error.message });
  }
});

// =========================================================
// USER UPDATE (Admin/Dean only)
// =========================================================
router.put('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'dean' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can modify users.' });
    }

    const { id } = req.params;
    const { full_name, role, id_number, department, status, password } = req.body;

    const profileUpdate = {};
    if (full_name !== undefined) profileUpdate.full_name = full_name.trim();
    if (role !== undefined) profileUpdate.role = role;
    if (id_number !== undefined) profileUpdate.id_number = id_number.trim();
    if (department !== undefined) profileUpdate.department = department?.trim() || null;
    if (status !== undefined) profileUpdate.status = status;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id);

      if (profileError) return res.status(400).json({ error: profileError.message });
    }

    const userUpdate = {};
    if (role !== undefined) userUpdate.role = role;

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      userUpdate.password_hash = await bcrypt.hash(password, 10);

      const { error: authError } = await supabase.auth.admin.updateUserById(id, { password });
      if (authError) {
        console.warn('Could not sync password to Supabase Auth:', authError.message);
      }
    }

    let updatedUser = null;
    if (Object.keys(userUpdate).length > 0) {
      const { data, error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', id)
        .select()
        .single();

      if (userError) return res.status(400).json({ error: userError.message });
      updatedUser = data;
    }

    return res.json({ message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// =========================================================
// USER DELETION (Admin/Dean only)
// =========================================================
router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'dean' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete users.' });
    }

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User ID is required.' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    await supabase.from('student_profiles').delete().eq('user_id', id);
    await supabase.from('faculty_profiles').delete().eq('user_id', id);
    await supabase.from('alumni_profiles').delete().eq('user_id', id);

    await supabase.auth.admin.deleteUser(id);
    await supabase.from('users').delete().eq('id', id);

    const { data: deletedProfile, error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (deleteProfileError) {
      return res.status(500).json({ error: deleteProfileError.message || 'Failed to delete profile.' });
    }

    return res.status(200).json({
      success: true,
      message: 'User and associated profiles deleted successfully.',
      deletedProfile,
    });
  } catch (error) {
    console.error('DELETE USER ERROR:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user.' });
  }
});

// =========================================================
// GET ALL USERS (Admin/Dean only)
// =========================================================
router.get('/users', authenticate, async (req, res) => {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can access this resource.' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

router.get('/profile-test', (req, res) => {
  console.log('✅ /profile-test was reached');

  res.json({
    success: true,
    message: 'Profile route is loaded.'
  });
});

// =========================================================
// UPDATE CURRENT USER PASSWORD
// =========================================================
router.put('/password', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Your login session is invalid. Please sign in again.'
      });
    }

    const {
      current_password,
      new_password,
      confirm_password
    } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------
    if (!current_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required.'
      });
    }

    if (!new_password) {
      return res.status(400).json({
        success: false,
        error: 'New password is required.'
      });
    }

    if (!confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Please confirm your new password.'
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match.'
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!\%*?&.#_-]{8,}$/;

    if (!passwordRegex.test(new_password)) {
      return res.status(400).json({
        success: false,
        error:
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    if (current_password === new_password) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from your current password.'
      });
    }

    // -----------------------------------------------------
    // GET CURRENT USER FROM public.users
    // -----------------------------------------------------
    const {
      data: currentUser,
      error: userLookupError
    } = await supabase
      .from('users')
      .select('id, username, password_hash, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (userLookupError) {
      console.error('Password user lookup error:', userLookupError);
      return res.status(500).json({
        success: false,
        error: userLookupError.message
      });
    }

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Your user account could not be found.'
      });
    }

    // -----------------------------------------------------
    // VERIFY CURRENT PASSWORD
    // -----------------------------------------------------
    const currentPasswordMatches =
      await bcrypt.compare(
        current_password,
        currentUser.password_hash
      );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.'
      });
    }

    // -----------------------------------------------------
    // HASH NEW PASSWORD
    // -----------------------------------------------------
    const newPasswordHash =
      await bcrypt.hash(new_password, 10);

    // -----------------------------------------------------
    // UPDATE public.users
    // -----------------------------------------------------
    const {
      error: passwordUpdateError
    } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash
      })
      .eq('id', currentUser.id);

    if (passwordUpdateError) {
      console.error('Password update error:', passwordUpdateError);
      return res.status(400).json({
        success: false,
        error: passwordUpdateError.message
      });
    }

    // -----------------------------------------------------
    // OPTIONAL: sync Supabase Auth
    // -----------------------------------------------------
    try {
      const {
        error: authUpdateError
      } = await supabase.auth.admin.updateUserById(
        currentUser.id,
        {
          password: new_password
        }
      );

      if (authUpdateError) {
        console.warn(
          'Supabase Auth password sync warning:',
          authUpdateError.message
        );
      }
    } catch (authError) {
      console.warn(
        'Supabase Auth password sync warning:',
        authError
      );
    }

    console.log(
      `Password updated for username: ${currentUser.username}`
    );

    return res.json({
      success: true,
      message: 'Password updated successfully.'
    });

  } catch (error) {
    console.error('UPDATE PASSWORD ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update password.'
    });
  }
});
module.exports = router;