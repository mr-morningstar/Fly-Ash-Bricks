'use strict';

const { UserModel } = require('../models/User.model');
const { RoleModel } = require('../models/Role.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { generateQRCode } = require('../utils/qrGenerator');
const fs = require('fs');
const path = require('path');

/** Helper to generate clean unique URL slug from name */
const generateSlug = (name) => {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-${rand}`;
};

class UserController {
  /** Create User (Manager/Admin action) */
  createUser = async (req, res, next) => {
    try {
      const data = { ...req.body };

      // Check if email already taken
      const existing = await UserModel.findOne({ email: data.email });
      if (existing) {
        return next(new AppError('A user with this email address already exists.', 400));
      }

      // Verify Role exists
      const role = await RoleModel.findById(data.role);
      if (!role) {
        return next(new AppError('Specified Role does not exist.', 404));
      }

      // Generate public profile slug & QR code
      data.publicSlug = generateSlug(data.name);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      data.qrCodePath = await generateQRCode(data.publicSlug, clientUrl);

      if (req.file) {
        data.avatar = `uploads/avatars/${req.file.filename}`;
      }

      const user = await UserModel.create(data);
      user.password = undefined;

      return ApiResponse.Created(res, user, 'User created successfully with public profile QR.');
    } catch (err) {
      next(err);
    }
  };

  /** Get list of users */
  getAllUsers = async (req, res, next) => {
    try {
      const features = new APIFeatures(UserModel.find().populate('role'), req.query)
        .search(['name', 'email', 'phone'])
        .filter()
        .sort()
        .paginate();

      const users = await features.query;
      const total = await UserModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, {
        users,
        total,
        page: features.page,
        limit: features.limit
      }, 'Users list loaded.');
    } catch (err) {
      next(err);
    }
  };

  /** Get Single User */
  getUser = async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.id).populate('role');
      if (!user) {
        return next(new AppError('User not found.', 404));
      }
      return ApiResponse.Ok(res, user, 'User details loaded.');
    } catch (err) {
      next(err);
    }
  };

  /** Update User (Manager/Admin action) */
  updateUser = async (req, res, next) => {
    try {
      const data = { ...req.body };
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      if (data.email && data.email !== user.email) {
        const existing = await UserModel.findOne({ email: data.email });
        if (existing) {
          return next(new AppError('Email is already taken.', 400));
        }
      }

      if (data.role) {
        const role = await RoleModel.findById(data.role);
        if (!role) {
          return next(new AppError('Specified Role does not exist.', 404));
        }
      }

      if (req.file) {
        if (user.avatar) {
          const oldPath = path.join(__dirname, '../../', user.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        data.avatar = `uploads/avatars/${req.file.filename}`;
      }

      // If password is sent, hash it via model save hook (or if direct update, it's processed on model save)
      // Mongoose save middleware handles it, so we assign fields and call save()
      Object.assign(user, data);
      await user.save();

      const updated = await UserModel.findById(user._id).populate('role');

      return ApiResponse.Ok(res, updated, 'User details updated.');
    } catch (err) {
      next(err);
    }
  };

  /** Delete User */
  deleteUser = async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return next(new AppError('User not found.', 404));
      }

      // Prevent self deletion
      if (String(user._id) === String(req.user._id)) {
        return next(new AppError('You cannot delete your own admin account.', 400));
      }

      // Delete files
      if (user.avatar) {
        const pathAv = path.join(__dirname, '../../', user.avatar);
        if (fs.existsSync(pathAv)) fs.unlinkSync(pathAv);
      }
      if (user.qrCodePath) {
        const pathQr = path.join(__dirname, '../../', user.qrCodePath);
        if (fs.existsSync(pathQr)) fs.unlinkSync(pathQr);
      }

      await UserModel.findByIdAndDelete(req.params.id);

      return ApiResponse.Ok(res, null, 'User deleted successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Update own profile details (theme, phone, avatar, name) */
  updateMyProfile = async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return next(new AppError('User session invalid.', 401));
      }

      const { name, phone, theme } = req.body;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (theme) user.theme = theme;

      if (req.file) {
        if (user.avatar) {
          const oldPath = path.join(__dirname, '../../', user.avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        user.avatar = `uploads/avatars/${req.file.filename}`;
      }

      await user.save();
      const updated = await UserModel.findById(user._id).populate('role');

      return ApiResponse.Ok(res, updated, 'Profile settings updated.');
    } catch (err) {
      next(err);
    }
  };

  /** Update password (self action) */
  updateMyPassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return next(new AppError('Please provide both current and new passwords.', 400));
      }

      const user = await UserModel.findById(req.user.id).select('+password');
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return next(new AppError('Current password is incorrect.', 401));
      }

      user.password = newPassword;
      await user.save();

      return ApiResponse.Ok(res, null, 'Password changed successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Get User QR code path */
  getUserQR = async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return next(new AppError('User not found.', 404));

      // Regenerate if missing
      if (!user.qrCodePath) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        user.qrCodePath = await generateQRCode(user.publicSlug || generateSlug(user.name), clientUrl);
        await user.save();
      }

      return ApiResponse.Ok(res, { qrCodePath: user.qrCodePath }, 'User profile QR retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /** Public endpoint for viewing profile via slug (unauthenticated) */
  getPublicProfile = async (req, res, next) => {
    try {
      const user = await UserModel.findOne({ publicSlug: req.params.slug }).select('name email phone avatar role').populate('role', 'name');
      if (!user) {
        return next(new AppError('Profile not found.', 404));
      }
      return ApiResponse.Ok(res, user, 'Public profile details.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new UserController();
