'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');

// Single consolidated endpoint — returns all dashboard data in one call
router.get('/full', protect, dashboardController.getFullDashboard);

module.exports = router;
