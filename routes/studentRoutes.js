const express = require("express");
const router = express.Router();

const Student = require("../models/Student");


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
      .sort({
        createdAt:-1,
        _id:-1,
      });



    res.status(200).json(students);



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





module.exports = router;