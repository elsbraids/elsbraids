const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { inMemoryStore, makeId, resolveGoogleMapsEmbed } = require('../data/sampleData');
const { cleanText, parseSafeUrl } = require('../utils/requestValidation');
const { Product, Service, Booking, Order, Customer, Gallery, Settings, ContactMessage } = require('../models');
const { isDatabaseReady } = require('../utils/database');
const { createNotification } = require('../utils/notifications');
const { sendStatusUpdateEmail } = require('../utils/email');

const present = (document) => {
  const value = document.toObject ? document.toObject() : { ...document };
  value.id = value.id || value._id?.toString();
  delete value._id;
  delete value.__v;
  delete value.passwordHash;
  return value;
};

const validImages = (images) => Array.isArray(images) && images.length <= 12 && images.every((image) => typeof image === 'string' && image.startsWith('data:image/') && image.length <= 2500000);

router.use(protect);

router.get('/dashboard', async (req, res) => {
  if (isDatabaseReady()) {
    const [bookings, orders, customers, products] = await Promise.all([Booking.find().sort({ createdAt: -1 }).lean(), Order.find().sort({ createdAt: -1 }).lean(), Customer.find().select('-passwordHash').lean(), Product.find().lean()]);
    const today = new Date().toISOString().slice(0, 10);
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return res.json({ success: true, data: { stats: { totalBookings: bookings.length, pendingBookings: bookings.filter((item) => item.status === 'Pending').length, confirmedBookings: bookings.filter((item) => item.status === 'Confirmed').length, completedBookings: bookings.filter((item) => item.status === 'Completed').length, todaysBookings: bookings.filter((item) => item.date === today).length, todaysRevenue: orders.filter((item) => String(item.createdAt || '').slice(0, 10) === today).reduce((sum, order) => sum + Number(order.total || 0), 0), totalCustomers: customers.length, totalOrders: orders.length, pendingOrders: orders.filter((item) => item.status === 'Pending').length, totalProducts: products.length, lowStockProducts: products.filter((item) => item.stock < 10).length, revenue, unreadMessages: 0 }, recentBookings: bookings.slice(0, 5).map(present), recentOrders: orders.slice(0, 5).map(present), recentCustomers: customers.slice(0, 5).map(present) } });
  }
  const totalBookings = inMemoryStore.bookings.length;
  const pendingBookings = inMemoryStore.bookings.filter((item) => item.status === 'Pending').length;
  const confirmedBookings = inMemoryStore.bookings.filter((item) => item.status === 'Confirmed').length;
  const completedBookings = inMemoryStore.bookings.filter((item) => item.status === 'Completed').length;
  const totalOrders = inMemoryStore.orders.length;
  const pendingOrders = inMemoryStore.orders.filter((item) => item.status === 'Pending').length;
  const totalProducts = inMemoryStore.products.length;
  const lowStockProducts = inMemoryStore.products.filter((item) => item.stock < 10).length;
  const revenue = inMemoryStore.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todaysBookings = inMemoryStore.bookings.filter((item) => item.date === today);
  const todaysRevenue = inMemoryStore.orders
    .filter((order) => String(order.createdAt || '').slice(0, 10) === today)
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const unreadMessages = inMemoryStore.contactMessages.filter((item) => !item.read).length;

  res.json({
    success: true,
    data: {
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        todaysBookings: todaysBookings.length,
        todaysRevenue,
        totalCustomers: inMemoryStore.customers.length,
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        revenue,
        unreadMessages,
      },
      recentBookings: inMemoryStore.bookings.slice(0, 5),
      recentOrders: inMemoryStore.orders.slice(0, 5),
      recentCustomers: inMemoryStore.customers.slice(0, 5),
    },
  });
});

router.get('/services', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Service.find().lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.services });
});

router.post('/services', (req, res) => {
  if (req.body.images && !validImages(req.body.images)) return res.status(400).json({ message: 'Use up to 12 images, each under 2 MB.' });
  const name = String(req.body.name || '').trim().toLowerCase();
  if (inMemoryStore.services.some((item) => String(item.name || '').trim().toLowerCase() === name)) {
    return res.status(409).json({ message: 'A style with this name already exists.' });
  }
  const service = { id: makeId('service'), ...req.body, isActive: req.body.isActive ?? true };
  if (isDatabaseReady()) return Service.create(service).then((saved) => res.status(201).json({ success: true, data: present(saved) }));
  inMemoryStore.services.unshift(service);
  res.status(201).json({ success: true, data: service });
});

