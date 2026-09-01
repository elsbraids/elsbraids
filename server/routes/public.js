const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Service, Gallery, Settings } = require('../models');
const { inMemoryStore } = require('../data/sampleData');
const { makeId, resolveGoogleMapsEmbed } = require('../data/sampleData');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { customerProtect } = require('../middleware/customerAuth');
const rateLimit = require('express-rate-limit');
const { getJwtSecret, jwtOptions } = require('../config/security');
const { validateCustomerSignup, validateCustomerCredentials } = require('../utils/customerAuth');
const { cleanText, isEmail, isPhone, parseSafeUrl, parseItems } = require('../utils/requestValidation');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Customer, Product, Booking, Order, Payment, ContactMessage } = require('../models');
const { isDatabaseReady } = require('../utils/database');
const { createNotification } = require('../utils/notifications');
const {
  sendOtpEmail,
  sendResetConfirmationEmail,
  sendBookingConfirmation,
  sendAdminBookingAlert,
  sendPaymentReceipt,
  sendAdminPaymentAlert
} = require('../utils/email');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many authentication attempts. Please try again later.' } });
const actionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } });

router.post('/payment', customerProtect, actionLimiter, async (req, res) => {
  const { amount, email, reference } = req.body || {};
  const numericAmount = Number(amount);
  const customerEmail = String(email || req.customer.email).trim().toLowerCase();
  const paymentReference = String(reference || `els-${Date.now()}`).trim();
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !isEmail(customerEmail) || paymentReference.length > 100) {
    return res.status(400).json({ success: false, message: 'Valid payment amount, email, and reference are required.' });
  }
  if (customerEmail !== req.customer.email.toLowerCase()) return res.status(400).json({ success: false, message: 'Payment email must match the signed-in customer.' });
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('[payment] PAYSTACK_SECRET_KEY is not configured');
    return res.status(503).json({ success: false, message: 'Paystack payment service is not configured.' });
  }
  try {
    console.log('[payment] Initializing Paystack payment:', { amount: numericAmount, email: customerEmail, reference: paymentReference });
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(numericAmount), email: customerEmail, reference: paymentReference, currency: 'GHS', callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout` }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      console.error('[payment] Paystack initialization failed:', payload);
      return res.status(502).json({ success: false, message: payload.message || 'Unable to initialize Paystack payment.' });
    }
    console.log('[payment] Paystack payment initialized:', { reference: paymentReference });
    return res.json({ success: true, data: { authorization_url: payload.data.authorization_url, access_code: payload.data.access_code, reference: payload.data.reference } });
  } catch (error) {
    console.error('[payment] Paystack request failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to communicate with Paystack.' });
  }
});

const initializeBookingPayment = async (req, res) => {
  const { amount, email, reference, booking } = req.body || {};
  const numericAmount = Number(amount);
  const customerEmail = String(email || req.customer.email).trim().toLowerCase();
  const paymentReference = String(reference || booking?.reference || `els-booking-${Date.now()}`).trim();

  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !isEmail(customerEmail) || paymentReference.length > 100) {
    return res.status(400).json({ success: false, message: 'Valid booking payment amount, email, and reference are required.' });
  }

  if (customerEmail !== req.customer.email.toLowerCase()) {
    return res.status(400).json({ success: false, message: 'Payment email must match the signed-in customer.' });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('[booking-payment] PAYSTACK_SECRET_KEY is not configured');
    return res.status(503).json({ success: false, message: 'Paystack payment service is not configured.' });
  }

  try {
    console.log('[booking-payment] Initializing Paystack booking payment:', { amount: numericAmount, email: customerEmail, reference: paymentReference });
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(numericAmount),
        email: customerEmail,
        reference: paymentReference,
        currency: 'GHS',
        callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/book`,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      console.error('[booking-payment] Paystack initialization failed:', payload);
      return res.status(502).json({ success: false, message: payload.message || 'Unable to initialize booking payment.' });
    }

    console.log('[booking-payment] Paystack booking payment initialized:', { reference: paymentReference });
    return res.json({
      success: true,
      data: {
        authorization_url: payload.data.authorization_url,
        access_code: payload.data.access_code,
        reference: payload.data.reference,
      },
      booking,
    });
  } catch (error) {
    console.error('[booking-payment] Paystack request failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to communicate with Paystack.' });
  }
};

