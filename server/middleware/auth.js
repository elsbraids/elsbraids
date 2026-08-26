const jwt = require('jsonwebtoken');
const { inMemoryStore } = require('../data/sampleData');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../config/security');

const protect = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    const admin = inMemoryStore.admin;

    if (!admin || decoded.role !== 'admin' || decoded.sub !== admin.id) {
      return res.status(403).json({ message: 'Administrator access required.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};

module.exports = { protect };
