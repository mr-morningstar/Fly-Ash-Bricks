'use strict';

const { logger } = require('../logger/winston.logger');
const { ApiResponse } = require('../responses/ApiResponse');

/**
 * Global Error Handler Middleware
 * Must be registered LAST in app.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, statusCode: 400, message: 'Validation Error', data: null, errors });
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `Duplicate value for '${field}'. Please use a different value.`,
      data: null,
      errors: null,
    });
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, statusCode: 400, message: 'Invalid ID format.', data: null, errors: null });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.Unauthorized(res, 'Invalid or malformed token.');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.Unauthorized(res, 'Session expired. Please log in again.');
  }

  // express-validator ValidationError (via AppError)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      statusCode: err.statusCode || 400,
      message: err.message,
      data: null,
      errors: err.errors || null,
    });
  }

  // Unknown / Programming errors — mask in production
  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode === 500 ? 'Internal Server Error' : err.message;

  return res.status(statusCode).json({ success: false, statusCode, message, data: null, errors: null });
};

module.exports = { errorHandler };
