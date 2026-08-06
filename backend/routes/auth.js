const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  const { username, password, role, email } = req.body;

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password_hash, role, email }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'User created!', user: data });
});

// CLEANUP FAILED REGISTRATION
// Called by the frontend if a later step (student_profiles, faculty_profiles,
// alumni_profiles, or the users-table register call) fails after the
// Supabase Auth user + profiles row were already created. Deletes the
// orphaned auth user so the email is free to register again.
router.post('/cleanup-failed-registration', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Cleanup failed:', error.message);
    return res.status(400).json({ error: error.message });
  }
  res.json({ message: 'Cleaned up' });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Step 1: Pangitaa ang user sa users table
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user)
    return res.status(401).json({ error: 'Invalid username or password' });

  // Step 2: Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch)
    return res.status(401).json({ error: 'Invalid username or password' });

  // Step 3: Fetch profiles.id, full_name, id_number, and status via EMAIL.
  let fullName = username;
  let idNumber = '';
  let profileId = null;
  let profileStatus = null;

  if (user.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, id_number, status')
      .eq('email', user.email)
      .single();

    if (profile) {
      profileId = profile.id;
      fullName = profile.full_name ?? username;
      idNumber = profile.id_number ?? '';
      profileStatus = profile.status;
    }
  }

  // Step 3.5: Block login if the account hasn't been approved yet.
  if (profileStatus === 'pending') {
    return res.status(403).json({
      error: 'Your account is pending approval from your department chair.',
    });
  }
  if (profileStatus === 'rejected') {
    return res.status(403).json({
      error: 'Your registration was not approved. Please contact your department chair.',
    });
  }

  // Step 4: Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
      profileId,
      username: user.username,
      role: user.role,
      fullName,
      idNumber,
      alumniId: user.alumni_id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
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
    }
  });
});

module.exports = router;