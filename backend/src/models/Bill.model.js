'use strict';

const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema(
  {
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    // Attendance breakdown for the billing period
    daysP:  { type: Number, default: 0 },   // Present
    daysA:  { type: Number, default: 0 },   // Absent
    daysHD: { type: Number, default: 0 },   // Half Day
    daysFD: { type: Number, default: 0 },   // Full Day

    gross:           { type: Number, default: 0 }, // Production share (before trip + advance)
    tripEarnings:    { type: Number, default: 0 }, // Earnings from fleet trips (driver + helper)
    totalGross:      { type: Number, default: 0 }, // gross + tripEarnings
    advanceDeducted: { type: Number, default: 0 }, // Amount taken from advanceBalance
    net:             { type: Number, default: 0 }, // Final payable: totalGross - advanceDeducted
  },
  { _id: false }
);

const BillSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required.'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Billing period start date is required.'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Billing period end date is required.'],
    },
    status: {
      type: String,
      enum: { values: ['pending', 'paid'], message: 'Status must be pending or paid.' },
      default: 'pending',
    },
    lineItems: [LineItemSchema],

    totalGross:  { type: Number, default: 0 }, // sum of all lineItem.totalGross
    totalTrip:   { type: Number, default: 0 }, // sum of all lineItem.tripEarnings
    totalNet:    { type: Number, default: 0 }, // sum of all lineItem.net

    pdfPath: { type: String },     // relative path to generated PDF

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidAt: { type: Date },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
BillSchema.index({ group: 1, periodStart: 1, periodEnd: 1 });
BillSchema.index({ status: 1 });
BillSchema.index({ createdAt: -1 });

const BillModel = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

module.exports = { BillModel };
