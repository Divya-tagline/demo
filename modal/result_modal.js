const { ObjectID } = require('mongodb');
const mongoose = require('mongoose');

const ResultS = mongoose.Schema({
    s_id : ObjectID,
    sub_id: ObjectID,
    result: Number,
    persantage : Number
  });


module.exports = mongoose.model("Result", ResultS);