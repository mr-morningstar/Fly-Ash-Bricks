'use strict';

const { body } = require('express-validator');

const createProductionValidation = [
  body('group')
    .notEmpty().withMessage('Group ID is required.')
    .isMongoId().withMessage('Invalid Group ID format.'),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Invalid date format.'),
  body('totalBricks')
    .notEmpty().withMessage('totalBricks is required.')
    .isInt({ min: 0 }).withMessage('totalBricks must be a non-negative integer.'),
  body('trips')
    .optional()
    .isInt({ min: 0 }).withMessage('trips must be a non-negative integer.'),
  body('notes')
    .optional()
    .trim()
];

const updateProductionValidation = [
  body('totalBricks')
    .optional()
    .isInt({ min: 0 }).withMessage('totalBricks must be a non-negative integer.'),
  body('trips')
    .optional()
    .isInt({ min: 0 }).withMessage('trips must be a non-negative integer.'),
  body('notes')
    .optional()
    .trim()
];

module.exports = {
  createProductionValidation,
  updateProductionValidation
};
