'use strict';

const { ProductionModel } = require('../models/Production.model');
const { GroupModel } = require('../models/Group.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { InventoryModel } = require('../models/Inventory.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');

const normalizeDate = (dStr) => {
  const d = new Date(dStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

class ProductionController {
  /** Create daily production record for a group */
  createProduction = async (req, res, next) => {
    try {
      const { group, date, totalBricks, shift, trips, materialConsumption, notes } = req.body;
      const targetDate = normalizeDate(date);

      const groupDoc = await GroupModel.findById(group);
      if (!groupDoc) return next(new AppError('Group not found.', 404));

      const existing = await ProductionModel.findOne({ group, date: targetDate });
      if (existing) return next(new AppError('Production record already exists for this group on this date.', 400));

      const newRecord = await ProductionModel.create({
        group,
        date: targetDate,
        totalBricks,
        shift: shift || 'full',
        ratePerBrick: groupDoc.ratePerBrick,
        trips: trips || 0,
        materialConsumption: materialConsumption || [],
        notes,
        createdBy: req.user._id,
      });

      return ApiResponse.Created(res, newRecord, 'Production record logged successfully.');
    } catch (err) { next(err); }
  };

  /** List production records — paginated, filterable */
  getAllProduction = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        ProductionModel.find().populate('group', 'name ratePerBrick').populate('materialConsumption.inventoryItem', 'name unit'),
        req.query
      ).search(['notes']).dateRange('date').filter().sort().paginate();

      const production = await features.query;
      
      if (req.query.export === 'csv') {
        let csv = 'Date,Group,Total Bricks,Rate,Shift,Trips,Notes\n';
        production.forEach(p => {
          const d = new Date(p.date).toLocaleDateString();
          const grp = p.group?.name || '';
          csv += `"${d}","${grp}",${p.totalBricks},${p.ratePerBrick},"${p.shift}",${p.trips},"${p.notes}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="production_export.csv"');
        return res.send(csv);
      }

      const total = await ProductionModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { production, total, page: features.page, limit: features.limit }, 'Production records retrieved.');
    } catch (err) { next(err); }
  };

  /** Get single production record */
  getProduction = async (req, res, next) => {
    try {
      const record = await ProductionModel.findById(req.params.id)
        .populate('group').populate('materialConsumption.inventoryItem', 'name unit currentStock');
      if (!record) return next(new AppError('Production record not found.', 404));
      return ApiResponse.Ok(res, record, 'Production record details retrieved.');
    } catch (err) { next(err); }
  };

  /**
   * Daily form data — single call returning groups + their attendance counts
   * and available inventory items for material consumption entry.
   */
  getDailyFormData = async (req, res, next) => {
    try {
      const date = req.query.date ? normalizeDate(req.query.date) : normalizeDate(new Date());

      const [groups, inventoryItems, existingRecords] = await Promise.all([
        GroupModel.find({ isActive: true }).select('name ratePerBrick splitMethod fixedRatePerHead'),
        InventoryModel.find({ isActive: true }).select('name unit currentStock isOptional category'),
        ProductionModel.find({ date }).select('group totalBricks'),
      ]);

      // Attach existing record and attendance count to each group
      const groupsWithData = await Promise.all(
        groups.map(async (g) => {
          const existing = existingRecords.find((r) => String(r.group) === String(g._id));
          const presentCount = await AttendanceModel.countDocuments({ group: g._id, date, status: { $in: ['P', 'FD'] } });
          return {
            ...g.toObject(),
            existingRecord: existing || null,
            presentCount,
          };
        })
      );

      return ApiResponse.Ok(res, {
        date: date.toISOString().split('T')[0],
        groups: groupsWithData,
        inventoryItems,
      }, 'Daily form data loaded.');
    } catch (err) { next(err); }
  };

  /** Update production record */
  updateProduction = async (req, res, next) => {
    try {
      const record = await ProductionModel.findById(req.params.id);
      if (!record) return next(new AppError('Production record not found.', 404));

      const { totalBricks, shift, trips, materialConsumption, notes } = req.body;
      if (totalBricks !== undefined) record.totalBricks = totalBricks;
      if (shift !== undefined) record.shift = shift;
      if (trips !== undefined) record.trips = trips;
      if (notes !== undefined) record.notes = notes;
      if (materialConsumption !== undefined) record.materialConsumption = materialConsumption;

      await record.save();
      return ApiResponse.Ok(res, record, 'Production record updated.');
    } catch (err) { next(err); }
  };

  /** Delete production record */
  deleteProduction = async (req, res, next) => {
    try {
      const record = await ProductionModel.findByIdAndDelete(req.params.id);
      if (!record) return next(new AppError('Production record not found.', 404));
      return ApiResponse.Ok(res, null, 'Production record deleted.');
    } catch (err) { next(err); }
  };

  /** CSV Import */
  importProduction = async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('CSV file is required.', 400));
      const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });

      const created = [];
      const errors = [];

      for (const [i, row] of rows.entries()) {
        try {
          const group = await GroupModel.findOne({ name: new RegExp(`^${row.group || row.groupName}$`, 'i') });
          if (!group) throw new Error(`Group "${row.group || row.groupName}" not found.`);

          const date = normalizeDate(row.date);
          const existing = await ProductionModel.findOne({ group: group._id, date });
          if (existing) throw new Error(`Record already exists for ${row.group} on ${row.date}.`);

          const record = await ProductionModel.create({
            group: group._id,
            date,
            totalBricks: parseInt(row.totalBricks || row.bricks || 0),
            ratePerBrick: group.ratePerBrick,
            trips: parseInt(row.trips || 0),
            notes: row.notes || '',
            createdBy: req.user._id,
          });
          created.push(record);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }
      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} production records.`);
    } catch (err) { next(err); }
  };
}

module.exports = new ProductionController();
