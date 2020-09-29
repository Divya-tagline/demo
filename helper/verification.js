let authHelper = [];
const { check } = require("express-validator");
authHelper.validation = [
  check("name", "name is required").exists(),
  check("password", "password is required").notEmpty().exists(),
  check("email", "email is required").notEmpty().exists(),
];

authHelper.resultvalidation = [
  check("sub_id", "subject Id is required").notEmpty().exists(),
  check("qustionsans", "Qustions and Ans is required").notEmpty().exists(),
];
authHelper.loginvalidation = [
  check("password", "password is required").notEmpty().exists(),
  check("email", "email is required").notEmpty().exists(),
];
authHelper.takeexamvalidation = [
  check("sub_id", "subject Id is required").notEmpty().exists(),
];
authHelper.questionaddvalidation = [
  check('questions').isArray().exists(),
  check("questions.*.q_name", "Question name is required").isArray().exists(),
  check("questions.*.option", "Option is required").exists(),
  check("questions.*.answer", "Answer is required").exists(),
  check("questions.*.sub_id", "Sub_id is required").exists(),
];
module.exports = authHelper;
