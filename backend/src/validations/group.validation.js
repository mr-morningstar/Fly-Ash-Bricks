'use strict';

const { body } = require('express-validator');

const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required.'),
  body('description')
    .optional()
    .trim(),
  body('maxMembers')
    .optional()
    .isInt({ min: 1 }).withMessage('maxMembers must be at least 1.'),
  body('ratePerBrick')
    .notEmpty().withMessage('ratePerBrick is required.')
    .isFloat({ min: 0 }).withMessage('ratePerBrick cannot be negative.'),
  body('splitMethod')
    .optional()
    .isIn(['equal', 'fixed']).withMessage('splitMethod must be "equal" or "fixed".'),
  body('fixedRatePerHead')
    .optional()
    .isFloat({ min: 0 }).withMessage('fixedRatePerHead cannot be negative.'),
  body('attendanceMultipliers')
    .optional()
    .isObject().withMessage('attendanceMultipliers must be an object.'),
  body('attendanceMultipliers.P')
    .optional()
    .isFloat({ min: 0 }).withMessage('P multiplier cannot be negative.'),
  body('attendanceMultipliers.A')
    .optional()
    .isFloat({ min: 0 }).withMessage('A multiplier cannot be negative.'),
  body('attendanceMultipliers.HD')
    .optional()
    .isFloat({ min: 0 }).withMessage('HD multiplier cannot be negative.'),
  body('attendanceMultipliers.FD')
    .optional()
    .isFloat({ min: 0 }).withMessage('FD multiplier cannot be negative.')
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Group name cannot be empty.'),
  body('description')
    .optional()
    .trim(),
  body('maxMembers')
    .optional()
    .isInt({ min: 1 }).withMessage('maxMembers must be at least 1.'),
  body('ratePerBrick')
    .optional()
    .isFloat({ min: 0 }).withMessage('ratePerBrick cannot be negative.'),
  body('splitMethod')
    .optional()
    .isIn(['equal', 'fixed']).withMessage('splitMethod must be "equal" or "fixed".'),
  body('fixedRatePerHead')
    .optional()
    .isFloat({ min: 0 }).withMessage('fixedRatePerHead cannot be negative.'),
  body('attendanceMultipliers')
    .optional()
    .isObject().withMessage('attendanceMultipliers must be an object.'),
  body('attendanceMultipliers.P')
    .optional()
    .isFloat({ min: 0 }).withMessage('P multiplier cannot be negative.'),
  body('attendanceMultipliers.A')
    .optional()
    .isFloat({ min: 0 }).withMessage('A multiplier cannot be negative.'),
  body('attendanceMultipliers.HD')
    .optional()
    .isFloat({ min: 0 }).withMessage('HD multiplier cannot be negative.'),
  body('attendanceMultipliers.FD')
    .optional()
    .isFloat({ min: 0 }).withMessage('FD multiplier cannot be negative.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean.')
];

module.exports = {
  createGroupValidation,
  updateGroupValidation
};
