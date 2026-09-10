'use strict';

const { body } = require('express-validator');

const markSingleAttendanceValidation = [
  body('labour')
    .notEmpty().withMessage('Labour ID is required.')
    .isMongoId().withMessage('Invalid Labour ID format.'),
  body('group')
    .notEmpty().withMessage('Group ID is required.')
    .isMongoId().withMessage('Invalid Group ID format.'),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Invalid date format.'),
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['P', 'A', 'HD', 'FD']).withMessage('Status must be P, A, HD, or FD.'),
  body('note')
    .optional()
    .trim()
];

const bulkMarkAttendanceValidation = [
  body('group')
    .notEmpty().withMessage('Group ID is required.')
    .isMongoId().withMessage('Invalid Group ID format.'),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Invalid date format.'),
  body('records')
    .isArray({ min: 1 }).withMessage('records must be a non-empty array.'),
  body('records.*.labour')
    .notEmpty().withMessage('Labour ID is required within records.')
    .isMongoId().withMessage('Invalid Labour ID format inside records.'),
  body('records.*.status')
    .notEmpty().withMessage('Status is required within records.')
    .isIn(['P', 'A', 'HD', 'FD']).withMessage('Status must be P, A, HD, or FD inside records.'),
  body('records.*.note')
    .optional()
    .trim()
];

module.exports = {
  markSingleAttendanceValidation,
  bulkMarkAttendanceValidation
};
