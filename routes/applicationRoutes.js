
const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");

// ======================================================
// ALLOWED APPLICATION STATUSES
// ======================================================

const allowedStatuses = [
  "New",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Interview Completed",
  "Selected",
  "Rejected",
];


// ======================================================
// STUDENT - APPLY FOR A JOB
// ======================================================

router.post("/apply", async (req, res) => {
  try {
    const {
      jobId,
      studentId,
    } = req.body;

    // --------------------------------------------------
    // CHECK REQUIRED DATA
    // --------------------------------------------------

    if (!jobId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "jobId and studentId are required",
      });
    }

    // --------------------------------------------------
    // CHECK JOB
    // --------------------------------------------------

    const job = await JobPosting.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // --------------------------------------------------
    // CHECK STUDENT
    // --------------------------------------------------

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // --------------------------------------------------
    // CHECK DUPLICATE APPLICATION
    // --------------------------------------------------

    const existingApplication =
      await Application.findOne({
        jobId: jobId,
        studentId: studentId,
      });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // --------------------------------------------------
    // CREATE REAL APPLICATION
    // --------------------------------------------------

    const application = await Application.create({
      jobId: jobId,
      studentId: studentId,

      // New application starts as New
      status: "New",

      appliedAt: new Date(),
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: application,
    });

  } catch (error) {
    console.error("Apply Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


// ======================================================
// COMPANY - GET ONLY ACTUAL APPLICANTS
// ======================================================

router.get(
  "/company/:companyName",
  async (req, res) => {
    try {
      const companyName =
        req.params.companyName;

      // ------------------------------------------------
      // FIND COMPANY'S JOBS
      // ------------------------------------------------

      const jobs = await JobPosting.find({
        companyName: companyName,
      }).select(
        "_id jobProfileId companyName"
      );

      const jobIds = jobs.map(
        (job) => job._id
      );

      // ------------------------------------------------
      // FIND ACTUAL APPLICATIONS
      // ------------------------------------------------

      const applications =
        await Application.find({
          jobId: {
            $in: jobIds,
          },
        })
          .populate(
            "studentId",
            "name email phone"
          )
          .populate(
            "jobId",
            "companyName packageOffered vacancies location"
          )
          .sort({
            appliedAt: -1,
          });

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(200).json({
        success: true,
        count: applications.length,
        applicants: applications,
      });

    } catch (error) {
      console.error(
        "Get Applicants Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);


// ======================================================
// COMPANY - GET ONLY SHORTLISTED STUDENTS
// ======================================================
//
// IMPORTANT:
// This does NOT create students.
//
// It only returns students whose REAL application
// already exists and whose status is "Shortlisted".
// ======================================================

router.get(
  "/company/:companyName/shortlisted",
  async (req, res) => {
    try {
      const companyName =
        req.params.companyName;

      // ------------------------------------------------
      // FIND COMPANY'S JOBS
      // ------------------------------------------------

      const jobs = await JobPosting.find({
        companyName: companyName,
      }).select("_id");

      const jobIds = jobs.map(
        (job) => job._id
      );

      // ------------------------------------------------
      // FIND ONLY SHORTLISTED APPLICATIONS
      // ------------------------------------------------

      const applications =
        await Application.find({
          jobId: {
            $in: jobIds,
          },

          status: "Shortlisted",
        })
          .populate(
            "studentId",
            "name email phone"
          )
          .populate(
            "jobId",
            "companyName packageOffered vacancies location"
          )
          .sort({
            appliedAt: -1,
          });

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(200).json({
        success: true,
        count: applications.length,
        shortlistedStudents: applications,
      });

    } catch (error) {
      console.error(
        "Get Shortlisted Students Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);


// ======================================================
// COMPANY - GET ONLY SELECTED STUDENTS
// ======================================================
//
// Shows students who were actually selected by the
// company after the recruitment process.
// ======================================================

router.get(
  "/company/:companyName/selected",
  async (req, res) => {
    try {
      const companyName =
        req.params.companyName;

      // ------------------------------------------------
      // FIND COMPANY'S JOBS
      // ------------------------------------------------

      const jobs = await JobPosting.find({
        companyName: companyName,
      }).select("_id");

      const jobIds = jobs.map(
        (job) => job._id
      );

      // ------------------------------------------------
      // FIND SELECTED APPLICATIONS
      // ------------------------------------------------

      const applications =
        await Application.find({
          jobId: {
            $in: jobIds,
          },

          status: "Selected",
        })
          .populate(
            "studentId",
            "name email phone"
          )
          .populate(
            "jobId",
            "companyName packageOffered vacancies location"
          )
          .sort({
            appliedAt: -1,
          });

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(200).json({
        success: true,
        count: applications.length,
        selectedStudents: applications,
      });

    } catch (error) {
      console.error(
        "Get Selected Students Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);


// ======================================================
// COMPANY - UPDATE APPLICATION STATUS
// ======================================================
//
// Company can update the status of an EXISTING
// application.
//
// Example:
// New -> Under Review
// Under Review -> Shortlisted
// Shortlisted -> Interview
// Interview -> Interview Completed
// Interview Completed -> Selected
// Interview Completed -> Rejected
// ======================================================

router.put(
  "/:applicationId/status",
  async (req, res) => {
    try {
      const {
        applicationId,
      } = req.params;

      const {
        status,
      } = req.body;

      // ------------------------------------------------
      // CHECK STATUS
      // ------------------------------------------------

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application status",
          allowedStatuses:
            allowedStatuses,
        });
      }

      // ------------------------------------------------
      // FIND APPLICATION
      // ------------------------------------------------

      const existingApplication =
        await Application.findById(
          applicationId
        );

      if (!existingApplication) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // ------------------------------------------------
      // UPDATE STATUS
      // ------------------------------------------------

      existingApplication.status =
        status;

      await existingApplication.save();

      // ------------------------------------------------
      // GET UPDATED APPLICATION
      // ------------------------------------------------

      const updatedApplication =
        await Application.findById(
          applicationId
        )
          .populate(
            "studentId",
            "name email phone"
          )
          .populate(
            "jobId",
            "companyName packageOffered vacancies location"
          );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(200).json({
        success: true,

        message:
          "Application status updated successfully",

        application:
          updatedApplication,
      });

    } catch (error) {
      console.error(
        "Status Update Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);


// ======================================================
// STUDENT - CHECK WHETHER ALREADY APPLIED
// ======================================================

router.get(
  "/check/:jobId/:studentId",
  async (req, res) => {
    try {
      const {
        jobId,
        studentId,
      } = req.params;

      // ------------------------------------------------
      // FIND APPLICATION
      // ------------------------------------------------

      const application =
        await Application.findOne({
          jobId: jobId,
          studentId: studentId,
        });

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      res.status(200).json({
        success: true,

        alreadyApplied:
          application != null,

        application:
          application,
      });

    } catch (error) {
      console.error(
        "Check Application Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
