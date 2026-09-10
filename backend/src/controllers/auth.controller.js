'use strict';

const jwt = require('jsonwebtoken');
const { UserModel } = require('../models/User.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const crypto = require('crypto');

/** Generate JWT Token */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/** Send Token in httpOnly Cookie + Response Body */
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    token,
    data: { user },
    errors: null
  });
};

class AuthController {
  /** Login User */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      let normalizedEmail = (email || '').trim().toLowerCase();
      if (normalizedEmail === 'admin@devbricks.in') {
        normalizedEmail = 'admin@devbricks.com';
      }

      const user = await UserModel.findOne({ email: normalizedEmail }).select('+password').populate('role');
      if (!user || !user.isActive) {
        return next(new AppError('Incorrect email or password, or your account is deactivated.', 401));
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return next(new AppError('Incorrect email or password.', 401));
      }

      return createSendToken(user, 200, res, 'Logged in successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Logout User (clears cookie) */
  logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    return ApiResponse.Ok(res, null, 'Logged out successfully.');
  };

  /** Get Current User Profile */
  getMe = async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user.id).populate('role');
      return ApiResponse.Ok(res, { user });
    } catch (err) {
      next(err);
    }
  };

  /** Forgot Password */
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email });
      if (!user) {
        return next(new AppError('There is no user with that email address.', 404));
      }

      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // In real prod we'd send an email. For DEV, we'll return the token in the API response 
      // so it's easy to reset password from local/Postman/frontend without setting up SMTP.
      const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

      return ApiResponse.Ok(res, {
        resetToken,
        resetUrl,
        message: 'Password reset link generated (sent in response for convenience).'
      }, 'Token generated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Reset Password */
  resetPassword = async (req, res, next) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

      const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      }).populate('role');

      if (!user) {
        return next(new AppError('Token is invalid or has expired.', 400));
      }

      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return createSendToken(user, 200, res, 'Password reset successfully. You are now logged in.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AuthController();
