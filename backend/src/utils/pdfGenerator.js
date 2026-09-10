'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * generateBillPDF — Generates a pdfkit invoice for a Bill document.
 *
 * @param {object} opts
 *   @param {object}  opts.bill        — Populated Bill mongoose document
 *   @param {object}  opts.settings    — Settings singleton (company name, logo, etc.)
 *   @param {string}  opts.outputPath  — Absolute path to save the PDF
 * @returns {Promise<string>}           — outputPath when done
 */
const generateBillPDF = ({ bill, settings, outputPath }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    const pageW = doc.page.width - 80; // usable width with margins

    // ── Header ─────────────────────────────────────────────────────
    // Logo (if available)
    if (settings.logoPath && fs.existsSync(settings.logoPath)) {
      doc.image(settings.logoPath, 40, 30, { width: 60 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(settings.companyName || 'DEV Bricks', 110, 40, { align: 'left' });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .text(settings.companyAddress || '', 110, 62)
      .text(`Ph: ${settings.companyPhone || ''}`, 110, 74);

    // "PAYMENT BILL" tag on right
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1a1a1a')
      .text('PAYMENT BILL', 0, 40, { align: 'right' });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .text(`Bill No: ${bill._id.toString().slice(-8).toUpperCase()}`, 0, 62, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 0, 74, { align: 'right' });

    // Divider
    doc.moveTo(40, 100).lineTo(doc.page.width - 40, 100).strokeColor('#ddd').stroke();

    // ── Period & Group ──────────────────────────────────────────────
    doc.moveDown(0.5);
    const start = new Date(bill.periodStart).toLocaleDateString('en-IN');
    const end = new Date(bill.periodEnd).toLocaleDateString('en-IN');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1a1a1a')
      .text(`Group: ${bill.group?.name || '—'}`, 40, 115)
      .text(`Period: ${start} — ${end}`, 40, 130)
      .text(`Status: ${bill.status.toUpperCase()}`, 40, 145);

    // ── Labour Table ────────────────────────────────────────────────
    const tableTop = 175;
    const cols = {
      name:  { x: 40,   w: 110, label: 'Labour Name' },
      p:     { x: 150,  w: 30,  label: 'P' },
      hd:    { x: 180,  w: 30,  label: 'HD' },
      fd:    { x: 210,  w: 30,  label: 'FD' },
      a:     { x: 240,  w: 30,  label: 'A' },
      gross: { x: 270,  w: 70,  label: 'Gross (₹)' },
      ded:   { x: 340,  w: 70,  label: 'Advance (₹)' },
      net:   { x: 410,  w: 70,  label: 'Net (₹)' },
    };

    // Header row background
    doc.rect(40, tableTop - 5, pageW + 20, 18).fill('#f0f0f0');

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1a1a1a');
    Object.values(cols).forEach(({ x, w, label }) => {
      doc.text(label, x, tableTop, { width: w, align: 'center' });
    });

    // Data rows
    let y = tableTop + 20;
    const lineItems = bill.lineItems || [];

    lineItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.rect(40, y - 3, pageW + 20, 16).fill('#fafafa');
      }
      doc.font('Helvetica').fontSize(8).fillColor('#333');
      doc.text(item.labour?.name || '—', cols.name.x, y, { width: cols.name.w });
      doc.text(item.daysP  ?? 0, cols.p.x,   y, { width: cols.p.w,   align: 'center' });
      doc.text(item.daysHD ?? 0, cols.hd.x,  y, { width: cols.hd.w,  align: 'center' });
      doc.text(item.daysFD ?? 0, cols.fd.x,  y, { width: cols.fd.w,  align: 'center' });
      doc.text(item.daysA  ?? 0, cols.a.x,   y, { width: cols.a.w,   align: 'center' });
      doc.text(fmt(item.gross),           cols.gross.x, y, { width: cols.gross.w, align: 'right' });
      doc.text(fmt(item.advanceDeducted), cols.ded.x,   y, { width: cols.ded.w,   align: 'right' });
      doc.text(fmt(item.net),             cols.net.x,   y, { width: cols.net.w,   align: 'right' });
      y += 16;
    });

    // Bottom border
    doc.moveTo(40, y + 2).lineTo(doc.page.width - 40, y + 2).strokeColor('#ccc').stroke();

    // ── Totals ──────────────────────────────────────────────────────
    y += 14;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a');
    doc.text(`Total Gross: ₹${fmt(bill.totalGross)}`, 0, y, { align: 'right' });
    doc.text(`Total Net Payable: ₹${fmt(bill.totalNet)}`, 0, y + 16, { align: 'right', color: '#16a34a' });

    // ── Signature ───────────────────────────────────────────────────
    const sigY = y + 60;
    doc.moveTo(40, sigY + 30).lineTo(180, sigY + 30).strokeColor('#888').stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#555').text('Authorised Signature', 40, sigY + 34);

    doc.moveTo(doc.page.width - 180, sigY + 30).lineTo(doc.page.width - 40, sigY + 30).stroke();
    doc.text('Received By', doc.page.width - 180, sigY + 34);

    // ── Footer ──────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#aaa')
      .text(
        `Generated by DEV Bricks Management System — ${new Date().toISOString()}`,
        40,
        doc.page.height - 50,
        { align: 'center', width: pageW + 20 }
      );

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

/** Format number as Indian currency string */
function fmt(n) {
  if (n == null) return '0.00';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = { generateBillPDF };
