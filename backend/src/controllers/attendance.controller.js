'use strict';

const { AttendanceModel } = require('../models/Attendance.model');
const { LabourModel } = require('../models/Labour.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');

const normalizeDate = (dStr) => {
  const d = new Date(dStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

class AttendanceController {
  /** Mark single labour attendance (upsert) */
  markSingleAttendance = async (req, res, next) => {
    try {
      const { labour, group, date, status, note } = req.body;
      const targetDate = normalizeDate(date);
      const labourDoc = await LabourModel.findOne({ _id: labour, isDeleted: false });
      if (!labourDoc) return next(new AppError('Labour worker not found.', 404));

      const attendance = await AttendanceModel.findOneAndUpdate(
        { labour, date: targetDate },
        { group, status, note, markedBy: req.user._id },
        { new: true, upsert: true, runValidators: true }
      );
      return ApiResponse.Ok(res, attendance, 'Attendance marked successfully.');
    } catch (err) { next(err); }
  };

  /** Bulk mark group attendance (upsert) */
  bulkMarkAttendance = async (req, res, next) => {
    try {
      const { group, date, records } = req.body;
      const targetDate = normalizeDate(date);

      const ops = records.map((rec) =>
        AttendanceModel.findOneAndUpdate(
          { labour: rec.labour, date: targetDate },
          { group, status: rec.status, note: rec.note || '', markedBy: req.user._id },
          { new: true, upsert: true, runValidators: true }
        )
      );
      const savedRecords = await Promise.all(ops);
      return ApiResponse.Ok(res, savedRecords, `Bulk attendance for ${savedRecords.length} workers saved.`);
    } catch (err) { next(err); }
  };

  /** Get full month attendance grid for a group — single query */
  getAttendanceGrid = async (req, res, next) => {
    try {
      const { groupId, month, year } = req.query;
      if (!groupId || !month || !year) {
        return next(new AppError('groupId, month, and year are required.', 400));
      }

      const m = parseInt(month) - 1; // 0-indexed
      const y = parseInt(year);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0)); // last day of month

      const [labours, attendanceList] = await Promise.all([
        LabourModel.find({ group: groupId, isDeleted: false }).select('name phone'),
        AttendanceModel.find({ group: groupId, date: { $gte: start, $lte: end } }),
      ]);

      const attendanceMap = {};
      attendanceList.forEach((att) => {
        const dStr = att.date.toISOString().split('T')[0];
        attendanceMap[`${att.labour}_${dStr}`] = { status: att.status, note: att.note };
      });

      const dates = [];
      let current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
      }

      const grid = labours.map((labour) => {
        const row = { labourId: labour._id, name: labour.name, phone: labour.phone, attendance: {}, summary: { P: 0, A: 0, HD: 0, FD: 0 } };
        dates.forEach((dStr) => {
          const entry = attendanceMap[`${labour._id}_${dStr}`];
          row.attendance[dStr] = entry || null; // null = not marked
          if (entry) row.summary[entry.status] = (row.summary[entry.status] || 0) + 1;
        });
        return row;
      });

      return ApiResponse.Ok(res, { dates, grid, month: parseInt(month), year: parseInt(year) }, 'Attendance grid retrieved.');
    } catch (err) { next(err); }
  };

  /** List attendance records (filterable) */
  getAttendanceList = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        AttendanceModel.find().populate('labour', 'name phone').populate('group', 'name'),
        req.query
      ).filter().sort().paginate();

      const records = await features.query;
      const total = await AttendanceModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { records, total, page: features.page, limit: features.limit }, 'Attendance list retrieved.');
    } catch (err) { next(err); }
  };

  /** CSV Import attendance */
  importAttendance = async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('CSV file is required.', 400));
      const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });

      const created = [];
      const errors = [];

      for (const [i, row] of rows.entries()) {
        try {
          const labour = await LabourModel.findOne({ name: new RegExp(`^${row.name}$`, 'i') });
          if (!labour) throw new Error(`Labour "${row.name}" not found.`);

          const rec = await AttendanceModel.findOneAndUpdate(
            { labour: labour._id, date: normalizeDate(row.date) },
            { group: labour.group, status: row.status || 'P', note: row.note || '', markedBy: req.user._id },
            { new: true, upsert: true, runValidators: true }
          );
          created.push(rec);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }
      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} attendance records.`);
    } catch (err) { next(err); }
  };
}

module.exports = new AttendanceController();
