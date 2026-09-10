'use strict';

const { LabourModel } = require('../models/Labour.model');
const { GroupModel } = require('../models/Group.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { BillModel } = require('../models/Bill.model');
const { ProductionModel } = require('../models/Production.model');
const { TripModel } = require('../models/Trip.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

class LabourController {
  /** Create new Labour worker */
  createLabour = async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.file) data.photo = `uploads/photos/${req.file.filename}`;

      if (data.group) {
        const group = await GroupModel.findById(data.group);
        if (!group) return next(new AppError('The specified Group does not exist.', 404));
        const memberCount = await LabourModel.countDocuments({ group: data.group, isActive: true, isDeleted: false });
        if (memberCount >= group.maxMembers)
          return next(new AppError(`Group has reached its maximum size limit of ${group.maxMembers} members.`, 400));
      }

      data.createdBy = req.user._id;
      const newLabour = await LabourModel.create(data);
      return ApiResponse.Created(res, newLabour, 'Labour profile created successfully.');
    } catch (err) { next(err); }
  };

  /** List labours with search, filters, sorting, pagination */
  getAllLabours = async (req, res, next) => {
    try {
      const features = new APIFeatures(LabourModel.find().populate('group', 'name ratePerBrick'), req.query)
        .filter().sort().paginate();

      const labours = await features.query;
      const total = await LabourModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { labours, total, page: features.page, limit: features.limit }, 'Labours list retrieved.');
    } catch (err) { next(err); }
  };

  /** Get Single Labour */
  getLabour = async (req, res, next) => {
    try {
      const labour = await LabourModel.findById(req.params.id).populate('group');
      if (!labour) return next(new AppError('Labour worker not found.', 404));
      return ApiResponse.Ok(res, labour, 'Labour profile retrieved.');
    } catch (err) { next(err); }
  };

  /**
   * Full Employee Profile — single aggregation.
   * Returns: profile, group, last 30d attendance summary, billing history,
   * trip earnings, total production contribution.
   */
  getLabourProfile = async (req, res, next) => {
    try {
      const labour = await LabourModel.findById(req.params.id).populate('group');
      if (!labour) return next(new AppError('Labour worker not found.', 404));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        recentAttendance,
        billHistory,
        tripHistory,
        totalProduction,
      ] = await Promise.all([
        // Last 30 days attendance
        AttendanceModel.find({ labour: req.params.id, date: { $gte: thirtyDaysAgo } })
          .sort({ date: -1 })
          .select('date status note'),

        // All billing records this labour appears in
        BillModel.find({ 'lineItems.labour': req.params.id })
          .sort({ createdAt: -1 })
          .populate('group', 'name')
          .select('group periodStart periodEnd status lineItems totalNet'),

        // Trips where this labour was driver or helper
        TripModel.find({
          $or: [
            { 'driver.labourRef': req.params.id },
            { 'helpers.labourRef': req.params.id },
          ],
        }).sort({ date: -1 }).select('date destination tripsCount grandTotal driver helpers'),

        // Total bricks contributed (via group production, approximated)
        ProductionModel.aggregate([
          { $match: { group: labour.group?._id } },
          { $group: { _id: null, totalBricks: { $sum: '$totalBricks' }, totalAmount: { $sum: '$totalAmount' } } },
        ]),
      ]);

      // Extract this labour's line items from bills
      const parsedBills = billHistory.map((bill) => {
        const myItem = bill.lineItems.find((li) => String(li.labour) === String(req.params.id));
        return {
          _id: bill._id,
          group: bill.group,
          periodStart: bill.periodStart,
          periodEnd: bill.periodEnd,
          status: bill.status,
          gross: myItem?.gross || 0,
          tripEarnings: myItem?.tripEarnings || 0,
          totalGross: myItem?.totalGross || 0,
          advanceDeducted: myItem?.advanceDeducted || 0,
          net: myItem?.net || 0,
        };
      });

      // Attendance summary
      const attSummary = { P: 0, A: 0, HD: 0, FD: 0 };
      recentAttendance.forEach((a) => { attSummary[a.status] = (attSummary[a.status] || 0) + 1; });

      // Trip earnings total
      let totalTripEarnings = 0;
      tripHistory.forEach((trip) => {
        if (String(trip.driver?.labourRef) === String(req.params.id)) {
          totalTripEarnings += trip.totalTripCost || 0;
        }
        trip.helpers?.forEach((h) => {
          if (String(h.labourRef) === String(req.params.id)) totalTripEarnings += h.totalCost || 0;
        });
      });

      return ApiResponse.Ok(res, {
        profile: labour,
        attendanceSummary: attSummary,
        recentAttendance,
        billHistory: parsedBills,
        tripHistory,
        totalTripEarnings,
        groupProduction: totalProduction[0] || { totalBricks: 0, totalAmount: 0 },
        totalPaidOut: parsedBills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.net, 0),
      }, 'Labour full profile loaded.');
    } catch (err) { next(err); }
  };

  /** Update Labour profile */
  updateLabour = async (req, res, next) => {
    try {
      const data = { ...req.body };
      const labour = await LabourModel.findById(req.params.id);
      if (!labour) return next(new AppError('Labour worker not found.', 404));

      if (req.file) {
        if (labour.photo) {
          const oldPath = path.join(__dirname, '../../', labour.photo);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        data.photo = `uploads/photos/${req.file.filename}`;
      }

      if (data.group && data.group !== String(labour.group)) {
        const group = await GroupModel.findById(data.group);
        if (!group) return next(new AppError('The specified Group does not exist.', 404));
        const memberCount = await LabourModel.countDocuments({ group: data.group, isActive: true, isDeleted: false });
        if (memberCount >= group.maxMembers)
          return next(new AppError(`Group has reached its max size of ${group.maxMembers}.`, 400));
      }

      Object.assign(labour, data);
      const updated = await labour.save();
      return ApiResponse.Ok(res, updated, 'Labour profile updated.');
    } catch (err) { next(err); }
  };

  /** Soft delete */
  softDeleteLabour = async (req, res, next) => {
    try {
      const labour = await LabourModel.findById(req.params.id);
      if (!labour) return next(new AppError('Labour worker not found.', 404));
      labour.isActive = false;
      labour.isDeleted = true;
      labour.deletedAt = Date.now();
      labour.deletedBy = req.user._id;
      await labour.save();
      return ApiResponse.Ok(res, null, 'Labour soft-deleted.');
    } catch (err) { next(err); }
  };

  /** Hard delete — Super Admin only */
  hardDeleteLabour = async (req, res, next) => {
    try {
      const labour = await LabourModel.findById(req.params.id).setOptions({ includeDeleted: true });
      if (!labour) return next(new AppError('Labour worker not found.', 404));
      if (labour.photo) {
        const photoPath = path.join(__dirname, '../../', labour.photo);
        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      }
      await LabourModel.findByIdAndDelete(req.params.id);
      return ApiResponse.Ok(res, null, 'Labour permanently deleted.');
    } catch (err) { next(err); }
  };

  /** CSV Import — bulk create labours */
  importLabours = async (req, res, next) => {
    try {
      if (!req.file) return next(new AppError('CSV file is required.', 400));
      const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });

      const created = [];
      const errors = [];

      for (const [i, row] of rows.entries()) {
        try {
          let groupId = null;
          if (row.group || row.groupName) {
            const g = await GroupModel.findOne({ name: new RegExp(`^${row.group || row.groupName}$`, 'i') });
            if (g) groupId = g._id;
          }

          const labour = await LabourModel.create({
            name: row.name || row.Name,
            phone: row.phone || row.Phone || '',
            age: row.age ? parseInt(row.age) : undefined,
            gender: row.gender || undefined,
            address: row.address || '',
            idProofNumber: row.idProofNumber || row.id_proof || '',
            group: groupId,
            joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
            createdBy: req.user._id,
          });
          created.push(labour);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }

      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} labours.`);
    } catch (err) { next(err); }
  };
}

module.exports = new LabourController();
