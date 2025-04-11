const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  date: {
    type: String,
    required: [true, "Та заавал захиалга хийх өдрөө оруулна уу!"],
  },
  schedule: {
    type: Schema.Types.ObjectId,
    ref: "Schedule",
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  phone: {
    type: String,
  },
  name: {
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
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
