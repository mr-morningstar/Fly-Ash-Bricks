'use strict';

const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    enquiryType: { type: String, trim: true, default: 'General Order Enquiry' },
    quantity: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Quoted', 'Converted', 'Closed'],
      default: 'New'
    },
    xmlData: { type: String, default: '' },
    emailSent: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

const EnquiryModel = mongoose.model('Enquiry', EnquirySchema);

module.exports = { EnquiryModel };
