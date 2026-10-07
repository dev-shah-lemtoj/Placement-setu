
const mongoose = require('mongoose');

// Every status the application routes can set. Keep in sync with
// allowedStatuses in routes/applicationRoutes.js.
const applicationStatuses = [
  'New',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Interview Scheduled',
  'Interview Completed',
  'On Hold',
  'Selected',
  'Rejected',
];

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
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
      enum: applicationStatuses,
      default: 'New',
    },

    // Filled in by the company when announcing the result
    offerPackage: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'Application',
  applicationSchema
);

module.exports.applicationStatuses = applicationStatuses;

