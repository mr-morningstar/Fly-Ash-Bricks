'use strict';

const { body } = require('express-validator');

const generateBillValidation = [
  body('group')
    .notEmpty().withMessage('Group ID is required.')
    .isMongoId().withMessage('Invalid Group ID format.'),
  body('periodStart')
    .notEmpty().withMessage('Period start date is required.')
    .isISO8601().withMessage('Invalid periodStart date format.'),
  body('periodEnd')
    .notEmpty().withMessage('Period end date is required.')
    .isISO8601().withMessage('Invalid periodEnd date format.')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.periodStart)) {
        throw new Error('Period end date must be after or equal to period start date.');
      }
      return true;
    })
];

const updateBillStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['pending', 'paid']).withMessage('Status must be "pending" or "paid".')
];

module.exports = {
  generateBillValidation,
  updateBillStatusValidation
};
