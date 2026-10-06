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

module.exports = router;