'use strict';

const { PublicSiteModel } = require('../models/PublicSite.model');
const { EnquiryModel } = require('../models/Enquiry.model');
const { sendOrderEnquiryEmails } = require('../utils/emailService');
const { ApiResponse } = require('../core/responses/ApiResponse');
const { AppError } = require('../utils/appError');
const fs = require('fs');
const path = require('path');

class PublicSiteController {
  /** Get Public Site content (Public endpoint - no Auth) */
  getSiteContent = async (req, res, next) => {
    try {
      let site = await PublicSiteModel.findOne();
      if (!site) {
        // Seed default document
        site = await PublicSiteModel.create({});
      }
      return ApiResponse.Ok(res, site, 'Website content retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /** Update Public Site content (Admin only) */
  updateSiteContent = async (req, res, next) => {
    try {
      let site = await PublicSiteModel.findOne();
      if (!site) {
        site = new PublicSiteModel();
      }

      const fields = { ...req.body };

      // Support parsing JSON fields if sent as multipart form data
      if (typeof fields.products === 'string') {
        try {
          fields.products = JSON.parse(fields.products);
        } catch (e) {
          return next(new AppError('Invalid format for products JSON.', 400));
        }
      }
      if (typeof fields.socialLinks === 'string') {
        try {
          fields.socialLinks = JSON.parse(fields.socialLinks);
        } catch (e) {
          return next(new AppError('Invalid format for socialLinks JSON.', 400));
        }
      }

      // Handle file uploads (heroImage, product images)
      if (req.files) {
        if (req.files.heroImage && req.files.heroImage[0]) {
          // Delete old hero image if exists
          if (site.heroImage) {
            const oldPath = path.join(__dirname, '../../', site.heroImage);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          fields.heroImage = `uploads/photos/${req.files.heroImage[0].filename}`;
        }

        // Support uploading files for products
        if (req.files.productImages) {
          fields.products = fields.products || [];
          req.files.productImages.forEach((file, index) => {
            // Find corresponding product by index (assumes array order matched on client)
            if (fields.products[index]) {
              fields.products[index].image = `uploads/photos/${file.filename}`;
            }
          });
        }
      }

      Object.assign(site, fields);
      const updatedSite = await site.save();

      return ApiResponse.Ok(res, updatedSite, 'Public website content updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Upload images to gallery */
  uploadGalleryImages = async (req, res, next) => {
    try {
      let site = await PublicSiteModel.findOne();
      if (!site) {
        site = await PublicSiteModel.create({});
      }

      if (!req.files || req.files.length === 0) {
        return next(new AppError('No images uploaded.', 400));
      }

      const paths = req.files.map((file) => `uploads/photos/${file.filename}`);
      site.gallery.push(...paths);
      await site.save();

      return ApiResponse.Ok(res, site.gallery, 'Gallery images uploaded successfully.');
    } catch (err) {
      next(err);
    }
  };

  /** Delete gallery image */
  deleteGalleryImage = async (req, res, next) => {
    try {
      const { imagePath } = req.body;
      let site = await PublicSiteModel.findOne();
      if (!site) {
        return next(new AppError('Website content not configured.', 404));
      }

      // Check if image is in gallery
      const index = site.gallery.indexOf(imagePath);
      if (index === -1) {
        return next(new AppError('Image not found in gallery.', 404));
      }

      // Remove from array
      site.gallery.splice(index, 1);
      await site.save();

      // Delete file from disk
      const filePath = path.join(__dirname, '../../', imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return ApiResponse.Ok(res, site.gallery, 'Gallery image deleted.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Submit an order enquiry from the public website
   * Saves to MongoDB, generates XML, dispatches email with XML attachment to Ashish Dansena
   */
  submitEnquiry = async (req, res, next) => {
    try {
      const { firstName, lastName, phone, email, enquiryType, quantity, message } = req.body;

      if (!firstName || !phone) {
        return next(new AppError('First name and phone number are required.', 400));
      }

      // Create enquiry document
      const enquiry = await EnquiryModel.create({
        firstName,
        lastName: lastName || '',
        phone,
        email: email || '',
        enquiryType: enquiryType || 'General Order Enquiry',
        quantity: quantity || '',
        message: message || '',
        status: 'New'
      });

      // Send emails with XML attachment in background
      try {
        const { xmlContent } = await sendOrderEnquiryEmails(enquiry);
        enquiry.xmlData = xmlContent;
        enquiry.emailSent = true;
        await enquiry.save();
      } catch (emailErr) {
        console.error('Email dispatch warning:', emailErr);
      }

      return ApiResponse.Created(
        res,
        {
          id: enquiry._id,
          recipient: 'ashishdansena636@gmail.com',
          status: 'Success'
        },
        'Order enquiry received successfully. Details dispatched to director Ashish Dansena with XML query file.'
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get list of all enquiries (Admin only)
   */
  getEnquiries = async (req, res, next) => {
    try {
      const enquiries = await EnquiryModel.find().sort({ createdAt: -1 }).limit(100);
      return ApiResponse.Ok(res, enquiries, 'Enquiries retrieved.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Add new article to public site (Manager / Super Admin)
   */
  addArticle = async (req, res, next) => {
    try {
      const { title, category, readTime, excerpt, content, author, image } = req.body;
      if (!title || !excerpt) {
        return next(new AppError('Title and excerpt are required.', 400));
      }

      let site = await PublicSiteModel.findOne();
      if (!site) site = await PublicSiteModel.create({});

      site.articles.unshift({
        title,
        category: category || 'Manufacturing',
        readTime: readTime || '5 min read',
        excerpt,
        content: content || '',
        author: author || 'Ashish Dansena',
        image: image || 'assets/gallery-2.jpg',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });

      await site.save();
      return ApiResponse.Created(res, site.articles, 'Article created successfully.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update an existing article
   */
  updateArticle = async (req, res, next) => {
    try {
      const { articleId } = req.params;
      const { title, category, readTime, excerpt, content, image } = req.body;

      let site = await PublicSiteModel.findOne();
      if (!site) return next(new AppError('Website content not found.', 404));

      const article = site.articles.id(articleId);
      if (!article) return next(new AppError('Article not found.', 404));

      if (title) article.title = title;
      if (category) article.category = category;
      if (readTime) article.readTime = readTime;
      if (excerpt) article.excerpt = excerpt;
      if (content !== undefined) article.content = content;
      if (image) article.image = image;

      await site.save();
      return ApiResponse.Ok(res, article, 'Article updated successfully.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Delete an article
   */
  deleteArticle = async (req, res, next) => {
    try {
      const { articleId } = req.params;
      let site = await PublicSiteModel.findOne();
      if (!site) return next(new AppError('Website content not found.', 404));

      const initialCount = site.articles.length;
      site.articles.pull({ _id: articleId });

      if (site.articles.length === initialCount) {
        return next(new AppError('Article not found.', 404));
      }

      await site.save();
      return ApiResponse.Ok(res, site.articles, 'Article deleted successfully.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Add a gallery item (with title and category)
   */
  addGalleryItem = async (req, res, next) => {
    try {
      const { title, category, image, subtitle } = req.body;
      if (!title || !image) {
        return next(new AppError('Title and image are required.', 400));
      }

      let site = await PublicSiteModel.findOne();
      if (!site) site = await PublicSiteModel.create({});

      site.galleryItems.unshift({
        title,
        category: category || 'plant',
        image,
        subtitle: subtitle || ''
      });

      await site.save();
      return ApiResponse.Created(res, site.galleryItems, 'Gallery item added.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Delete a gallery item
   */
  deleteGalleryItem = async (req, res, next) => {
    try {
      const { itemId } = req.params;
      let site = await PublicSiteModel.findOne();
      if (!site) return next(new AppError('Website content not found.', 404));

      site.galleryItems.pull({ _id: itemId });
      await site.save();

      return ApiResponse.Ok(res, site.galleryItems, 'Gallery item deleted.');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new PublicSiteController();


