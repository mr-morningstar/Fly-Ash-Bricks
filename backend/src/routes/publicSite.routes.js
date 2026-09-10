'use strict';

const express = require('express');
const router = express.Router();
const publicSiteController = require('../controllers/publicSite.controller');
const { verifyToken, checkPermission } = require('../core/middlewares/auth.middleware');
const { createUploader } = require('../middleware/upload.middleware');

// Setup multer uploader for multiple fields/arrays in public site edits
const uploadSiteFiles = createUploader('photos').fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 }
]);
const uploadGalleryFiles = createUploader('photos').array('galleryImages', 10);

// Public route (unauthenticated)
router.get('/site', publicSiteController.getSiteContent);
router.post('/enquiry', publicSiteController.submitEnquiry);

// Admin-only routes
router.get('/enquiries', verifyToken, publicSiteController.getEnquiries);
router.put('/site', verifyToken, checkPermission('publicSite.update'), uploadSiteFiles, publicSiteController.updateSiteContent);
router.post('/gallery', verifyToken, checkPermission('publicSite.update'), uploadGalleryFiles, publicSiteController.uploadGalleryImages);
router.post('/gallery/delete', verifyToken, checkPermission('publicSite.update'), publicSiteController.deleteGalleryImage);
router.post('/articles', verifyToken, checkPermission('publicSite.update'), publicSiteController.addArticle);
router.put('/articles/:articleId', verifyToken, checkPermission('publicSite.update'), publicSiteController.updateArticle);
router.delete('/articles/:articleId', verifyToken, checkPermission('publicSite.update'), publicSiteController.deleteArticle);
router.post('/gallery-items', verifyToken, checkPermission('publicSite.update'), publicSiteController.addGalleryItem);
router.delete('/gallery-items/:itemId', verifyToken, checkPermission('publicSite.update'), publicSiteController.deleteGalleryItem);

module.exports = router;

