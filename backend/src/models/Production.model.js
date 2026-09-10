'use strict';

const mongoose = require('mongoose');

// ── Material consumption sub-document ────────────────────────────────────
const MaterialConsumptionSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative.'],
    },
  },
  { _id: false }
);

const ProductionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required.'],
    },
    date: {
      type: Date,
      required: [true, 'Production date is required.'],
    },
    shift: {
      type: String,
      enum: { values: ['morning', 'afternoon', 'full'], message: 'Shift must be morning, afternoon, or full.' },
      default: 'full',
    },
    totalBricks: {
      type: Number,
      required: [true, 'Total bricks count is required.'],
      min: [0, 'Total bricks cannot be negative.'],
    },
    trips: {
      type: Number,
      default: 0,
      min: [0, 'Trips cannot be negative.'],
    },
    // Snapshot of rate at entry time — prevents historical records from
    // being affected if the group's ratePerBrick is later changed.
    ratePerBrick: {
      type: Number,
      required: [true, 'Rate per brick is required.'],
      min: [0, 'Rate cannot be negative.'],
    },
    // Auto-computed server-side — NEVER accept from client
    totalAmount: {
      type: Number,
      min: 0,
    },
    // Optional: materials consumed in this production run
    // Each entry will decrement Inventory.currentStock via post-save hook
    materialConsumption: [MaterialConsumptionSchema],

    notes: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// ── Business Rule: totalAmount is always computed server-side ─────────────
ProductionSchema.pre('validate', function (next) {
  if (this.totalBricks != null && this.ratePerBrick != null) {
    this.totalAmount = Math.round(this.totalBricks * this.ratePerBrick * 100) / 100;
  }
  next();
});

// ── Post-save: decrement inventory stock for consumed materials ───────────
ProductionSchema.post('save', async function (doc) {
  if (!doc.materialConsumption || doc.materialConsumption.length === 0) return;
  try {
    const { InventoryModel } = require('./Inventory.model');
    const ops = doc.materialConsumption.map((item) =>
      InventoryModel.findByIdAndUpdate(item.inventoryItem, {
        $inc: { currentStock: -item.quantity },
      })
    );
    await Promise.all(ops);
  } catch (err) {
    console.error('[Production] Failed to update inventory on production save:', err.message);
  }
});

// ── Indexes ───────────────────────────────────────────────────────────────
// One production record per group per day
ProductionSchema.index({ group: 1, date: 1 }, { unique: true });
// Date-range queries for dashboard/reports
ProductionSchema.index({ date: -1 });

const ProductionModel =
  mongoose.models.Production || mongoose.model('Production', ProductionSchema);

module.exports = { ProductionModel };
