const express = require("express");
const router = express.Router();

const Interview = require("../models/Interview");

// SCHEDULE INTERVIEW
router.post("/schedule", async (req, res) => {
  try {
    const interview = await Interview.create({
      company: req.body.company,
      jobProfile: req.body.jobProfile,
      student: req.body.student,
      round: req.body.round,
      interviewType: req.body.interviewType,
      date: req.body.date,
      time: req.body.time,
      duration: req.body.duration,
      venue: req.body.venue,
      meetingLink: req.body.meetingLink,
      interviewer: req.body.interviewer,
      notes: req.body.notes,
      status: req.body.status,
    });

    res.status(201).json({
      success: true,
      message: "Interview Scheduled Successfully",
      interview: interview,
    });
  } catch (error) {
    console.error(error);

    const isValidationError = error.name === "ValidationError";

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError
        ? "Invalid interview details"
        : "Failed to schedule interview",
      error: error.message,
    });
  }
});

// GET ALL INTERVIEWS
router.get("/", async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews: interviews,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
      error: error.message,
    });
  }
});

module.exports = router;
