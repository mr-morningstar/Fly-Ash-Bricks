'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../core/middlewares/auth.middleware');
const { authLimiter } = require('../core/middlewares/rateLimit.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} = require('../validations/auth.validation');

router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, validate, authController.resetPassword);

// Authenticated routes
router.get('/me', verifyToken, authController.getMe);
router.put('/change-password', verifyToken, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
