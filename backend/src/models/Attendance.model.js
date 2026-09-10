'use strict';

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: [true, 'Labour reference is required.'],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group reference is required.'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required.'],
    },
    status: {
      type: String,
      enum: {
        values: ['P', 'A', 'HD', 'FD'],
        message: 'Status must be P (Present), A (Absent), HD (Half Day), or FD (Full Day).',
      },
      required: [true, 'Attendance status is required.'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
// Enforce one record per labour per day
AttendanceSchema.index({ labour: 1, date: 1 }, { unique: true });
// Efficient group+date queries (grid view, bulk mark)
AttendanceSchema.index({ group: 1, date: 1 });
// Date range queries
AttendanceSchema.index({ date: 1 });

const AttendanceModel =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

module.exports = { AttendanceModel };
