'use strict';

const mongoose = require('mongoose');

/**
 * Settings — Singleton document.
 * Only one doc should ever exist. Controllers enforce this.
 */
const SettingsSchema = new mongoose.Schema(
  {
    companyName:    { type: String, trim: true, default: 'DEV Bricks' },
    companyAddress: { type: String, trim: true },
    companyPhone:   { type: String, trim: true },
    companyEmail:   { type: String, trim: true },
    gstNumber:      { type: String, trim: true },
    logoPath:       { type: String },  // relative upload path

    bankDetails: {
      bankName:      { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc:          { type: String, trim: true },
      branch:        { type: String, trim: true },
      upiId:         { type: String, trim: true },
    },

    // ── Production Settings ──────────────────────────────────────────────
    shiftTimings: {
      morning:   { type: String, default: '06:00 - 12:00' },
      afternoon: { type: String, default: '12:00 - 18:00' },
      full:      { type: String, default: '06:00 - 18:00' },
    },
    brickStandardWeight: { type: Number, default: 3.5 }, // kg per brick

    // Mix ratio (% by weight) — informational for reports
    defaultMixRatio: {
      flyAsh:   { type: Number, default: 62 },
      lime:     { type: Number, default: 12 },
      gypsum:   { type: Number, default: 5  },
      sand:     { type: Number, default: 21 },
    },

    // ── Inventory Alerts ─────────────────────────────────────────────────
    lowStockAlertThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },

    // ── Currency / locale ────────────────────────────────────────────────
    currencySymbol: { type: String, default: '₹' },
    // ── Dropdown Configurations ──────────────────────────────────────────
    materialUnits: { 
      type: [String], 
      default: ['tons', 'kg', 'bags', 'liters', 'units', 'm³'] 
    },
    productionLabels: { 
      type: [String], 
      default: ['Line A', 'Line B', 'Plant 1', 'Plant 2'] 
    },
  },
  { timestamps: true }
);

const SettingsModel =
  mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

module.exports = { SettingsModel };
