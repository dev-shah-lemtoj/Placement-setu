const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");
const Application = require("../models/Application");
const Interview = require("../models/Interview");

// Academic year "2026-27" runs from 1 June 2026 to 31 May 2027.
function academicYearOf(date) {
  const year = date.getMonth() >= 5
    ? date.getFullYear()
    : date.getFullYear() - 1;

  return `${year}-${String(year + 1).slice(-2)}`;
}

function academicYearRange(label) {
  const startYear = parseInt(label.split("-")[0], 10);

  return {
    start: new Date(startYear, 5, 1),
    end: new Date(startYear + 1, 5, 1),
  };
}

// "5.5 LPA", "₹4.5 - 6 LPA", "600000" -> package in LPA.
// Uses the first number; values above 1000 are treated as rupees.
function packageInLPA(text) {
  const match = String(text || "").replace(/,/g, "").match(/\d+(\.\d+)?/);

  if (!match) return null;

  const value = parseFloat(match[0]);

  return value > 1000 ? value / 100000 : value;
}

const shortlistedStatuses = [
  "Shortlisted",
  "Interview",
  "Interview Scheduled",
  "Interview Completed",
  "Selected",
];

function distinctCount(applications, predicate) {
  return new Set(
    applications
      .filter(predicate)
      .map((application) => application.studentId.toString())
  ).size;
}

// ======================================================
// PLACEMENT SUMMARY
// ======================================================
//
// GET /api/reports/summary?year=2026-27
// Year defaults to the current academic year. Jobs posted in the
// year, and the applications to them, are counted. Student totals
// are not year-bound.

router.get("/summary", async (req, res) => {
  try {
    const currentYear = academicYearOf(new Date());
    const year = req.query.year || currentYear;
    const { start, end } = academicYearRange(year);

    // ---------------- available years ----------------

    const firstJob = await JobPosting.findOne().sort({ createdAt: 1 });
    const firstYear = parseInt(
      academicYearOf(firstJob ? firstJob.createdAt : new Date()).split("-")[0],
      10
    );
    const lastYear = parseInt(currentYear.split("-")[0], 10);

    const availableYears = [];
    for (let y = lastYear; y >= firstYear; y--) {
      availableYears.push(`${y}-${String(y + 1).slice(-2)}`);
    }

    // ---------------- data for the year ----------------

    const students = await Student.find().select("cgpa course branch");

    const jobs = await JobPosting.find({
      createdAt: { $gte: start, $lt: end },
    }).populate("jobProfileId", "jobTitle");

    const jobIds = jobs.map((job) => job._id);

    const applications = await Application.find({
      jobId: { $in: jobIds },
    });

    const interviewedIds = new Set(
      (
        await Interview.distinct("studentId", {
          jobPostingId: { $in: jobIds },
          studentId: { $ne: null },
        })
      ).map((id) => id.toString())
    );

    // A student is eligible if their CGPA meets at least one job's
    // minimum CGPA for the year.
    const lowestCGPA = jobs.length
      ? Math.min(...jobs.map((job) => job.eligibilityCGPA || 0))
      : null;

    const isEligible = (student) =>
      lowestCGPA != null &&
      student.cgpa != null &&
      student.cgpa >= lowestCGPA;

    // ---------------- funnel ----------------

    const appliedIds = new Set(
      applications.map((application) => application.studentId.toString())
    );

    const selectedApplications = applications.filter(
      (application) => application.status === "Selected"
    );

    const placedIds = new Set(
      selectedApplications.map((application) =>
        application.studentId.toString()
      )
    );

    // ---------------- packages of placed students ----------------

    const jobById = new Map(jobs.map((job) => [job._id.toString(), job]));

    const packages = selectedApplications
      .map((application) =>
        packageInLPA(jobById.get(application.jobId.toString())?.packageOffered)
      )
      .filter((value) => value != null);

    const highestPackage = packages.length ? Math.max(...packages) : 0;
    const lowestPackage = packages.length ? Math.min(...packages) : 0;
    const averagePackage = packages.length
      ? packages.reduce((sum, value) => sum + value, 0) / packages.length
      : 0;

    // ---------------- company-wise ----------------

    const companyReports = jobs.map((job) => {
      const jobApplications = applications.filter(
        (application) => application.jobId.toString() === job._id.toString()
      );

      return {
        company: job.companyName,
        profile: job.jobProfileId?.jobTitle || "",
        applied: jobApplications.length,
        shortlisted: jobApplications.filter((application) =>
          shortlistedStatuses.includes(application.status)
        ).length,
        selected: jobApplications.filter(
          (application) => application.status === "Selected"
        ).length,
        package: job.packageOffered,
      };
    });

    // ---------------- department-wise ----------------

    const departments = new Map();

    for (const student of students) {
      const name = student.course || student.branch || "Not Specified";
      const id = student._id.toString();

      if (!departments.has(name)) {
        departments.set(name, {
          department: name,
          total: 0,
          eligible: 0,
          applied: 0,
          placed: 0,
        });
      }

      const department = departments.get(name);

      department.total++;
      if (isEligible(student)) department.eligible++;
      if (appliedIds.has(id)) department.applied++;
      if (placedIds.has(id)) department.placed++;
    }

    res.status(200).json({
      success: true,
      year,
      availableYears,

      totalStudents: students.length,
      eligibleStudents: students.filter(isEligible).length,
      appliedStudents: appliedIds.size,
      shortlistedStudents: distinctCount(applications, (application) =>
        shortlistedStatuses.includes(application.status)
      ),
      interviewedStudents: interviewedIds.size,
      placedStudents: placedIds.size,

      highestPackage,
      averagePackage,
      lowestPackage,

      companyReports,
      departmentReports: [...departments.values()].sort(
        (a, b) => b.total - a.total
      ),
    });
  } catch (error) {
    console.error("Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
});

module.exports = router;
