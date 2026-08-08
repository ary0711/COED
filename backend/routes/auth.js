
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');


const router = express.Router();

/*
=========================================================
REGISTER
=========================================================

FULL REGISTRATION
-----------------

Used by Dean/User Management.

Creates:

1. users
2. profiles

The same UUID is used for users.id and profiles.id.

Required:

username
password
role
email
full_name
id_number

Optional:

department
status


LEGACY REGISTRATION
-------------------

Your existing activatePending() function sends only:

username
password
role

That is still supported below so existing
student/faculty/alumni activation does not
immediately break.
=========================================================
*/

router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      email,
      full_name,
      id_number,
      department,
      status
    } = req.body;

    /*
    =====================================================
    BASIC VALIDATION
    =====================================================
    */

    if (!username || !password || !role) {
      return res.status(400).json({
        error: 'Username, password, and role are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters.'
      });
    }

    if (!full_name || !id_number || !email) {
      return res.status(400).json({
        error:
          'Email, full name, and ID number are required.'
      });
    }

    const normalizedUsername =
      username.trim().toLowerCase();

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    =====================================================
    CHECK EXISTING USER IN public.users
    =====================================================
    */

    const {
      data: existingUser,
      error: existingUserError
    } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingUserError) {
      console.error(
        'Existing user check error:',
        existingUserError
      );

      return res.status(500).json({
        error: existingUserError.message
      });
    }

    if (existingUser) {
      return res.status(409).json({
        error:
          'An account with this username already exists.'
      });
    }

    /*
    =====================================================
    CHECK EXISTING EMAIL IN public.users
    =====================================================
    */

    const {
      data: existingEmail,
      error: existingEmailError
    } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingEmailError) {
      console.error(
        'Existing email check error:',
        existingEmailError
      );

      return res.status(500).json({
        error: existingEmailError.message
      });
    }

    if (existingEmail) {
      return res.status(409).json({
        error:
          'An account with this email already exists.'
      });
    }

    /*
    =====================================================
    CHECK EXISTING ID NUMBER
    =====================================================
    */

    const {
      data: existingProfile,
      error: existingProfileError
    } = await supabase
      .from('profiles')
      .select('id')
      .eq('id_number', id_number.trim())
      .maybeSingle();

    if (existingProfileError) {
      console.error(
        'Existing ID number check error:',
        existingProfileError
      );

      return res.status(500).json({
        error: existingProfileError.message
      });
    }

    if (existingProfile) {
      return res.status(409).json({
        error:
          'This ID number is already registered.'
      });
    }

    /*
    =====================================================
    STEP 1
    CREATE SUPABASE AUTH USER
    =====================================================

    Supabase generates the UUID.

    We will use this SAME UUID for:
      auth.users
      public.users
      public.profiles
    */

    const {
      data: authData,
      error: authError
    } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true
    });

    if (authError) {
      console.error(
        'Supabase Auth user creation error:',
        authError
      );

      return res.status(400).json({
        error: authError.message
      });
    }

    if (!authData?.user) {
      return res.status(500).json({
        error:
          'Supabase Auth user was not created.'
      });
    }

    const authUser = authData.user;

    console.log(
      'Supabase Auth user created:',
      authUser.id
    );

    /*
    =====================================================
    STEP 2
    HASH PASSWORD FOR public.users
    =====================================================
    */

    const password_hash =
      await bcrypt.hash(password, 10);

    /*
    =====================================================
    STEP 3
    CREATE public.users
    =====================================================

    IMPORTANT:

    We explicitly use authUser.id.

    This means:

      auth.users.id
            =
      public.users.id
    */

    const {
      data: user,
      error: userError
    } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          username: normalizedUsername,
          password_hash,
          role,
          email: normalizedEmail
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error(
        'public.users insert error:',
        userError
      );

      /*
      Roll back Auth account
      */

      await supabase.auth.admin.deleteUser(
        authUser.id
      );

      return res.status(400).json({
        error: userError.message
      });
    }

    console.log(
      'public.users record created:',
      user.id
    );

    /*
    =====================================================
    STEP 4
    CREATE PROFILE
    =====================================================

    profiles.id must match auth.users.id.

    Because profiles.id has:

      FOREIGN KEY (id)
      REFERENCES auth.users(id)

    this will now satisfy the constraint.
    */

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          full_name: full_name.trim(),
          email: normalizedEmail,
          role,
          id_number: id_number.trim(),
          department:
            department?.trim() || null,
          status:
            status || 'active'
        }
      ])
      .select()
      .single();

    /*
    =====================================================
    PROFILE CREATION FAILED
    =====================================================
    */

    if (profileError) {
  console.error(
    'Profile insert error:',
    profileError
  );

  console.error(
    'AUTH USER ID:',
    authUser.id
  );

  console.error(
    'AUTH USER EMAIL:',
    authUser.email
  );

  /*
  =====================================================
  DEBUG: CHECK IF AUTH USER REALLY EXISTS
  =====================================================
  */

  const {
    data: verifyAuthUser,
    error: verifyAuthError
  } = await supabase.auth.admin.getUserById(
    authUser.id
  );

  console.log(
    'VERIFY AUTH USER:',
    verifyAuthUser?.user
  );

  console.log(
    'VERIFY AUTH ERROR:',
    verifyAuthError
  );

  /*
  DO NOT DELETE ANYTHING YET.
  */

  return res.status(400).json({
    error: profileError.message,

    debug: {
      authUserId: authUser.id,
      authUserExists: !!verifyAuthUser?.user,
      authError: verifyAuthError?.message || null
    }
  });
}

    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    console.log(
      'Profile created:',
      profile.id
    );

    return res.status(201).json({
      message:
        'User and profile created successfully!',

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },

      profile
    });

  } catch (error) {

    console.error(
      'Registration error:',
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        'Internal server error.'
    });
  }
});

