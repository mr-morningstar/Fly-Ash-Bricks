'use strict';

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { uploadLogo } = require('../middleware/upload.middleware');

// Company settings (Singleton)
router.route('/')
  .get(verifyToken, checkPermission('settings.view'), settingsController.getSettings)
  .put(verifyToken, checkPermission('settings.edit'), uploadLogo, settingsController.updateSettings);

// Roles management
router.route('/roles')
  .get(verifyToken, checkPermission('role.view'), settingsController.getRoles)
  .post(verifyToken, checkPermission('role.create'), settingsController.createRole);

router.route('/roles/:id')
  .put(verifyToken, checkPermission('role.edit'), settingsController.updateRole)
  .delete(verifyToken, checkPermission('role.delete'), settingsController.deleteRole);

module.exports = router;
