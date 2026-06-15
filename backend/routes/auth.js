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

  // Step 3: Fetch full_name ug id_number gikan sa profiles gamit EMAIL
  let fullName = username;
  let idNumber = '';

  if (user.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, id_number')
      .eq('email', user.email)
      .single();

    if (profile) {
      fullName = profile.full_name ?? username;
      idNumber = profile.id_number ?? '';
    }
  }

  // Step 4: Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName,
      idNumber,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Login successful!',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName,
      idNumber,
    }
  });
});

module.exports = router;