/*
=========================================================
CLEANUP FAILED REGISTRATION
=========================================================
*/

router.post(
  '/cleanup-failed-registration',
  async (req, res) => {

    try {

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'Missing userId'
        });
      }

      const {
        error
      } = await supabase.auth.admin.deleteUser(
        userId
      );

      if (error) {

        console.error(
          'Cleanup failed:',
          error.message
        );

        return res.status(400).json({
          error: error.message
        });
      }

      return res.json({
        message: 'Cleaned up'
      });

    } catch (error) {

      console.error(
        'Cleanup error:',
        error
      );

      return res.status(500).json({
        error: 'Internal server error.'
      });
    }
  }
);


/*
=========================================================
LOGIN
=========================================================
*/

router.post('/login', async (req, res) => {

  try {

    const {
      username,
      password
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error:
          'Username and password are required.'
      });
    }

    const normalizedUsername =
      username.trim().toLowerCase();

    /*
    =====================================================
    FIND USER
    =====================================================
    */

    const {
      data: user,
      error
    } = await supabase
      .from('users')
      .select('*')
      .eq(
        'username',
        normalizedUsername
      )
      .maybeSingle();

    if (error || !user) {

      return res.status(401).json({
        error:
          'Invalid username or password'
      });
    }

    /*
    =====================================================
    CHECK PASSWORD
    =====================================================
    */

    const isMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!isMatch) {

      return res.status(401).json({
        error:
          'Invalid username or password'
      });
    }

    /*
    =====================================================
    GET PROFILE
    =====================================================
    */

    let fullName =
      normalizedUsername;

    let idNumber = '';

    let profileId = null;

    let profileStatus = null;

    let department = null;

    if (user.email) {

      const {
        data: profile
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, id_number, status, department, role'
        )
        .eq(
          'email',
          user.email
        )
        .maybeSingle();

      if (profile) {

        profileId =
          profile.id;

        fullName =
          profile.full_name ||
          normalizedUsername;

        idNumber =
          profile.id_number ||
          '';

        profileStatus =
          profile.status;

        department =
          profile.department ||
          null;
      }
    }

    /*
    =====================================================
    BLOCK PENDING
    =====================================================
    */

    if (
      profileStatus ===
      'pending'
    ) {

      return res.status(403).json({
        error:
          'Your account is pending approval from your department chair.'
      });
    }

    /*
    =====================================================
    BLOCK REJECTED
    =====================================================
    */

    if (
      profileStatus ===
      'rejected'
    ) {

      return res.status(403).json({
        error:
          'Your registration was not approved. Please contact your department chair.'
      });
    }

    /*
    =====================================================
    BLOCK INACTIVE
    =====================================================
    */

    if (
      profileStatus ===
      'inactive'
    ) {

      return res.status(403).json({
        error:
          'Your account is currently inactive.'
      });
    }

    /*
    =====================================================
    GENERATE JWT
    =====================================================
    */

    const token =
      jwt.sign(
        {
          userId: user.id,

          profileId,

          username:
            user.username,

          role:
            user.role,

          fullName,

          idNumber,

          department,

          alumniId:
            user.alumni_id ??
            null
        },

        process.env.JWT_SECRET,

        {
          expiresIn: '8h'
        }
      );

    /*
    =====================================================
    RESPONSE
    =====================================================
    */

    return res.json({

      message:
        'Login successful!',

      token,

      user: {

        id:
          user.id,

        profileId,

        username:
          user.username,

        role:
          user.role,

        fullName,

        idNumber,

        email:
          user.email,

        department
      }
    });

  } catch (error) {

    console.error(
      'Login error:',
      error
    );

    return res.status(500).json({
      error:
        'Internal server error.'
    });
  }
});


