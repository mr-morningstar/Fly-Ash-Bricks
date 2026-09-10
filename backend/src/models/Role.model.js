'use strict';

const mongoose = require('mongoose');
const { ALL_PERMISSIONS } = require('../config/permissions');

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required.'],
      unique: true,
      trim: true,
    },
    permissions: {
      type: [String],
      enum: {
        values: ALL_PERMISSIONS,
        message: '"{VALUE}" is not a valid permission.',
      },
      default: [],
    },
    isDefault: { type: Boolean, default: false },   // seeded roles
    isEditable: { type: Boolean, default: true },   // Super Admin role is not editable
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const RoleModel = mongoose.models.Role || mongoose.model('Role', RoleSchema);

module.exports = { RoleModel };
