const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  issuer: {
    type: String,
    trim: true,
    default: "",
  },

  date: {
    type: String,
    trim: true,
    default: "",
  },

  imageUrl: {
    type: String,
    default: "",
  },
});

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // Quiz score out of 100, null until the student takes the quiz
  score: {
    type: Number,
    default: null,
  },
});

const resumeSchema = new mongoose.Schema({
  fileName: String,
  fileType: String,
  fileSize: Number,
  url: String,
  uploadedAt: Date,
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  // ================= PROFILE =================

  college: { type: String, default: "" },
  course: { type: String, default: "" },
  branch: { type: String, default: "" },
  year: { type: String, default: "" },
  cgpa: { type: Number, default: null },
  passingYear: { type: Number, default: null },
  backlogs: { type: Number, default: 0 },
  address: { type: String, default: "" },

  skills: {
    type: [skillSchema],
    default: [],
  },

  certifications: {
    type: [certificationSchema],
    default: [],
  },

  resume: {
    type: resumeSchema,
    default: null,
  },
});

module.exports = mongoose.model("Student", studentSchema);
