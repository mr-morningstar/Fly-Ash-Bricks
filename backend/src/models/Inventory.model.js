'use strict';

const mongoose = require('mongoose');

/**
 * Inventory — Catalog of raw materials used in fly ash brick production.
 * Stock balance is managed by MaterialInward (increments) and
 * Production.materialConsumption (decrements).
 * currentStock always starts at 0 — never pre-seeded with a value.
 */
const InventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required.'],
      trim: true,
      unique: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required.'],
      trim: true,
      // e.g. tons, bags, liters, kg, m³
    },
    category: {
      type: String,
      enum: {
        values: ['raw-material', 'additive', 'fuel', 'other'],
        message: 'Category must be raw-material, additive, fuel, or other.',
      },
      default: 'raw-material',
    },
    // Stock starts at 0 — only MaterialInward creates stock
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative.'],
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: [0, 'Minimum stock level cannot be negative.'],
    },
    // Lime, Gypsum, Chemical Additive are optional — will not trigger
    // mandatory consumption validation during production entry
    isOptional: {
      type: Boolean,
      default: false,
    },
    // Latest known cost per unit (informational, from last inward)
    lastUnitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Virtual: low stock flag ────────────────────────────────────────────────
InventorySchema.virtual('isLowStock').get(function () {
  if (this.minStockLevel <= 0) return false;
  return this.currentStock <= this.minStockLevel;
});

InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

// ── Indexes ───────────────────────────────────────────────────────────────
InventorySchema.index({ name: 1 });
InventorySchema.index({ category: 1 });
InventorySchema.index({ isActive: 1 });
InventorySchema.index({ currentStock: 1 }); // for low-stock alert queries

const InventoryModel =
  mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);

module.exports = { InventoryModel };
