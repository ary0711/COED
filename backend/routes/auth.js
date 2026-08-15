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

Used by Dean/User Management (no `userId` in the body — this
route creates a brand-new Supabase Auth user from scratch).

Creates:

1. auth user (via supabase.auth.admin.createUser)
2. users
3. profiles

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


SELF-SERVICE REGISTRATION (student/faculty/alumni via LoginPage)
------------------------------------------------------------------

The frontend's own signup form already calls
supabase.auth.signUp() AND inserts the profiles /
student_profiles / faculty_profiles / alumni_profiles rows
directly via the Supabase client BEFORE hitting this route.
That means by the time this endpoint runs, the auth user and
the profiles row already exist.

When the frontend includes `userId` in the request body, this
route reuses that existing auth user instead of trying to
create a second one for the same email (which always fails,
since the email is already registered) and skips re-inserting
`profiles` (already inserted by the frontend). It only needs
to create the `users` table row here, since that table stores
the bcrypt password hash used by the legacy username/password
login flow and the frontend has no direct insert access to it.


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
      status,
      userId // present only when the frontend already ran supabase.auth.signUp()
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
          'Full name, ID number, and email are required.'
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

    Skipped when `userId` is provided: in the self-service
    flow the auth user for this email was JUST created by
    the frontend's own signUp() call a moment ago, so a
    "does this email already exist" check here would always
    (correctly, but unhelpfully) say yes and block every
    legitimate registration.
    */

    if (!userId) {
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

    // When userId is provided, the frontend's own registration flow already
    // inserted this exact profiles row (same id_number) moments ago, so
    // finding it here is expected, not a conflict — only block on a
    // duplicate ID number that belongs to a DIFFERENT account.
    if (existingProfile && existingProfile.id !== userId) {
      return res.status(409).json({
        error:
          'This ID number is already registered.'
      });
    }

    /*
    =====================================================
    STEP 1
    GET OR CREATE THE SUPABASE AUTH USER
    =====================================================
    */

    let authUser;

    if (userId) {
      // Self-service flow: the frontend already created this auth user via
      // supabase.auth.signUp(). Verify it exists and reuse it instead of
      // creating a duplicate (which would fail with an "email already
      // registered" error every time).
      const {
        data: verifyAuthUser,
        error: verifyAuthError
      } = await supabase.auth.admin.getUserById(userId);

      if (verifyAuthError || !verifyAuthUser?.user) {
        console.error(
          'Could not verify pre-created auth user:',
          verifyAuthError
        );

        return res.status(400).json({
          error:
            'Could not verify the account created during signup. Please try registering again.'
        });
      }

      authUser = verifyAuthUser.user;

      console.log(
        'Reusing existing Supabase Auth user:',
        authUser.id
      );
    } else {
  // =========================================
  // ADMIN / DEAN REGISTRATION
  // =========================================

  console.log(
    'Creating new Supabase Auth user:',
    normalizedEmail
  );

  const {
    data: authData,
    error: authError
  } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: password,
    email_confirm: true
  });

  // =========================================
  // HANDLE SUPABASE AUTH ERROR
  // =========================================

  if (authError) {
    console.error(
      'Supabase Auth user creation error:',
      authError
    );

    const authMessage =
      authError.message?.toLowerCase() || '';

    // -----------------------------------------
    // EMAIL ALREADY EXISTS IN SUPABASE AUTH
    // -----------------------------------------

    if (
      authMessage.includes('already registered') ||
      authMessage.includes('already exists') ||
      authMessage.includes('user already')
    ) {
      return res.status(409).json({
        error:
          'This email address is already registered in Supabase Authentication. If this account was previously deleted from User Management, remove the old authentication account before registering this email again.'
      });
    }

    // -----------------------------------------
    // INVALID EMAIL
    // -----------------------------------------

    if (
      authMessage.includes('invalid email')
    ) {
      return res.status(400).json({
        error:
          'The email address provided is invalid. Please enter a valid email address.'
      });
    }

    // -----------------------------------------
    // WEAK PASSWORD
    // -----------------------------------------

    if (
      authMessage.includes('password') &&
      (
        authMessage.includes('weak') ||
        authMessage.includes('short') ||
        authMessage.includes('characters')
      )
    ) {
      return res.status(400).json({
        error:
          'The password does not meet the required security requirements.'
      });
    }

    // -----------------------------------------
    // OTHER AUTH ERROR
    // -----------------------------------------

    return res.status(400).json({
      error:
        authError.message ||
        'Unable to create the authentication account.'
    });
  }

  // =========================================
  // VERIFY AUTH USER WAS CREATED
  // =========================================

  if (!authData?.user) {
    console.error(
      'Supabase Auth returned no user after creation.'
    );

    return res.status(500).json({
      error:
        'The authentication account could not be created. Please try again.'
    });
  }

  authUser = authData.user;

  console.log(
    'Supabase Auth user created:',
    authUser.id
  );
}

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
      Roll back Auth account — but only if we created it ourselves in
      this request. If `userId` was passed in, that auth account (and
      its profiles row) belong to the frontend's own signUp() flow, and
      that flow already has its own rollback path — deleting it here
      too would be redundant and could race with it.
      */
      if (!userId) {
        await supabase.auth.admin.deleteUser(
          authUser.id
        );
      }

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
    GET OR CREATE PROFILE
    =====================================================

    profiles.id must match auth.users.id.

    When `userId` was provided, the frontend already inserted this
    profiles row directly via the Supabase client — inserting it again
    here would just fail on the primary key. Fetch it instead so the
    response payload still includes it. Otherwise (admin/legacy flow),
    create it as before.
    */

    let profile = null;

    if (userId) {
      const {
        data: existingProfileRow,
        error: fetchProfileError
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchProfileError) {
        console.error(
          'Fetching existing profile error:',
          fetchProfileError
        );
      }

      profile = existingProfileRow || null;
    } else {
      const {
        data: newProfile,
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

        return res.status(400).json({
          error: profileError.message,

          debug: {
            authUserId: authUser.id,
            authUserExists: !!verifyAuthUser?.user,
            authError: verifyAuthError?.message || null
          }
        });
      }

      profile = newProfile;
    }

    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    console.log(
      'Registration complete for profile:',
      profile?.id
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
    RESOLVE THIS CHAIR'S ASSIGNED DEPARTMENT(S)
    =====================================================

    Scoping is by department_id (a real foreign key on
    student_profiles), not the free-text `program` column —
    that field has no validation and drifts out of sync
    (e.g. "BEEd" vs "BEED"). department_id is always reliable.

    Also resolves the department NAMEs so the frontend can
    display "Managing: X, Y" without hardcoding any IDs.
    */

    const departmentIds = user.department_ids ?? [];
    let departmentNames = [];

    if (departmentIds.length > 0) {
      const { data: depRows } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      departmentNames = (depRows ?? []).map(d => d.name);
    }

    /*
    =====================================================
    GENERATE JWT
    =====================================================
    */

    const token = jwt.sign(
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
          null,

        departmentIds,
        departmentNames,
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

  // =========================================
  // STEP 3A: DELETE SUPABASE AUTH USER
  // =========================================

  const {
    error: deleteAuthError
  } = await supabase.auth.admin.deleteUser(
    loginUser.id
  );

  if (deleteAuthError) {

    console.error(
      'Delete Supabase Auth user error:',
      deleteAuthError
    );

    return res.status(500).json({
      error:
        deleteAuthError.message ||
        'Failed to delete the authentication account. The user was not deleted from the system.'
    });
  }

  console.log(
    'Supabase Auth user deleted:',
    loginUser.id
  );

  // =========================================
  // STEP 3B: DELETE public.users
  // =========================================

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
        'Authentication account was deleted, but the login record could not be removed.'
    });
  }

  console.log(
    'public.users record deleted:',
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