'use strict';

const { TripModel } = require('../models/Trip.model');
const { LabourModel } = require('../models/Labour.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');
const { parse } = require('csv-parse/sync');

class TripController {
  /** List all trips — paginated, filterable */
  getAll = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        TripModel.find()
          .populate('driver.labourRef', 'name phone')
          .populate('helpers.labourRef', 'name phone')
          .populate('createdBy', 'name'),
        req.query
      ).filter().sort().paginate();

      const trips = await features.query;
      const total = await TripModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { trips, total, page: features.page, limit: features.limit }, 'Trips retrieved.');
    } catch (err) { next(err); }
  };

  /** Get single trip with full detail */
  getOne = async (req, res, next) => {
    try {
      const trip = await TripModel.findById(req.params.id)
        .populate('driver.labourRef', 'name phone group')
        .populate('helpers.labourRef', 'name phone group')
        .populate('createdBy', 'name');
      if (!trip) return next(new AppError('Trip not found.', 404));
      return ApiResponse.Ok(res, trip, 'Trip retrieved.');
    } catch (err) { next(err); }
  };

  /** Create a new trip */
  create = async (req, res, next) => {
    try {
      const trip = await TripModel.create({
        ...req.body,
        createdBy: req.user._id,
      });
      const populated = await TripModel.findById(trip._id)
        .populate('driver.labourRef', 'name phone')
        .populate('helpers.labourRef', 'name phone');
      return ApiResponse.Created(res, populated, 'Trip recorded successfully.');
    } catch (err) { next(err); }
  };

  /** Update a trip */
  update = async (req, res, next) => {
    try {
      const trip = await TripModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('driver.labourRef', 'name phone').populate('helpers.labourRef', 'name phone');
      if (!trip) return next(new AppError('Trip not found.', 404));
      return ApiResponse.Ok(res, trip, 'Trip updated.');
    } catch (err) { next(err); }
  };

  /** Delete a trip */
  remove = async (req, res, next) => {
    try {
      const trip = await TripModel.findByIdAndDelete(req.params.id);
      if (!trip) return next(new AppError('Trip not found.', 404));
      return ApiResponse.Ok(res, null, 'Trip deleted.');
    } catch (err) { next(err); }
  };

  /** Add a helper to an existing trip */
  addHelper = async (req, res, next) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) return next(new AppError('Trip not found.', 404));
      trip.helpers.push(req.body);
      await trip.save();
      return ApiResponse.Ok(res, trip, 'Helper added.');
    } catch (err) { next(err); }
  };

  /** Update a helper */
  updateHelper = async (req, res, next) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) return next(new AppError('Trip not found.', 404));
      const helper = trip.helpers.id(req.params.helperId);
      if (!helper) return next(new AppError('Helper not found.', 404));
      Object.assign(helper, req.body);
      await trip.save();
      return ApiResponse.Ok(res, trip, 'Helper updated.');
    } catch (err) { next(err); }
  };

  /** Remove a helper */
  removeHelper = async (req, res, next) => {
    try {
      const trip = await TripModel.findById(req.params.id);
      if (!trip) return next(new AppError('Trip not found.', 404));
      trip.helpers.pull({ _id: req.params.helperId });
      await trip.save();
      return ApiResponse.Ok(res, trip, 'Helper removed.');
    } catch (err) { next(err); }
  };

  /** Get labours list for helper/driver selection (form data) */
  getFormData = async (req, res, next) => {
    try {
      const labours = await LabourModel.find({ isActive: true })
        .select('name phone group')
        .populate('group', 'name')
        .sort('name');
      return ApiResponse.Ok(res, { labours }, 'Trip form data retrieved.');
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
          const trip = await TripModel.create({
            date: new Date(row.date),
            customerName: row.customerName || row.customer || '',
            villageName: row.villageName || row.village || '',
            destination: row.destination,
            bricksDelivered: parseInt(row.bricksDelivered || 0),
            tripsCount: parseInt(row.tripsCount || 1),
            ratePerTrip: parseFloat(row.ratePerTrip || 0),
            driver: {
              name: row.driverName || '',
              contact: row.driverContact || '',
              vehicleNumber: row.vehicleNumber || '',
            },
            notes: row.notes || '',
            createdBy: req.user._id,
          });
          created.push(trip);
        } catch (e) {
          errors.push({ row: i + 2, message: e.message });
        }
      }
      return ApiResponse.Ok(res, { created: created.length, errors }, `Imported ${created.length} trips.`);
    } catch (err) { next(err); }
  };
}

module.exports = new TripController();
