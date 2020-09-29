let helper = [];
const Qustion = require("../modal/question_modal");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Student = require("../modal/student_modal");
const result = require("dotenv");
result.config();
const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.USER_NAME,
    pass: process.env.PASSWORD,
  },
});
helper.check_value = async function check_value(result, n) {
  let mark = 0;
  for (var i = 0; i < n; i++) {
    var ans = result[i].ans;
    var y = result[i].questionId;
    await Qustion.findById(y, function (err, responce) {
      if (responce.answer == ans) {
        mark++;
      }
    });
  }
  return mark;
};

helper.cron = (email, msg, time) => {
  cron.schedule(time, function () {
    console.log("running a task every 2 hours(1 min)");
    const mailOptions = {
      from: process.env.USER_NAME,
      to: email,
      subject: "result",
      text: msg,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        res.status(config.OK_STATUS).json(info);
        console.log("Email sent: " + info.response);
      }
    });
  });
};

helper.detail = (response) => {
  for (let i = 0; i < Object.keys(response).length; i++) {
    let r = response[i].student_result;
    let total = Object.keys(r).length;
    let per = 0;
    for (let j = 0; j < total; j++) {
      per += r[j].persantage;
    }
    const result = per / total;
    if (!r[i]) {
      continue;
    }
    Student.findByIdAndUpdate(r[i].s_id, { result: result });
  }
};

helper.sendmail = (email, msg) => {};

module.exports = helper;
