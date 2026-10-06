const mongoose = require("mongoose");

const jobPostingSchema = new mongoose.Schema(
  {
    // ==========================================
    // COMPANY INFORMATION
    // ==========================================

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    jobProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobProfile",
      required: true,
    },

    // ==========================================
    // JOB INFORMATION
    // ==========================================

    packageOffered: {
      type: String,
      required: true,
      trim: true,
    },

    vacancies: {
      type: Number,
      required: true,
      min: 1,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    eligibilityCGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    lastDateToApply: {
      type: String,
      required: true,
    },

    selectionProcess: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // POSTED BY
    // ==========================================

    postedByType: {
      type: String,
      enum: ["T&P", "Company"],
      required: true,
    },

    postedById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "JobPosting",
  jobPostingSchema
);