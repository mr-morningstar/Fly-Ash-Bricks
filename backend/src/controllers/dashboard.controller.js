'use strict';

const { ProductionModel } = require('../models/Production.model');
const { LabourModel } = require('../models/Labour.model');
const { GroupModel } = require('../models/Group.model');
const { BillModel } = require('../models/Bill.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { InventoryModel } = require('../models/Inventory.model');
const { TripModel } = require('../models/Trip.model');
const { ApiResponse } = require('../core/responses/ApiResponse');

const getUTCMidnight = (d = new Date()) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));

const thirtyDaysAgo = () => {
  const d = getUTCMidnight();
  d.setUTCDate(d.getUTCDate() - 30);
  return d;
};

class DashboardController {
  /**
   * Single endpoint returning all dashboard data in one round-trip.
   * Uses Promise.all for parallel execution of independent queries.
   */
  getFullDashboard = async (req, res, next) => {
    try {
      const today = getUTCMidnight();
      const thirtyDays = thirtyDaysAgo();

      const [
        todayProd,
        totalLabours,
        activeGroups,
        pendingBillsCount,
        productionTrend,
        groupComparison,
        recentBills,
        recentTrips,
        lowStockItems,
        todayAttendanceSummary,
      ] = await Promise.all([
        // Today's production
        ProductionModel.find({ date: today }),

        // Counts
        LabourModel.countDocuments({ isActive: true, isDeleted: false }),
        GroupModel.countDocuments({ isActive: true }),
        BillModel.countDocuments({ status: 'pending' }),

        // 30-day production trend (aggregated by date)
        ProductionModel.aggregate([
          { $match: { date: { $gte: thirtyDays } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, totalBricks: { $sum: '$totalBricks' }, totalAmount: { $sum: '$totalAmount' } } },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', totalBricks: 1, totalAmount: 1, _id: 0 } },
        ]),

        // Group-wise production comparison (all time)
        ProductionModel.aggregate([
          { $group: { _id: '$group', totalBricks: { $sum: '$totalBricks' }, totalAmount: { $sum: '$totalAmount' } } },
          { $lookup: { from: 'groups', localField: '_id', foreignField: '_id', as: 'group' } },
          { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },
          { $project: { groupName: { $ifNull: ['$group.name', 'Unknown'] }, totalBricks: 1, totalAmount: 1, _id: 0 } },
        ]),

        // Recent 5 bills
        BillModel.find().sort({ createdAt: -1 }).limit(5).populate('group', 'name').select('group periodStart periodEnd status totalNet createdAt'),

        // Recent 5 trips
        TripModel.find().sort({ date: -1 }).limit(5).select('date destination bricksDelivered tripsCount grandTotal driver.name'),

        // Low stock items
        InventoryModel.find({
          isActive: true,
          minStockLevel: { $gt: 0 },
          $expr: { $lte: ['$currentStock', '$minStockLevel'] },
        }).select('name unit currentStock minStockLevel'),

        // Today's attendance summary (total present)
        AttendanceModel.aggregate([
          { $match: { date: today } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      // Summarise today's production
      const totalBricksToday = todayProd.reduce((s, p) => s + p.totalBricks, 0);
      const todayEstimatedPayout = todayProd.reduce((s, p) => s + p.totalAmount, 0);

      // Summarise attendance
      const attendance = { P: 0, A: 0, HD: 0, FD: 0 };
      todayAttendanceSummary.forEach((a) => { attendance[a._id] = a.count; });

      return ApiResponse.Ok(res, {
        summary: {
          totalBricksToday,
          todayEstimatedPayout,
          totalLabours,
          activeGroups,
          pendingBillsCount,
          lowStockCount: lowStockItems.length,
          todayPresent: attendance.P + attendance.FD,
        },
        productionTrend,
        groupComparison,
        recentBills,
        recentTrips,
        lowStockItems,
        todayAttendance: attendance,
      }, 'Dashboard data loaded.');
    } catch (err) { next(err); }
  };
}

module.exports = new DashboardController();
