'use strict';

const { validationResult } = require('express-validator');
const { ApiResponse } = require('../responses/ApiResponse');

/**
 * validate — Runs after a chain of express-validator checks.
 * Collects all validation errors and returns a 400 if any exist.
 * Usage:
 *   router.post('/', [...validationChain], validate, controller.create)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return ApiResponse.BadRequest(res, 'Validation failed.', formatted);
  }
  next();
};

module.exports = { validate };
