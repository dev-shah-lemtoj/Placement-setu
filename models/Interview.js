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
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