/*
=========================================================
DELETE USER
=========================================================

Deletes both:

users
profiles
=========================================================
*/

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      role,
      password
    } = req.body;

    const updateData = {};

    // Update role
    if (role) {
      updateData.role = role;
    }

    // Update password only if provided
    if (password && password.trim() !== '') {

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters.'
        });
      }

      updateData.password_hash =
        await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No changes were provided.'
      });
    }

    const {
      data,
      error
    } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Keep profiles synchronized
    if (role) {
      await supabase
        .from('profiles')
        .update({
          role: role
        })
        .eq('id', id);
    }

    return res.json({
      message: 'User updated successfully.',
      user: data
    });

  } catch (error) {

    console.error(
      'Update user error:',
      error
    );

    return res.status(500).json({
      error: 'Internal server error.'
    });
  }
});
/*
=====================================================
DELETE USER
=====================================================

Deletes:

1. profiles record
2. users record

The same UUID is used for both tables.
*/

/*
=====================================================
DELETE USER
=====================================================

The frontend sends the PROFILE ID.

We first find the profile, then find the
corresponding login account in users using
the email/username.

This works even if profiles.id and users.id
are different UUIDs.
*/

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('====================================');
    console.log('DELETE USER REQUEST');
    console.log('Profile ID:', id);
    console.log('====================================');

    if (!id) {
      return res.status(400).json({
        error: 'User ID is required.'
      });
    }

    /*
    =====================================================
    STEP 1: FIND PROFILE
    =====================================================
    */

    const {
      data: profile,
      error: profileFindError
    } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (profileFindError) {
      console.error(
        'Find profile error:',
        profileFindError
      );

      return res.status(500).json({
        error: profileFindError.message
      });
    }

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found.'
      });
    }

    console.log('Profile found:', profile);

    /*
    =====================================================
    STEP 2: FIND LOGIN ACCOUNT
    =====================================================

    First try matching users.id with profile.id.

    If that does not exist, try matching by email.
    */

    let loginUser = null;

    /*
    -----------------------------------------------------
    TRY 1: SAME UUID
    -----------------------------------------------------
    */

    const {
      data: userById,
      error: userByIdError
    } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (userByIdError) {
      console.error(
        'Find user by ID error:',
        userByIdError
      );
    }

    if (userById) {
      loginUser = userById;
    }

    /*
    -----------------------------------------------------
    TRY 2: MATCH BY EMAIL
    -----------------------------------------------------
    */

    if (!loginUser && profile.email) {

      const {
        data: userByEmail,
        error: userByEmailError
      } = await supabase
        .from('users')
        .select('*')
        .eq(
          'email',
          profile.email.trim().toLowerCase()
        )
        .maybeSingle();

      if (userByEmailError) {
        console.error(
          'Find user by email error:',
          userByEmailError
        );
      }

      if (userByEmail) {
        loginUser = userByEmail;
      }
    }

    /*
    =====================================================
    STEP 3: IF LOGIN ACCOUNT WAS FOUND
    =====================================================
    */

    if (loginUser) {

      console.log(
        'Login account found:',
        loginUser.id
      );

      /*
      ---------------------------------------------------
      DELETE LOGIN ACCOUNT
      ---------------------------------------------------
      */

      const {
        error: deleteUserError
      } = await supabase
        .from('users')
        .delete()
        .eq('id', loginUser.id);

      if (deleteUserError) {

        console.error(
          'Delete users table error:',
          deleteUserError
        );

        return res.status(500).json({
          error:
            deleteUserError.message ||
            'Failed to delete login account.'
        });
      }

      console.log(
        'Login account deleted:',
        loginUser.id
      );
    } else {

      console.warn(
        'No login account found for profile:',
        id
      );

      /*
      We DO NOT stop here.

      The profile can still be deleted.
      This is useful for pending/old accounts that
      may not have a users record.
      */
    }

    /*
    =====================================================
    STEP 4: DELETE PROFILE
    =====================================================
    */

    const {
      data: deletedProfile,
      error: deleteProfileError
    } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (deleteProfileError) {

      console.error(
        'Delete profile error:',
        deleteProfileError
      );

      return res.status(500).json({
        error:
          deleteProfileError.message ||
          'Failed to delete profile.'
      });
    }

    /*
    =====================================================
    STEP 5: VERIFY PROFILE WAS DELETED
    =====================================================
    */

    if (!deletedProfile) {

      return res.status(404).json({
        error:
          'Profile could not be deleted.'
      });
    }

    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    console.log(
      'Profile deleted:',
      deletedProfile.id
    );

    console.log(
      'User deletion completed successfully.'
    );

    return res.status(200).json({
      success: true,

      message:
        'User and profile deleted successfully.',

      deletedUser: loginUser
        ? {
            id: loginUser.id,
            email: loginUser.email,
            username: loginUser.username
          }
        : null,

      deletedProfile: {
        id: deletedProfile.id,
        email: deletedProfile.email,
        full_name: deletedProfile.full_name
      }
    });

  } catch (error) {

    console.error(
      'DELETE USER ERROR:',
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        'Failed to delete user.'
    });
  }
});

module.exports = router;

