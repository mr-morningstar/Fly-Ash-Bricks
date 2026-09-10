'use strict';

const { InventoryModel } = require('../models/Inventory.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');

class InventoryController {
  /** List all inventory items with low-stock flag */
  getAll = async (req, res, next) => {
    try {
      const features = new APIFeatures(InventoryModel.find(), req.query)
        .search(['name', 'category', 'description'])
        .dateRange('createdAt')
        .filter()
        .sort()
        .paginate();

      const items = await features.query;
      
      if (req.query.export === 'csv') {
        let csv = 'Name,Category,Current Stock,Min Stock,Last Unit Cost,Status\n';
        items.forEach(i => {
          csv += `"${i.name}","${i.category}",${i.currentStock},${i.minStockLevel},${i.lastUnitCost},${i.isActive ? 'Active' : 'Inactive'}\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
        return res.send(csv);
      }

      const total = await InventoryModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, {
        items,
        total,
        page: features.page,
        limit: features.limit,
        lowStockCount: items.filter((i) => i.isLowStock).length,
      }, 'Inventory list retrieved.');
    } catch (err) { next(err); }
  };

  /** Get a single inventory item */
  getOne = async (req, res, next) => {
    try {
      const item = await InventoryModel.findById(req.params.id);
      if (!item) return next(new AppError('Inventory item not found.', 404));
      return ApiResponse.Ok(res, item, 'Inventory item retrieved.');
    } catch (err) { next(err); }
  };

  /** Create a new inventory item */
  create = async (req, res, next) => {
    try {
      const { name, unit, category, minStockLevel, isOptional, description } = req.body;
      const item = await InventoryModel.create({
        name, unit, category, minStockLevel, isOptional, description,
        currentStock: 0, // Always starts at 0
        createdBy: req.user._id,
      });
      return ApiResponse.Created(res, item, 'Inventory item created.');
    } catch (err) { next(err); }
  };

  /** Update inventory item (NOT stock — stock is managed via inward/production) */
  update = async (req, res, next) => {
    try {
      const forbidden = ['currentStock']; // protect stock integrity
      forbidden.forEach((f) => delete req.body[f]);

      const item = await InventoryModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!item) return next(new AppError('Inventory item not found.', 404));
      return ApiResponse.Ok(res, item, 'Inventory item updated.');
    } catch (err) { next(err); }
  };

  /** Soft-toggle active status */
  toggleActive = async (req, res, next) => {
    try {
      const item = await InventoryModel.findById(req.params.id);
      if (!item) return next(new AppError('Inventory item not found.', 404));
      item.isActive = !item.isActive;
      await item.save();
      return ApiResponse.Ok(res, item, `Inventory item ${item.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) { next(err); }
  };

  /** Low-stock alert list */
  getLowStock = async (req, res, next) => {
    try {
      // Items where currentStock <= minStockLevel and minStockLevel > 0
      const items = await InventoryModel.find({
        isActive: true,
        minStockLevel: { $gt: 0 },
        $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      });
      return ApiResponse.Ok(res, items, 'Low-stock items retrieved.');
    } catch (err) { next(err); }
  };

  /** Import inventory items from CSV */
  importCSV = async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('CSV file is required.', 400));
      const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });

      const created = [];
      const errors = [];

      for (const [i, row] of records.entries()) {
        try {
          const item = await InventoryModel.create({
            name: row.name || row.Name,
            unit: row.unit || row.Unit,
            category: row.category || 'raw-material',
            minStockLevel: parseFloat(row.minStockLevel || row.min_stock || 0),
            isOptional: row.isOptional === 'true' || row.isOptional === '1',
            description: row.description || '',
            currentStock: 0,
            createdBy: req.user._id,
          });
          created.push(item);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }

      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} inventory items.`);
    } catch (err) { next(err); }
  };
}

module.exports = new InventoryController();
