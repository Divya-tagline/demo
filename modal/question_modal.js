const { ObjectID } = require('mongodb');
const mongoose = require('mongoose');

const QuestionS = mongoose.Schema({
    sub_id : ObjectID,
    q_name: String,
    option : [],
    answer : String
  });

module.exports = mongoose.model("Qustion", QuestionS);