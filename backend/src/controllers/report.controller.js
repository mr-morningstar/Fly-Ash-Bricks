'use strict';

const { ProductionModel } = require('../models/Production.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { BillModel } = require('../models/Bill.model');
const { TripModel } = require('../models/Trip.model');
const { MaterialInwardModel } = require('../models/MaterialInward.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');

class ReportController {
  /**
   * Generate report data for the given type and date range.
   * Returns data that the frontend can format into CSV or display.
   */
  generateReport = async (req, res, next) => {
    try {
      const { type, from, to } = req.query;
      
      if (!type || !from || !to) {
        return next(new AppError('type, from, and to are required query parameters.', 400));
      }

      const startDate = new Date(from);
      const endDate = new Date(to);
      // End date inclusive to 23:59:59
      endDate.setUTCHours(23, 59, 59, 999);

      let data = [];

      switch (type) {
        case 'production':
          data = await ProductionModel.find({
            date: { $gte: startDate, $lte: endDate },
          })
            .populate('group', 'name ratePerBrick')
            .sort({ date: 1 });
          break;

        case 'attendance':
          data = await AttendanceModel.find({
            date: { $gte: startDate, $lte: endDate },
          })
            .populate('labour', 'name phone')
            .populate('group', 'name')
            .sort({ date: 1 });
          break;

        case 'billing':
          data = await BillModel.find({
            createdAt: { $gte: startDate, $lte: endDate },
          })
            .populate('group', 'name')
            .sort({ createdAt: 1 });
          break;

        case 'inventory-consumption':
          data = await MaterialInwardModel.find({
            date: { $gte: startDate, $lte: endDate },
          })
            .populate('inventoryItem', 'name unit')
            .sort({ date: 1 });
          break;

        case 'trip-summary':
          data = await TripModel.find({
            date: { $gte: startDate, $lte: endDate },
          })
            .populate('driver.labourRef', 'name')
            .populate('helpers.labourRef', 'name')
            .sort({ date: 1 });
          break;

        default:
          return next(new AppError('Invalid report type.', 400));
      }

      return ApiResponse.Ok(res, data, `Report data for ${type} retrieved.`);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new ReportController();
