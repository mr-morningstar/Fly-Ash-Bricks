'use strict';

const { SettingsModel } = require('../models/Settings.model');
const { RoleModel } = require('../models/Role.model');
const { UserModel } = require('../models/User.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const fs = require('fs');
const path = require('path');

class SettingsController {
  /** Get Company Settings (Singleton) */
  getSettings = async (req, res, next) => {
    try {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = await SettingsModel.create({});
      }
      return ApiResponse.Ok(res, settings, 'Settings loaded.');
    } catch (err) {
      next(err);
    }
  };

  /** Update Company Settings (Logo support) */
  updateSettings = async (req, res, next) => {
    try {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = new SettingsModel();
      }

      const data = { ...req.body };
      
      // Parse bankDetails if sent as string from form data
      if (typeof data.bankDetails === 'string') {
        try {
          data.bankDetails = JSON.parse(data.bankDetails);
        } catch (e) {
          return next(new AppError('Invalid format for bankDetails JSON.', 400));
        }
      }

      if (req.file) {
        if (settings.logoPath) {
          const oldPath = path.join(__dirname, '../../', settings.logoPath);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        data.logoPath = `uploads/logos/${req.file.filename}`;
      }

      Object.assign(settings, data);
      await settings.save();

      return ApiResponse.Ok(res, settings, 'Settings updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Get all Roles */
  getRoles = async (req, res, next) => {
    try {
      const roles = await RoleModel.find();
      return ApiResponse.Ok(res, roles, 'Roles list retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /** Create custom Role */
  createRole = async (req, res, next) => {
    try {
      const { name, permissions, description } = req.body;

      const existing = await RoleModel.findOne({ name });
      if (existing) {
        return next(new AppError('A role with this name already exists.', 400));
      }

      const role = await RoleModel.create({
        name,
        permissions,
        description,
        isDefault: false,
        isEditable: true
      });

      return ApiResponse.Created(res, role, 'Custom Role created successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Update Role (protect default/Super Admin) */
  updateRole = async (req, res, next) => {
    try {
      const { name, permissions, description } = req.body;
      const role = await RoleModel.findById(req.params.id);
      if (!role) {
        return next(new AppError('Role not found.', 404));
      }

      if (role.name === 'Super Admin' && name && name !== 'Super Admin') {
        return next(new AppError('The Super Admin role name cannot be renamed.', 403));
      }

      if (name && name !== role.name) {
        const existing = await RoleModel.findOne({ name, _id: { $ne: role._id } });
        if (existing) {
          return next(new AppError('A role with this name already exists.', 400));
        }
        role.name = name;
      }

      if (permissions && Array.isArray(permissions)) {
        // Super Admin must retain all permissions
        if (role.name === 'Super Admin') {
          // keep Super Admin permissions intact
        } else {
          role.permissions = permissions;
        }
      }

      if (description !== undefined) {
        role.description = description;
      }

      await role.save();

      return ApiResponse.Ok(res, role, 'Role details updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Delete Role (check if assigned) */
  deleteRole = async (req, res, next) => {
    try {
      const role = await RoleModel.findById(req.params.id);
      if (!role) {
        return next(new AppError('Role not found.', 404));
      }

      if (role.isDefault || !role.isEditable) {
        return next(new AppError('System default roles cannot be deleted.', 400));
      }

      // Check if any user is currently assigned to this role
      const usersAssigned = await UserModel.countDocuments({ role: role._id });
      if (usersAssigned > 0) {
        return next(new AppError(`Cannot delete role. It is currently assigned to ${usersAssigned} users.`, 400));
      }

      await RoleModel.findByIdAndDelete(req.params.id);

      return ApiResponse.Ok(res, null, 'Custom role deleted successfully.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new SettingsController();
