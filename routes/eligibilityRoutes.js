const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ SAFE MODEL INIT (prevents overwrite error in dev)
const EligibilitySchema = new mongoose.Schema(
  {
    minCGPA: Number,
    branches: [String],
    backlogsAllowed: Boolean,
    maxBacklogs: Number,
    gapAllowed: Boolean,
    skills: [String],
    courseType: [String],
    location: String,
  },
  { timestamps: true }
);

// Prevent model overwrite error in nodemon
const Eligibility =
  mongoose.models.Eligibility ||
  mongoose.model("Eligibility", EligibilitySchema);

// ===================== SAVE API =====================
router.post("/save", async (req, res) => {
  try {
    const {
      minCGPA,
      branches,
      backlogsAllowed,
      maxBacklogs,
      gapAllowed,
      skills,
      courseType,
      location,
    } = req.body;

    const newEligibility = new Eligibility({
      minCGPA,
      branches,
      backlogsAllowed,
      maxBacklogs,
      gapAllowed,
      skills,
      courseType,
      location,
    });

    const saved = await newEligibility.save();

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

module.exports = router;