router.post('/booking/payment', customerProtect, actionLimiter, initializeBookingPayment);
router.post('/bookings/payment', customerProtect, actionLimiter, initializeBookingPayment);

const createCustomerToken = (customer) => jwt.sign(
  { sub: customer.id, role: 'customer', email: customer.email },
  getJwtSecret(),
  jwtOptions,
);

const createAdminToken = (admin) => jwt.sign(
  { sub: admin.id, role: 'admin' },
  getJwtSecret(),
  jwtOptions,
);


const respondWithStore = (res, key) => res.json({ success: true, data: inMemoryStore[key] || [] });

router.get('/services', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: await Service.find({ isActive: true }).lean() });
  return respondWithStore(res, 'services');
});

router.get('/services/:id', async (req, res) => {
  if (isDatabaseReady()) {
    const service = await Service.findOne({ $or: [{ id: req.params.id }, { name: req.params.id }] }).lean();
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.json({ success: true, data: service });
  }
  const service = inMemoryStore.services.find((item) => item.id === req.params.id || item.name === req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  return res.json({ success: true, data: service });
});

router.get('/products', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: await Product.find({ isActive: true }).lean() });
  return respondWithStore(res, 'products');
});

router.get('/products/:id', async (req, res) => {
  if (isDatabaseReady()) {
    const productQuery = mongoose.isValidObjectId(req.params.id)
      ? { $or: [{ id: req.params.id }, { _id: req.params.id }] }
      : { id: req.params.id };
    const product = await Product.findOne(productQuery).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ success: true, data: product });
  }
  const product = inMemoryStore.products.find((item) => item.id === req.params.id || item.name === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.json({ success: true, data: product });
});

router.get('/gallery', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: await Gallery.find({ isActive: true }).lean() });
  return respondWithStore(res, 'gallery');
});

router.get('/settings', async (req, res) => {
  if (isDatabaseReady()) {
    const settings = await Settings.findOne({ key: 'main' }).lean()
      || await Settings.findOne().lean();
    console.log('[settings] Public GET:', settings ? `found, keys: ${Object.keys(settings).join(', ')}` : 'not found');
    return res.json({ success: true, data: settings || {} });
  }
  const settings = {
    ...inMemoryStore.settings,
    location: String(inMemoryStore.settings.location || 'Atonsu, Kumasi, Ghana').replace(/Atomsu/gi, 'Atonsu'),
  };
  settings.googleMapsEmbedUrl = settings.googleMapsEmbedUrl || await resolveGoogleMapsEmbed(settings.googleMapsUrl);
  inMemoryStore.settings = settings;
  return res.json({ success: true, data: settings });
});

