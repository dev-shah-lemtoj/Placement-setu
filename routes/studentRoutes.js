const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const Student = require("../models/Student");
const Application = require("../models/Application");


// ================= REGISTER STUDENT =================

router.post("/register", async (req, res) => {

  try {

    const { name, email, phone, password } = req.body;


    // Required fields validation
    if (!name || !email || !phone || !password) {

      return res.status(400).json({
        message: "All fields are required",
      });

    }


    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {

      return res.status(400).json({
        message: "Invalid mobile number",
      });

    }


    // Check existing student
    const existingStudent = await Student.findOne({
      phone,
    });


    if (existingStudent) {

      return res.status(400).json({
        message: "Phone number already registered",
      });

    }



    // Create student

    const student = new Student({

      name,
      email,
      phone,
      password,

    });



    await student.save();



    res.status(201).json({

      success: true,

      message: "Student Registered Successfully",

      student,

    });



  } catch(error) {


    res.status(500).json({

      success:false,

      error:error.message,

    });


  }

});





// ================= LOGIN STUDENT =================


router.post("/login", async (req,res)=>{


  try {


    const {
      phone,
      password
    } = req.body;



    if(!phone || !password){

      return res.status(400).json({

        message:"Phone and Password are required",

      });

    }




    const student = await Student.findOne({

      phone,
      password,

    });




    if(!student){


      return res.status(400).json({

        message:"Invalid Credentials",

      });


    }




    res.status(200).json({


      success:true,


      message:"Login Successful",



      student:{


        _id:student._id,

        name:student.name,

        email:student.email,

        phone:student.phone,

        photoUrl:student.photoUrl,


      }


    });



  }
  catch(error){


    res.status(500).json({

      success:false,

      error:error.message,

    });


  }


});





// ================= GET ALL STUDENTS =================


router.get("/", async(req,res)=>{


  try{


    const students = await Student.find()
      .select("-password")
      .sort({
        createdAt:-1,
        _id:-1,
      });

    // Placement status for each student, from their applications
    const applications = await Application.find()
      .select("studentId status");

    const statusOf = new Map();

    for (const application of applications) {
      const id = application.studentId.toString();
      const current = statusOf.get(id);

      if (application.status === "Selected") {
        statusOf.set(id, "Placed");
      } else if (current !== "Placed") {
        statusOf.set(id, "In Process");
      }
    }

    res.status(200).json(
      students.map((student) => ({
        ...student.toObject(),
        placementStatus:
          statusOf.get(student._id.toString()) || "Not Applied",
      }))
    );



  }
  catch(error){


    res.status(500).json({

      error:error.message,

    });


  }


});






// ================= GET STUDENT COUNT =================


router.get("/count", async(req,res)=>{


  try{


    const totalStudents =
      await Student.countDocuments();



    res.status(200).json({

      totalStudents,

    });



  }
  catch(error){


    res.status(500).json({

      error:error.message,

    });


  }


});






// ================= UPDATE STUDENT =================


router.put("/:id", async(req,res)=>{


try{


const {
  name,
  email,
  phone
}=req.body;



const updatedStudent =
await Student.findByIdAndUpdate(

req.params.id,

{

name,

email,

phone,

},

{

new:true,

runValidators:true,

}

);



if(!updatedStudent){

return res.status(404).json({

message:"Student Not Found",

});

}



res.status(200).json({

success:true,

message:"Student Updated Successfully",

student:updatedStudent,

});



}
catch(error){


res.status(500).json({

success:false,

error:error.message,

});


}


});






// ================= DELETE STUDENT =================


router.delete("/:id", async(req,res)=>{


try{


const deletedStudent =
await Student.findByIdAndDelete(
req.params.id
);



if(!deletedStudent){


return res.status(404).json({

message:"Student Not Found",

});


}




res.status(200).json({

success:true,

message:"Student Deleted Successfully",

});




}
catch(error){


res.status(500).json({

success:false,

error:error.message,

});


}



});





// ================= GET SINGLE STUDENT (PROFILE) =================

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ================= UPDATE STUDENT PROFILE =================
//
// Only the fields listed here can be changed by the student.
// Password and resume have their own routes.

const profileFields = [
  "name",
  "email",
  "phone",
  "college",
  "course",
  "branch",
  "year",
  "cgpa",
  "passingYear",
  "backlogs",
  "tenthPercentage",
  "twelfthPercentage",
  "attendance",
  "educationGap",
  "address",
  "skills",
  "certifications",
];

router.put("/:id/profile", async (req, res) => {
  try {
    const update = {};

    for (const field of profileFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    if (
      update.phone !== undefined &&
      !/^[6-9]\d{9}$/.test(update.phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      student,
    });
  } catch (error) {
    const isDuplicate = error.code === 11000;

    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: isDuplicate
        ? "Email or phone already used by another student"
        : "Failed to update profile",
      error: error.message,
    });
  }
});


