'use strict';

const express = require('express');
const router = express.Router();
const productionController = require('../controllers/production.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const {
  createProductionValidation,
  updateProductionValidation
} = require('../validations/production.validation');

router.route('/')
  .post(verifyToken, checkPermission('production.create'), createProductionValidation, validate, productionController.createProduction)
  .get(verifyToken, checkPermission('production.view'), productionController.getAllProduction);

router.get('/daily-form', verifyToken, productionController.getDailyFormData);

router.route('/:id')
  .get(verifyToken, checkPermission('production.view'), productionController.getProduction)
  .put(verifyToken, checkPermission('production.edit'), updateProductionValidation, validate, productionController.updateProduction)
  .delete(verifyToken, checkPermission('production.delete'), productionController.deleteProduction);

module.exports = router;
