'use strict';

const mongoose = require('mongoose');

/**
 * Driver Model
 * Manages drivers who can deliver brick trips.
 * A driver can be a standalone driver OR linked to a registered labour.
 * Each driver has a default trip rate (e.g. ₹500/trip) and a helper rate
 * (if they go as loading/unloading helper with another driver).
 */
const DriverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required.'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['Truck', 'Tractor', 'Dumper', 'Tempo', 'Other'],
      default: 'Truck',
    },
    // Default payment rate to driver per delivery trip
    defaultTripRate: {
      type: Number,
      default: 500,
      min: [0, 'Trip rate cannot be negative.'],
    },
    // Rate paid if this driver goes as helper (loading/unloading) with another driver
    helperRate: {
      type: Number,
      default: 150,
      min: [0, 'Helper rate cannot be negative.'],
    },
    // Optional link to registered Labour
    labourRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

DriverSchema.index({ name: 1 });
DriverSchema.index({ phone: 1 });
DriverSchema.index({ vehicleNumber: 1 });
DriverSchema.index({ labourRef: 1 });

const DriverModel = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);

module.exports = { DriverModel };
