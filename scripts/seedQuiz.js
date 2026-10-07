// Adds the starter quiz questions to the database.
// Run once with: node scripts/seedQuiz.js
//
// Skills that already have questions are skipped, so running it
// again does not create duplicates. Add more questions with
// POST /api/quiz/questions.

const mongoose = require("mongoose");
require("dotenv").config();

const QuizQuestion = require("../models/QuizQuestion");

const starterQuestions = [
  {
    skill: "Flutter",
    question: "What is Flutter?",
    options: ["Language", "Framework", "Database", "OS"],
    correctIndex: 1,
  },
  {
    skill: "Flutter",
    question: "Which language does Flutter use?",
    options: ["Java", "Kotlin", "Dart", "Swift"],
    correctIndex: 2,
  },
  {
    skill: "Flutter",
    question: "Flutter is developed by?",
    options: ["Google", "Apple", "Microsoft", "Meta"],
    correctIndex: 0,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const skills = [...new Set(starterQuestions.map((q) => q.skill))];

  for (const skill of skills) {
    const existing = await QuizQuestion.countDocuments({ skill });

    if (existing > 0) {
      console.log(`Skipping ${skill}: ${existing} questions already exist`);
      continue;
    }

    const questions = starterQuestions.filter((q) => q.skill === skill);

    await QuizQuestion.insertMany(questions);

    console.log(`Added ${questions.length} ${skill} questions`);
  }

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
