const mongoose = require("mongoose");
const { Schema } = mongoose;

const user_verifySchema = new Schema({
  phone: {
    type: Number,
    unique: false, // Allow duplicates
  },
  active_second: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verify_code: {
    type: Number,
    default: null,
  },
});

module.exports = mongoose.model("User_verify", user_verifySchema);
