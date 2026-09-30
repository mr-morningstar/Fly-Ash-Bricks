'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

// Public route for QR code target profiles
router.get('/public/:slug', userController.getPublicProfile);

// Self actions
router.patch('/me/profile', verifyToken, uploadAvatar, userController.updateMyProfile);
router.patch('/me/password', verifyToken, userController.updateMyPassword);

// User CRUD (restricted)
router.route('/')
  .post(verifyToken, checkPermission('user.create'), uploadAvatar, userController.createUser)
  .get(verifyToken, checkPermission('user.view'), userController.getAllUsers);

router.route('/:id')
  .get(verifyToken, checkPermission('user.view'), userController.getUser)
  .put(verifyToken, checkPermission('user.edit'), uploadAvatar, userController.updateUser)
  .patch(verifyToken, checkPermission('user.edit'), uploadAvatar, userController.updateUser)
  .delete(verifyToken, checkPermission('user.delete'), userController.deleteUser);

router.patch('/:id/toggle', verifyToken, checkPermission('user.edit'), userController.toggleActive);
router.patch('/:id/reset-password', verifyToken, checkPermission('user.edit'), userController.adminResetPassword);

router.get('/:id/qr', verifyToken, checkPermission('user.view'), userController.getUserQR);

module.exports = router;
