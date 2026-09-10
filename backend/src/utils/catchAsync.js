'use strict';

/**
 * catchAsync — Wraps async route handlers so uncaught rejections
 * are forwarded to the global errorHandler via next(err).
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { catchAsync };
