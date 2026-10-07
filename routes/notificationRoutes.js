const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const Application = require("../models/Application");
const JobPosting = require("../models/JobPosting");
const Student = require("../models/Student");
const { checkEligibility } = require("../utils/eligibility");
const { Eligibility } = require("./eligibilityRoutes");

// ======================================================
// RESOLVE AUDIENCE TO STUDENT IDS
// ======================================================
//
// companyName is optional. When given, Applied / Shortlisted /
// Selected / Eligible are limited to that company's jobs.

async function companyJobIds(companyName) {
  const filter = companyName ? { companyName } : {};

  const jobs = await JobPosting.find(filter).select("_id");

  return jobs.map((job) => job._id);
}

async function studentsWithApplicationStatus(companyName, statuses) {
  const filter = {
    jobId: { $in: await companyJobIds(companyName) },
  };

  if (statuses) {
    filter.status = { $in: statuses };
  }

  return Application.distinct("studentId", filter);
}

// Students eligible for at least one open job (of the company, if
// given), using the same rules as applying.
async function eligibleStudents(companyName) {
  const filter = { status: "Open" };

  if (companyName) {
    filter.companyName = companyName;
  }

  const jobs = await JobPosting.find(filter)
    .populate("jobProfileId", "jobTitle skillsRequired");

  if (jobs.length === 0) return [];

  const criteria = await Eligibility.find().lean();
  const students = await Student.find().select("-password");

  return students
    .filter((student) =>
      jobs.some((job) => checkEligibility(student, job, criteria).eligible)
    )
    .map((student) => student._id);
}

async function resolveRecipients(audience, companyName) {
  switch (audience) {
    case "Applied Students":
      return studentsWithApplicationStatus(companyName, null);

    case "Shortlisted Students":
      return studentsWithApplicationStatus(companyName, [
        "Shortlisted",
        "Interview",
        "Interview Scheduled",
      ]);

    case "Selected Students":
      return studentsWithApplicationStatus(companyName, ["Selected"]);

    case "Eligible Students":
      return eligibleStudents(companyName);

    default:
      return [];
  }
}

// ======================================================
// T&P - HOW MANY STUDENTS WOULD RECEIVE IT
// ======================================================
//
// GET /audience-count?audience=Selected%20Students&companyName=Acme

router.get("/audience-count", async (req, res) => {
  try {
    const audience = req.query.audience || "All Students";

    const count =
      audience === "All Students"
        ? await Student.countDocuments()
        : (await resolveRecipients(audience, req.query.companyName)).length;

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to count recipients",
      error: error.message,
    });
  }
});

// ======================================================
// T&P - SEND NOTIFICATION
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      audience,
      companyName,
      jobRole,
      importantDate,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const targetAudience = audience || "All Students";

    const recipients =
      targetAudience === "All Students"
        ? []
        : await resolveRecipients(targetAudience, companyName);

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      audience: targetAudience,
      recipients,
      companyName,
      jobRole,
      importantDate,
    });

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      recipientCount:
        targetAudience === "All Students"
          ? await Student.countDocuments()
          : recipients.length,
      notification,
    });
  } catch (error) {
    console.error("Send Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// ======================================================
// STUDENT - GET MY NOTIFICATIONS
// ======================================================

router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const notifications = await Notification.find({
      $or: [
        { audience: "All Students" },
        { recipients: studentId },
      ],
      deletedBy: { $ne: studentId },
    })
      .select("-recipients -deletedBy")
      .sort({ createdAt: -1 });

    const formatted = notifications.map((notification) => {
      const item = notification.toObject();

      item.isRead = notification.readBy.some(
        (id) => id.toString() === studentId
      );

      delete item.readBy;

      return item;
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      notifications: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// ======================================================
// STUDENT - MARK ONE AS READ
// ======================================================

router.put("/:id/read", async (req, res) => {
  try {
    const { studentId } = req.body;

    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: studentId },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// STUDENT - MARK ALL AS READ
// ======================================================

router.put("/student/:studentId/read-all", async (req, res) => {
  try {
    const { studentId } = req.params;

    await Notification.updateMany(
      {
        $or: [
          { audience: "All Students" },
          { recipients: studentId },
        ],
      },
      {
        $addToSet: { readBy: studentId },
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// STUDENT - DELETE (HIDE) A NOTIFICATION
// ======================================================

router.delete("/:id/student/:studentId", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { deletedBy: req.params.studentId },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