router.put('/services/:id', (req, res) => {
  if (req.body.images && !validImages(req.body.images)) return res.status(400).json({ message: 'Use up to 12 images, each under 2 MB.' });
  if (isDatabaseReady()) return Service.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true, runValidators: true }).then((service) => service ? res.json({ success: true, data: present(service) }) : res.status(404).json({ message: 'Service not found' }));
  const index = inMemoryStore.services.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Service not found' });
  inMemoryStore.services[index] = { ...inMemoryStore.services[index], ...req.body };
  res.json({ success: true, data: inMemoryStore.services[index] });
});

router.delete('/services/:id', (req, res) => {
  if (isDatabaseReady()) return Service.deleteOne({ id: req.params.id }).then((result) => res.json({ success: true, message: result.deletedCount ? 'Service deleted' : 'Service not found' }));
  inMemoryStore.services = inMemoryStore.services.filter((item) => item.id !== req.params.id);
  res.json({ success: true, message: 'Service deleted' });
});

router.get('/products', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Product.find().lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.products });
});

router.post('/products', (req, res) => {
  if (req.body.images && !validImages(req.body.images)) return res.status(400).json({ message: 'Use up to 12 images, each under 2 MB.' });
  const sku = String(req.body.sku || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim().toLowerCase();
  if (inMemoryStore.products.some((item) => String(item.sku || '').trim().toLowerCase() === sku || String(item.name || '').trim().toLowerCase() === name)) {
    return res.status(409).json({ message: 'A product with this SKU or name already exists.' });
  }
  const product = { id: makeId('product'), ...req.body, isActive: req.body.isActive ?? true };
  if (isDatabaseReady()) return Product.create(product).then((saved) => res.status(201).json({ success: true, data: present(saved) }));
  inMemoryStore.products.unshift(product);
  res.json({ success: true, data: product });
});

router.put('/products/:id', (req, res) => {
  if (req.body.images && !validImages(req.body.images)) return res.status(400).json({ message: 'Use up to 12 images, each under 2 MB.' });
  if (isDatabaseReady()) return Product.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true, runValidators: true }).then((product) => product ? res.json({ success: true, data: present(product) }) : res.status(404).json({ message: 'Product not found' }));
  const index = inMemoryStore.products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  inMemoryStore.products[index] = { ...inMemoryStore.products[index], ...req.body };
  res.json({ success: true, data: inMemoryStore.products[index] });
});

router.delete('/products/:id', (req, res) => {
  if (isDatabaseReady()) return Product.deleteOne({ id: req.params.id }).then((result) => res.json({ success: true, message: result.deletedCount ? 'Product deleted' : 'Product not found' }));
  inMemoryStore.products = inMemoryStore.products.filter((item) => item.id !== req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});

router.get('/bookings', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Booking.find().sort({ createdAt: -1 }).lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.bookings });
});

