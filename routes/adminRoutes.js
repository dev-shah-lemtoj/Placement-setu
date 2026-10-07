const express = require("express");
const router = express.Router();

const Admin = require("../models/admin");

// REGISTER ADMIN
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingAdmin) {
      return res.status(400).send("Admin already exists");
    }

    const admin = new Admin({
      name,
      email,
      phone,
      password,
    });

    await admin.save();

    res.status(201).send("Registration Successful");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// LOGIN ADMIN
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });

    if (!admin) {
      return res.status(400).send("Admin not found");
    }

    if (admin.password !== password) {
      return res.status(400).send("Invalid Password");
    }

    res.status(200).json({
      message: "Login Successful",
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// UPDATE ADMIN PROFILE
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin,
    });
  } catch (error) {
    const isDuplicate = error.code === 11000;

    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: isDuplicate
        ? "Email or phone already in use"
        : "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;