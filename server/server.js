require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { validateProductionEnvironment, isProduction } = require('./config/security');
const { contentSecurityPolicy } = require('./config/headers');
const { inMemoryStore } = require('./data/sampleData');

const { connectDatabase } = require('./config/db');
const { seedSampleData } = require('./data/sampleData');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 5000;

validateProductionEnvironment();

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
  inMemoryStore.admin = { id: 'admin-configured', email: process.env.ADMIN_EMAIL.toLowerCase(), password: process.env.ADMIN_PASSWORD_HASH, name: process.env.ADMIN_NAME || 'Administrator' };
}
seedSampleData();

const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  'https://elsbraids.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed.'));
    },
    credentials: true,
  }),
);
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: { directives: Object.fromEntries(contentSecurityPolicy.split('; ').map((directive) => {
    const [name, ...values] = directive.split(' ');
    return [name, values];
  })) },
  frameguard: { action: 'sameorigin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

// IMPORTANT: Webhooks must be mounted before express.json() so they can access the raw body Buffer for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  }),
);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EL\'S BRAIDS API is running', timestamp: new Date().toISOString() });
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const start = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  } catch (error) {
    console.error('Database startup failed.');
    if (isProduction) process.exit(1);
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  }
};

start();