router.post('/bookings', async (req, res) => {
  if (!isDatabaseReady()) return res.status(503).json({ success: false, message: 'MongoDB is not connected.' });

  const payload = {
    reference: req.body.reference || `ELS-${Date.now()}`,
    customerId: req.body.customerId,
    customerName: req.body.customerName || 'Customer',
    phone: req.body.phone || '',
    email: req.body.email || '',
    serviceName: req.body.serviceName || '',
    date: req.body.date || '',
    time: req.body.time || '',
    location: req.body.location || '',
    googleLocation: req.body.googleLocation || '',
    notes: req.body.notes || '',
    bookingImage1: typeof req.body.bookingImage1 === 'string' ? req.body.bookingImage1 : '',
    bookingImage2: typeof req.body.bookingImage2 === 'string' ? req.body.bookingImage2 : '',
    status: req.body.status || 'Pending',
    paymentStatus: req.body.paymentStatus || 'Pending',
    paymentOption: ['half', 'full'].includes(req.body.paymentOption) ? req.body.paymentOption : 'full',
    paymentAmount: Number(req.body.paymentAmount || 0),
  };

  try {
    const saved = await Booking.create(payload);
    const output = saved.toObject ? saved.toObject() : { ...saved };
    output.id = output.id || output._id?.toString();
    delete output._id;
    delete output.__v;
    console.log('[admin-bookings] created booking record', { id: output.id, reference: output.reference, email: output.email });
    return res.status(201).json({ success: true, data: output });
  } catch (error) {
    console.error('[admin-bookings] create failed:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'Unable to create booking.' });
  }
});

router.put('/bookings/:id', (req, res) => {
  const nextValues = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(nextValues, 'bookingImage1')) nextValues.bookingImage1 = typeof nextValues.bookingImage1 === 'string' ? nextValues.bookingImage1 : '';
  if (Object.prototype.hasOwnProperty.call(nextValues, 'bookingImage2')) nextValues.bookingImage2 = typeof nextValues.bookingImage2 === 'string' ? nextValues.bookingImage2 : '';

  if (isDatabaseReady()) {
    return Booking.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      { $set: nextValues },
      { new: true, runValidators: true },
    ).then(async (booking) => {
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (req.body.status) {
        // Send email via Brevo
        await sendStatusUpdateEmail({ fullName: booking.customerName, email: booking.email }, booking, req.body.status);
        // Create in-app notification
        await createNotification({ recipientType: 'Customer', recipientEmail: booking.email, type: 'Status', subject: 'Booking Status Updated', message: `Your booking for ${booking.serviceName} is now ${req.body.status}.`, relatedData: { reference: booking.reference, status: req.body.status }, sendEmail: false });
      }
      res.json({ success: true, data: present(booking) });
    });
  }

  const booking = inMemoryStore.bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  Object.assign(booking, nextValues);
  if (req.body.status) {
    // Send email via Brevo
    sendStatusUpdateEmail({ fullName: booking.customerName, email: booking.email }, booking, req.body.status);
    // Create in-app notification
    createNotification({ recipientType: 'Customer', recipientEmail: booking.email, type: 'Status', subject: 'Booking Status Updated', message: `Your booking for ${booking.serviceName} is now ${req.body.status}.`, relatedData: { reference: booking.reference, status: req.body.status }, sendEmail: false });
  }
  res.json({ success: true, data: booking });
});

router.delete('/bookings/:id', (req, res) => {
  if (isDatabaseReady()) return Booking.deleteOne({ $or: [{ id: req.params.id }, { _id: req.params.id }] }).then((result) => res.json({ success: true, message: result.deletedCount ? 'Booking deleted' : 'Booking not found' }));
  inMemoryStore.bookings = inMemoryStore.bookings.filter((item) => item.id !== req.params.id);
  res.json({ success: true, message: 'Booking deleted' });
});

router.get('/orders', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Order.find().sort({ createdAt: -1 }).lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.orders });
});

router.put('/orders/:id', (req, res) => {
  if (isDatabaseReady()) {
    return Order.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, { $set: { status: req.body.status } }, { new: true, runValidators: true }).then(async (order) => {
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (req.body.status) {
        // Send email via Brevo
        await sendStatusUpdateEmail(
          { fullName: order.customerName, email: order.email }, 
          { reference: order.paymentReference, serviceName: 'Product Purchase', date: new Date(order.createdAt).toLocaleDateString(), time: new Date(order.createdAt).toLocaleTimeString() }, 
          req.body.status
        );
        // Create in-app notification
        await createNotification({ recipientType: 'Customer', recipientEmail: order.email, type: 'Status', subject: 'Order Status Updated', message: `Your order status is now ${req.body.status}.`, relatedData: { paymentReference: order.paymentReference, status: req.body.status }, sendEmail: false });
      }
      res.json({ success: true, data: present(order) });
    });
  }
  const order = inMemoryStore.orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = req.body.status || order.status;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  if (req.body.status) {
    // Send email via Brevo
    sendStatusUpdateEmail(
      { fullName: order.customerName, email: order.email }, 
      { reference: order.paymentReference, serviceName: 'Product Purchase', date: new Date(order.createdAt).toLocaleDateString(), time: new Date(order.createdAt).toLocaleTimeString() }, 
      req.body.status
    );
    // Create in-app notification
    createNotification({ recipientType: 'Customer', recipientEmail: order.email, type: 'Status', subject: 'Order Status Updated', message: `Your order status is now ${req.body.status}.`, relatedData: { paymentReference: order.paymentReference, status: req.body.status }, sendEmail: false });
  }
  res.json({ success: true, data: order });
});

