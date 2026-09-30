'use strict';

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');

router.route('/')
  .get(verifyToken, settingsController.getRoles)
  .post(verifyToken, checkPermission('role.create'), settingsController.createRole);

router.route('/:id')
  .put(verifyToken, checkPermission('role.edit'), settingsController.updateRole)
  .patch(verifyToken, checkPermission('role.edit'), settingsController.updateRole)
  .delete(verifyToken, checkPermission('role.delete'), settingsController.deleteRole);

module.exports = router;
