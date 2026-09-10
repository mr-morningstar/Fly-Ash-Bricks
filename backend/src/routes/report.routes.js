'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');

router.use(protect);

router.get('/generate', reportController.generateReport);

module.exports = router;