router.get('/customers', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Customer.find().select('-passwordHash').lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.customers });
});

router.get('/messages', async (req, res) => {
  if (isDatabaseReady()) {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    const payload = messages.map((message) => {
      const output = { ...message, id: message.id || message._id?.toString() };
      delete output._id;
      delete output.__v;
      return output;
    });
    console.log('[admin-messages] fetched from MongoDB', { count: payload.length });
    return res.json({ success: true, data: payload });
  }
  res.json({ success: true, data: inMemoryStore.contactMessages });
});

router.post('/messages', async (req, res) => {
  if (!isDatabaseReady()) return res.status(503).json({ success: false, message: 'MongoDB is not connected.' });

  const { customerName, name, email, phone, message, status } = req.body;
  if (!customerName && !name) return res.status(400).json({ message: 'Customer name is required.' });
  if (!email || !phone || !message) return res.status(400).json({ message: 'Email, phone, and message are required.' });

  const entry = {
    customerName: customerName || name,
    name: name || customerName || '',
    email,
    phone,
    message,
    status: status === 'Read' ? 'Read' : 'Unread',
    read: status === 'Read',
  };

  try {
    const saved = await ContactMessage.create(entry);
    const output = saved.toObject ? saved.toObject() : { ...saved };
    output.id = output.id || output._id?.toString();
    delete output._id;
    delete output.__v;
    console.log('[admin-messages] created message record', { id: output.id, email: output.email, status: output.status });
    return res.status(201).json({ success: true, data: output });
  } catch (error) {
    console.error('[admin-messages] create failed:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'Unable to create message.' });
  }
});

router.put('/messages/:id', async (req, res) => {
  if (isDatabaseReady()) {
    const updated = await ContactMessage.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { read: req.body.read ?? false, status: req.body.read ? 'Read' : 'Unread' } },
      { new: true, runValidators: true },
    );

    if (!updated) return res.status(404).json({ message: 'Message not found' });
    const output = updated.toObject ? updated.toObject() : { ...updated };
    output.id = output.id || output._id?.toString();
    delete output._id;
    delete output.__v;
    console.log('[admin-messages] updated message record', { id: output.id, read: output.read, status: output.status });
    return res.json({ success: true, data: output });
  }

  const message = inMemoryStore.contactMessages.find((item) => item.id === req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  message.read = req.body.read ?? message.read ?? false;
  message.status = message.read ? 'Read' : 'Unread';
  res.json({ success: true, data: message });
});

router.delete('/messages/:id', async (req, res) => {
  if (isDatabaseReady()) {
    const result = await ContactMessage.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Message not found' });
    return res.json({ success: true, message: 'Message deleted' });
  }

  const index = inMemoryStore.contactMessages.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Message not found' });
  inMemoryStore.contactMessages.splice(index, 1);
  return res.json({ success: true, message: 'Message deleted' });
});

router.get('/gallery', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Gallery.find().sort({ createdAt: -1 }).lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.gallery });
});

router.post('/gallery', (req, res) => {
  const item = { id: makeId('gallery'), ...req.body, isActive: req.body.isActive ?? true };
  if (isDatabaseReady()) {
    return Gallery.create(item)
      .then((saved) => res.status(201).json({ success: true, data: present(saved) }))
      .catch((error) => {
        console.error('[admin-gallery] create failed:', error.message);
        return res.status(400).json({ success: false, message: error.message || 'Unable to upload gallery image.' });
      });
  }
  inMemoryStore.gallery.unshift(item);
  res.status(201).json({ success: true, data: item });
});

router.delete('/gallery/:id', async (req, res) => {
  const { id } = req.params;

  if (isDatabaseReady()) {
    try {
      const result = await Gallery.deleteOne({ $or: [{ id }, { _id: id }] });
      if (!result.deletedCount) {
        const byStringId = await Gallery.findOne({ id }).lean();
        if (!byStringId) return res.status(404).json({ message: 'Gallery image not found' });
      }
      console.log('[admin-gallery] deleted image', { id, deletedCount: result.deletedCount });
      return res.json({ success: true, message: 'Gallery image deleted' });
    } catch (error) {
      console.error('[admin-gallery] delete failed:', error.message);
      if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Gallery ID is not valid for this record.' });
      }
      return res.status(500).json({ success: false, message: 'Unable to delete gallery image.' });
    }
  }

  const index = inMemoryStore.gallery.findIndex((item) => item.id === id || item._id === id);
  if (index === -1) return res.status(404).json({ message: 'Gallery image not found' });
  inMemoryStore.gallery.splice(index, 1);
  console.log('[admin-gallery] deleted image in-memory', { id });
  return res.json({ success: true, message: 'Gallery image deleted' });
});

