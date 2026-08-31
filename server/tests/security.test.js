const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } = require('../config/security');
const { parseSafeUrl, parseItems } = require('../utils/requestValidation');
const { Booking, ContactMessage } = require('../models');

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
