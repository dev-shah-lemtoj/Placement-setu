const Student = require("../models/Student");

// ================= REGISTER STUDENT =================

exports.registerStudent = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingStudent = await Student.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Email or Phone already exists",
      });
    }

    const student = new Student({
      name,
      email,
      phone,
      password,
    });

    await student.save();

    res.status(201).json({
      message: "Student Registered Successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= GET ALL STUDENTS =================

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({
      _id: -1,
    });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= UPDATE STUDENT =================

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedStudent =
      await Student.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student Not Found",
      });
    }

    res.status(200).json({
      message: "Student Updated Successfully",
      student: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= DELETE STUDENT =================

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStudent =
      await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student Not Found",
      });
    }

    res.status(200).json({
      message: "Student Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};