router.post('/bookings', customerProtect, actionLimiter, async (req, res) => {
  const { phone, serviceName, date, time, notes, location, googleLocation, paymentReference, paymentOption, bookingImage1, bookingImage2 } = req.body;
  const customerName = req.customer.fullName || req.customer.name || 'Customer';
  const email = req.customer.email;
  const dbService = isDatabaseReady()
    ? await Service.findOne({ $or: [{ id: serviceName }, { name: serviceName }] }).lean()
    : null;
  const service = dbService || inMemoryStore.services.find((item) => item.name === serviceName || item.id === serviceName);

  if (!phone || !service || !date || !time || !paymentReference || !['half', 'full'].includes(paymentOption) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].includes(time)) {
    return res.status(400).json({ message: 'Please provide all required booking information' });
  }
  if (!isPhone(String(phone)) || String(phone).length > 25) return res.status(400).json({ message: 'Phone number is not valid.' });
  if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ message: 'Payment service is not configured.' });
  if (isDatabaseReady() && await Payment.exists({ reference: paymentReference })) return res.status(409).json({ message: 'Payment has already been used.' });
  let verification;
  try {
    const paymentResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
    verification = await paymentResponse.json();
  } catch {
    return res.status(502).json({ message: 'Unable to verify payment.' });
  }
  const expectedAmount = Math.round(Number(service.price) * (paymentOption === 'half' ? 0.5 : 1) * 100);
  const transaction = verification?.data;
  if (!verification?.status || transaction?.status !== 'success' || transaction.currency !== 'GHS' || Number(transaction.amount) !== expectedAmount || String(transaction.customer?.email || '').toLowerCase() !== email.toLowerCase()) return res.status(400).json({ message: 'Payment verification failed.' });

  const bookingCount = isDatabaseReady() ? await Booking.countDocuments() : inMemoryStore.bookings.length;
  const reference = `ELS-${new Date().getFullYear()}-${String(bookingCount + 1).padStart(5, '0')}`;
  const booking = {
    id: makeId('booking'),
    reference,
    customerName,
    phone,
    email,
    serviceName: service.name,
    date,
    time,
    location: cleanText(location || googleLocation || 'Atonsu, Kumasi, Ghana', 300),
    googleLocation: cleanText(googleLocation || location || 'Atonsu, Kumasi, Ghana', 300),
    notes: cleanText(notes, 1000),
    bookingImage1: typeof bookingImage1 === 'string' ? bookingImage1 : '',
    bookingImage2: typeof bookingImage2 === 'string' ? bookingImage2 : '',
    paymentStatus: 'Paid',
    status: 'Pending',
    paymentOption,
    paymentAmount: expectedAmount / 100,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseReady()) {
    const saved = await Booking.create({
      ...booking,
      customerId: req.customer._id,
      serviceId: service.id,
      location: booking.location,
      googleLocation: booking.googleLocation,
      paymentOption,
      paymentAmount: booking.paymentAmount,
      paymentStatus: 'Paid',
    });
    await Payment.create({ bookingId: saved._id, customerId: req.customer._id, reference: paymentReference, amount: expectedAmount, currency: 'GHS', status: 'Paid' });
    const payload = saved.toObject ? saved.toObject() : { ...saved };
    payload.id = payload.id || payload._id?.toString();
    delete payload._id;
    delete payload.__v;
    
    // Send email via Brevo
    await sendBookingConfirmation(req.customer, payload);
    if (inMemoryStore.admin?.email) {
      await sendAdminBookingAlert(inMemoryStore.admin.email, payload, req.customer);
    }

    // In-app notifications
    await createNotification({ recipientType: 'Customer', recipientEmail: email, type: 'Booking', subject: 'Booking Confirmed', message: `Your booking for ${service.name} on ${date} at ${time} is confirmed.`, relatedData: { reference: payload.reference }, sendEmail: false });
    if (inMemoryStore.admin?.email) {
      await createNotification({ recipientType: 'Admin', recipientEmail: inMemoryStore.admin.email, type: 'Booking', subject: 'New Booking Created', message: `${customerName} booked ${service.name} on ${date} at ${time}.`, relatedData: { reference: payload.reference }, sendEmail: false });
    }
    
    console.log('[booking] saved booking to MongoDB', { id: payload.id, reference: payload.reference, email: payload.email });
    return res.status(201).json({ success: true, data: payload });
  }
  
  // In-memory fallback
  await sendBookingConfirmation(req.customer, booking);
  if (inMemoryStore.admin?.email) {
    await sendAdminBookingAlert(inMemoryStore.admin.email, booking, req.customer);
  }

  await createNotification({ recipientType: 'Customer', recipientEmail: email, type: 'Booking', subject: 'Booking Confirmed', message: `Your booking for ${service.name} on ${date} at ${time} is confirmed.`, relatedData: { reference: booking.reference }, sendEmail: false });
  if (inMemoryStore.admin?.email) {
    await createNotification({ recipientType: 'Admin', recipientEmail: inMemoryStore.admin.email, type: 'Booking', subject: 'New Booking Created', message: `${customerName} booked ${service.name} on ${date} at ${time}.`, relatedData: { reference: booking.reference }, sendEmail: false });
  }
  
  inMemoryStore.bookings.unshift(booking);
  return res.status(201).json({ success: true, data: booking });
});

