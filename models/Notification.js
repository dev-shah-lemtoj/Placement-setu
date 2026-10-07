const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // e.g. General, Placement Drive, Interview, Result,
    // APPLICATION_STATUS, INTERVIEW_SCHEDULED ...
    type: {
      type: String,
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },

    // "All Students" is a broadcast. Any other audience is resolved
    // to a list of recipients when the notification is created.
    audience: {
      type: String,
      default: "Student",
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    companyName: { type: String, default: "" },
    jobRole: { type: String, default: "" },
    importantDate: { type: String, default: "" },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
