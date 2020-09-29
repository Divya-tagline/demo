const jwt = require("jsonwebtoken");
const config = require("../config");
let ensure = [];
ensure.teacher = async (req, res, next) => {
  try {
    const token = req.headers["auth"];
    if (token) {
      req.token = token;
      const checkToekn = await checkToken(token, "my_teacher_key");
      req.authData = checkToekn.data;
      next();
    }
  } catch (e) {
    res.status(config.BAD_REQUEST).json({ message: "unauthorized.." });
  }};
ensure.student = async (req, res, next) => {
  try {
    const token = req.headers["auth"];
    if (token) {
      req.token = token;
      const checkToekn = await checkToken(token, "my_student_key");
      req.authData = checkToekn.data;
      next();
    }
  } catch (e) {
    res.status(config.BAD_REQUEST).json({ message: "unauthorized.." });
  }
};

const checkToken = (token, key) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, key, (err, authData) => {
      if (err) {
        return reject(null);
      } else {
        console.log("authData");
        return resolve(authData);
      }
    });
  });
};

module.exports = ensure;
