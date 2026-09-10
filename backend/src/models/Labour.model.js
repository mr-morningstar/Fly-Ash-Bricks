'use strict';

const mongoose = require('mongoose');

const LabourSchema = new mongoose.Schema(
  {
    // ── Core Identity ───────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Labour name is required.'],
      trim: true,
    },
    age: {
      type: Number,
      min: [14, 'Age must be at least 14.'],
      max: [80, 'Age must be 80 or below.'],
    },
    gender: {
      type: String,
      enum: { values: ['male', 'female', 'other'], message: 'Invalid gender value.' },
    },
    dob: { type: Date },
    address: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number.'],
    },
    photo: { type: String },           // relative upload path
    idProofType: {
      type: String,
      enum: { values: ['aadhaar', 'pan', 'voter', 'driving_license', 'other', ''], message: 'Invalid ID proof type.' },
      default: '',
    },
    idProofNumber: { type: String, trim: true },

    // ── Employment ──────────────────────────────────────────────────────
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    joiningDate: { type: Date, default: Date.now },
    skills: [{ type: String, trim: true }], // e.g. ['molding', 'mixing', 'loading']

    // ── Financial ───────────────────────────────────────────────────────
    advanceBalance: {
      type: Number,
      default: 0,
      min: [0, 'Advance balance cannot be negative.'],
    },
    bankDetails: {
      bankName:      { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc:          { type: String, trim: true, uppercase: true },
      branch:        { type: String, trim: true },
      upiId:         { type: String, trim: true },
    },

    // ── Emergency Contact ────────────────────────────────────────────────
    emergencyContact: {
      name:         { type: String, trim: true },
      phone:        { type: String, trim: true },
      relationship: { type: String, trim: true },
    },

    // ── Soft delete ──────────────────────────────────────────────────────
    isActive:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
LabourSchema.index({ name: 1 });
LabourSchema.index({ phone: 1 });
LabourSchema.index({ group: 1 });
LabourSchema.index({ isActive: 1 });
LabourSchema.index({ isDeleted: 1 });
LabourSchema.index({ 'group': 1, 'isDeleted': 1, 'isActive': 1 }); // billing queries
LabourSchema.index({ name: 'text', phone: 'text', address: 'text' });

// ── Soft-delete scope ─────────────────────────────────────────────────────
LabourSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const LabourModel = mongoose.models.Labour || mongoose.model('Labour', LabourSchema);

module.exports = { LabourModel };
