'use strict';

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { verifyToken: protect } = require('../core/middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Public/Protected
router.use(protect);

router.post('/import', upload.single('file'), tripController.importCSV);
router.get('/form-data', tripController.getFormData);

router
  .route('/')
  .get(tripController.getAll)
  .post(tripController.create);

router
  .route('/:id')
  .get(tripController.getOne)
  .patch(tripController.update)
  .delete(tripController.remove);

// Helper sub-document routes
router.post('/:id/helpers', tripController.addHelper);
router.patch('/:id/helpers/:helperId', tripController.updateHelper);
router.delete('/:id/helpers/:helperId', tripController.removeHelper);

module.exports = router;
