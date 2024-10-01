const mongoose = require("mongoose");
const { Schema } = mongoose;

const dayOffSchema = new Schema({
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
  },
  date: {
    type: String,
    required: true,
  },
  schedule: {
    type: [Schema.Types.ObjectId],
    ref: "Schedule",
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
  updatedUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DayOff", dayOffSchema);
