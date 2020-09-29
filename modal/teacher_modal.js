const mongoose = require('mongoose');

const TeacherS = mongoose.Schema({
    t_name: String,
    t_password : String,
    t_email: String,
    token: String  
  });

module.exports = mongoose.model("Teacher", TeacherS);