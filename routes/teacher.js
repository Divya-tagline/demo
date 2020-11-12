const express = require("express");
const router = express.Router();
const auth = require("../helper/verification");
const helper = require("../helper");
const session = require("express-session");
router.use(session({saveUninitialized:true,
  secret: "Secret key" ,
  resave: false,  }));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ensureToken = require("../middlewares/ensureToken").teacher;
const saltRounds = 10;
const { validationResult } = require("express-validator");
const config = require("../config");
const Teacher = require("../modal/teacher_modal");
const Subject = require("../modal/subject_modal");
const Qustion = require("../modal/question_modal");
const Student = require("../modal/student_modal");
router.get("/", function (req, res, next) {
  Teacher.find(function (err, response) {
    if (err) res.json(err);
    console.log(response);
    res.json(response);
  });
});

router.get("/getallstudentresult", async function (req, res) {1
  const authData = req.authData;
  await Student.aggregate(
    [
      {
        $lookup: {
          from: "results",
          localField: "_id",
          foreignField: "s_id",
          as: "student_result",
        },
      },
    ],
    async function (err, response) {
      await helper.detail(response);
    }
  );
  let result = [];

  await Student.aggregate([{ $sort: { result: -1 } }], function (
    err,
    response
  ) {
    response.map((sInfo) => {
      if (!sInfo.result) sInfo.result = 00;
      let message = { name: sInfo.s_name, Result: sInfo.result };
      result.push(message);
    });
  });
  res.json(result);
});
router.post("/signup", auth.validation, function (req, res, next) {
  const teacherInfo = req.body; //Get the parsed information
  const errors = validationResult(req).array();
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    const hash = bcrypt.hashSync(teacherInfo.password, saltRounds);
    const newTeacher = new Teacher({
      t_name: teacherInfo.name,
      t_password: hash,
      t_email: teacherInfo.email,
    });
    Teacher.findOne({ t_email: teacherInfo.email }, function (err, teacher) {
      if (teacher)
        return res
          .status(config.BAD_REQUEST)
          .json({ auth: false, message: "email exits" });

      newTeacher.save(function (err, Teach) {
        if (err)
          res
            .status(config.BAD_REQUEST)
            .json({ message: "Database error", type: "error", error: err });
        else res.json({ message: "Register successfully" });
      });
    });
  }
});

router.post("/login", auth.loginvalidation, function (req, res) {
  const teacher = req.body;
  const errors = validationResult(req).array();
  console.log("errors", errors);
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    Teacher.findOne({ t_email: teacher.email }, function (err, teach) {
      
      if (!teach) return res.status(config.BAD_REQUEST).json({ message: "Email Not exit" });
      if (!bcrypt.compareSync(teacher.password, teach.t_password))
        return res
          .status(config.BAD_REQUEST)
          .json({ message: " password Invaild" });
      let data = {
        email: teach.t_email,
        password: teach.t_password,
      };
      const token = jwt.sign({ data }, "my_teacher_key");
      Teacher.findByIdAndUpdate(teach._id, { token: token }, function (
        err,
        result
      ) {
        if (err) res.send(err);
        else {
          req.session.teach = teach;
          res.status(config.OK_STATUS).json({
            token: token,
          });
        }
      });
    });
  }
});

router.get("/getsubjects", (req, res) => {
  Subject.find(function (err, response) {
    if (err) res.json(err);
    console.log(response);
    res.json(response);
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy(function () {
    console.log("teacher logged out.");
  });
  res.status(config.OK_STATUS).json({ message: "LOGOUT..." });
});
router.post("/subjectadd", ensureToken, function (req, res) {
  const authData = req.authData;
  var sub_name = req.body.sub_name;
  if (!sub_name) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error!!! Subname need" });
  } else {
    Teacher.findOne({ t_email: authData.email }, function (err, std) {
      if (std) {
        //subject add
        var newSubject = Subject({
          sub_name: sub_name,
        });
        Subject.findOne({ sub_name: sub_name }, async function (err, sub) {
          if (sub)
            return res
              .status(400)
              .json({ auth: false, message: "Subject name exits" });

          await newSubject.save(function (err, ABC) {
            if (err)
              res.status(config.BAD_REQUEST).json({
                message: "Database error",
                type: "error",
                error: err,
              });
            else
              res
                .status(config.OK_STATUS)
                .json({ message: "new subject add", data: ABC });
          });
        });
      } else
        return res
          .status(config.UNAUTHORIZED)
          .json({ message: "anauthorized" });
    });
  }
});
router.post("/questionadd", ensureToken, function (req, res) {
  const authData = req.authData;
  const errors = validationResult(req).array();
  console.log("\n errors : ", errors);
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    Teacher.findOne({ t_email: authData.email }, async function (err, std) {
      if (std) {
        //Qustion add
        var question = req.body.questions;
        try {
          const q = await Qustion.insertMany(question);
          res
            .status(config.OK_STATUS)
            .json({ message: "Question added", Data: q });
        } catch (e) {
          console.log(e);
          res.json(e);
        }
      } else return res.status(config.UNAUTHORIZED).json({ message: "anauthorized" });
    });
  }
});

module.exports = router;
