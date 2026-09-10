'use strict';

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/import', upload.single('file'), inventoryController.importCSV);
router.get('/low-stock', inventoryController.getLowStock);

router
  .route('/')
  .get(inventoryController.getAll)
  .post(inventoryController.create);

router
  .route('/:id')
  .get(inventoryController.getOne)
  .patch(inventoryController.update);

router.patch('/:id/toggle', inventoryController.toggleActive);

module.exports = router;
