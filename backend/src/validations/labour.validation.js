'use strict';

const { body } = require('express-validator');

const createLabourValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Labour name is required.'),
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 14, max: 80 }).withMessage('Age must be between 14 and 80.'),
  body('address')
    .optional({ nullable: true })
    .trim(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian phone number.'),
  body('idProofNumber')
    .optional({ nullable: true })
    .trim(),
  body('group')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('Invalid Group ID format.'),
  body('joiningDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid date format for joiningDate.'),
  body('advanceBalance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Advance balance cannot be negative.')
];

const updateLabourValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Labour name cannot be empty.'),
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 14, max: 80 }).withMessage('Age must be between 14 and 80.'),
  body('address')
    .optional({ nullable: true })
    .trim(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian phone number.'),
  body('idProofNumber')
    .optional({ nullable: true })
    .trim(),
  body('group')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (val === '' || val === null) return true;
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(val)) {
        throw new Error('Invalid Group ID format.');
      }
      return true;
    }),
  body('joiningDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid date format for joiningDate.'),
  body('advanceBalance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Advance balance cannot be negative.'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean.')
];

module.exports = {
  createLabourValidation,
  updateLabourValidation
};