// ================= UPLOAD RESUME =================
//
// Body: { fileName, fileType, fileBase64 }
// The file is saved under uploads/resumes and served from /uploads.

const resumeDir = path.join(__dirname, "..", "uploads", "resumes");
const allowedResumeTypes = ["pdf", "doc", "docx"];
const maxResumeBytes = 5 * 1024 * 1024;

function deleteResumeFile(resume) {
  if (!resume || !resume.url) return;

  const filePath = path.join(__dirname, "..", resume.url);

  fs.unlink(filePath, () => {});
}

router.post("/:id/resume", async (req, res) => {
  try {
    const { fileName, fileBase64 } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: "fileName and fileBase64 are required",
      });
    }

    const extension = path
      .extname(fileName)
      .replace(".", "")
      .toLowerCase();

    if (!allowedResumeTypes.includes(extension)) {
      return res.status(400).json({
        success: false,
        message: "Only PDF, DOC and DOCX files are allowed",
      });
    }

    const buffer = Buffer.from(fileBase64, "base64");

    if (buffer.length > maxResumeBytes) {
      return res.status(400).json({
        success: false,
        message: "File too large. Max 5MB allowed",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    fs.mkdirSync(resumeDir, { recursive: true });

    const storedName = `${student._id}-${Date.now()}.${extension}`;

    fs.writeFileSync(path.join(resumeDir, storedName), buffer);

    deleteResumeFile(student.resume);

    student.resume = {
      fileName,
      fileType: extension,
      fileSize: buffer.length,
      url: `/uploads/resumes/${storedName}`,
      uploadedAt: new Date(),
    };

    await student.save();

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      resume: student.resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload resume",
      error: error.message,
    });
  }
});


// ================= IMAGE UPLOADS =================
//
// Body: { fileName, fileBase64 }. Saves a JPG / PNG / WEBP image under
// uploads/<folder> and returns its URL, or sends an error and
// returns null.

const allowedImageTypes = ["jpg", "jpeg", "png", "webp"];
const maxImageBytes = 3 * 1024 * 1024;

async function saveStudentImage(req, res, folder) {
  const { fileName, fileBase64 } = req.body;

  const extension = path
    .extname(fileName || "")
    .replace(".", "")
    .toLowerCase();

  if (!fileBase64 || !allowedImageTypes.includes(extension)) {
    res.status(400).json({
      success: false,
      message: "Upload a JPG, PNG or WEBP image",
    });
    return null;
  }

  const buffer = Buffer.from(fileBase64, "base64");

  if (buffer.length > maxImageBytes) {
    res.status(400).json({
      success: false,
      message: "Image too large. Max 3MB allowed",
    });
    return null;
  }

  if (!(await Student.exists({ _id: req.params.id }))) {
    res.status(404).json({
      success: false,
      message: "Student Not Found",
    });
    return null;
  }

  const dir = path.join(__dirname, "..", "uploads", folder);

  fs.mkdirSync(dir, { recursive: true });

  const storedName = `${req.params.id}-${Date.now()}.${extension}`;

  fs.writeFileSync(path.join(dir, storedName), buffer);

  return `/uploads/${folder}/${storedName}`;
}

// Certificate image: the app saves the returned URL on the
// certification through PUT /:id/profile.
router.post("/:id/certificate-image", async (req, res) => {
  try {
    const imageUrl = await saveStudentImage(req, res, "certificates");

    if (!imageUrl) return;

    res.status(200).json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
});

// Profile photo: replaces the previous photo.
router.post("/:id/photo", async (req, res) => {
  try {
    const photoUrl = await saveStudentImage(req, res, "photos");

    if (!photoUrl) return;

    const previous = await Student.findById(req.params.id).select("photoUrl");

    if (previous && previous.photoUrl) {
      fs.unlink(path.join(__dirname, "..", previous.photoUrl), () => {});
    }

    await Student.findByIdAndUpdate(req.params.id, { photoUrl });

    res.status(200).json({
      success: true,
      photoUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      error: error.message,
    });
  }
});


// ================= RENAME RESUME =================

router.put("/:id/resume", async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required",
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student || !student.resume) {
      return res.status(404).json({
        success: false,
        message: "Resume Not Found",
      });
    }

    student.resume.fileName = fileName;

    await student.save();

    res.status(200).json({
      success: true,
      resume: student.resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ================= DELETE RESUME =================

router.delete("/:id/resume", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    deleteResumeFile(student.resume);

    student.resume = null;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


module.exports = router;