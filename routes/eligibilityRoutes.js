const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ SAFE MODEL INIT (prevents overwrite error in dev)
//
// One criteria document per company + job title. An empty jobTitle
// means the criteria apply to all of that company's jobs.
const EligibilitySchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "", trim: true },
    jobTitle: { type: String, default: "", trim: true },
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      default: null,
    },

    minCGPA: Number,
    min10thPercentage: Number,
    min12thPercentage: Number,
    minAttendance: Number,
    branches: [String],
    courses: [String],
    backlogsAllowed: Boolean,
    maxBacklogs: Number,
    gapAllowed: Boolean,
    maxEducationGap: Number,
    skills: [String],
    passingYear: Number,
    location: String,
  },
  { timestamps: true }
);

// Prevent model overwrite error in nodemon
const Eligibility =
  mongoose.models.Eligibility ||
  mongoose.model("Eligibility", EligibilitySchema);

// ===================== SAVE API =====================
//
// Accepts the field names sent by both the company screen
// (courseType, gapAllowed) and the T&P screen (company, jobProfile,
// courses, educationGapAllowed, attendance).
router.post("/save", async (req, res) => {
  try {
    const body = req.body;

    const companyName = (body.companyName || body.company || "").trim();
    const jobTitle = (body.jobTitle || body.jobProfile || "").trim();

    const criteria = {
      companyName,
      jobTitle,
      jobPostingId: body.jobPostingId || null,
      minCGPA: body.minCGPA,
      min10thPercentage: body.min10thPercentage,
      min12thPercentage: body.min12thPercentage,
      minAttendance: body.minAttendance ?? body.attendance,
      branches: body.branches,
      courses: body.courses || body.courseType,
      backlogsAllowed: body.backlogsAllowed,
      maxBacklogs: body.maxBacklogs,
      gapAllowed: body.gapAllowed ?? body.educationGapAllowed,
      maxEducationGap: body.maxEducationGap,
      skills: body.skills,
      passingYear: body.passingYear,
      location: body.location,
    };

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const saved = await Eligibility.findOneAndUpdate(
      { companyName, jobTitle },
      criteria,
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      message: "Eligibility saved successfully",
      data: saved,
    });
  } catch (err) {
    console.error("Eligibility Save Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error while saving eligibility",
      error: err.message,
    });
  }
});

// ===================== GET API =====================
//
// Optional ?companyName= filter.
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.companyName) {
      filter.companyName = req.query.companyName;
    }

    const criteria = await Eligibility.find(filter).sort({
      updatedAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: criteria.length,
      data: criteria,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching eligibility",
      error: err.message,
    });
  }
});

module.exports = router;
module.exports.Eligibility = Eligibility;
