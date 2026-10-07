
const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");
const Interview = require("../models/Interview");
const { notifyStudents } = require("../utils/notify");
const {
  checkEligibility,
  eligibilityMessage,
} = require("../utils/eligibility");
const { Eligibility } = require("./eligibilityRoutes");

// ======================================================
// ALLOWED APPLICATION STATUSES
// ======================================================

const allowedStatuses = Application.applicationStatuses;


// ======================================================
// POPULATE HELPERS
// ======================================================
//
// jobId points to a JobPosting. The job title lives on the posting's
// JobProfile, so it is copied onto the job as jobTitle for the app.

const jobPopulate = {
  path: "jobId",
  select:
    "companyName packageOffered vacancies location selectionProcess lastDateToApply jobProfileId",
  populate: {
    path: "jobProfileId",
    select: "jobTitle department workMode",
  },
};

const studentFields =
  "name email phone college course branch cgpa passingYear backlogs skills resume";

function formatApplication(application) {
  const item = application.toObject();
  const job = item.jobId;

  if (job) {
    job.jobTitle = job.jobProfileId?.jobTitle || "";
    job.department = job.jobProfileId?.department || "";
    job.workMode = job.jobProfileId?.workMode || "";
  }

  return item;
}

function findApplications(filter) {
  return Application.find(filter)
    .populate("studentId", studentFields)
    .populate(jobPopulate)
    .sort({ appliedAt: -1 });
}

// Adds each application's latest interview as "interview".
async function withInterviews(applications) {
  const interviews = await Interview.find({
    applicationId: {
      $in: applications.map((application) => application._id),
    },
  }).sort({ createdAt: -1 });

  return applications.map((application) => {
    const item = formatApplication(application);

    item.interview =
      interviews.find(
        (interview) =>
          interview.applicationId.toString() ===
          application._id.toString()
      ) || null;

    return item;
  });
}

async function companyJobIds(companyName) {
  const jobs = await JobPosting.find({
    companyName: companyName,
  }).select("_id");

  return jobs.map((job) => job._id);
}


// ======================================================
// STUDENT - APPLY FOR A JOB
// ======================================================

router.post("/apply", async (req, res) => {
  try {
    const {
      jobId,
      studentId,
    } = req.body;

    if (!jobId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "jobId and studentId are required",
      });
    }

    const job = await JobPosting.findById(jobId)
      .populate("jobProfileId", "jobTitle skillsRequired");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const eligibility = checkEligibility(
      student,
      job,
      await Eligibility.find().lean()
    );

    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibilityMessage(eligibility),
        reasons: eligibility.reasons,
        missing: eligibility.missing,
      });
    }

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

    const application = await Application.create({
      jobId: jobId,
      studentId: studentId,
      status: "New",
      appliedAt: new Date(),
    });

    const jobTitle = job.jobProfileId?.jobTitle || "the job";

    await notifyStudents([studentId], {
      title: "Application Submitted",
      message: `Your application for ${jobTitle} at ${job.companyName} was submitted successfully.`,
      type: "APPLICATION_SUBMITTED",
    });

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
// STUDENT - GET MY APPLICATIONS
// ======================================================
//
// Each application includes its latest interview, if one was
// scheduled for it.

router.get("/student/:studentId", async (req, res) => {
  try {
    const applications = await findApplications({
      studentId: req.params.studentId,
    });

    const formatted = await withInterviews(applications);

    res.status(200).json({
      success: true,
      count: formatted.length,
      applications: formatted,
    });
  } catch (error) {
    console.error("Get Student Applications Error:", error);

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
      const applications = await findApplications({
        jobId: {
          $in: await companyJobIds(req.params.companyName),
        },
      });

      res.status(200).json({
        success: true,
        count: applications.length,
        applicants: await withInterviews(applications),
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
// Only returns students whose REAL application exists and whose
// status is "Shortlisted".

router.get(
  "/company/:companyName/shortlisted",
  async (req, res) => {
    try {
      const applications = await findApplications({
        jobId: {
          $in: await companyJobIds(req.params.companyName),
        },
        status: "Shortlisted",
      });

      res.status(200).json({
        success: true,
        count: applications.length,
        shortlistedStudents: applications.map(formatApplication),
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

router.get(
  "/company/:companyName/selected",
  async (req, res) => {
    try {
      const applications = await findApplications({
        jobId: {
          $in: await companyJobIds(req.params.companyName),
        },
        status: "Selected",
      });

      res.status(200).json({
        success: true,
        count: applications.length,
        selectedStudents: applications.map(formatApplication),
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
// Example flow:
// New -> Under Review -> Shortlisted -> Interview
// -> Interview Completed -> Selected / Rejected
//
// The student is notified of every change.

router.put(
  "/:applicationId/status",
  async (req, res) => {
    try {
      const {
        applicationId,
      } = req.params;

      const {
        status,
        offerPackage,
        joiningDate,
        remarks,
      } = req.body;

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

      existingApplication.status =
        status;

      if (offerPackage !== undefined) {
        existingApplication.offerPackage = offerPackage;
      }

      if (joiningDate !== undefined) {
        existingApplication.joiningDate = joiningDate;
      }

      if (remarks !== undefined) {
        existingApplication.remarks = remarks;
      }

      await existingApplication.save();

      const updatedApplication =
        await Application.findById(applicationId)
          .populate("studentId", studentFields)
          .populate(jobPopulate);

      const formatted = formatApplication(updatedApplication);
      const job = formatted.jobId || {};

      await notifyStudents([existingApplication.studentId], {
        title:
          status === "Selected"
            ? "Congratulations! You are Selected"
            : "Application Status Updated",
        message: `Your application for ${job.jobTitle || "the job"} at ${job.companyName || "the company"} is now "${status}".`,
        type: status === "Selected" || status === "Rejected"
          ? "RESULT"
          : "APPLICATION_STATUS",
      });

      res.status(200).json({
        success: true,

        message:
          "Application status updated successfully",

        application: formatted,
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

      const application =
        await Application.findOne({
          jobId: jobId,
          studentId: studentId,
        });

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
