'use strict';

const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const {
  createGroupValidation,
  updateGroupValidation
} = require('../validations/group.validation');

router.route('/')
  .post(verifyToken, checkPermission('group.create'), createGroupValidation, validate, groupController.createGroup)
  .get(verifyToken, checkPermission('group.view'), groupController.getAllGroups);

router.route('/:id')
  .get(verifyToken, checkPermission('group.view'), groupController.getGroup)
  .put(verifyToken, checkPermission('group.config'), updateGroupValidation, validate, groupController.updateGroup)
  .delete(verifyToken, checkPermission('group.delete'), groupController.deleteGroup);

router.post('/:id/members', verifyToken, checkPermission('group.edit'), groupController.assignMembers);
router.delete('/:id/members/:labourId', verifyToken, checkPermission('group.edit'), groupController.removeMember);

module.exports = router;
