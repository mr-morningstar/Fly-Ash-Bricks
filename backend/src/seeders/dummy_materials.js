'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../core/database/connection');
const { InventoryModel } = require('../models/Inventory.model');

const dummyMaterials = [
  { name: 'Fly Ash - Grade A', unit: 'tons', category: 'raw-material', minStockLevel: 50, isOptional: false },
  { name: 'Stone Dust', unit: 'tons', category: 'raw-material', minStockLevel: 100, isOptional: false },
  { name: 'Cement - OPC 43', unit: 'bags', category: 'raw-material', minStockLevel: 200, isOptional: false },
  { name: 'Gypsum', unit: 'tons', category: 'additive', minStockLevel: 10, isOptional: true },
  { name: 'Lime', unit: 'tons', category: 'additive', minStockLevel: 20, isOptional: true },
  { name: 'Chemical Hardener', unit: 'liters', category: 'additive', minStockLevel: 50, isOptional: true },
  { name: 'Coal / Firewood', unit: 'tons', category: 'fuel', minStockLevel: 5, isOptional: true },
  { name: 'Packaging Pallets', unit: 'units', category: 'other', minStockLevel: 100, isOptional: false },
  { name: 'Water', unit: 'liters', category: 'raw-material', minStockLevel: 1000, isOptional: false },
  { name: 'Machine Oil', unit: 'liters', category: 'other', minStockLevel: 10, isOptional: true }
];

async function seedDummies() {
  await connectDB();
  for (const mat of dummyMaterials) {
    try {
      await InventoryModel.updateOne(
        { name: mat.name },
        { $set: mat },
        { upsert: true }
      );
      console.log(`Added: ${mat.name}`);
    } catch (e) {
      console.error(e.message);
    }
  }
  console.log('Dummy materials inserted!');
  process.exit(0);
}

seedDummies();
