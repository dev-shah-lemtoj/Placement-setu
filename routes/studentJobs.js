const express = require("express");
const router = express.Router();

const JobPosting = require("../models/JobPosting");

router.get("/", async (req, res) => {
  try {
    const jobs = await JobPosting.find({
      status: "Open",
      postedByType: {
        $in: ["Company", "T&P"],
      },
    }).populate("jobProfileId");

    const formattedJobs = jobs.map((job) => ({
      id: job._id,
      companyName: job.companyName,
      jobTitle: job.jobProfileId?.jobTitle || "",
      jobDescription: job.jobProfileId?.jobDescription || "",
      department: job.jobProfileId?.department || "",
      skills: job.jobProfileId?.skillsRequired || [],
      salary:
          job.packageOffered ||
          job.jobProfileId?.salary ||
          "",
      location:
          job.location ||
          job.jobProfileId?.location ||
          "",
      workMode:
          job.jobProfileId?.workMode ||
          "Full Time",
      minCGPA: job.eligibilityCGPA,
      lastDate: job.lastDateToApply,
      vacancies: job.vacancies,
      selectionProcess: job.selectionProcess,
      postedByType: job.postedByType,
      postedById: job.postedById,
      status: job.status,
    }));

    res.status(200).json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error("Student Jobs Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
});

module.exports = router;