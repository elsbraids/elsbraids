const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCustomerCredentials } = require('../utils/customerAuth');

test('validateCustomerCredentials rejects empty credentials', () => {
  const result = validateCustomerCredentials({ email: '', password: '' });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Email is required'));
});

test('validateCustomerCredentials requires a minimum password length of 8', () => {
  const result = validateCustomerCredentials({ email: 'ama@example.com', password: 'short' });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Password must be at least 8 characters long'));
});
