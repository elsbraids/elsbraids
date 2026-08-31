const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../config/security');
const { Notification, Customer } = require('../models');
const { isDatabaseReady } = require('../utils/database');
const { inMemoryStore } = require('../data/sampleData');

// Combined Auth Middleware for Notifications
const anyAuth = async (req, res, next) => {
  const token = req.cookies?.token || req.cookies?.customerToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    
    if (decoded.role === 'admin') {
      const admin = inMemoryStore.admin;
      if (!admin || decoded.sub !== admin.id) return res.status(401).json({ message: 'Invalid admin' });
      req.user = { id: admin.id, email: admin.email, role: 'Admin' };
    } else if (decoded.role === 'customer') {
      const customer = isDatabaseReady()
        ? await Customer.findById(decoded.sub).lean()
        : inMemoryStore.customerAccounts.find(c => c.id === decoded.sub);
      if (!customer) return res.status(401).json({ message: 'Invalid customer' });
      req.user = { id: decoded.sub, email: customer.email, role: 'Customer' };
    } else {
      return res.status(401).json({ message: 'Invalid role' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};

// GET /api/notifications
router.get('/', anyAuth, async (req, res) => {
  const { email, role } = req.user;
  
  if (isDatabaseReady()) {
    const notifications = await Notification.find({ recipientEmail: email, recipientType: role })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ success: true, data: notifications });
  } else {
    const notifications = inMemoryStore.notifications
      .filter(n => n.recipientEmail === email && n.recipientType === role)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    return res.json({ success: true, data: notifications });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', anyAuth, async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.user;

  if (isDatabaseReady()) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientEmail: email, recipientType: role },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ success: true, data: notification });
  } else {
    const notification = inMemoryStore.notifications.find(n => n.id === id && n.recipientEmail === email && n.recipientType === role);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.read = true;
    return res.json({ success: true, data: notification });
  }
});

module.exports = router;
