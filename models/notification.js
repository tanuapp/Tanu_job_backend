const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  title: String,

  user: {
    type: mongoose.Types.ObjectId,
    ref: "Customer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
