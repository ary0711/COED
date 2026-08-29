const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

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

    // =====================================================
    // PHASE 1: COMPREHENSIVE PRE-VALIDATION (ZERO DB WRITES)
    // =====================================================

    // 1. Required field verification
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

    // 2. Role validation
    const allowedRoles = ['student', 'faculty', 'staff', 'alumni', 'dean', 'admin'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid role selected. Allowed roles: ${allowedRoles.join(', ')}.`,
      });
    }

    // 3. ID number format & length validation
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

    // 4. Alumni graduation year validation
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

    // 5. Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // 6. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    // 7. Resolve department_id using direct mapping & database fallback
    let resolvedDepartmentId = null;
    if (programCode) {
      const mapped = PROGRAM_TO_DEPARTMENT[programCode];
      if (mapped) {
        resolvedDepartmentId = mapped.id;
      } else {
        // Fallback query if code is direct UUID or full name
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

    // 8. Pre-flight check for duplicates
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

    // =====================================================
    // PHASE 2: ATOMIC WRITES (WITH COMPENSATING ROLLBACK)
    // =====================================================

    // Step A: Create Auth User
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

    // Step B: Insert into public.users
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

    // Step C: Insert into public.profiles
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

    // Step D: Insert into Role-Specific Sub-Profile
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

    // Success response
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
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    let fullName = normalizedUsername;
    let idNumber = '';
    let profileId = null;
    let profileStatus = null;
    let department = null;

    if (user.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, id_number, status, department, role')
        .eq('email', user.email)
        .maybeSingle();

      if (profile) {
        profileId = profile.id;
        fullName = profile.full_name || normalizedUsername;
        idNumber = profile.id_number || '';
        profileStatus = profile.status;
        department = profile.department || null;
      }
    }

    if (profileStatus === 'pending') {
      return res.status(403).json({ error: 'Your account is pending approval from your department chair.' });
    }
    if (profileStatus === 'rejected') {
      return res.status(403).json({ error: 'Your registration was not approved. Please contact your department chair.' });
    }
    if (profileStatus === 'inactive') {
      return res.status(403).json({ error: 'Your account is currently inactive.' });
    }

    const departmentIds = user.department_ids ?? [];
    let departmentNames = [];

    if (departmentIds.length > 0) {
      const { data: depRows } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      departmentNames = (depRows ?? []).map((d) => d.name);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        profileId,
        username: user.username,
        role: user.role,
        fullName,
        idNumber,
        department,
        alumniId: user.alumni_id ?? null,
        departmentIds,
        departmentNames,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

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
        email: user.email,
        department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'faculty')
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load faculty', error: error.message });
  }
});

router.get('/faculty-count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'faculty')
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

module.exports = router;