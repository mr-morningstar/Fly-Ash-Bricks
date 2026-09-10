'use strict';

const express = require('express');
const router = express.Router();
const labourController = require('../controllers/labour.controller');
const { verifyToken, checkPermission, requireRole } = require('../core/middlewares/auth.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const { uploadPhoto } = require('../middleware/upload.middleware');
const {
  createLabourValidation,
  updateLabourValidation
} = require('../validations/labour.validation');

router.route('/')
  .post(verifyToken, checkPermission('labour.create'), uploadPhoto, createLabourValidation, validate, labourController.createLabour)
  .get(verifyToken, checkPermission('labour.view'), labourController.getAllLabours);

router.route('/:id')
  .get(verifyToken, checkPermission('labour.view'), labourController.getLabour)
  .put(verifyToken, checkPermission('labour.edit'), uploadPhoto, updateLabourValidation, validate, labourController.updateLabour)
  .delete(verifyToken, checkPermission('labour.delete'), labourController.softDeleteLabour);

router.delete('/:id/hard', verifyToken, requireRole(['Super Admin']), labourController.hardDeleteLabour);

module.exports = router;