router.get('/customers/me/bookings', customerProtect, (req, res) => {
  if (isDatabaseReady()) return Booking.find({ customerId: req.customer._id }).lean().then((bookings) => res.json({ success: true, data: bookings }));
  const bookings = inMemoryStore.bookings.filter((booking) => booking.email === req.customer.email);
  return res.json({ success: true, data: bookings });
});

router.post('/orders', customerProtect, actionLimiter, async (req, res) => {
  const { phone, address, region, city, deliveryLocation, googleLocation, notes, paymentReference } = req.body;
  const items = parseItems(req.body.items);
  const customerName = req.customer.fullName;
  const email = req.customer.email;

  if (!phone || !address || !region || !city || !deliveryLocation || !items || !isPhone(String(phone))) {
    return res.status(400).json({ message: 'Missing order details' });
  }
  if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.length > 100) return res.status(400).json({ message: 'Payment reference is required.' });

  const trustedItems = [];
  for (const item of items) {
    const product = isDatabaseReady()
      ? await Product.findOne({ id: item.productId, isActive: true }).lean()
      : inMemoryStore.products.find((entry) => entry.id === item.productId && entry.isActive !== false);
    if (!product) return res.status(400).json({ message: 'One or more products are invalid.' });
    trustedItems.push({ productId: product.id, name: product.name, quantity: item.quantity, price: Number(product.price) });
  }
  const total = trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (inMemoryStore.orders.some((order) => order.paymentReference === paymentReference) || (isDatabaseReady() && await Payment.exists({ reference: paymentReference }))) return res.status(409).json({ message: 'Payment has already been used.' });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return res.status(503).json({ message: 'Payment service is not configured.' });
  let verification;
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, { headers: { Authorization: `Bearer ${secretKey}` } });
    verification = await response.json();
  } catch {
    return res.status(502).json({ message: 'Unable to verify payment.' });
  }
  const transaction = verification?.data;
  if (!verification?.status || transaction?.status !== 'success' || transaction.currency !== 'GHS' || Number(transaction.amount) !== Math.round(total * 100) || String(transaction.customer?.email || '').toLowerCase() !== email.toLowerCase()) {
    return res.status(400).json({ message: 'Payment verification failed.' });
  }

  const order = {
    id: makeId('order'),
    customerName,
    email,
    phone,
    address: cleanText(address, 300),
    region: cleanText(region, 80),
    city: cleanText(city, 100),
    deliveryLocation: cleanText(deliveryLocation, 40),
    googleLocation: cleanText(googleLocation || address, 300),
    notes: cleanText(notes, 1000),
    items: trustedItems,
    total,
    status: 'Pending',
    paymentStatus: 'Paid',
    paymentMethod: 'Paystack',
    paymentReference,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseReady()) {
    const savedOrder = await Order.create({ ...order, customerId: req.customer._id, subtotal: total, deliveryFee: 0, currency: 'GHS' });
    await Payment.create({ orderId: savedOrder._id, customerId: req.customer._id, reference: paymentReference, amount: Math.round(total * 100), currency: 'GHS', status: 'Paid' });
    
    // Send email via Brevo
    await sendPaymentReceipt(req.customer, { paymentReference, total, items: trustedItems });
    if (inMemoryStore.admin?.email) {
      await sendAdminPaymentAlert(inMemoryStore.admin.email, { paymentReference, total, customerName, email });
    }

    // In-app notifications
    await createNotification({ recipientType: 'Customer', recipientEmail: email, type: 'Purchase', subject: 'Order Confirmed', message: `Your order for GHS ${total} has been confirmed.`, relatedData: { paymentReference }, sendEmail: false });
    if (inMemoryStore.admin?.email) {
      await createNotification({ recipientType: 'Admin', recipientEmail: inMemoryStore.admin.email, type: 'Purchase', subject: 'New Order Received', message: `${customerName} placed an order for GHS ${total}.`, relatedData: { paymentReference }, sendEmail: false });
    }
    
    return res.status(201).json({ success: true, data: savedOrder.toObject() });
  }

  // In-memory fallback
  await sendPaymentReceipt(req.customer, { paymentReference, total, items: trustedItems });
  if (inMemoryStore.admin?.email) {
    await sendAdminPaymentAlert(inMemoryStore.admin.email, { paymentReference, total, customerName, email });
  }

  await createNotification({ recipientType: 'Customer', recipientEmail: email, type: 'Purchase', subject: 'Order Confirmed', message: `Your order for GHS ${total} has been confirmed.`, relatedData: { paymentReference }, sendEmail: false });
  if (inMemoryStore.admin?.email) {
    await createNotification({ recipientType: 'Admin', recipientEmail: inMemoryStore.admin.email, type: 'Purchase', subject: 'New Order Received', message: `${customerName} placed an order for GHS ${total}.`, relatedData: { paymentReference }, sendEmail: false });
  }

  inMemoryStore.orders.unshift(order);
  return res.status(201).json({ success: true, data: order });
});

