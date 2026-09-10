'use strict';

const jwt = require('jsonwebtoken');
const { ApiResponse } = require('../responses/ApiResponse');
const { UserModel } = require('../../models/User.model');

/**
 * verifyToken — Extracts JWT from:
 *   1. Authorization: Bearer <token>  (mobile / Postman)
 *   2. req.cookies.jwt               (browser httpOnly cookie)
 * Attaches decoded payload to req.user.
 */
const verifyToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return ApiResponse.Unauthorized(res, 'Access denied. No token provided.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user doc (so we have up-to-date role/permissions)
    const user = await UserModel.findById(decoded.id).populate('role').select('-password');
    if (!user || !user.isActive) {
      return ApiResponse.Unauthorized(res, 'User no longer exists or is inactive.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.Unauthorized(res, 'Session expired. Please log in again.');
    }
    return ApiResponse.Unauthorized(res, 'Invalid token.');
  }
};

/**
 * checkPermission — Checks if the logged-in user's role has the required permission.
 * Usage: router.get('/', verifyToken, checkPermission('labour.view'), controller.list)
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return ApiResponse.Unauthorized(res, 'No role assigned.');
    }
    // Super Admin always passes
    if (user.role.name === 'Super Admin') {
      return next();
    }
    if (!user.role.permissions || !user.role.permissions.includes(permission)) {
      return ApiResponse.Forbidden(res, `Permission denied: '${permission}' is required.`);
    }
    next();
  };
};

/**
 * requireRole — Restricts access to specific role names.
 * Usage: router.delete('/:id', verifyToken, requireRole(['Super Admin']), controller.hardDelete)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return ApiResponse.Unauthorized(res, 'No role assigned.');
    }
    if (!roles.includes(req.user.role.name)) {
      return ApiResponse.Forbidden(res, `This action requires one of these roles: ${roles.join(', ')}.`);
    }
    next();
  };
};

module.exports = { verifyToken, checkPermission, requireRole };
