'use strict';

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { validate } = require('../core/middlewares/validate.middleware');
const {
  markSingleAttendanceValidation,
  bulkMarkAttendanceValidation
} = require('../validations/attendance.validation');

router.post('/', verifyToken, checkPermission('attendance.mark'), markSingleAttendanceValidation, validate, attendanceController.markSingleAttendance);
router.post('/bulk', verifyToken, checkPermission('attendance.mark'), bulkMarkAttendanceValidation, validate, attendanceController.bulkMarkAttendance);
router.get('/grid', verifyToken, checkPermission('attendance.view'), attendanceController.getAttendanceGrid);

module.exports = router;
