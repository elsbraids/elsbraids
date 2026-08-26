const sanitizeText = (value) => String(value ?? '').replace(/[<>]/g, '').trim();

const validateCustomerCredentials = (payload = {}) => {
  const errors = [];
  const email = sanitizeText(payload.email).toLowerCase();
  const password = String(payload.password ?? '').trim();

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (password && password.length < 8) errors.push('Password must be at least 8 characters long');

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email is not valid');
  }

  return { valid: errors.length === 0, errors };
};

const validateCustomerSignup = (payload = {}) => {
  const errors = [];
  const fullName = sanitizeText(payload.fullName);
  const email = sanitizeText(payload.email).toLowerCase();
  const phone = sanitizeText(payload.phone);
  const password = String(payload.password ?? '').trim();
  const city = sanitizeText(payload.city);
  const address = sanitizeText(payload.address);

  if (!fullName) errors.push('Full name is required');
  if (!email) errors.push('Email is required');
  if (!phone) errors.push('Phone number is required');
  if (!password) errors.push('Password is required');
  if (password && password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!city) errors.push('City is required');
  if (!address) errors.push('Address is required');

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email is not valid');
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateCustomerSignup, validateCustomerCredentials };
