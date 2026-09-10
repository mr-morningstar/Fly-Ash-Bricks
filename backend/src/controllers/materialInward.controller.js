'use strict';

const { MaterialInwardModel } = require('../models/MaterialInward.model');
const { InventoryModel } = require('../models/Inventory.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');

class MaterialInwardController {
  /** List all inward records — paginated, filterable */
  getAll = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        MaterialInwardModel.find().populate('inventoryItem', 'name unit category').populate('createdBy', 'name'),
        req.query
      ).search(['vendorName', 'driverName', 'vehicleNumber', 'invoiceNumber', 'notes']).dateRange('date').filter().sort().paginate();

      const records = await features.query;
      
      if (req.query.export === 'csv') {
        let csv = 'Date,Material,Quantity,Unit,Unit Cost,Total Cost,Vendor,Driver,Vehicle,Invoice,Notes\n';
        records.forEach(r => {
          const d = new Date(r.date).toLocaleDateString();
          const mat = r.inventoryItem?.name || '';
          const unit = r.inventoryItem?.unit || '';
          csv += `"${d}","${mat}",${r.quantity},"${unit}",${r.unitCost},${r.totalCost},"${r.vendorName}","${r.driverName}","${r.vehicleNumber}","${r.invoiceNumber}","${r.notes}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inward_export.csv"');
        return res.send(csv);
      }

      const total = await MaterialInwardModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { records, total, page: features.page, limit: features.limit }, 'Material inward records retrieved.');
    } catch (err) { next(err); }
  };

  /** Get single record */
  getOne = async (req, res, next) => {
    try {
      const record = await MaterialInwardModel.findById(req.params.id)
        .populate('inventoryItem', 'name unit category currentStock')
        .populate('createdBy', 'name');
      if (!record) return next(new AppError('Material inward record not found.', 404));
      return ApiResponse.Ok(res, record, 'Record retrieved.');
    } catch (err) { next(err); }
  };

  /** Create a new inward record (auto-increments inventory stock via post-save hook) */
  create = async (req, res, next) => {
    try {
      const { inventoryItem, date, quantity, unitCost, vendorName, vendorContact, driverName, driverContact, vehicleNumber, invoiceNumber, notes } = req.body;

      // Validate inventory item exists
      const invItem = await InventoryModel.findById(inventoryItem);
      if (!invItem) return next(new AppError('Inventory item not found.', 404));

      const record = await MaterialInwardModel.create({
        inventoryItem,
        date: date || new Date(),
        quantity,
        unit: invItem.unit,     // snapshot
        unitCost: unitCost || 0,
        vendorName, vendorContact, driverName, driverContact, vehicleNumber, invoiceNumber, notes,
        createdBy: req.user._id,
      });

      // Fetch updated inventory stock
      const updatedItem = await InventoryModel.findById(inventoryItem);

      return ApiResponse.Created(res, { record, updatedStock: updatedItem.currentStock }, 'Material inward recorded. Stock updated.');
    } catch (err) { next(err); }
  };

  /** Create multiple inward records at once (Mega Form Bulk Entry) */
  createBulk = async (req, res, next) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return next(new AppError('No records provided.', 400));
      }

      const createdRecords = [];
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const itemData = records[i];
        try {
          const invItem = await InventoryModel.findById(itemData.inventoryItem);
          if (!invItem) throw new Error('Inventory item not found.');

          const record = await MaterialInwardModel.create({
            inventoryItem: itemData.inventoryItem,
            date: itemData.date || new Date(),
            quantity: itemData.quantity,
            unit: invItem.unit,
            unitCost: itemData.unitCost || 0,
            vendorName: itemData.vendorName,
            vendorContact: itemData.vendorContact,
            driverName: itemData.driverName,
            driverContact: itemData.driverContact,
            vehicleNumber: itemData.vehicleNumber,
            invoiceNumber: itemData.invoiceNumber,
            notes: itemData.notes,
            createdBy: req.user._id,
          });
          createdRecords.push(record);
        } catch (e) {
          errors.push({ row: i + 1, message: e.message });
        }
      }

      return ApiResponse.Created(res, { created: createdRecords.length, errors }, `Successfully logged ${createdRecords.length} inward records.`);
    } catch (err) { next(err); }
  };

  /** Update inward record */
  update = async (req, res, next) => {
    try {
      const existing = await MaterialInwardModel.findById(req.params.id);
      if (!existing) return next(new AppError('Record not found.', 404));

      const oldQty = existing.quantity;
      const newQty = req.body.quantity !== undefined ? Number(req.body.quantity) : oldQty;

      // Protect computed field
      delete req.body.totalCost;

      const record = await MaterialInwardModel.findByIdAndUpdate(
        req.params.id, req.body, { new: true, runValidators: true }
      ).populate('inventoryItem', 'name unit');

      // Adjust inventory: difference between old and new quantity
      const diff = newQty - oldQty;
      if (diff !== 0) {
        await InventoryModel.findByIdAndUpdate(existing.inventoryItem, {
          $inc: { currentStock: diff },
        });
      }

      return ApiResponse.Ok(res, record, 'Record updated.');
    } catch (err) { next(err); }
  };

  /** Delete inward record (auto-decrements stock via pre-delete hook) */
  remove = async (req, res, next) => {
    try {
      const record = await MaterialInwardModel.findOneAndDelete({ _id: req.params.id });
      if (!record) return next(new AppError('Record not found.', 404));
      return ApiResponse.Ok(res, null, 'Inward record deleted. Stock decremented.');
    } catch (err) { next(err); }
  };

  /** CSV Import */
  importCSV = async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('CSV file is required.', 400));
      const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });

      const created = [];
      const errors = [];

      for (const [i, row] of rows.entries()) {
        try {
          const itemName = row.material || row.inventoryItem || row.item;
          const invItem = await InventoryModel.findOne({ name: new RegExp(`^${itemName}$`, 'i') });
          if (!invItem) throw new Error(`Inventory item "${itemName}" not found.`);

          const record = await MaterialInwardModel.create({
            inventoryItem: invItem._id,
            date: row.date ? new Date(row.date) : new Date(),
            quantity: parseFloat(row.quantity || row.qty || 0),
            unit: invItem.unit,
            unitCost: parseFloat(row.unitCost || row.unit_cost || 0),
            vendorName: row.vendorName || row.vendor_name || '',
            vendorContact: row.vendorContact || row.vendor_contact || '',
            driverName: row.driverName || row.driver_name || '',
            driverContact: row.driverContact || row.driver_contact || '',
            vehicleNumber: row.vehicleNumber || row.vehicle_no || '',
            invoiceNumber: row.invoiceNumber || row.invoice_no || '',
            notes: row.notes || '',
            createdBy: req.user._id,
          });
          created.push(record);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }

      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} inward records.`);
    } catch (err) { next(err); }
  };
}

module.exports = new MaterialInwardController();
