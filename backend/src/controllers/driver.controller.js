'use strict';

const { DriverModel } = require('../models/Driver.model');
const { LabourModel } = require('../models/Labour.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');

class DriverController {
  /** List all drivers — paginated, searchable */
  getAll = async (req, res, next) => {
    try {
      const features = new APIFeatures(
        DriverModel.find().populate('labourRef', 'name phone group'),
        req.query
      )
        .search(['name', 'phone', 'vehicleNumber'])
        .filter()
        .sort()
        .paginate();

      const drivers = await features.query;
      const total = await DriverModel.countDocuments(features.query.getFilter());

      return ApiResponse.Ok(res, { drivers, total, page: features.page, limit: features.limit }, 'Drivers retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Get single driver */
  getOne = async (req, res, next) => {
    try {
      const driver = await DriverModel.findById(req.params.id).populate('labourRef', 'name phone group');
      if (!driver) return next(new AppError('Driver not found.', 404));
      return ApiResponse.Ok(res, driver, 'Driver details retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /** Create new driver */
  create = async (req, res, next) => {
    try {
      const data = { ...req.body };
      data.createdBy = req.user._id;

      // If linked to a labour and name/phone not provided, inherit from labour
      if (data.labourRef) {
        const labour = await LabourModel.findById(data.labourRef);
        if (labour) {
          if (!data.name) data.name = labour.name;
          if (!data.phone) data.phone = labour.phone;
        }
      }

      const driver = await DriverModel.create(data);
      const populated = await DriverModel.findById(driver._id).populate('labourRef', 'name phone group');
      return ApiResponse.Created(res, populated, 'Driver added successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Update driver */
  update = async (req, res, next) => {
    try {
      const driver = await DriverModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate('labourRef', 'name phone group');

      if (!driver) return next(new AppError('Driver not found.', 404));
      return ApiResponse.Ok(res, driver, 'Driver updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Delete driver */
  remove = async (req, res, next) => {
    try {
      const driver = await DriverModel.findByIdAndDelete(req.params.id);
      if (!driver) return next(new AppError('Driver not found.', 404));
      return ApiResponse.Ok(res, null, 'Driver removed successfully.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new DriverController();
