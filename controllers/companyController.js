const Company = require("../models/Company");
const bcrypt = require("bcryptjs");

// Register Company
exports.registerCompany = async (req, res) => {
  try {
    const { companyName, email, phone, password } = req.body;

    const existingCompany = await Company.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCompany) {
      return res.status(400).json({
        message: "Company already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = new Company({
      companyName,
      email,
      phone,
      password: hashedPassword,
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: "Company Registered Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login Company
exports.loginCompany = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const company = await Company.findOne({ phone });

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};