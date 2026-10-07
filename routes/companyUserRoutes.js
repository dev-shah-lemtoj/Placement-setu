const express = require("express");
const router = express.Router();

const CompanyUser = require("../models/CompanyUser");
const JobPosting = require("../models/JobPosting");
const JobProfile = require("../models/JobProfile");
const Interview = require("../models/Interview");
const { Eligibility } = require("./eligibilityRoutes");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  console.log("REGISTER REQUEST:", req.body.phone);

  try {
    const {
      companyName,
      email,
      phone,
      password,
    } = req.body;
const phoneRegex = /^[6-9]\d{9}$/;

if (!phoneRegex.test(phone)) {
  return res.status(400).json({
    success: false,
    message: "Invalid mobile number",
  });
}
    const existingCompany =
      await CompanyUser.findOne({
        $or: [{ email }, { phone }],
      });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company already exists",
      });
    }

    const company = new CompanyUser({
      companyName,
      email,
      phone,
      password,
    });

    await company.save();

    console.log("REGISTER SUCCESS:", company._id);

    company.password = undefined;

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      company,
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================= GET ALL COMPANIES =================
router.get("/", async (req, res) => {
  try {
    const companies = await CompanyUser.find().select("-password");

    res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================= UPDATE COMPANY =================
//
// Jobs, job profiles, interviews and eligibility criteria refer to
// the company by name, so a rename is applied to them as well.
router.put("/:id", async (req, res) => {
  try {
    const previous = await CompanyUser.findById(req.params.id);

    const company =
      await CompanyUser.findByIdAndUpdate(
        req.params.id,
        {
          companyName: req.body.companyName,
          email: req.body.email,
          phone: req.body.phone,
        },
        { new: true, runValidators: true }
      ).select("-password");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (previous && previous.companyName !== company.companyName) {
      const from = { companyName: previous.companyName };
      const to = { companyName: company.companyName };

      await Promise.all([
        JobPosting.updateMany(from, to),
        JobProfile.updateMany(from, to),
        Eligibility.updateMany(from, to),
        Interview.updateMany(
          { company: previous.companyName },
          { company: company.companyName }
        ),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================= DELETE COMPANY =================
router.delete("/:id", async (req, res) => {
  try {
    const company =
      await CompanyUser.findByIdAndDelete(
        req.params.id
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  console.log("LOGIN REQUEST:", req.body.phone);

  try {
    const { phone, password } = req.body;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }
    const company =
      await CompanyUser.findOne({ phone });

    console.log("FOUND COMPANY:", company?._id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (company.password !== password) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    console.log("LOGIN SUCCESS");

    company.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login Successful",
      company,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;