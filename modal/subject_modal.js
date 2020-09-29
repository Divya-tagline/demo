const mongoose = require('mongoose');

const SubjectS = mongoose.Schema({
    sub_name: String
  });

module.exports = mongoose.model("Subject", SubjectS);