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
      <div style="margin-top:14px;padding:12px;background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.25);border-radius:10px;">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#ff8c37;font-weight:700;display:block;">Enterprise ERP Architecture</span>
        <span style="font-size:13px;color:#ffffff;font-weight:800;">Digitally Developed &amp; Designed by <strong style="color:#ff8c37;">Shivam Dansena</strong></span>
        <div style="font-size:11px;color:#8b949e;margin-top:2px;">Full-Stack Developer &amp; Systems Designer</div>
      </div>
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
    .footer { background: #fafbfc; padding: 16px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
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
      📍 W5JV+P4H, Sondka, Basanpali, Chhattisgarh 496661 · Call: +91 80851 12711<br>
      <div style="margin-top:10px;padding:10px;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;display:inline-block;">
        <span style="font-size:11px;color:#0f766e;font-weight:700;">Crafted with excellence by <strong>Shivam Dansena</strong> &mdash; Full Stack Developer</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds HTML template for Password Reset (DEV Fly Ash Bricks)
 */
function buildPasswordResetHtml({ name, resetUrl }) {
  const userName = name || 'Valued Team Member';
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080f14; margin: 0; padding: 24px; color: #e6edf3; }
    .wrapper { max-width: 580px; margin: 0 auto; background: #0e171f; border-radius: 20px; border: 1px solid #1e2c38; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #064e3b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .brand-title { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
    .brand-sub { margin: 6px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500; letter-spacing: 0.5px; }
    .body { padding: 36px 28px; }
    .headline { font-size: 20px; font-weight: 800; color: #f0fdfa; margin: 0 0 16px; }
    .text { font-size: 15px; color: #94a3b8; line-height: 1.65; margin: 0 0 20px; }
    .notice-box { background: rgba(13, 148, 136, 0.1); border-left: 4px solid #14b8a6; padding: 14px 18px; border-radius: 8px; margin: 24px 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .reset-btn { display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff !important; padding: 15px 36px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 25px rgba(20, 184, 166, 0.35); text-transform: uppercase; letter-spacing: 0.8px; }
    .footer { background: #070d12; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #17232d; }
    .dev-stamp { margin-top: 18px; padding: 14px; background: rgba(13, 148, 136, 0.08); border: 1px solid rgba(13, 148, 136, 0.25); border-radius: 12px; text-align: center; }
    .dev-title { font-size: 10px; font-weight: 800; color: #14b8a6; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
    .dev-name { font-size: 14px; font-weight: 800; color: #ffffff; }
    .dev-role { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="font-size:32px;margin-bottom:8px;">🧱</div>
      <h1 class="brand-title">DEV FLY ASH BRICKS</h1>
      <p class="brand-sub">Management & Manufacturing ERP · Sondka, Kharsia</p>
    </div>
    <div class="body">
      <h2 class="headline">Password Reset Request 🔐</h2>
      <p class="text">Hello <strong>${userName}</strong>,</p>
      <p class="text">
        We received a request to reset the password for your account on the <strong>DEV Fly Ash Bricks ERP</strong> workspace. 
        Click the secure button below to set a new password:
      </p>

      <div class="btn-container">
        <a href="${resetUrl}" class="reset-btn" target="_blank">Reset My Password →</a>
      </div>

      <div class="notice-box">
        <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.5;">
          ⏱️ <strong>Security Notice:</strong> This reset link is single-use and will expire in <strong>15 minutes</strong>. If you did not request this change, please ignore this email; your existing password will remain safe.
        </p>
      </div>

      <p class="text" style="font-size:13px;color:#64748b;margin-top:24px;">
        If the button above does not work, copy and paste this URL into your browser:<br>
        <span style="color:#2dd4bf;word-break:break-all;">${resetUrl}</span>
      </p>
    </div>
    <div class="footer">
      <strong>DEV Fly Ash Bricks</strong> · Dev Kumar Dansena & Ashish Dansena<br>
      📍 Sondka, Basanpali, Kharsia, Raigarh, Chhattisgarh 496661 · Call: +91 80851 12711<br>
      &copy; ${year} DEV Fly Ash Bricks. All rights reserved.
      
      <div class="dev-stamp">
        <div class="dev-title">Digital ERP Solutions Architecture</div>
        <div class="dev-name">Crafted by <span style="color:#2dd4bf;">Shivam Dansena</span></div>
        <div class="dev-role">Full-Stack Software Developer &amp; Lead Systems Architect</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Configure Nodemailer Transporter (exact GYM platform pattern)
 */
function getTransporter(portOverride) {
  const isSecure = process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465;
  const portNum = portOverride || Number(process.env.SMTP_PORT) || 587;
  const host = process.env.SMTP_HOST || (process.env.EMAIL_USER?.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp-relay.brevo.com');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  logger.info(`[emailService] Initializing transporter | Host: ${host} | Port: ${portNum} | Secure: ${isSecure} | User: ${user ? '✅ set' : '❌ missing'}`);

  if (user && pass) {
    if (user.includes('@gmail.com') || host.includes('gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        family: 4,
        connectionTimeout: 15000,
        socketTimeout: 30000
      });
    }
    return nodemailer.createTransport({
      host,
      port: portNum,
      secure: isSecure,
      auth: { user, pass },
      family: 4,
      connectionTimeout: 15000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true
  });
}

/**
 * Universal email dispatcher matching GYM platform:
 * Attempts Brevo HTTPS REST API first; if unconfigured or rejected (e.g. 401 unactivated key),
 * automatically and transparently falls back to SMTP transport.
 */
async function sendEmailUniversal({ to, subject, html, attachments = [] }) {
  const fromName = process.env.FROM_NAME || 'DEV Fly Ash Bricks';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sworkdansena@gmail.com';
  const brevoKey = process.env.BREVO_API_KEY || (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xkeysib-') ? process.env.SMTP_PASS : null);
  const isBrevoHost = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('brevo.com');

  // 1. Try Brevo HTTPS REST API
  if (brevoKey || (isBrevoHost && process.env.SMTP_PASS)) {
    try {
      const apiKey = brevoKey || process.env.SMTP_PASS;
      logger.info(`[emailService] Attempting Brevo HTTPS REST API dispatch to: ${to}`);

      const payload = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
      };

      if (attachments && attachments.length > 0) {
        payload.attachment = attachments.map(att => ({
          name: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64')
        }));
      }

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.warn(`[emailService] Brevo HTTP API returned status ${res.status} (${errText}). Falling back to SMTP transport.`);
      } else {
        const data = await res.json();
        logger.info(`[emailService] Brevo HTTP API successfully delivered messageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
    } catch (apiErr) {
      logger.warn(`[emailService] Brevo HTTP API attempt failed (${apiErr.message}). Proceeding with SMTP fallback...`);
    }
  }

  // 2. Standard Nodemailer SMTP fallback (exact GYM platform pattern)
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      attachments
    });
    logger.info(`[emailService] Message successfully dispatched via SMTP: ${info.messageId || 'OK'}`);
    return { success: true, messageId: info.messageId };
  } catch (smtpErr) {
    logger.error(`[emailService] SMTP fallback failed:`, smtpErr.message);
    throw smtpErr;
  }
}

/**
 * Sends Password Reset Email via Brevo / SMTP
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const html = buildPasswordResetHtml({ name, resetUrl });
  return sendEmailUniversal({
    to,
    subject: '🔑 Reset Your Password — DEV Fly Ash Bricks ERP',
    html
  });
}

/**
 * Sends order enquiry email to Ashish Dansena with XML attachment,
 * and sends confirmation to the customer.
 */
async function sendOrderEnquiryEmails(enquiry) {
  const targetOwnerEmail = process.env.OWNER_EMAIL || 'ashishdansena636@gmail.com';
  const xmlContent = generateEnquiryXml(enquiry);

  let ownerResult;
  try {
    ownerResult = await sendEmailUniversal({
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
    });
    logger.info(`✅ Enquiry email dispatched to owner (${targetOwnerEmail}) for customer ${enquiry.phone}`);
  } catch (err) {
    logger.error('Error sending owner enquiry email:', err);
  }

  // Send confirmation to customer if they provided an email address
  if (enquiry.email && enquiry.email.includes('@')) {
    try {
      await sendEmailUniversal({
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
  sendOrderEnquiryEmails,
  sendEmailUniversal,
  sendPasswordResetEmail,
  buildPasswordResetHtml
};
