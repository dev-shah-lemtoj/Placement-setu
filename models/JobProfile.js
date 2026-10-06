const mongoose = require("mongoose");

const jobProfileSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },

  jobTitle: {
    type: String,
    required: true,
  },

  jobDescription: {
    type: String,
    required: true,
  },

  department: {
    type: String,
    required: true,
  },

  skillsRequired: {
    type: String,
    required: true,
  },

  eligibilityCriteria: {
    type: String,
    required: true,
  },

  salary: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  workMode: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "JobProfile",
  jobProfileSchema
);