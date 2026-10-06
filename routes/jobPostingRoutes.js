const express = require("express");
const router = express.Router();

const JobPosting = require("../models/JobPosting");

// GET ALL OPEN JOBS
router.get("/", async (req, res) => {
  try {
    const jobs = await JobPosting.find({
      status: "Open",
    })
      .populate("jobProfileId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs: jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
});

// CREATE JOB POSTING
router.post("/", async (req, res) => {
  try {
    const job = await JobPosting.create({
      companyName: req.body.companyName,
      jobProfileId: req.body.jobProfileId,
      packageOffered: req.body.packageOffered,
      vacancies: req.body.vacancies,
      location: req.body.location,
      eligibilityCGPA: req.body.eligibilityCGPA,
      lastDateToApply: req.body.lastDateToApply,
      selectionProcess: req.body.selectionProcess,
      postedByType: req.body.postedByType,
      postedById: req.body.postedById,
    });

    res.status(201).json({
      success: true,
      message: "Job Posted Successfully",
      job: job,
    });
  } catch (error) {
    console.error(error);

    const isValidationError =
      error.name === "ValidationError" || error.name === "CastError";

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError
        ? "Invalid job details"
        : "Failed to post job",
      error: error.message,
    });
  }
});

module.exports = router;