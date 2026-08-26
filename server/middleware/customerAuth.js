const jwt = require('jsonwebtoken');
const { inMemoryStore } = require('../data/sampleData');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../config/security');
const { Customer } = require('../models');
const { isDatabaseReady } = require('../utils/database');

const customerProtect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.cookies?.customerToken;

  if (!token) return res.status(401).json({ message: 'Customer authentication required.' });

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (decoded.role !== 'customer' || !decoded.sub) return res.status(403).json({ message: 'Customer access required.' });
    const customer = isDatabaseReady()
      ? await Customer.findById(decoded.sub).select('+passwordHash').lean()
      : inMemoryStore.customerAccounts.find((entry) => entry.id === decoded.sub);
    if (!customer) return res.status(401).json({ message: 'Customer session is invalid.' });
    if (isDatabaseReady()) customer.fullName = customer.name;
    req.customer = customer;
    next();
  } catch {
    return res.status(401).json({ message: 'Customer session is invalid or expired.' });
  }
};

module.exports = { customerProtect };
