'use strict';

const { BillModel } = require('../models/Bill.model');
const { GroupModel } = require('../models/Group.model');
const { LabourModel } = require('../models/Labour.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { ProductionModel } = require('../models/Production.model');
const { TripModel } = require('../models/Trip.model');
const { SettingsModel } = require('../models/Settings.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { generateBillPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

const normalizeDate = (dStr) => {
  const d = new Date(dStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

class BillingController {
  /**
   * Build trip earnings map for all labours in a group over a date range.
   * Returns { labourId: totalTripEarnings }
   */
  _buildTripEarningsMap = async (groupLabourIds, start, end) => {
    const trips = await TripModel.find({
      date: { $gte: start, $lte: end },
      $or: [
        { 'driver.labourRef': { $in: groupLabourIds } },
        { 'helpers.labourRef': { $in: groupLabourIds } },
      ],
    });

    const earningsMap = {};
    groupLabourIds.forEach((id) => { earningsMap[String(id)] = 0; });

    trips.forEach((trip) => {
      // Driver earnings
      if (trip.driver?.labourRef) {
        const key = String(trip.driver.labourRef);
        if (earningsMap[key] !== undefined) {
          earningsMap[key] += trip.totalTripCost || 0;
        }
      }
      // Helper earnings
      (trip.helpers || []).forEach((helper) => {
        if (helper.labourRef) {
          const key = String(helper.labourRef);
          if (earningsMap[key] !== undefined) {
            earningsMap[key] += helper.totalCost || 0;
          }
        }
      });
    });

    return earningsMap;
  };

  /** Generate Bill for a group over a period (includes trip earnings) */
  generateBill = async (req, res, next) => {
    try {
      const { group, periodStart, periodEnd, notes } = req.body;
      const start = normalizeDate(periodStart);
      const end = normalizeDate(periodEnd);

      const groupDoc = await GroupModel.findById(group);
      if (!groupDoc) return next(new AppError('Group not found.', 404));

      const labours = await LabourModel.find({ group, isDeleted: false });
      if (labours.length === 0)
        return next(new AppError('No labours found in this group to generate a bill for.', 400));

      const labourIds = labours.map((l) => l._id);

      // Fetch production, attendance, and trip data in parallel
      const [productionDocs, attendanceDocs, tripEarningsMap] = await Promise.all([
        ProductionModel.find({ group, date: { $gte: start, $lte: end } }),
        AttendanceModel.find({ group, date: { $gte: start, $lte: end } }),
        this._buildTripEarningsMap(labourIds, start, end),
      ]);

      const productionMap = {};
      productionDocs.forEach((prod) => {
        productionMap[prod.date.toISOString().split('T')[0]] = prod;
      });

      const attendanceMap = {};
      attendanceDocs.forEach((att) => {
        const dStr = att.date.toISOString().split('T')[0];
        attendanceMap[`${dStr}_${att.labour}`] = att.status;
      });

      const dates = [];
      let current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
      }

      const lineItemsMap = {};
      labours.forEach((lab) => {
        lineItemsMap[lab._id] = { labour: lab._id, daysP: 0, daysA: 0, daysHD: 0, daysFD: 0, gross: 0, tripEarnings: 0, totalGross: 0, advanceDeducted: 0, net: 0 };
      });

      const mults = groupDoc.attendanceMultipliers || { P: 1.0, A: 0, HD: 0.5, FD: 1.0 };

      dates.forEach((dStr) => {
        const prod = productionMap[dStr];
        const dayTotalValue = prod ? prod.totalAmount : 0;

        const dayWeights = {};
        let sumOfWeights = 0;

        labours.forEach((lab) => {
          const status = attendanceMap[`${dStr}_${lab._id}`] || 'A';
          let weight = mults[status] ?? 0;
          dayWeights[lab._id] = weight;
          sumOfWeights += weight;

          const item = lineItemsMap[lab._id];
          if (status === 'P') item.daysP++;
          else if (status === 'A') item.daysA++;
          else if (status === 'HD') item.daysHD++;
          else if (status === 'FD') item.daysFD++;
        });

        labours.forEach((lab) => {
          const weight = dayWeights[lab._id];
          if (weight === 0) return;

          let share = 0;
          if (groupDoc.splitMethod === 'equal') {
            if (sumOfWeights > 0 && dayTotalValue > 0) share = dayTotalValue * (weight / sumOfWeights);
          } else {
            share = (groupDoc.fixedRatePerHead || 0) * weight;
          }
          lineItemsMap[lab._id].gross += share;
        });
      });

      let totalGross = 0;
      let totalTrip = 0;
      let totalNet = 0;
      const lineItems = [];

      for (const lab of labours) {
        const item = lineItemsMap[lab._id];
        item.gross = Math.round(item.gross * 100) / 100;

        // Add trip earnings
        item.tripEarnings = Math.round((tripEarningsMap[String(lab._id)] || 0) * 100) / 100;
        item.totalGross = Math.round((item.gross + item.tripEarnings) * 100) / 100;

        const advanceBal = lab.advanceBalance || 0;
        item.advanceDeducted = Math.round(Math.min(item.totalGross, advanceBal) * 100) / 100;
        item.net = Math.round((item.totalGross - item.advanceDeducted) * 100) / 100;

        totalGross += item.totalGross;
        totalTrip += item.tripEarnings;
        totalNet += item.net;

        lineItems.push(item);
      }

      let bill = await BillModel.create({
        group,
        periodStart: start,
        periodEnd: end,
        status: 'pending',
        lineItems,
        totalGross: Math.round(totalGross * 100) / 100,
        totalTrip: Math.round(totalTrip * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        generatedBy: req.user._id,
        notes,
      });

      let settings = await SettingsModel.findOne();
      if (!settings) settings = await SettingsModel.create({});

      bill = await BillModel.findById(bill._id).populate('group').populate('lineItems.labour');

      const billsDir = path.join(__dirname, '../../uploads/bills');
      if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });

      const pdfFilename = `bill-${bill._id}.pdf`;
      const pdfPath = path.join(billsDir, pdfFilename);
      await generateBillPDF({ bill, settings, outputPath: pdfPath });

      bill.pdfPath = `uploads/bills/${pdfFilename}`;
      await bill.save();

      return ApiResponse.Created(res, bill, 'Bill generated. Trip earnings included in line items.');
    } catch (err) { next(err); }
  };

  /** List Bills */
  getAllBills = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        BillModel.find().populate('group', 'name').populate('generatedBy', 'name'),
        req.query
      ).filter().sort().paginate();

      const bills = await features.query;
      const total = await BillModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { bills, total, page: features.page, limit: features.limit }, 'Bills list retrieved.');
    } catch (err) { next(err); }
  };

  /** Get Single Bill Details */
  getBill = async (req, res, next) => {
    try {
      const bill = await BillModel.findById(req.params.id)
        .populate('group').populate('lineItems.labour').populate('generatedBy').populate('paidBy');
      if (!bill) return next(new AppError('Bill not found.', 404));
      return ApiResponse.Ok(res, bill, 'Bill details retrieved.');
    } catch (err) { next(err); }
  };

  /** Update Bill Status (Paid/Pending) */
  updateBillStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const bill = await BillModel.findById(req.params.id);
      if (!bill) return next(new AppError('Bill not found.', 404));
      if (bill.status === status) return ApiResponse.Ok(res, bill, `Bill is already ${status}.`);

      if (status === 'paid') {
        for (const item of bill.lineItems) {
          if (item.advanceDeducted > 0) {
            await LabourModel.findByIdAndUpdate(item.labour, { $inc: { advanceBalance: -item.advanceDeducted } });
          }
        }
        bill.status = 'paid';
        bill.paidAt = Date.now();
        bill.paidBy = req.user._id;
      } else {
        for (const item of bill.lineItems) {
          if (item.advanceDeducted > 0) {
            await LabourModel.findByIdAndUpdate(item.labour, { $inc: { advanceBalance: item.advanceDeducted } });
          }
        }
        bill.status = 'pending';
        bill.paidAt = undefined;
        bill.paidBy = undefined;
      }

      await bill.save();
      const updated = await BillModel.findById(bill._id).populate('group').populate('lineItems.labour');
      return ApiResponse.Ok(res, updated, `Bill status updated to ${status}.`);
    } catch (err) { next(err); }
  };

  /** Download Bill PDF */
  downloadBillPDF = async (req, res, next) => {
    try {
      const bill = await BillModel.findById(req.params.id);
      if (!bill || !bill.pdfPath) return next(new AppError('Bill invoice PDF not found.', 404));
      const filePath = path.join(__dirname, '../../', bill.pdfPath);
      if (!fs.existsSync(filePath)) return next(new AppError('Invoice file is missing from storage.', 404));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Bill-${bill._id}.pdf`);
      return fs.createReadStream(filePath).pipe(res);
    } catch (err) { next(err); }
  };
}

module.exports = new BillingController();