router.get('/settings', async (req, res) => {
  if (isDatabaseReady()) {
    const settings = await Settings.findOne({ key: 'main' }).lean()
      || await Settings.findOne().lean();
    console.log('[settings] Admin GET:', settings ? `found, keys: ${Object.keys(settings).join(', ')}` : 'not found');
    return res.json({ success: true, data: settings || {} });
  }
  inMemoryStore.settings.googleMapsEmbedUrl = inMemoryStore.settings.googleMapsEmbedUrl || await resolveGoogleMapsEmbed(inMemoryStore.settings.googleMapsUrl);
  res.json({ success: true, data: inMemoryStore.settings });
});

router.put('/settings', async (req, res) => {
  const allowed = ['businessName', 'phone', 'email', 'location', 'businessHours', 'homepageText', 'aboutText', 'logo', 'favicon', 'heroImages', 'socials', 'googleMapsUrl'];
  const nextSettings = {};
  for (const key of allowed) {
    if (!(key in req.body)) continue;
    if (['logo', 'favicon', 'googleMapsUrl'].includes(key)) {
      const isImageDataUri = ['logo', 'favicon'].includes(key) && typeof req.body[key] === 'string' && req.body[key].startsWith('data:');
      const value = isImageDataUri
        ? req.body[key]
        : parseSafeUrl(req.body[key], key === 'googleMapsUrl' ? ['google.com', 'www.google.com', 'maps.google.com', 'www.google.com.gh'] : []);
      if (req.body[key] && !value) {
        const message = ['logo', 'favicon'].includes(key) ? `${key} must be a data URI or HTTPS URL.` : `${key} must be a safe HTTPS URL.`;
        return res.status(400).json({ message });
      }
      nextSettings[key] = value;
    } else if (key === 'heroImages') {
      if (!Array.isArray(req.body[key]) || req.body[key].length > 10) return res.status(400).json({ message: 'Too many hero images.' });
      nextSettings[key] = req.body[key].map((value) => (
        typeof value === 'string' && value.startsWith('data:') ? value : parseSafeUrl(value)
      ));
      if (nextSettings[key].some((value) => !value)) return res.status(400).json({ message: 'Hero images must be data URIs or HTTPS URLs.' });
    } else if (key === 'socials') {
      if (!req.body[key] || typeof req.body[key] !== 'object') return res.status(400).json({ message: 'Invalid social links.' });
      nextSettings[key] = Object.fromEntries(Object.entries(req.body[key]).map(([name, value]) => [name, value === '#' || value === '' ? value : parseSafeUrl(value)]));
    } else {
      nextSettings[key] = cleanText(req.body[key], 500);
    }
  }
  if (isDatabaseReady()) {
    // Preserve existing googleMapsUrl if not being updated in this request
    const existing = await Settings.findOne({ key: 'main' }).select('googleMapsUrl').lean()
      || await Settings.findOne().select('googleMapsUrl').lean();
    nextSettings.googleMapsEmbedUrl = await resolveGoogleMapsEmbed(
      nextSettings.googleMapsUrl || existing?.googleMapsUrl || ''
    );
    console.log('[settings] PUT saving to MongoDB, keys:', Object.keys(nextSettings));
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { key: 'main', ...nextSettings } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    console.log('[settings] PUT saved, returned keys:', settings ? Object.keys(settings).join(', ') : 'null');
    return res.json({ success: true, data: settings || {} });
  }
  inMemoryStore.settings = { ...inMemoryStore.settings, ...nextSettings };
  inMemoryStore.settings.googleMapsEmbedUrl = await resolveGoogleMapsEmbed(inMemoryStore.settings.googleMapsUrl);
  res.json({ success: true, data: inMemoryStore.settings });
});

module.exports = router;
