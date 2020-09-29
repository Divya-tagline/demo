const express = require("express");
const router = express.Router();
const Student = require("../modal/student_modal");
const Subject = require("../modal/subject_modal");
const auth = require("../helper/verification");
const session = require("express-session");
router.use(session({ secret: "Secret key" }));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const saltRounds = 10;
const Result = require("../modal/result_modal");
const helper = require("../helper");
const ensureToken = require("../middlewares/ensureToken").student;
const { ObjectID } = require("mongodb");
const config = require("../config");
router.get("/", function (req, res, next) {
  Student.find(function (err, response) {
    if (err) res.json(err);
    console.log(response);
    res.json(response);
  });
});

router.post("/signup", auth.validation, function (req, res, next) {
  const errors = validationResult(req).array();
  const studentInfo = req.body;
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    /*  if (studentInfo.password !== studentInfo.con_password) {
      return res.json({ message: "password and confirm password not match" });
    }*/
    const hash = bcrypt.hashSync(studentInfo.password, saltRounds);
    var newStudent = new Student({
      s_name: studentInfo.name,
      s_password: hash,
      s_email: studentInfo.email,
    });
    try {
      Student.findOne({ s_email: studentInfo.email }, function (err, student) {
        if (student)
          return res
            .status(config.BAD_REQUEST)
            .json({ auth: false, message: "email exits" });
        newStudent.save(function (err, Std) {
          if (err)
            res
              .status(config.SERVER_ERROR)
              .json({ message: "Database error", type: "error", error: err });
          else {
            res
              .status(config.OK_STATUS)
              .json({ message: "your registere sucssfully", data: { Std } });
          }
        });
      });
    } catch (e) {
      return res.status(config.BAD_REQUEST).json({ message: "Bad request" });
    }
  }
});

router.get("/logout", function (req, res) {
  req.session.destroy(function () {
    console.log("student logged out.");
  });
  res.status(config.OK_STATUS).send("student logged out.");
});

router.post("/login", auth.loginvalidation, async function (req, res) {
  var student = req.body;
  const errors = validationResult(req).array();
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    // try{
    await Student.findOne({ s_email: student.email }, function (err, std) {
      console.log(std);
      try {
        if (!bcrypt.compareSync(student.password, std.s_password))
          return res
            .status(config.BAD_REQUEST)
            .json({ message: "password Invaild" });
        let data = {
          email: std.s_email,
          password: std.s_password,
        };
        const token = jwt.sign({ data }, "my_student_key");
        Student.findByIdAndUpdate(std._id, { token: token }, function (
          err,
          result
        ) {
          if (err) res.status(config.BAD_REQUEST).send(err);
          else {
            req.session.std = std;
            res.status(config.OK_STATUS).json({
              token: token,
            });
          }
        });
      } catch (e) {
        return res.status(400).json({ message: "email not exait", error: e });
      }
    });
  }
});

//result
router.post("/result", ensureToken, auth.resultvalidation, async function (
  req,
  res
) {
  const errors = validationResult(req).array();
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    const authData = req.authData;
    Student.findOne({ s_email: authData.email }, async function (err, std) {
      if (std) {
        //authorized
        const result = req.body;
        const qustionsans = result.qustionsans;
        const total = Object.keys(qustionsans).length;
        const studentemail = authData.email;

        let mark = await helper.check_value(qustionsans, total);
        let persantage = (mark / total) * 100;
        const msg =
          `RESULT
            mark : ` +
          mark +
          `
            persantage: ` +
          persantage +
          `% `;
        const newresult = Result({
          s_id: std._id,
          sub_id: result.sub_id,
          result: mark,
          persantage: persantage,
        });
        newresult.save(function (err, ABC) {
          if (err)
            res.status(config.BAD_REQUEST).json({
              message: "Database error",
              type: "error",
              error: err,
            });
          else {
            console.log("your exam done");
            res.status(config.OK_STATUS).json({
              message:
                "Your exam done. The exam result will be sent in email after 2 hours ",
            });
          }
        });
        const time = "0 */2 * * *";
        helper.cron(studentemail, msg, time);
      } else return res.json({ message: "anauthorized" });
    });
  }
});

router.post("/takeexam", ensureToken, function (req, res) {
  const authData = req.authData;
  const sub_id = req.body.sub_id;
  if (!sub_id) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error!!! Sub_id need" });
  } else {
    Student.findOne({ s_email: authData.email }, async (err, std) => {
      if (std) {
        const defaultQuery = [
          { $match: { _id: ObjectID(sub_id) } },
          {
            $lookup: {
              from: "qustions",
              localField: "_id",
              foreignField: "sub_id",
              as: "question_detail",
            },
          },
          { $unwind: "$question_detail" },
          {
            $project: {
              question: "$question_detail.q_name",
              option: "$question_detail.option",
            },
          },
        ];

        const resp = await Subject.aggregate(defaultQuery);
        console.log("\n resp : ", resp);
        return res
          .status(config.OK_STATUS)
          .json({ message: "Qustions: ", Data: resp });
      } else
        return res
          .status(config.UNAUTHORIZED)
          .json({ message: "anauthorized" });
    });
  }
});

module.exports = router;