router.post('/customers/signup', authLimiter, async (req, res) => {
  const payload = req.body || {};
  const sanitizedPayload = {
    fullName: String(payload.fullName ?? '').replace(/[<>]/g, '').trim(),
    email: String(payload.email ?? '').replace(/[<>]/g, '').trim().toLowerCase(),
    phone: String(payload.phone ?? '').replace(/[<>]/g, '').trim(),
    password: String(payload.password ?? '').trim(),
    city: String(payload.city ?? '').replace(/[<>]/g, '').trim(),
    address: String(payload.address ?? '').replace(/[<>]/g, '').trim(),
  };

  const validation = validateCustomerSignup(sanitizedPayload);

  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.errors[0] });
  }

  const email = sanitizedPayload.email;
  const existingCustomer = isDatabaseReady()
    ? await Customer.findOne({ email }).lean()
    : inMemoryStore.customerAccounts.find((customer) => customer.email === email);

  if (existingCustomer) {
    return res.status(409).json({ success: false, message: 'A customer with this email already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(sanitizedPayload.password, 10);
  const customer = {
    id: makeId('customer'),
    fullName: sanitizedPayload.fullName,
    email,
    phone: sanitizedPayload.phone,
    city: sanitizedPayload.city,
    address: sanitizedPayload.address,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseReady()) {
    const savedCustomer = await Customer.create({ name: customer.fullName, email: customer.email, phone: customer.phone, city: customer.city, address: customer.address, passwordHash: hashedPassword });
    return res.status(201).json({ success: true, data: { id: savedCustomer.id, email: savedCustomer.email, fullName: savedCustomer.name } });
  }

  inMemoryStore.customerAccounts.unshift(customer);
  inMemoryStore.customers.unshift({
    id: customer.id,
    name: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    bookings: 0,
    orders: 0,
    registeredAt: customer.createdAt,
  });

  return res.status(201).json({ success: true, data: { id: customer.id, email: customer.email, fullName: customer.fullName } });
});

router.post('/customers/signin', authLimiter, async (req, res) => {
  const payload = req.body || {};
  const sanitizedPayload = {
    email: String(payload.email ?? '').replace(/[<>]/g, '').trim().toLowerCase(),
    password: String(payload.password ?? '').trim(),
  };

  const validation = validateCustomerCredentials(sanitizedPayload);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.errors[0] });
  }

  const fullCustomer = isDatabaseReady()
    ? await Customer.findOne({ email: sanitizedPayload.email }).select('+passwordHash').lean()
    : inMemoryStore.customerAccounts.find((entry) => entry.email === sanitizedPayload.email);

  if (!fullCustomer) {
    console.log(`[customer-auth] Signin failed: User not found for email ${sanitizedPayload.email}`);
    return res.status(401).json({ success: false, message: 'User not found.' });
  } else {
    console.log(`[customer-auth] Signin: User found for email ${sanitizedPayload.email}`);
  }

  // Handle both DB field (passwordHash) and in-memory field (password)
  const storedHash = fullCustomer.passwordHash || fullCustomer.password || '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid';
  const passwordMatches = await bcrypt.compare(sanitizedPayload.password, storedHash);

  if (!passwordMatches) {
    console.log(`[customer-auth] Signin failed: Password does not match for email ${sanitizedPayload.email}`);
    return res.status(401).json({ success: false, message: 'Password is incorrect.' });
  } else {
    console.log(`[customer-auth] Signin: Password matches for email ${sanitizedPayload.email}`);
  }

  const token = createCustomerToken({ id: fullCustomer.id || fullCustomer._id.toString(), email: fullCustomer.email });
  res.cookie('customerToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 1000 });
  return res.json({ success: true, customer: { name: fullCustomer.fullName || fullCustomer.name, email: fullCustomer.email } });
});

