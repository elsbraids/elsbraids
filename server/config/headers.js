const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://upload-widget.cloudinary.com https://js.paystack.co https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://elsbraids.vercel.app https://elsbraids.onrender.com https://api.paystack.co https://api.cloudinary.com https://res.cloudinary.com https://accounts.google.com https://oauth2.googleapis.com https://openidconnect.googleapis.com",
  "frame-src https://www.google.com https://checkout.paystack.com https://paystack.com https://upload-widget.cloudinary.com https://widget.cloudinary.com https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com https://paystack.com https://accounts.google.com",
  "frame-ancestors 'self'",
].join('; ');

module.exports = { contentSecurityPolicy };
