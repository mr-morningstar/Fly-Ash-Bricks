'use strict';

/**
 * ENV Validator — Security Gate
 * Runs at server startup. Hard-fails if critical env vars are missing.
 */
function validateEnv() {
  const required = ['JWT_SECRET', 'MONGO_URI'];
  const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === '');

  if (missing.length > 0) {
    throw new Error(
      `\n\n🔴 FATAL: Missing required environment variables:\n` +
        missing.map((k) => `   ❌ ${k}`).join('\n') +
        `\n\nPlease set them in your .env file and restart the server.\n`
    );
  }

  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

  return {
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_URI: process.env.MONGO_URI,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '5000',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  };
}

module.exports = { validateEnv };
