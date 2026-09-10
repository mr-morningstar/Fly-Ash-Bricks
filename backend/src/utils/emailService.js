'use strict';

const nodemailer = require('nodemailer');
const { logger } = require('../core/logger/winston.logger');

/**
 * Creates an XML document string from enquiry details
 */
function generateEnquiryXml(enquiry) {
  const sanitize = (str) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const fullName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();
  const dateStr = new Date(enquiry.createdAt || Date.now()).toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<DevBricksEnquiry>
  <Meta>
    <EnquiryId>${sanitize(String(enquiry._id || Date.now()))}</EnquiryId>
    <Timestamp>${sanitize(dateStr)}</Timestamp>
    <Source>DEV Fly Ash Bricks Public Portal</Source>
    <Location>Sondka, Basanpali, Kharsia, Raigarh, Chhattisgarh 496661</Location>
  </Meta>
  <Customer>
    <FullName>${sanitize(fullName)}</FullName>
    <FirstName>${sanitize(enquiry.firstName)}</FirstName>
    <LastName>${sanitize(enquiry.lastName)}</LastName>
    <Phone>${sanitize(enquiry.phone)}</Phone>
    <Email>${sanitize(enquiry.email)}</Email>
  </Customer>
  <OrderDetails>
    <EnquiryType>${sanitize(enquiry.enquiryType)}</EnquiryType>
    <EstimatedQuantity>${sanitize(enquiry.quantity)}</EstimatedQuantity>
    <Requirements>${sanitize(enquiry.message)}</Requirements>
  </OrderDetails>
</DevBricksEnquiry>`;
}

/**
 * Builds HTML template for owner (Ashish Dansena)
 */
function buildOwnerEmailHtml(enquiry) {
  const fullName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();
  const dateFormatted = new Date(enquiry.createdAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b1117; margin:0; padding:20px; color: #e6edf3; }
    .container { max-width: 600px; margin: 0 auto; background: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #ff6b00 0%, #d9534f 100%); padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background: #ff6b00; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 10px; }
    .body { padding: 28px; }
    .field-group { margin-bottom: 18px; }
    .field-label { font-size: 11px; text-transform: uppercase; color: #8b949e; letter-spacing: 1px; font-weight: 700; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #f0f6fc; font-weight: 600; background: #0d1117; padding: 12px 14px; border-radius: 8px; border: 1px solid #21262d; }
    .highlight-box { background: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.3); border-radius: 10px; padding: 16px; margin: 20px 0; }
    .highlight-title { font-size: 12px; font-weight: 700; color: #ff8c37; text-transform: uppercase; margin-bottom: 6px; }
    .highlight-text { font-size: 15px; color: #ffffff; line-height: 1.5; white-space: pre-wrap; }
    .actions { text-align: center; margin: 24px 0 12px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; margin: 0 6px 8px; }
    .btn-call { background: #ff6b00; color: #ffffff; }
    .btn-wa { background: #25d366; color: #ffffff; }
    .footer { background: #0d1117; padding: 16px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #21262d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧱 DEV Fly Ash Bricks — New Order Enquiry</h1>
      <p>Received on ${dateFormatted}</p>
      <span class="badge">Action Required</span>
    </div>
    <div class="body">
      <p style="font-size:14px;color:#8b949e;margin-top:0;">Hello <strong>Ashish Dansena</strong>, a new customer has submitted an order enquiry on your website:</p>

      <div class="field-group">
        <div class="field-label">Customer Name</div>
        <div class="field-value">👤 ${fullName}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Phone Number</div>
        <div class="field-value">📞 <a href="tel:${enquiry.phone}" style="color:#ff8c37;text-decoration:none;">${enquiry.phone}</a></div>
      </div>

      <div class="field-group">
        <div class="field-label">Customer Email</div>
        <div class="field-value">✉️ ${enquiry.email ? `<a href="mailto:${enquiry.email}" style="color:#58a6ff;text-decoration:none;">${enquiry.email}</a>` : 'Not provided'}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Enquiry Type</div>
        <div class="field-value">📋 ${enquiry.enquiryType || 'General Enquiry'}</div>
      </div>

      <div class="field-group">
        <div class="field-label">Estimated Quantity</div>
        <div class="field-value">🧱 ${enquiry.quantity || 'Not specified'}</div>
      </div>

      <div class="highlight-box">
        <div class="highlight-title">Customer Requirements / Site Details</div>
        <div class="highlight-text">${enquiry.message || 'No additional message provided.'}</div>
      </div>

      <div class="actions">
        <a href="tel:${enquiry.phone}" class="btn btn-call">📞 Call Customer</a>
        <a href="https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}" class="btn btn-wa" target="_blank">💬 WhatsApp</a>
      </div>

      <p style="font-size:12px;color:#8b949e;text-align:center;margin-top:16px;">
        📎 An XML document containing full structured enquiry data is attached to this email (<code>enquiry-${enquiry._id || 'data'}.xml</code>).
      </p>
    </div>
    <div class="footer">
      DEV Fly Ash Bricks · Sondka, Basanpali, Kharsia, Raigarh, CG · Phone: 8085112711<br>
      System Architect: Shivam Dansena
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds HTML thank-you template for customer
 */
function buildCustomerEmailHtml(enquiry) {
  const fullName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; margin:0; padding:20px; color: #333; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e4e8; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .header { background: #ff6b00; padding: 24px; text-align: center; color: #ffffff; }
    .body { padding: 28px; line-height: 1.6; }
    .footer { background: #fafbfc; padding: 14px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">DEV Fly Ash Bricks</h2>
      <p style="margin:4px 0 0;font-size:13px;">Thank You for Your Order Enquiry</p>
    </div>
    <div class="body">
      <p>Dear <strong>${fullName}</strong>,</p>
      <p>Thank you for reaching out to <strong>DEV Fly Ash Bricks</strong>. We have successfully received your enquiry regarding <strong>${enquiry.enquiryType || 'Fly Ash Bricks'}</strong> (Qty: ${enquiry.quantity || 'As discussed'}).</p>
      <p>Our director, <strong>Ashish Dansena</strong>, will review your requirements and call you at <strong>${enquiry.phone}</strong> shortly with our best bulk quotation and delivery schedule.</p>
      <p>If you need urgent assistance, please feel free to call us directly at <strong>+91 80851 12711</strong> or chat with us on WhatsApp.</p>
      <p style="margin-top:24px;">Warm regards,<br><strong>Dev Kumar Dansena & Ashish Dansena</strong><br>DEV Fly Ash Bricks · Sondka, Kharsia, Raigarh (CG)</p>
    </div>
    <div class="footer">
      📍 W5JV+P4H, Sondka, Basanpali, Chhattisgarh 496661 · Call: +91 80851 12711
    </div>
  </div>
</body>
</html>`;
}

