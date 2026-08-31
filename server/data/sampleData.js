const crypto = require('crypto');

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const makeId = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const resolveGoogleMapsEmbed = async (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const allowedHosts = ['google.com', 'www.google.com', 'maps.google.com', 'www.google.com.gh'];
    if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname.toLowerCase())) return '';
    if (parsed.pathname.includes('/maps/embed')) return parsed.toString();
    const coordinates = parsed.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    return coordinates ? `https://www.google.com/maps?q=${coordinates[1]},${coordinates[2]}&z=17&output=embed` : '';
  } catch {
    return '';
  }
};

const sampleServices = [
  {
    id: 'svc-1',
    name: 'Knotless Braids',
    description: 'Lightweight, versatile knotless braids designed for comfort and long-lasting beauty.',
    price: 250,
    duration: '3 - 5 hours',
    category: 'Braids',
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
  {
    id: 'svc-2',
    name: 'Italian Curls',
    description: 'Soft, glossy curls that bring fullness, volume, and a polished finish.',
    price: 300,
    duration: '3 - 4 hours',
    category: 'Curls',
    images: ['https://images.unsplash.com/photo-1521590832167-7e5d18d02b3c?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
  {
    id: 'svc-3',
    name: 'French Curls',
    description: 'Elegant, bouncy curls crafted to frame the face and enhance natural texture.',
    price: 280,
    duration: '2 - 4 hours',
    category: 'Curls',
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
  {
    id: 'svc-4',
    name: 'Bone Straight Braids',
    description: 'Ultra sleek straight braids for a polished, sophisticated appearance.',
    price: 260,
    duration: '4 - 5 hours',
    category: 'Braids',
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
  {
    id: 'svc-5',
    name: 'Kinky Braids',
    description: 'Natural-looking kinky braids that add texture and confidence with low-maintenance styling.',
    price: 240,
    duration: '3 - 5 hours',
    category: 'Braids',
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
  {
    id: 'svc-6',
    name: 'Piercings',
    description: 'Professional piercing services with hygiene-focused care and modern styling.',
    price: 95,
    duration: '30 - 45 mins',
    category: 'Piercing',
    images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    isActive: true,
  },
];

const sampleProducts = [
  { id: 'prod-1', name: 'Braiding Hair', price: 120, category: 'Haircare', stock: 42, sku: 'BRAID-001', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Premium braiding hair for long-lasting styles and smooth installation.' },
  { id: 'prod-2', name: 'Edge Control', price: 60, category: 'Styling', stock: 18, sku: 'EDGE-002', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Helps define edges for a neat, polished finish.' },
  { id: 'prod-3', name: 'Hair Oil', price: 75, category: 'Haircare', stock: 27, sku: 'OIL-003', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Nourishing hair oil to support shine and scalp wellness.' },
  { id: 'prod-4', name: 'Hair Mousse', price: 82, category: 'Styling', stock: 14, sku: 'MOUSSE-004', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Lightweight styling mousse for definition and volume.' },
  { id: 'prod-5', name: 'Shampoo', price: 90, category: 'Haircare', stock: 35, sku: 'SHAMPOO-005', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Gentle formula for soft, clean, healthy hair.' },
  { id: 'prod-6', name: 'Conditioner', price: 95, category: 'Haircare', stock: 30, sku: 'COND-006', images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'], isActive: true, description: 'Hydrating conditioner to keep hair smooth and manageable.' },
];

const sampleGallery = [
  { id: 'gal-1', title: 'Braids styling session', category: 'Braids', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'gal-2', title: 'Curls transformation', category: 'Curls', image: 'https://images.unsplash.com/photo-1521590832167-7e5d18d02b3c?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'gal-3', title: 'Piercing studio visit', category: 'Piercing', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', isActive: true },
];

const sampleSettings = {
  businessName: "EL'S BRAIDS",
  phone: '0553971315',
  email: 'hello@elsbraids.com',
  location: 'Atonsu, Kumasi, Ghana',
  businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
  aboutText: 'EL\'S BRAIDS provides premium braiding, piercing, and beauty services in Kumasi with a warm, professional touch.',
  homepageText: 'Beautiful Hair. Beautiful You.',
  socials: {
    instagram: '#',
    facebook: '#',
    whatsapp: '#',
    tiktok: '',
    snapchat: '',
  },
};

const sampleBookings = [
  {
    id: 'bk-001',
    customerName: 'Akosua Mensah',
    phone: '0240000001',
    email: 'akosua@example.com',
    serviceName: 'Knotless Braids',
    date: '2026-08-25',
    time: '10:00 AM',
    notes: '',
    status: 'Pending',
    reference: 'ELS-2026-00125',
  },
];

const sampleOrders = [
  {
    id: 'ord-001',
    customerName: 'Ama Boateng',
    email: 'ama@example.com',
    phone: '0240000002',
    address: '12 Lake Road, Ahodwo',
    region: 'Ashanti',
    city: 'Kumasi',
    deliveryLocation: 'Home delivery',
    googleLocation: '12 Lake Road, Ahodwo, Kumasi',
    notes: 'Please call before delivery.',
    total: 320,
    status: 'Pending',
    paymentStatus: 'Pending',
    items: [{ name: 'Braiding Hair', quantity: 2, price: 120 }],
  },
];

const sampleCustomers = [
  {
    id: 'cust-1',
    name: 'Akosua Mensah',
    email: 'akosua@example.com',
    phone: '0240000001',
    bookings: 1,
    orders: 1,
    registeredAt: '2026-08-01T00:00:00.000Z',
  },
];

const inMemoryStore = {
  services: [],
  products: sampleProducts,
  gallery: sampleGallery,
  settings: sampleSettings,
  bookings: sampleBookings,
  orders: sampleOrders,
  customers: sampleCustomers,
  customerAccounts: [],
  contactMessages: [],
  admin: null,
};

const seedSampleData = () => {
  const store = global.__ELS_STORE__ || inMemoryStore;
  global.__ELS_STORE__ = store;
  return store;
};

module.exports = {
  sampleServices,
  sampleProducts,
  sampleGallery,
  sampleSettings,
  seedSampleData,
  inMemoryStore,
  slugify,
  makeId,
  resolveGoogleMapsEmbed,
};
