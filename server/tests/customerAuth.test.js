const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCustomerSignup } = require('../utils/customerAuth');

test('validateCustomerSignup rejects missing required fields', () => {
  const result = validateCustomerSignup({
    fullName: 'Ama',
    email: 'ama@example.com',
    phone: '0240000001',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Password is required'));
});

test('validateCustomerSignup accepts valid payloads', () => {
  const result = validateCustomerSignup({
    fullName: 'Ama Boateng',
    email: 'ama@example.com',
    phone: '0240000001',
    password: 'StrongPass123',
    city: 'Kumasi',
    address: 'Atonsu',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});
