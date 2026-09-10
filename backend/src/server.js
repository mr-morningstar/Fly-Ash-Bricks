'use strict';

const path = require('path');
const fs = require('fs');

// Load environment variables FIRST
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { validateEnv } = require('./config/env');
const { logger } = require('./core/logger/winston.logger');

// Validate critical configurations
try {
  validateEnv();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Automatically create upload directories if missing at startup
const uploadPaths = [
  '../uploads',
  '../uploads/avatars',
  '../uploads/logos',
  '../uploads/bills',
  '../uploads/photos',
  '../uploads/qrcodes'
];
uploadPaths.forEach((relPath) => {
  const dir = path.join(__dirname, relPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created missing directory: ${dir}`);
  }
});

const app = require('./app');
const { connectDB } = require('./core/database/connection');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  // Start HTTP Server
  const server = app.listen(PORT, () => {
    logger.info(`🚀 DEV Fly Ash Bricks Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  });

  // Handle unhandled promise rejections outside Express
  process.on('unhandledRejection', (err) => {
    logger.error('🔴 UNHANDLED REJECTION! Shutting down server gracefully...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('🔴 UNCAUGHT EXCEPTION! Shutting down server immediately...', err);
    process.exit(1);
  });
};

startServer();
