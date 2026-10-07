const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const CompanyUser = require("../models/CompanyUser");
const JobPosting = require("../models/JobPosting");
const Application = require("../models/Application");

const profileFields = [
  "companyName",
  "hrName",
  "email",
  "phone",
  "location",
  "website",
  "description",
];

function pickProfile(body) {
  const data = {};

  for (const field of profileFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  return data;
}

// CREATE / UPDATE COMPANY PROFILE
//
// With companyUserId (sent by the company app) the account's profile is
// created or updated, so each account has one profile.
router.post("/", async (req, res) => {
  try {
    const data = pickProfile(req.body);
    const { companyUserId } = req.body;

    let company;

    if (companyUserId) {
      company = await Company.findOneAndUpdate(
        { companyUserId },
        { ...data, companyUserId },
        { new: true, upsert: true, runValidators: true }
      );
    } else {
      company = await Company.create(data);
    }

    res.status(201).json({
      success: true,
      company,
    });
  } catch (error) {
    const isDuplicate = error.code === 11000;

    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: isDuplicate
        ? "Another company profile already uses this email"
        : "Failed to save company profile",
      error: error.message,
    });
  }
});

// GET ALL COMPANIES
//
// Every registered company account, with its profile details when it
// has one, plus any profile not linked to an account. Each item has
// hasAccount / hasProfile flags.
router.get("/", async (req, res) => {
  try {
    const accounts = await CompanyUser.find()
      .select("-password")
      .sort({ createdAt: -1 });

    const profiles = await Company.find().sort({ createdAt: -1 });

    // Job and hiring counts per company name
    const jobs = await JobPosting.find().select("_id companyName status");
    const hires = await Application.find({ status: "Selected" }).select("jobId");

    const statsFor = (companyName) => {
      const own = jobs.filter((job) => job.companyName === companyName);
      const ids = new Set(own.map((job) => job._id.toString()));

      return {
        jobCount: own.length,
        openJobCount: own.filter((job) => job.status === "Open").length,
        hiredCount: hires.filter((h) => ids.has(h.jobId.toString())).length,
      };
    };

    const usedProfiles = new Set();

    const companies = accounts.map((account) => {
      // Profiles created before accounts were linked match by name
      const profile =
        profiles.find(
          (p) => p.companyUserId?.toString() === account._id.toString()
        ) ||
        profiles.find(
          (p) =>
            !p.companyUserId &&
            p.companyName.trim().toLowerCase() ===
              account.companyName.trim().toLowerCase()
        );

      if (profile) usedProfiles.add(profile._id.toString());

      return {
        _id: account._id,
        companyUserId: account._id,
        companyName: account.companyName,
        hrName: profile?.hrName || "",
        email: profile?.email || account.email,
        phone: profile?.phone || account.phone,
        location: profile?.location || "",
        website: profile?.website || "",
        description: profile?.description || "",
        hasAccount: true,
        hasProfile: Boolean(profile),
        createdAt: account.createdAt,
        ...statsFor(account.companyName),
      };
    });

    for (const profile of profiles) {
      if (usedProfiles.has(profile._id.toString())) continue;

      companies.push({
        ...profile.toObject(),
        hasAccount: false,
        hasProfile: true,
        ...statsFor(profile.companyName),
      });
    }

    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// GET A COMPANY ACCOUNT'S PROFILE
router.get("/by-user/:companyUserId", async (req, res) => {
  try {
    const company = await Company.findOne({
      companyUserId: req.params.companyUserId,
    });

    if (!company) {
      return res.status(404).json({
        message: "Company profile not created yet",
      });
    }

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// GET SINGLE COMPANY
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
