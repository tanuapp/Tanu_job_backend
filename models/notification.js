const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  title: String,
  desc: String,

  status: {
    type: String,
    enum: ["read", "unread"],
    default: "unread",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
