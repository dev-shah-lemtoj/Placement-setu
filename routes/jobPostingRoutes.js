const express = require("express");
const router = express.Router();

const JobPosting = require("../models/JobPosting");
const Application = require("../models/Application");

// GET JOBS
// Open jobs by default; ?status=all returns open and closed jobs.
router.get("/", async (req, res) => {
  try {
    const filter = req.query.status === "all" ? {} : { status: "Open" };

    const jobs = await JobPosting.find(filter)
      .populate("jobProfileId")
      .sort({ createdAt: -1 });

    // Number of applications per job
    const counts = await Application.aggregate([
      { $match: { jobId: { $in: jobs.map((job) => job._id) } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]);

    const countOf = new Map(
      counts.map((c) => [c._id.toString(), c.count])
    );

    res.status(200).json({
      success: true,
      jobs: jobs.map((job) => ({
        ...job.toObject(),
        applicantCount: countOf.get(job._id.toString()) || 0,
      })),
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

// OPEN / CLOSE A JOB POSTING
// Closed jobs stop appearing to students and can't be applied to.
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Open", "Closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Open or Closed",
      });
    }

    const job = await JobPosting.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("jobProfileId");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Job ${status === "Open" ? "reopened" : "closed"}`,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: error.message,
    });
  }
});

module.exports = router;