// Helper functions replaced by Brevo email service module import at the top

// 1. Request OTP
router.post('/customers/forgot-password', authLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').replace(/[<>]/g, '').trim().toLowerCase();
  const genericResponse = { success: true, message: 'If an account exists, a reset code has been sent to your email.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json(genericResponse);

  const isAdmin = inMemoryStore.admin && inMemoryStore.admin.email === email;
  const customer = !isAdmin && (isDatabaseReady()
    ? await Customer.findOne({ email }).select('+otpHash +otpExpiresAt +otpFailedAttempts').lean()
    : inMemoryStore.customerAccounts.find((entry) => entry.email === email));

  if (!isAdmin && !customer) return res.json(genericResponse);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (isAdmin) {
    inMemoryStore.admin.otpHash = otpHash;
    inMemoryStore.admin.otpExpiresAt = otpExpiresAt.toISOString();
    inMemoryStore.admin.otpFailedAttempts = 0;
  } else if (isDatabaseReady()) {
    await Customer.updateOne({ _id: customer._id }, { $set: { otpHash, otpExpiresAt, otpFailedAttempts: 0 } });
  } else {
    customer.otpHash = otpHash;
    customer.otpExpiresAt = otpExpiresAt.toISOString();
    customer.otpFailedAttempts = 0;
  }

  try {
    const emailed = await sendOtpEmail(email, otp);
    if (!emailed) console.log(`[auth] OTP for ${email} (development):`, otp);
  } catch (error) {
    console.error('[auth] OTP email failed:', error.message);
  }
  return res.json(process.env.NODE_ENV === 'production' ? genericResponse : { ...genericResponse, otp });
});

// 2. Verify OTP
router.post('/customers/verify-otp', authLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const otp = String(req.body?.otp ?? '').trim();
  if (!email || otp.length !== 6) return res.status(400).json({ success: false, message: 'Invalid OTP format.' });

  const isAdmin = inMemoryStore.admin && inMemoryStore.admin.email === email;
  const customer = !isAdmin && (isDatabaseReady()
    ? await Customer.findOne({ email }).select('+otpHash +otpExpiresAt +otpFailedAttempts').lean()
    : inMemoryStore.customerAccounts.find((entry) => entry.email === email));

  const target = isAdmin ? inMemoryStore.admin : customer;
  if (!target || !target.otpHash) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

  const now = new Date();
  const expiresAt = new Date(target.otpExpiresAt);
  if (now > expiresAt) return res.status(400).json({ success: false, message: 'OTP has expired.' });
  if (target.otpFailedAttempts >= 3) return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });

  const isValid = await bcrypt.compare(otp, target.otpHash);
  if (!isValid) {
    const newAttempts = (target.otpFailedAttempts || 0) + 1;
    if (isAdmin) {
      inMemoryStore.admin.otpFailedAttempts = newAttempts;
    } else if (isDatabaseReady()) {
      await Customer.updateOne({ _id: customer._id }, { $set: { otpFailedAttempts: newAttempts } });
    } else {
      customer.otpFailedAttempts = newAttempts;
    }
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  // OTP Valid! Clear OTP and issue temporary reset token (JWT)
  const resetToken = jwt.sign({ email, role: isAdmin ? 'admin' : 'customer', intent: 'reset_password' }, getJwtSecret(), { expiresIn: '15m' });
  
  if (isAdmin) {
    delete inMemoryStore.admin.otpHash;
    delete inMemoryStore.admin.otpExpiresAt;
    inMemoryStore.admin.otpFailedAttempts = 0;
  } else if (isDatabaseReady()) {
    await Customer.updateOne({ _id: customer._id }, { $unset: { otpHash: 1, otpExpiresAt: 1, otpFailedAttempts: 1 } });
  } else {
    delete customer.otpHash;
    delete customer.otpExpiresAt;
    customer.otpFailedAttempts = 0;
  }

  return res.json({ success: true, resetToken });
});

