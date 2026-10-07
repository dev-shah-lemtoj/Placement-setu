const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },

    jobProfile: {
      type: String,
      required: true,
      trim: true,
    },

    student: {
      type: String,
      required: true,
      trim: true,
    },

    round: {
      type: String,
      required: true,
      trim: true,
    },

    interviewType: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    venue: {
      type: String,
      trim: true,
      default: "",
    },

    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },

    interviewer: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Scheduled", "Rescheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },

    result: {
      type: String,
      enum: ["Pending", "Selected", "Rejected", "On Hold"],
      default: "Pending",
    },

    feedback: {
      type: String,
      trim: true,
      default: "",
    },

    // Links to the real application. company, jobProfile and student
    // above hold the display names.
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
