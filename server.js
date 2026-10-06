const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const companyRoutes = require("./routes/companyRoutes");
const companyUserRoutes = require("./routes/companyUserRoutes");
const jobProfileRoutes = require("./routes/jobProfileRoutes");
const jobPostingRoutes = require("./routes/jobPostingRoutes");
const eligibilityRoutes = require("./routes/eligibilityRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const studentJobsRoutes = require("./routes/studentJobs");
const interviewRoutes = require("./routes/interviewRoutes");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    console.log(`Database Name: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:");
    console.log(err);
  });


app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/company-users", companyUserRoutes);
app.use("/api/jobs/student", studentJobsRoutes);
app.use("/api/job-profiles", jobProfileRoutes);
app.use("/api/jobs", jobPostingRoutes);
app.use("/api/eligibility", eligibilityRoutes);

app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/", (req, res) => {
  res.send("Placement Backend Running Successfully");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running fine",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running On Port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});