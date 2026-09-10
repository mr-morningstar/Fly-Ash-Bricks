'use strict';

const mongoose = require('mongoose');

/**
 * MaterialInward — Records every inbound delivery of raw material to the yard.
 * On create → Inventory.currentStock += quantity.
 * On delete → Inventory.currentStock -= quantity.
 */
const MaterialInwardSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory item reference is required.'],
    },
    date: {
      type: Date,
      required: [true, 'Receipt date is required.'],
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity received is required.'],
      min: [0.001, 'Quantity must be greater than 0.'],
    },
    unit: {
      type: String,
      trim: true,
      // Snapshot of unit at time of inward (in case item unit changes)
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Auto-computed server-side: quantity × unitCost
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Vendor Details ──────────────────────────────────────────────────
    vendorName:    { type: String, trim: true },
    vendorContact: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },

    // ── Driver / Transport Details ──────────────────────────────────────
    driverName:    { type: String, trim: true },
    driverContact: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },

    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Business Rule: totalCost always computed server-side ──────────────────
MaterialInwardSchema.pre('validate', function (next) {
  if (this.quantity != null && this.unitCost != null) {
    this.totalCost = Math.round(this.quantity * this.unitCost * 100) / 100;
  }
  next();
});

// ── Post-save: increment inventory stock ─────────────────────────────────
MaterialInwardSchema.post('save', async function (doc) {
  try {
    const { InventoryModel } = require('./Inventory.model');
    await InventoryModel.findByIdAndUpdate(doc.inventoryItem, {
      $inc: { currentStock: doc.quantity },
      $set: { lastUnitCost: doc.unitCost > 0 ? doc.unitCost : undefined },
    });
  } catch (err) {
    console.error('[MaterialInward] Failed to update inventory stock on save:', err.message);
  }
});

// ── Pre-delete: decrement inventory stock ─────────────────────────────────
MaterialInwardSchema.pre('findOneAndDelete', async function (next) {
  try {
    const { InventoryModel } = require('./Inventory.model');
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      await InventoryModel.findByIdAndUpdate(doc.inventoryItem, {
        $inc: { currentStock: -doc.quantity },
      });
    }
  } catch (err) {
    console.error('[MaterialInward] Failed to decrement inventory stock on delete:', err.message);
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
MaterialInwardSchema.index({ inventoryItem: 1, date: -1 });
MaterialInwardSchema.index({ date: -1 });
MaterialInwardSchema.index({ vendorName: 1 });
MaterialInwardSchema.index({ driverName: 1 });

const MaterialInwardModel =
  mongoose.models.MaterialInward ||
  mongoose.model('MaterialInward', MaterialInwardSchema);

module.exports = { MaterialInwardModel };
