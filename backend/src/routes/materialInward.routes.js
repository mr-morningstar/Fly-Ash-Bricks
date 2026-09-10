'use strict';

const express = require('express');
const router = express.Router();
const materialInwardController = require('../controllers/materialInward.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/import', upload.single('file'), materialInwardController.importCSV);
router.post('/bulk', materialInwardController.createBulk);

router
  .route('/')
  .get(materialInwardController.getAll)
  .post(materialInwardController.create);

router
  .route('/:id')
  .get(materialInwardController.getOne)
  .patch(materialInwardController.update)
  .delete(materialInwardController.remove);

module.exports = router;
