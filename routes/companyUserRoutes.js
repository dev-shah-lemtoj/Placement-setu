const express = require("express");
const router = express.Router();

const CompanyUser = require("../models/CompanyUser");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  console.log("REGISTER REQUEST:", req.body);

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

    console.log("REGISTER SUCCESS:", company);

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
    const companies = await CompanyUser.find();

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
router.put("/:id", async (req, res) => {
  try {
    const company =
      await CompanyUser.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
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
  console.log("LOGIN REQUEST:", req.body);

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

    console.log("FOUND COMPANY:", company);

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