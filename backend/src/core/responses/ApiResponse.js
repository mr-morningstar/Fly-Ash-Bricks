'use strict';

const { Response } = require('express');

class ApiResponse {
  static Ok(res, data, message = 'Operation Successful') {
    return res.status(200).json({ success: true, statusCode: 200, message, data, errors: null });
  }

  static Created(res, data, message = 'Created Successfully') {
    return res.status(201).json({ success: true, statusCode: 201, message, data, errors: null });
  }

  static BadRequest(res, message, errors = null) {
    return res.status(400).json({ success: false, statusCode: 400, message, data: null, errors });
  }

  static Unauthorized(res, message = 'Unauthorized access', errors = null) {
    return res.status(401).json({ success: false, statusCode: 401, message, data: null, errors });
  }

  static Forbidden(res, message = 'Forbidden. You do not have permission.', errors = null) {
    return res.status(403).json({ success: false, statusCode: 403, message, data: null, errors });
  }

  static NotFound(res, message = 'Resource not found', errors = null) {
    return res.status(404).json({ success: false, statusCode: 404, message, data: null, errors });
  }

  static Conflict(res, message = 'Resource already exists', errors = null) {
    return res.status(409).json({ success: false, statusCode: 409, message, data: null, errors });
  }

  static Error(res, message = 'Internal Server Error', errors = null) {
    return res.status(500).json({ success: false, statusCode: 500, message, data: null, errors });
  }
}

module.exports = { ApiResponse };