/**
 * Configure Nodemailer Transporter
 */
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    // If Gmail
    if (user.includes('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }
    // Custom SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass }
    });
  }

  // Fallback test/stream transport if SMTP is not yet configured in .env
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true
  });
}

/**
 * Sends order enquiry email to Ashish Dansena with XML attachment,
 * and sends confirmation to the customer.
 */
async function sendOrderEnquiryEmails(enquiry) {
  const targetOwnerEmail = process.env.OWNER_EMAIL || 'ashishdansena636@gmail.com';
  const xmlContent = generateEnquiryXml(enquiry);
  const transporter = getTransporter();

  const ownerMailOptions = {
    from: process.env.EMAIL_FROM || `"DEV Fly Ash Bricks" <no-reply@devbricks.in>`,
    to: targetOwnerEmail,
    subject: `🧱 New Brick Order Enquiry from ${enquiry.firstName} ${enquiry.lastName || ''} (${enquiry.phone})`,
    html: buildOwnerEmailHtml(enquiry),
    attachments: [
      {
        filename: `enquiry-${enquiry._id || 'details'}.xml`,
        content: xmlContent,
        contentType: 'application/xml'
      }
    ]
  };

  let ownerResult;
  try {
    ownerResult = await transporter.sendMail(ownerMailOptions);
    logger.info(`✅ Enquiry email dispatched to owner (${targetOwnerEmail}) for customer ${enquiry.phone}`);
  } catch (err) {
    logger.error('Error sending owner enquiry email:', err);
  }

  // Send confirmation to customer if they provided an email address
  if (enquiry.email && enquiry.email.includes('@')) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"DEV Fly Ash Bricks" <info@devbricks.in>`,
        to: enquiry.email,
        subject: `Enquiry Received: DEV Fly Ash Bricks`,
        html: buildCustomerEmailHtml(enquiry)
      });
      logger.info(`✅ Confirmation email sent to customer (${enquiry.email})`);
    } catch (err) {
      logger.warn('Could not send customer confirmation email:', err.message);
    }
  }

  return {
    xmlContent,
    ownerResult
  };
}

module.exports = {
  generateEnquiryXml,
  sendOrderEnquiryEmails
};
