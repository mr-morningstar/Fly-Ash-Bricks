'use strict';

const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required.'],
      unique: true,
      trim: true,
    },
    description: { type: String, trim: true },
    maxMembers: { type: Number, default: 20, min: 1 },

    // ── Rate Configuration ───────────────────────────────────────────
    ratePerBrick: {
      type: Number,
      required: [true, 'Rate per brick is required.'],
      min: [0, 'Rate cannot be negative.'],
    },
    splitMethod: {
      type: String,
      enum: {
        values: ['equal', 'fixed'],
        message: 'splitMethod must be "equal" or "fixed".',
      },
      default: 'equal',
      // equal → daily total / present count (weighted by attendance)
      // fixed → each labour gets fixedRate regardless of total
    },
    fixedRatePerHead: {
      type: Number,
      default: 0,
      // Only used when splitMethod === 'fixed'
    },

    // ── Attendance Multipliers ───────────────────────────────────────
    // These are factors applied to each day's share per status.
    // e.g. P=1.0 (full share), HD=0.5, FD=1.2 (bonus), A=0
    attendanceMultipliers: {
      P:  { type: Number, default: 1.0, min: 0 },
      A:  { type: Number, default: 0.0, min: 0 },
      HD: { type: Number, default: 0.5, min: 0 },
      FD: { type: Number, default: 1.0, min: 0 },
    },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GroupSchema.index({ name: 1 });
GroupSchema.index({ isActive: 1 });

const GroupModel = mongoose.models.Group || mongoose.model('Group', GroupSchema);

module.exports = { GroupModel };
