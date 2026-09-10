'use strict';

const mongoose = require('mongoose');
const { logger } = require('../logger/winston.logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      logger.error('❌ MONGO_URI is not defined in environment variables');
      process.exit(1);
    }

    // Mask password for safe logging
    const maskedUri = mongoUri.replace(/:([^:@]{3,})@/, ':****@');
    logger.info(`Attempting to connect to MongoDB: ${maskedUri}`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
