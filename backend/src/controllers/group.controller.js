'use strict';

const { GroupModel } = require('../models/Group.model');
const { LabourModel } = require('../models/Labour.model');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');

class GroupController {
  /** Create Group */
  createGroup = async (req, res, next) => {
    try {
      const data = { ...req.body };
      data.createdBy = req.user._id;

      const group = await GroupModel.create(data);
      return ApiResponse.Created(res, group, 'Group created successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Get list of groups */
  getAllGroups = async (req, res, next) => {
    try {
      const features = new APIFeatures(GroupModel.find(), req.query)
        .search(['name'])
        .filter()
        .sort()
        .paginate();

      const groups = await features.query;
      const total = await GroupModel.countDocuments(features.query.getFilter());

      // Let's populate the active member count for each group
      const groupsWithMemberCount = await Promise.all(
        groups.map(async (group) => {
          const count = await LabourModel.countDocuments({ group: group._id, isActive: true, isDeleted: false });
          return {
            ...group.toObject(),
            memberCount: count
          };
        })
      );

      return ApiResponse.Ok(res, {
        groups: groupsWithMemberCount,
        total,
        page: features.page,
        limit: features.limit
      }, 'Groups list retrieved successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Get Single Group with populated Labours */
  getGroup = async (req, res, next) => {
    try {
      const group = await GroupModel.findById(req.params.id);
      if (!group) {
        return next(new AppError('Group not found.', 404));
      }

      // Fetch all labours in this group
      const labours = await LabourModel.find({ group: group._id, isDeleted: false });

      return ApiResponse.Ok(res, {
        group,
        labours
      }, 'Group details retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /** Update Group details/rates */
  updateGroup = async (req, res, next) => {
    try {
      const group = await GroupModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!group) {
        return next(new AppError('Group not found.', 404));
      }

      return ApiResponse.Ok(res, group, 'Group updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Delete Group (can only delete if empty or automatically set members' group to null) */
  deleteGroup = async (req, res, next) => {
    try {
      const group = await GroupModel.findById(req.params.id);
      if (!group) {
        return next(new AppError('Group not found.', 404));
      }

      // Set group field to null for all labours in this group
      await LabourModel.updateMany({ group: group._id }, { group: null });

      await GroupModel.findByIdAndDelete(req.params.id);

      return ApiResponse.Ok(res, null, 'Group deleted successfully and member associations cleared.');
    } catch (err) {
      next(err);
    }
  };

  /** Assign/Reassign labours to group */
  assignMembers = async (req, res, next) => {
    try {
      const { labourIds } = req.body; // array of Mongo IDs
      if (!Array.isArray(labourIds)) {
        return next(new AppError('labourIds must be an array of Labour IDs.', 400));
      }

      const group = await GroupModel.findById(req.params.id);
      if (!group) {
        return next(new AppError('Group not found.', 404));
      }

      // Count current members
      const currentCount = await LabourModel.countDocuments({ group: group._id, isActive: true, isDeleted: false });
      
      // Calculate how many we can add
      const availableSlots = group.maxMembers - currentCount;
      if (labourIds.length > availableSlots) {
        return next(new AppError(`Cannot assign all members. Only ${availableSlots} slots available (limit: ${group.maxMembers}).`, 400));
      }

      // Assign labours to this group
      await LabourModel.updateMany(
        { _id: { $in: labourIds } },
        { group: group._id }
      );

      return ApiResponse.Ok(res, null, `${labourIds.length} labours assigned to group successfully.`);
    } catch (err) {
      next(err);
    }
  };

  /** Remove members from group */
  removeMember = async (req, res, next) => {
    try {
      const { labourId } = req.params;
      const labour = await LabourModel.findOneAndUpdate(
        { _id: labourId, group: req.params.id },
        { group: null },
        { new: true }
      );

      if (!labour) {
        return next(new AppError('Labour worker not found in this group.', 404));
      }

      return ApiResponse.Ok(res, null, 'Labour removed from group successfully.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new GroupController();
