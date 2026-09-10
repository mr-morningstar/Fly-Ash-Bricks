'use strict';

const mongoose = require('mongoose');

/**
 * TripHelper — Embedded sub-document inside Trip.
 * Represents a labour (registered or manual) who assisted with loading/unloading.
 * If labourRef is set, the billing controller will add totalCost to that labour's
 * tripEarnings in the billing line item for the relevant period.
 */
const TripHelperSchema = new mongoose.Schema(
  {
    // Optional ref to a registered Labour — enables billing integration
    labourRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      default: null,
    },
    name:    { type: String, trim: true }, // manual name if no labourRef
    contact: { type: String, trim: true },
    role: {
      type: String,
      enum: ['loading', 'unloading', 'both', 'other'],
      default: 'both',
    },
    tripsCount: {
      type: Number,
      default: 1,
      min: [1, 'Trips count must be at least 1.'],
    },
    costPerTrip: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Auto-computed: tripsCount × costPerTrip
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

/**
 * Trip — Fleet Delivery record.
 * Manages brick deliveries from yard to customer/site.
 * Billing Impact: helpers with labourRef + driver with labourRef
 *   → their totalCost is added to billing line items as tripEarnings.
 */
const TripSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Trip date is required.'],
      default: Date.now,
    },
    customerName: {
      type: String,
      trim: true,
    },
    villageName: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Delivery destination is required.'],
      trim: true,
    },
    bricksDelivered: {
      type: Number,
      default: 0,
      min: 0,
    },
    tripsCount: {
      type: Number,
      required: [true, 'Number of trips is required.'],
      min: [1, 'At least 1 trip is required.'],
    },
    ratePerTrip: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Auto-computed: tripsCount × ratePerTrip
    totalTripCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Driver Details ──────────────────────────────────────────────────
    driver: {
      // Optional ref — if driver is a registered labour, billing adds
      // totalTripCost as tripEarnings for that labour
      labourRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        default: null,
      },
      name:          { type: String, trim: true },
      contact:       { type: String, trim: true },
      vehicleNumber: { type: String, trim: true, uppercase: true },
      vehicleType:   { type: String, trim: true }, // truck, tractor, tempo, etc.
    },

    // ── Loading / Unloading Helpers ─────────────────────────────────────
    helpers: [TripHelperSchema],

    // ── Auto-computed totals ────────────────────────────────────────────
    totalHelperCost: { type: Number, default: 0, min: 0 },
    grandTotal:      { type: Number, default: 0, min: 0 },

    notes:     { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Business Rule: Compute all totals before validation ──────────────────
TripSchema.pre('validate', function (next) {
  // Helper sub-doc totals
  let totalHelperCost = 0;
  if (Array.isArray(this.helpers)) {
    this.helpers.forEach((h) => {
      h.totalCost = Math.round((h.tripsCount || 0) * (h.costPerTrip || 0) * 100) / 100;
      totalHelperCost += h.totalCost;
    });
  }
  this.totalHelperCost = Math.round(totalHelperCost * 100) / 100;

  // Trip cost
  this.totalTripCost =
    Math.round((this.tripsCount || 0) * (this.ratePerTrip || 0) * 100) / 100;

  // Grand total
  this.grandTotal = Math.round((this.totalTripCost + this.totalHelperCost) * 100) / 100;

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
TripSchema.index({ date: -1 });
TripSchema.index({ destination: 1 });
TripSchema.index({ 'driver.labourRef': 1 });
TripSchema.index({ 'helpers.labourRef': 1 });
// For billing integration: fetch trips by date range quickly
TripSchema.index({ date: 1, 'driver.labourRef': 1 });

const TripModel = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

module.exports = { TripModel };
