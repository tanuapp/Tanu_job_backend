const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const dayOffSchema = new Schema({
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  day_off: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    // 0 --> Pending, 1 --> Accepted, 2 --> Denied
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DayOff", dayOffSchema);
