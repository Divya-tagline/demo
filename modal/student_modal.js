const mongoose = require('mongoose');
const StudentS = mongoose.Schema({
    s_name: String,
    s_password : String,
    s_email: String,
    token : String,
    result : Number
  });
 
module.exports = mongoose.model("Student", StudentS);

