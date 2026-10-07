const express = require("express");
const router = express.Router();

const QuizQuestion = require("../models/QuizQuestion");
const Student = require("../models/Student");

// ======================================================
// LIST SKILLS THAT HAVE A QUIZ
// ======================================================

router.get("/skills", async (req, res) => {
  try {
    const skills = await QuizQuestion.aggregate([
      { $group: { _id: "$skill", questionCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      skills: skills.map((skill) => ({
        name: skill._id,
        questionCount: skill.questionCount,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// ADD A QUESTION
// ======================================================

router.post("/questions", async (req, res) => {
  try {
    const { skill, question, options, correctIndex } = req.body;

    if (!Array.isArray(options) || correctIndex >= options.length) {
      return res.status(400).json({
        success: false,
        message: "correctIndex must point to one of the options",
      });
    }

    const created = await QuizQuestion.create({
      skill,
      question,
      options,
      correctIndex,
    });

    res.status(201).json({
      success: true,
      question: created,
    });
  } catch (error) {
    const isValidationError = error.name === "ValidationError";

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// GET QUESTIONS FOR A SKILL (answers not included)
// ======================================================

router.get("/:skill", async (req, res) => {
  try {
    const questions = await QuizQuestion.find({
      skill: req.params.skill,
    })
      .select("-correctIndex")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      skill: req.params.skill,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ======================================================
// SUBMIT ANSWERS
// ======================================================
//
// Body: { studentId, answers: { "<questionId>": selectedIndex } }
// The score is saved on the student's skill list (replacing any
// earlier score for the same skill).

router.post("/:skill/submit", async (req, res) => {
  try {
    const { skill } = req.params;
    const { studentId, answers } = req.body;

    const questions = await QuizQuestion.find({ skill });

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No quiz found for this skill",
      });
    }

    const correct = questions.filter(
      (question) =>
        answers &&
        answers[question._id.toString()] === question.correctIndex
    ).length;

    const score = Math.round((correct / questions.length) * 100);

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const existing = student.skills.find(
      (item) => item.name.toLowerCase() === skill.toLowerCase()
    );

    if (existing) {
      existing.score = score;
    } else {
      student.skills.push({ name: skill, score });
    }

    await student.save();

    res.status(200).json({
      success: true,
      skill,
      correct,
      total: questions.length,
      score,
      skills: student.skills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
