const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { inMemoryStore } = require('../data/sampleData');
const { makeId, resolveGoogleMapsEmbed } = require('../data/sampleData');
const { cleanText, parseSafeUrl } = require('../utils/requestValidation');
const { Product, Service, Booking, Order, Customer, Gallery, Settings } = require('../models');
const { isDatabaseReady } = require('../utils/database');

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

router.put('/bookings/:id', (req, res) => {
  if (isDatabaseReady()) return Booking.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, { $set: { status: req.body.status } }, { new: true, runValidators: true }).then((booking) => booking ? res.json({ success: true, data: present(booking) }) : res.status(404).json({ message: 'Booking not found' }));
  const booking = inMemoryStore.bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.status = req.body.status || booking.status;
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
  if (isDatabaseReady()) return Order.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, { $set: { status: req.body.status } }, { new: true, runValidators: true }).then((order) => order ? res.json({ success: true, data: present(order) }) : res.status(404).json({ message: 'Order not found' }));
  const order = inMemoryStore.orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = req.body.status || order.status;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  res.json({ success: true, data: order });
});

router.get('/customers', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Customer.find().select('-passwordHash').lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.customers });
});

router.get('/messages', (req, res) => {
  res.json({ success: true, data: inMemoryStore.contactMessages });
});

router.put('/messages/:id', (req, res) => {
  const message = inMemoryStore.contactMessages.find((item) => item.id === req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  message.read = req.body.read ?? message.read ?? false;
  res.json({ success: true, data: message });
});

router.get('/gallery', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Gallery.find().sort({ createdAt: -1 }).lean()).map(present) });
  res.json({ success: true, data: inMemoryStore.gallery });
});

router.post('/gallery', (req, res) => {
  const item = { id: makeId('gallery'), ...req.body, isActive: req.body.isActive ?? true };
  if (isDatabaseReady()) return Gallery.create(item).then((saved) => res.status(201).json({ success: true, data: present(saved) }));
  inMemoryStore.gallery.unshift(item);
  res.status(201).json({ success: true, data: item });
});

router.delete('/gallery/:id', (req, res) => {
  if (isDatabaseReady()) return Gallery.deleteOne({ $or: [{ id: req.params.id }, { _id: req.params.id }] }).then((result) => res.json({ success: true, message: result.deletedCount ? 'Gallery item deleted' : 'Gallery item not found' }));
  inMemoryStore.gallery = inMemoryStore.gallery.filter((item) => item.id !== req.params.id);
  res.json({ success: true, message: 'Gallery item deleted' });
});

router.get('/settings', async (req, res) => {
  if (isDatabaseReady()) return res.json({ success: true, data: (await Settings.findOne({ key: 'main' }).lean()) || {} });
  inMemoryStore.settings.googleMapsEmbedUrl = inMemoryStore.settings.googleMapsEmbedUrl || await resolveGoogleMapsEmbed(inMemoryStore.settings.googleMapsUrl);
  res.json({ success: true, data: inMemoryStore.settings });
});

router.put('/settings', async (req, res) => {
  const allowed = ['businessName', 'phone', 'email', 'location', 'businessHours', 'homepageText', 'aboutText', 'logo', 'favicon', 'heroImages', 'socials', 'googleMapsUrl'];
  const nextSettings = {};
  for (const key of allowed) {
    if (!(key in req.body)) continue;
    if (['logo', 'favicon', 'googleMapsUrl'].includes(key)) {
      const isFaviconDataUri = key === 'favicon' && typeof req.body[key] === 'string' && req.body[key].startsWith('data:');
      const value = isFaviconDataUri
        ? req.body[key]
        : parseSafeUrl(req.body[key], key === 'googleMapsUrl' ? ['google.com', 'www.google.com', 'maps.google.com', 'www.google.com.gh'] : []);
      if (req.body[key] && !value) {
        const message = key === 'favicon' ? 'favicon must be a data URI or HTTPS URL.' : `${key} must be a safe HTTPS URL.`;
        return res.status(400).json({ message });
      }
      nextSettings[key] = value;
    } else if (key === 'heroImages') {
      if (!Array.isArray(req.body[key]) || req.body[key].length > 10) return res.status(400).json({ message: 'Too many hero images.' });
      nextSettings[key] = req.body[key].map((value) => parseSafeUrl(value)).filter(Boolean);
      if (nextSettings[key].length !== req.body[key].length) return res.status(400).json({ message: 'Hero images must use HTTPS URLs.' });
    } else if (key === 'socials') {
      if (!req.body[key] || typeof req.body[key] !== 'object') return res.status(400).json({ message: 'Invalid social links.' });
      nextSettings[key] = Object.fromEntries(Object.entries(req.body[key]).map(([name, value]) => [name, value === '#' || value === '' ? value : parseSafeUrl(value)]));
    } else {
      nextSettings[key] = cleanText(req.body[key], 500);
    }
  }
  if (isDatabaseReady()) {
    const settings = await Settings.findOneAndUpdate({ key: 'main' }, { $set: nextSettings }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    settings.googleMapsEmbedUrl = await resolveGoogleMapsEmbed(settings.googleMapsUrl);
    await Settings.updateOne({ key: 'main' }, { $set: { googleMapsEmbedUrl: settings.googleMapsEmbedUrl } });
    return res.json({ success: true, data: settings });
  }
  inMemoryStore.settings = { ...inMemoryStore.settings, ...nextSettings };
  inMemoryStore.settings.googleMapsEmbedUrl = await resolveGoogleMapsEmbed(inMemoryStore.settings.googleMapsUrl);
  res.json({ success: true, data: inMemoryStore.settings });
});

module.exports = router;
