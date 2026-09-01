const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, required: true },
    images: [{ type: String }],
    videos: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, required: true, unique: true },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    serviceName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, default: '' },
    googleLocation: { type: String, default: '' },
    notes: { type: String, default: '' },
    bookingImage1: { type: String, default: '' },
    bookingImage2: { type: String, default: '' },
    paymentOption: { type: String, enum: ['half', 'full'], default: 'full' },
    paymentAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
    deliveryLocation: { type: String, required: true },
    googleLocation: { type: String, default: '' },
    notes: { type: String, default: '' },
    paymentOption: { type: String, enum: ['half', 'full'] },
    paymentAmount: { type: Number, min: 0 },
    items: [{ productId: String, name: String, quantity: { type: Number, min: 1 }, price: { type: Number, min: 0 } }],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['GHS'], default: 'GHS' },
    paymentReference: { type: String, required: true, unique: true, index: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true },
);

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    reference: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['GHS'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], required: true },
  },
  { timestamps: true },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    bookings: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    passwordHash: { type: String, select: false },
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpFailedAttempts: { type: Number, default: 0 },
    city: { type: String, maxlength: 100 },
    address: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

const gallerySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, enum: ['All', 'Braids', 'Curls', 'Piercing', 'Other'], default: 'Other' },
    image: { type: String },
    video: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Gallery records in this app intentionally use string IDs like "gallery-abcdef12".
// Keep the schema compatible with those IDs and avoid casting them to ObjectId.

const contactMessageSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    name: { type: String, default: '' },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Unread', 'Read'], default: 'Unread' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const settingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: "EL'S BRAIDS" },
    phone: { type: String, default: '0553971315' },
    email: { type: String, default: 'hello@elsbraids.com' },
    location: { type: String, default: 'Atonsu, Kumasi, Ghana' },
    googleMapsUrl: { type: String, default: '' },
    googleMapsEmbedUrl: { type: String, default: '' },
    businessHours: { type: String, default: 'Mon - Sat: 9:00 AM - 7:00 PM' },
    aboutText: { type: String, default: 'Professional braiding, piercing and beauty services in Kumasi.' },
    homepageText: { type: String, default: 'Beautiful Hair. Beautiful You.' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    heroImages: [{ type: String }],
    socials: {
      instagram: { type: String, default: '#' },
      facebook: { type: String, default: '#' },
      whatsapp: { type: String, default: '#' },
      tiktok: { type: String, default: '' },
      snapchat: { type: String, default: '' },
    },
    key: { type: String, default: 'main', index: true },
  },
  { timestamps: true },
);

const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ['Customer', 'Admin'], required: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    type: { type: String, enum: ['Booking', 'Purchase', 'Reminder', 'Status', 'Security'], required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    relatedData: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = {
  Admin: mongoose.model('Admin', adminSchema),
  Service: mongoose.model('Service', serviceSchema),
  Product: mongoose.model('Product', productSchema),
  Booking: mongoose.model('Booking', bookingSchema),
  Order: mongoose.model('Order', orderSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Customer: mongoose.model('Customer', customerSchema),
  Gallery: mongoose.model('Gallery', gallerySchema),
  ContactMessage: mongoose.model('ContactMessage', contactMessageSchema),
  Settings: mongoose.model('Settings', settingsSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
