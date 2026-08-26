const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';
const JWT_ISSUER = 'els-braids-api';
const JWT_AUDIENCE = 'els-braids-web';

const createJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isProduction) throw new Error('JWT_SECRET is required in production.');
  return crypto.randomBytes(48).toString('hex');
};

const JWT_SECRET = createJwtSecret();
const getJwtSecret = () => JWT_SECRET;

const validateProductionEnvironment = () => {
  if (!isProduction) return;

  const required = ['JWT_SECRET', 'CLIENT_URL', 'MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production.');

  let clientUrl;
  try {
    clientUrl = new URL(process.env.CLIENT_URL);
  } catch {
    throw new Error('CLIENT_URL must be a valid URL in production.');
  }
  if (clientUrl.protocol !== 'https:') throw new Error('CLIENT_URL must use HTTPS in production.');
  if (!/^\$2[aby]?\$\d{2}\$/.test(process.env.ADMIN_PASSWORD_HASH)) {
    throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash.');
  }
};

const jwtOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  expiresIn: '1h',
};

module.exports = { isProduction, JWT_ISSUER, JWT_AUDIENCE, getJwtSecret, jwtOptions, validateProductionEnvironment };
