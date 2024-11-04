const mongoose = require("mongoose");
const { Schema } = mongoose;

const rejectSchema = new Schema({
  status: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reject", rejectSchema);
