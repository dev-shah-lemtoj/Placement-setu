// Eligibility rules for applying to a job posting.
//
// The rules combine the posting's minimum CGPA with the criteria saved
// for the company (POST /api/eligibility/save). Criteria for the exact
// job title win over company-wide criteria (empty jobTitle). A rule
// that was never set means "any".
//
// If a rule is set but the student's profile has no value for it, the
// student is not eligible and is told what to add to their profile.
//
// The Flutter Eligibility screen (EligibilityJob in
// lib/eligibility_screen.dart) applies the same rules; keep them in sync.

function findCriteria(criteriaList, companyName, jobTitle) {
  let companyWide = null;

  for (const criteria of criteriaList) {
    if (criteria.companyName !== companyName) continue;

    if (criteria.jobTitle === jobTitle) return criteria;

    if (!criteria.jobTitle && !companyWide) companyWide = criteria;
  }

  return companyWide || {};
}

function list(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function sameText(a, b) {
  return String(a || "").trim().toLowerCase() ===
    String(b || "").trim().toLowerCase();
}

// Skill names are typed freely, so "Basic of Python." matches
// "basic of python" and "Node.js" matches "NodeJS". + and # are kept
// so C, C++ and C# stay different.
function sameSkill(a, b) {
  const key = (value) =>
    String(value || "").toLowerCase().replace(/[^a-z0-9+#]/g, "");

  return key(a) === key(b);
}

function isSet(value) {
  return value !== null && value !== undefined && value !== "";
}

// job: a JobPosting with jobProfileId populated
// student: a Student document
// criteriaList: all saved Eligibility documents
function checkEligibility(student, job, criteriaList) {
  const jobTitle = job.jobProfileId?.jobTitle || "";
  const c = findCriteria(criteriaList, job.companyName, jobTitle);

  const reasons = [];
  const missing = [];

  function require(label, studentValue, passes, failMessage) {
    if (!isSet(studentValue)) {
      missing.push(label);
    } else if (!passes(studentValue)) {
      reasons.push(failMessage);
    }
  }

  // ---------------- CGPA ----------------
  const minCGPA = Math.max(job.eligibilityCGPA || 0, c.minCGPA || 0);

  if (minCGPA > 0) {
    require("CGPA", student.cgpa, (v) => v >= minCGPA,
      `Minimum CGPA required is ${minCGPA}`);
  }

  // ---------------- course / branch ----------------
  const courses = list(c.courses);

  if (courses.length) {
    require("course", student.course,
      (v) => courses.some((course) => sameText(course, v)),
      `Course must be ${courses.join(" / ")}`);
  }

  const branches = list(c.branches);

  if (branches.length) {
    require("branch", student.branch,
      (v) => branches.some((branch) => sameText(branch, v)),
      `Branch must be ${branches.join(" / ")}`);
  }

  // ---------------- passing year ----------------
  if (isSet(c.passingYear)) {
    require("passing year", student.passingYear,
      (v) => v === c.passingYear,
      `Passing year must be ${c.passingYear}`);
  }

  // ---------------- backlogs ----------------
  const maxBacklogs = c.backlogsAllowed === false
    ? 0
    : c.backlogsAllowed === true && isSet(c.maxBacklogs)
      ? c.maxBacklogs
      : null;

  if (maxBacklogs !== null) {
    require("backlogs", student.backlogs, (v) => v <= maxBacklogs,
      maxBacklogs === 0
        ? "No backlogs are allowed"
        : `Maximum ${maxBacklogs} backlogs allowed`);
  }

  // ---------------- 10th / 12th / attendance ----------------
  if (c.min10thPercentage) {
    require("10th percentage", student.tenthPercentage,
      (v) => v >= c.min10thPercentage,
      `Minimum 10th percentage required is ${c.min10thPercentage}%`);
  }

  if (c.min12thPercentage) {
    require("12th percentage", student.twelfthPercentage,
      (v) => v >= c.min12thPercentage,
      `Minimum 12th percentage required is ${c.min12thPercentage}%`);
  }

  if (c.minAttendance) {
    require("attendance", student.attendance,
      (v) => v >= c.minAttendance,
      `Minimum attendance required is ${c.minAttendance}%`);
  }

  // ---------------- education gap ----------------
  const maxGap = c.gapAllowed === false
    ? 0
    : c.gapAllowed === true && isSet(c.maxEducationGap)
      ? c.maxEducationGap
      : null;

  if (maxGap !== null) {
    require("education gap", student.educationGap, (v) => v <= maxGap,
      maxGap === 0
        ? "No education gap is allowed"
        : `Maximum education gap allowed is ${maxGap} year(s)`);
  }

  // ---------------- skills ----------------
  // Criteria skills, else the job profile's comma-separated skills
  const criteriaSkills = list(c.skills);
  const requiredSkills = criteriaSkills.length
    ? criteriaSkills
    : String(job.jobProfileId?.skillsRequired || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

  const studentSkills = (student.skills || []).map((skill) => skill.name);

  const missingSkills = requiredSkills.filter(
    (skill) => !studentSkills.some((owned) => sameSkill(owned, skill))
  );

  if (missingSkills.length) {
    reasons.push(`Required skills missing: ${missingSkills.join(", ")}`);
  }

  return {
    eligible: reasons.length === 0 && missing.length === 0,
    reasons,
    missing,
  };
}

// One message for the app: what to add to the profile, or every
// rule the student fails.
function eligibilityMessage(result) {
  if (result.missing.length) {
    return `Complete your profile before applying: add your ${result.missing.join(", ")}`;
  }

  return result.reasons.join(". ");
}

module.exports = { checkEligibility, eligibilityMessage };
