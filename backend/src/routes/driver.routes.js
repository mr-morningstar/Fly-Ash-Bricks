'use strict';

const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');

router.use(protect);

router
  .route('/')
  .get(driverController.getAll)
  .post(driverController.create);

router
  .route('/:id')
  .get(driverController.getOne)
  .put(driverController.update)
  .delete(driverController.remove);

module.exports = router;
