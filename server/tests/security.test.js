const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../config/security');
const { parseSafeUrl, parseItems } = require('../utils/requestValidation');
const { Booking, ContactMessage, Service, Product, Gallery, Settings } = require('../models');
const { connectDatabase } = require('../config/db');
const { sampleServices } = require('../data/sampleData');

test('JWT secret is not the old predictable demo secret', () => {
  assert.notEqual(getJwtSecret(), ['demo', 'secret'].join('-'));
  assert.ok(getJwtSecret().length >= 32);
});

test('admin/customer tokens require expected claims', () => {
  const token = jwt.sign({ sub: 'customer-1', role: 'customer' }, getJwtSecret(), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '1h' });
  const decoded = jwt.verify(token, getJwtSecret(), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
  assert.equal(decoded.role, 'customer');
  assert.throws(() => jwt.verify(token, ['demo', 'secret'].join('-'), { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }));
});

test('URL validation rejects unsafe and non-Google map URLs', () => {
  assert.equal(parseSafeUrl('javascript:alert(1)'), '');
  assert.equal(parseSafeUrl('http://localhost:5000'), '');
  assert.equal(parseSafeUrl('https://example.com', ['google.com']), '');
  assert.match(parseSafeUrl('https://www.google.com/maps?q=Kumasi', ['google.com', 'www.google.com']), /^https:\/\//);
});

test('order items require bounded product IDs and positive integer quantities', () => {
  assert.deepEqual(parseItems([{ productId: 'prod-1', quantity: 2 }]), [{ productId: 'prod-1', quantity: 2 }]);
  assert.equal(parseItems([{ productId: 'prod-1', quantity: -1 }]), null);
  assert.equal(parseItems([{ productId: 'prod-1', quantity: 1.5 }]), null);
});

test('Booking schema includes required persisted data fields', () => {
  const fields = Object.keys(Booking.schema.paths);

  assert.ok(fields.includes('customerName'));
  assert.ok(fields.includes('email'));
  assert.ok(fields.includes('date'));
  assert.ok(fields.includes('time'));
  assert.ok(fields.includes('status'));
  assert.ok(fields.includes('paymentStatus'));
});

test('ContactMessage schema includes required persisted data fields', () => {
  const fields = Object.keys(ContactMessage.schema.paths);

  assert.ok(fields.includes('customerName'));
  assert.ok(fields.includes('email'));
  assert.ok(fields.includes('message'));
  assert.ok(fields.includes('createdAt'));
  assert.ok(fields.includes('status'));
});

test('admin gallery routes support deleting an image record', () => {
  const adminRouter = require('../routes/admin');
  const galleryDeleteRoute = adminRouter.stack.find((layer) => layer.route && layer.route.path === '/gallery/:id');

  assert.ok(galleryDeleteRoute, 'Gallery delete route should exist on the admin router');
  assert.equal(galleryDeleteRoute.route.methods.delete, true, 'Gallery delete route should allow DELETE requests');
});

test('connectDatabase seeds service catalog records when Mongo is empty', async () => {
  const originalConnect = mongoose.connect;
  const originalDeleteMany = Service.deleteMany;
  const originalCountDocuments = Service.countDocuments;
  const originalServiceInsertMany = Service.insertMany;
  const originalProductCountDocuments = Product.countDocuments;
  const originalProductInsertMany = Product.insertMany;
  const originalGalleryCountDocuments = Gallery.countDocuments;
  const originalGalleryInsertMany = Gallery.insertMany;
  const originalSettingsCountDocuments = Settings.countDocuments;
  const originalSettingsCreate = Settings.create;
  const originalSettingsUpdateMany = Settings.updateMany;

  process.env.MONGODB_URI = 'mongodb://localhost:27017/elsbraids-test';
  mongoose.connect = async () => {};
  Service.deleteMany = async () => {};
  Service.countDocuments = async () => 0;
  Product.countDocuments = async () => 0;
  Gallery.countDocuments = async () => 0;
  Settings.countDocuments = async () => 0;
  let insertedServices = [];
  Service.insertMany = async (items) => {
    insertedServices = items;
    return items;
  };
  Product.insertMany = async () => [];
  Gallery.insertMany = async () => [];
  Settings.create = async () => ({ key: 'main' });
  Settings.updateMany = async () => ({ ok: 1 });

  try {
    const result = await connectDatabase();
    assert.equal(result, true);
    assert.ok(insertedServices.length >= sampleServices.length);
    assert.deepEqual(insertedServices.map((service) => service.id).slice(0, 3), sampleServices.map((service) => service.id).slice(0, 3));
  } finally {
    mongoose.connect = originalConnect;
    Service.deleteMany = originalDeleteMany;
    Service.countDocuments = originalCountDocuments;
    Service.insertMany = originalServiceInsertMany;
    Product.countDocuments = originalProductCountDocuments;
    Product.insertMany = originalProductInsertMany;
    Gallery.countDocuments = originalGalleryCountDocuments;
    Gallery.insertMany = originalGalleryInsertMany;
    Settings.countDocuments = originalSettingsCountDocuments;
    Settings.create = originalSettingsCreate;
    Settings.updateMany = originalSettingsUpdateMany;
  }
});
