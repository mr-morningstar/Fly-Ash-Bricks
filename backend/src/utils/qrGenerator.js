'use strict';

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * generateQRCode — Creates a QR code PNG for a user's public profile URL.
 * @param {string} slug       — user's publicSlug
 * @param {string} clientUrl  — base frontend URL (from env)
 * @returns {Promise<string>} — relative path like 'uploads/qrcodes/qr-<slug>.png'
 */
const generateQRCode = async (slug, clientUrl) => {
  const url = `${clientUrl}/profile/${slug}`;
  const dir = path.join(__dirname, '../../uploads/qrcodes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `qr-${slug}.png`);
  await QRCode.toFile(filePath, url, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });

  return `uploads/qrcodes/qr-${slug}.png`;
};

module.exports = { generateQRCode };
