'use strict';

const multer = require('multer');
const path = require('path');
const { AppError } = require('../utils/appError');

/**
 * Factory: creates a multer middleware that stores files in a specific subfolder.
 * @param {string} folder — subfolder inside /uploads/ (e.g. 'avatars', 'logos', 'bills')
 * @param {number} maxSizeMB — max file size in megabytes (default 5)
 */
const createUploader = (folder, maxSizeMB = 5) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, `../../../uploads/${folder}`));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${folder}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files (jpg, png, webp) are allowed.', 400), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

// Pre-configured uploaders
const uploadAvatar = createUploader('avatars').single('avatar');
const uploadLogo = createUploader('logos').single('logo');
const uploadPhoto = createUploader('photos').single('photo');

module.exports = { uploadAvatar, uploadLogo, uploadPhoto, createUploader };
