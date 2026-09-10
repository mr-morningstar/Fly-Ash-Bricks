'use strict';

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const {
  generateBillValidation,
  updateBillStatusValidation
} = require('../validations/billing.validation');

router.post('/generate', verifyToken, checkPermission('billing.generate'), generateBillValidation, validate, billingController.generateBill);
router.get('/', verifyToken, checkPermission('billing.view'), billingController.getAllBills);
router.get('/:id', verifyToken, checkPermission('billing.view'), billingController.getBill);
router.patch('/:id/status', verifyToken, checkPermission('billing.pay'), updateBillStatusValidation, validate, billingController.updateBillStatus);
router.get('/:id/download', verifyToken, checkPermission('billing.download'), billingController.downloadBillPDF);

module.exports = router;