// 3. Reset Password
router.post('/customers/reset-password', authLimiter, async (req, res) => {
  const resetToken = String(req.body?.resetToken ?? req.body?.token ?? '').trim();
  const password = String(req.body?.password ?? '').trim();
  if (!resetToken || password.length < 8) return res.status(400).json({ success: false, message: 'A valid token and password (min 8 chars) are required.' });

  let decoded;
  try {
    decoded = jwt.verify(resetToken, getJwtSecret());
    if (decoded.intent !== 'reset_password') throw new Error('Invalid token intent');
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Reset token is invalid or expired.' });
  }

  const { email, role } = decoded;
  const passwordHash = await bcrypt.hash(password, 12);
  const isAdmin = role === 'admin' && inMemoryStore.admin && inMemoryStore.admin.email === email;

  if (isAdmin) {
    inMemoryStore.admin.password = passwordHash;
  } else {
    if (isDatabaseReady()) {
      await Customer.updateOne({ email }, { $set: { passwordHash } });
    } else {
      const customer = inMemoryStore.customerAccounts.find((entry) => entry.email === email);
      if (customer) customer.password = passwordHash;
    }
  }

  try {
    await sendResetConfirmationEmail(email);
    // Notify admin for security monitoring
    if (inMemoryStore.admin?.email) {
      await sendResetConfirmationEmail(inMemoryStore.admin.email); // Sends alert to admin
    }
  } catch (err) {
    console.error('[auth] Reset confirmation email failed');
  }

  return res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});


router.get('/customers/me', customerProtect, (req, res) => res.json({ success: true, customer: { id: req.customer.id, name: req.customer.fullName, email: req.customer.email } }));

router.post('/customers/logout', (req, res) => {
  res.clearCookie('customerToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  return res.json({ success: true });
});

router.get('/customers/me/orders', customerProtect, (req, res) => {
  if (isDatabaseReady()) return Order.find({ customerId: req.customer._id }).lean().then((orders) => res.json({ success: true, data: orders }));
  const orders = inMemoryStore.orders.filter((order) => order.email === req.customer.email);
  return res.json({ success: true, data: orders });
});

router.get('/payments/verify/:reference', customerProtect, async (req, res) => {
  const reference = req.params.reference;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!reference) {
    return res.status(400).json({ success: false, message: 'Payment reference is required.' });
  }

  if (!secretKey) {
    return res.status(400).json({ success: false, message: 'Paystack secret key is not configured.' });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const payload = await response.json();

    if (!payload.status || payload.data?.status !== 'success' || String(payload.data?.customer?.email || '').toLowerCase() !== req.customer.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    return res.json({ success: true, data: payload.data });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify payment.' });
  }
});

router.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ message: 'Please complete all contact fields' });
  }

  const messageEntry = {
    id: makeId('contact'),
    customerName: name,
    name,
    email,
    phone,
    message,
    status: 'Unread',
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseReady()) {
    return ContactMessage.create(messageEntry)
      .then((saved) => {
        const payload = saved.toObject ? saved.toObject() : { ...saved };
        payload.id = payload.id || payload._id?.toString();
        delete payload._id;
        delete payload.__v;
        console.log('[contact] saved message to MongoDB', { id: payload.id, email: payload.email, status: payload.status });
        return res.status(201).json({ success: true, data: payload });
      })
      .catch((error) => {
        console.error('[contact] MongoDB save failed:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save your message right now.' });
      });
  }

  inMemoryStore.contactMessages.unshift(messageEntry);
  return res.status(201).json({ success: true, data: messageEntry });
});

router.post('/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const admin = inMemoryStore.admin;

  if (!admin) return res.status(503).json({ message: 'Administrator authentication is not configured.' });

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);
  if (email !== admin.email || !passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createAdminToken(admin);
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 1000 });

  return res.json({ success: true, token, admin: { name: admin.name, email: admin.email } });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out' });
});

router.get('/auth/me', protect, (req, res) => {
  return res.json({ success: true, admin: { name: req.admin.name, email: req.admin.email } });
});

module.exports = router;
