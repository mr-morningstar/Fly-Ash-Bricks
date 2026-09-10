'use strict';

const { ProductionModel } = require('../models/Production.model');
const { AttendanceModel } = require('../models/Attendance.model');
const { TripModel } = require('../models/Trip.model');
const { GroupModel } = require('../models/Group.model');
const { LabourModel } = require('../models/Labour.model');
const { ApiResponse } = require('../core/responses/ApiResponse');

class WagesController {
  /**
   * Daily Wage & Settlement Summary
   * Calculates for each day:
   * 1. Bricks produced & making wage per labour (based on group ratePerBrick & attendance)
   * 2. PLUS (+) Loading/Unloading trip helper earnings
   * 3. PLUS (+) Driver trip earnings
   * Returns a daily list with individual worker breakdowns.
   */
  getDailySummary = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      // Default to current month or past 30 days
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      const start = startDate ? new Date(startDate) : new Date();
      if (!startDate) {
        start.setDate(start.getDate() - 30);
      }
      start.setHours(0, 0, 0, 0);

      // Fetch all required data in parallel
      const [productions, attendances, trips, groups, labours] = await Promise.all([
        ProductionModel.find({ date: { $gte: start, $lte: end } }).populate('group'),
        AttendanceModel.find({ date: { $gte: start, $lte: end } }).populate('labour group'),
        TripModel.find({ date: { $gte: start, $lte: end } })
          .populate('driver.labourRef', 'name phone')
          .populate('helpers.labourRef', 'name phone'),
        GroupModel.find(),
        LabourModel.find({ isDeleted: false }),
      ]);

      const groupMap = new Map();
      groups.forEach((g) => groupMap.set(String(g._id), g));

      const labourMap = new Map();
      labours.forEach((l) => labourMap.set(String(l._id), l));

      // Build daily buckets
      const daysMap = new Map();

      // Helper to format date string YYYY-MM-DD
      const toDateKey = (d) => {
        const dateObj = new Date(d);
        return dateObj.toISOString().split('T')[0];
      };

      // Populate unique dates from current date range
      const curr = new Date(start);
      while (curr <= end) {
        const key = toDateKey(curr);
        daysMap.set(key, {
          date: key,
          totalBricks: 0,
          totalTrips: 0,
          totalMakingWage: 0,
          totalTripWage: 0,
          grandTotal: 0,
          workersMap: new Map(), // labourId -> workerDailyRecord
        });
        curr.setDate(curr.getDate() + 1);
      }

      // 1. Process Productions
      productions.forEach((prod) => {
        const key = toDateKey(prod.date);
        if (!daysMap.has(key)) return;
        const day = daysMap.get(key);

        const bricks = prod.quantityProduced || 0;
        day.totalBricks += bricks;
      });

      // 2. Process Attendances & Making Wage
      // Group attendances by date and group
      const dateGroupAttendances = new Map(); // `${key}_${groupId}` -> [attendance]
      attendances.forEach((att) => {
        const key = toDateKey(att.date);
        const gId = att.group ? String(att.group._id || att.group) : 'no_group';
        const mapKey = `${key}_${gId}`;
        if (!dateGroupAttendances.has(mapKey)) {
          dateGroupAttendances.set(mapKey, []);
        }
        dateGroupAttendances.get(mapKey).push(att);
      });

      // Distribute production making wages to workers
      productions.forEach((prod) => {
        const key = toDateKey(prod.date);
        const day = daysMap.get(key);
        if (!day || !prod.group) return;

        const gId = String(prod.group._id || prod.group);
        const groupObj = groupMap.get(gId);
        const ratePerBrick = groupObj?.ratePerBrick || 5.5;
        const totalMakingPool = (prod.quantityProduced || 0) * ratePerBrick;
        day.totalMakingWage += totalMakingPool;

        const attList = dateGroupAttendances.get(`${key}_${gId}`) || [];
        const mults = groupObj?.attendanceMultipliers || { P: 1.0, HD: 0.5, FD: 1.0, A: 0 };

        // Calculate total attendance weight units
        let totalWeight = 0;
        attList.forEach((att) => {
          const status = att.status || 'P';
          const w = mults[status] !== undefined ? mults[status] : (status === 'P' ? 1.0 : status === 'HD' ? 0.5 : 0);
          totalWeight += w;
        });

        // Distribute pool to present labours
        attList.forEach((att) => {
          if (!att.labour) return;
          const lId = String(att.labour._id || att.labour);
          const status = att.status || 'P';
          const w = mults[status] !== undefined ? mults[status] : (status === 'P' ? 1.0 : status === 'HD' ? 0.5 : 0);
          const workerMakingWage = totalWeight > 0 ? Math.round(((w / totalWeight) * totalMakingPool) * 100) / 100 : 0;

          if (!day.workersMap.has(lId)) {
            const lDoc = labourMap.get(lId);
            day.workersMap.set(lId, {
              labourId: lId,
              name: lDoc?.name || att.labour.name || 'Labour Worker',
              group: groupObj?.name || 'General',
              attendance: status,
              makingWage: 0,
              drivingTrips: 0,
              drivingWage: 0,
              helperTrips: 0,
              helperWage: 0,
              totalPayable: 0,
            });
          }

          const wRecord = day.workersMap.get(lId);
          wRecord.attendance = status;
          wRecord.makingWage += workerMakingWage;
        });
      });

