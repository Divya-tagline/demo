const express = require("express");
const router = express.Router();
const Student = require("../modal/student_modal");
const Subject = require("../modal/subject_modal");
const auth = require("../helper/verification");
const session = require("express-session");
// const redis = require("redis");
// const client = redis.createClient();
// let RedisStore = require('connect-redis')(session)
router.use( session({
  // store: new RedisStore({ client: client }),
  secret: "Secret key" ,
  resave: false,
}));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const saltRounds = 10;
const Result = require("../modal/result_modal");
const helper = require("../helper");
const ensureToken = require("../middlewares/ensureToken").student;
const { ObjectID } = require("mongodb");
const config = require("../config");



client.on("error", function(error) {
  console.error(error);
});
// const redis_api = (req ,res , next) => {
//   client.get('STUDENT_DATA',(err , redis_data)=>{
//     if(err){
//       throw err;
//     }else if(redis_data)
//     {
//         console.log('redis_data', redis_data)
//         res.send(JSON.parse(redis_data));
//     }
//     else{
//       next()
//     }
//   })
  
// }

router.get("/",redis_api, async (req, res, next) => { 
  try {
    const student_detail = await Student.find();
    // client.setex("STUDENT_DATA",60,JSON.stringify(student_detail))
    res.json(student_detail);
  } catch (error) {
    console.log('error', error)
    return res.status(400).json({ message: "something wrong", error: error });
  }
  
});

router.post("/signup", auth.validation,async  (req, res, next) => {
  const errors = validationResult(req).array();
  const studentInfo = req.body;
  if (errors.length) {
    return res
      .status(config.BAD_REQUEST)
      .json({ message: "Validation Error", data: {}, errors });
  } else {
    const hash = bcrypt.hashSync(studentInfo.password, saltRounds);
    var newStudent = new Student({
      s_name: studentInfo.name,
      s_password: hash,
      s_email: studentInfo.email,
    });
    try {
      const student_detail = await Student.findOne({ s_email: studentInfo.email });
      if (student_detail) {
        return res
            .status(config.BAD_REQUEST)
            .json({ auth: false, message: "email already exits" });
      }
      const new_student =  newStudent.save();
      res.status(config.OK_STATUS)
              .json({ message: "your register sucssfully", data: { new_student } });
    } catch (e) {
      return res.status(config.BAD_REQUEST).json({ message: "Bad request" });
    }
  }
});

router.get("/logout", function (req, res) {
  client.set("DATA","hello");
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
              message: "Login Sucssfully"
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
        
        const mark = await helper.check_value(qustionsans, total);
        const persantage = (mark / total) * 100;
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
  console.log('authData', authData)
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
              id:"$question_detail._id",
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
