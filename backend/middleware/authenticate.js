
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authorization header is missing',
      code: 'NO_AUTH_HEADER'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Invalid authorization format',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({
      error: 'Authentication token is missing',
      code: 'MISSING_TOKEN'
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET is not configured.');
    return res.status(500).json({
      error: 'Authentication secret not configured'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    req.user = decoded;

    next();

  } catch (err) {
    console.error('JWT Authentication Error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token. Please log in again.',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

module.exports = authenticate;
