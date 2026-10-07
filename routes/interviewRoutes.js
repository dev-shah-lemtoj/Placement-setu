const express = require("express");
const router = express.Router();

const Interview = require("../models/Interview");
const Application = require("../models/Application");
const { notifyStudents } = require("../utils/notify");

const interviewFields = [
  "company",
  "jobProfile",
  "student",
  "round",
  "interviewType",
  "date",
  "time",
  "duration",
  "venue",
  "meetingLink",
  "interviewer",
  "notes",
  "status",
];

function pickFields(body, fields) {
  const data = {};

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  return data;
}

// SCHEDULE INTERVIEW
//
// When applicationId is sent, the interview is linked to that
// application's student and job, the application moves to
// "Interview Scheduled" and the student is notified.
router.post("/schedule", async (req, res) => {
  try {
    const data = pickFields(req.body, interviewFields);

    let application = null;

    if (req.body.applicationId) {
      application = await Application.findById(req.body.applicationId)
        .populate("studentId", "name")
        .populate({
          path: "jobId",
          select: "companyName jobProfileId",
          populate: { path: "jobProfileId", select: "jobTitle" },
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      data.applicationId = application._id;
      data.studentId = application.studentId?._id || null;
      data.jobPostingId = application.jobId?._id || null;
      data.student = data.student || application.studentId?.name;
      data.company = data.company || application.jobId?.companyName;
      data.jobProfile =
        data.jobProfile || application.jobId?.jobProfileId?.jobTitle;
    }

    const interview = await Interview.create(data);

    if (application) {
      application.status = "Interview Scheduled";
      await application.save();

      await notifyStudents([interview.studentId], {
        title: "Interview Scheduled",
        message: `Your ${interview.round} for ${interview.jobProfile} at ${interview.company} is scheduled on ${interview.date} at ${interview.time}.`,
        type: "INTERVIEW_SCHEDULED",
      });
    }

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

// GET A STUDENT'S INTERVIEWS
router.get("/student/:studentId", async (req, res) => {
  try {
    const interviews = await Interview.find({
      studentId: req.params.studentId,
    })
      .populate("jobPostingId", "location selectionProcess")
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews: interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
      error: error.message,
    });
  }
});

// GET A COMPANY'S INTERVIEWS
router.get("/company/:companyName", async (req, res) => {
  try {
    const interviews = await Interview.find({
      company: req.params.companyName,
    })
      .populate("studentId", "name email phone course branch cgpa resume")
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews: interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
      error: error.message,
    });
  }
});

// UPDATE INTERVIEW (reschedule, complete, cancel, record result)
//
// A Selected / Rejected result is copied to the linked application.
router.put("/:id", async (req, res) => {
  try {
    const update = pickFields(req.body, [
      ...interviewFields,
      "result",
      "feedback",
    ]);

    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (update.result === "Selected" || update.result === "Rejected") {
      if (interview.applicationId) {
        await Application.findByIdAndUpdate(interview.applicationId, {
          status: update.result,
        });
      }

      await notifyStudents([interview.studentId], {
        title:
          update.result === "Selected"
            ? "Congratulations! You are Selected"
            : "Interview Result",
        message: `Your interview result for ${interview.jobProfile} at ${interview.company}: ${update.result}.`,
        type: "RESULT",
      });
    } else if (update.status === "Cancelled" || update.date || update.time) {
      await notifyStudents([interview.studentId], {
        title:
          update.status === "Cancelled"
            ? "Interview Cancelled"
            : "Interview Updated",
        message:
          update.status === "Cancelled"
            ? `Your interview for ${interview.jobProfile} at ${interview.company} has been cancelled.`
            : `Your interview for ${interview.jobProfile} at ${interview.company} is now on ${interview.date} at ${interview.time}.`,
        type: "INTERVIEW_SCHEDULED",
      });
    }

    res.status(200).json({
      success: true,
      message: "Interview updated successfully",
      interview,
    });
  } catch (error) {
    const isValidationError = error.name === "ValidationError";

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError
        ? "Invalid interview details"
        : "Failed to update interview",
      error: error.message,
    });
  }
});

module.exports = router;
