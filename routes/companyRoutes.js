const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

// CREATE COMPANY
router.post("/", async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET ALL COMPANIES
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().sort({
      createdAt: -1,
    });

    res.status(200).json(companies);
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