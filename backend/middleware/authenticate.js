const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Debug: check if the secret is actually loaded from .env
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: process.env.JWT_SECRET is undefined or missing in .env!');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification Failed:', err.name, '-', err.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: err.message 
    });
  }
};

module.exports = authenticate;