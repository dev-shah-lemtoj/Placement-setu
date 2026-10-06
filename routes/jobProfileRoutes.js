const express = require("express");
const router = express.Router();

const JobProfile = require("../models/JobProfile");

// ========================================
// CREATE JOB PROFILE
// ========================================

router.post("/", async (req, res) => {
  console.log("========== JOB PROFILE RECEIVED ==========");
  console.log(req.body);

  try {
    const jobProfile = await JobProfile.create({
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      jobDescription: req.body.jobDescription,
      department: req.body.department,
      skillsRequired: req.body.skillsRequired,
      eligibilityCriteria:
          req.body.eligibilityCriteria,
      salary: req.body.salary,
      location: req.body.location,
      workMode: req.body.workMode,
    });

    console.log("========== JOB PROFILE SAVED ==========");
    console.log(jobProfile);

    res.status(201).json({
      success: true,
      message: "Job Profile Created Successfully",
      data: jobProfile,
    });

  } catch (error) {
    console.log("========== JOB PROFILE ERROR ==========");
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========================================
// GET ALL JOB PROFILES
// ========================================

router.get("/", async (req, res) => {
  try {
    const jobs = await JobProfile.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========================================
// GET SINGLE JOB PROFILE
// ========================================

router.get("/:id", async (req, res) => {
  try {
    const job = await JobProfile.findById(
      req.params.id,
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job Profile Not Found",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========================================
// DELETE JOB PROFILE
// ========================================

router.delete("/:id", async (req, res) => {
  try {
    const job = await JobProfile.findByIdAndDelete(
      req.params.id,
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job Profile Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job Profile Deleted Successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;