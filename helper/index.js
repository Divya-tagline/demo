let helper = [];
const Qustion = require("../modal/question_modal");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Student = require("../modal/student_modal");
const result = require("dotenv");
result.config();
const redis = require("redis");
const client = redis.createClient();

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

helper.detail = async (response) => {
  
  for (let i = 0; i < response.length; i++) {
    const studentDetails = response[i]
    let studentResults = response[i].student_result;
  
    let total = studentResults.length;
    let per = 0;
    for (let j = 0; j < total; j++) {
      per += studentResults[j].persantage;
    }
    const result = per / total;
    if (!result) {
      continue;
    }
    const as= await Student.findByIdAndUpdate(studentDetails._id, { result: result });
  }
};

helper.sendmail = (email, msg) => {};

helper.redis_api = (req ,res , next) => {

  client.get(req.originalUrl,(err , redis_data)=>{
    if(err){
      throw err;
    }else if(redis_data)
    {
        console.log('redis_data', redis_data)
        res.send(JSON.parse(redis_data));
    }
    else{
      next()
    }
  })

  
};

helper.set_redis = (key,data) =>{
  client.setex(key,60,JSON.stringify(data))

}
module.exports = helper;
