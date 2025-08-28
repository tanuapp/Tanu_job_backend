const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  date: {
    type: String,
  },
  finalPrice: {
    type: String,
  },
  isOption: {
    type: Boolean,
    default: false,
  },
  option: {
    type: Schema.Types.ObjectId,
    ref: "Option",
  },
  duration: {
    type: String,
    enum: ["one", "six", "year", "free"],
    default: "one",
  },

  schedule: {
    type: Schema.Types.ObjectId,
    ref: "Schedule",
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  notified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
  },
  name: {
    type: String,
  },
  extraInfo: {
    type: String,
  },
  isManual: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  qr: {
    type: String,
    default: "no-qr.png",
  },
  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "expired",
      "declined",
      "completed",
      "done",
      "advance",
    ], // ← нэмсэн
    default: "pending",
  },
  isCash: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