      // 3. Process Trips (Driver Earnings + Helper Loading/Unloading Earnings)
      trips.forEach((trip) => {
        const key = toDateKey(trip.date);
        const day = daysMap.get(key);
        if (!day) return;

        const tripsCount = trip.tripsCount || 1;
        day.totalTrips += tripsCount;

        // Driver payment
        if (trip.driver?.labourRef) {
          const dId = String(trip.driver.labourRef._id || trip.driver.labourRef);
          const driverPay = trip.totalTripCost || (tripsCount * (trip.ratePerTrip || 0));
          day.totalTripWage += driverPay;

          if (!day.workersMap.has(dId)) {
            const lDoc = labourMap.get(dId);
            day.workersMap.set(dId, {
              labourId: dId,
              name: lDoc?.name || trip.driver.name || 'Driver',
              group: 'Fleet Driver',
              attendance: 'P',
              makingWage: 0,
              drivingTrips: 0,
              drivingWage: 0,
              helperTrips: 0,
              helperWage: 0,
              totalPayable: 0,
            });
          }
          const rec = day.workersMap.get(dId);
          rec.drivingTrips += tripsCount;
          rec.drivingWage += driverPay;
        }

        // Helper loading/unloading payments (pickup & pickdown)
        if (Array.isArray(trip.helpers)) {
          trip.helpers.forEach((helper) => {
            const hCost = helper.totalCost || ((helper.tripsCount || tripsCount) * (helper.costPerTrip || 0));
            day.totalTripWage += hCost;

            if (helper.labourRef) {
              const hId = String(helper.labourRef._id || helper.labourRef);
              if (!day.workersMap.has(hId)) {
                const lDoc = labourMap.get(hId);
                day.workersMap.set(hId, {
                  labourId: hId,
                  name: lDoc?.name || helper.name || 'Helper',
                  group: 'Fleet Helper',
                  attendance: 'P',
                  makingWage: 0,
                  drivingTrips: 0,
                  drivingWage: 0,
                  helperTrips: 0,
                  helperWage: 0,
                  totalPayable: 0,
                });
              }
              const rec = day.workersMap.get(hId);
              rec.helperTrips += helper.tripsCount || tripsCount;
              rec.helperWage += hCost;
            }
          });
        }
      });

      // Calculate totals for each worker and each day
      const resultDays = [];
      daysMap.forEach((day) => {
        const workers = Array.from(day.workersMap.values()).map((w) => {
          w.makingWage = Math.round(w.makingWage * 100) / 100;
          w.drivingWage = Math.round(w.drivingWage * 100) / 100;
          w.helperWage = Math.round(w.helperWage * 100) / 100;
          w.totalPayable = Math.round((w.makingWage + w.drivingWage + w.helperWage) * 100) / 100;
          return w;
        });

        // Sort workers with highest earnings first
        workers.sort((a, b) => b.totalPayable - a.totalPayable);

        day.totalMakingWage = Math.round(day.totalMakingWage * 100) / 100;
        day.totalTripWage = Math.round(day.totalTripWage * 100) / 100;
        day.grandTotal = Math.round((day.totalMakingWage + day.totalTripWage) * 100) / 100;
        day.workers = workers;
        delete day.workersMap;

        // Only include days that had activity or in range
        if (day.totalBricks > 0 || day.totalTrips > 0 || workers.length > 0) {
          resultDays.push(day);
        }
      });

      // Sort newest days first
      resultDays.sort((a, b) => new Date(b.date) - new Date(a.date));

      return ApiResponse.Ok(
        res,
        { days: resultDays, totalDays: resultDays.length },
        'Daily wage and settlement summary calculated successfully.'
      );
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new WagesController();
