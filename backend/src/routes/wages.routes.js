'use strict';

const express = require('express');
const router = express.Router();
const wagesController = require('../controllers/wages.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');

router.use(protect);

router.get('/daily-summary', wagesController.getDailySummary);

module.exports = router;
