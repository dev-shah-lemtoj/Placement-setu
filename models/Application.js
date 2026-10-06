
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobProfile',
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,

      enum: [
        'Applied',
        'Shortlisted',
        'Interview Scheduled',
        'Interview Completed',
        'Selected',
        'Rejected',
      ],

      default: 'Applied',
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'Application',
  applicationSchema
);

