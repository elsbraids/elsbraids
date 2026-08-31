const mongoose = require('mongoose');
const { Product, Service, Gallery, Settings } = require('../models');
const { sampleProducts, sampleServices, sampleGallery, sampleSettings } = require('../data/sampleData');

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production.');
    console.log('No MONGODB_URI provided. Running in local demo mode.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    // Clean up any previously seeded sample services
    await Service.deleteMany({ id: { $regex: /^svc-/ } });

    if (process.env.NODE_ENV !== 'production' || process.env.SEED_SAMPLE_DATA === 'true') {
      if (await Product.countDocuments() === 0) await Product.insertMany(sampleProducts.map(({ id, ...item }) => ({ ...item, id })));
      if (await Gallery.countDocuments() === 0) await Gallery.insertMany(sampleGallery);
      if (await Settings.countDocuments() === 0) await Settings.create({ key: 'main', ...sampleSettings });
    }
    // Migration: stamp key:'main' on any settings doc that was created before this field existed
    await Settings.updateMany({ key: { $exists: false } }, { $set: { key: 'main' } });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') throw error;
    return false;
  }
};

module.exports = { connectDatabase };
