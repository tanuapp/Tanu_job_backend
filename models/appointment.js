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
  user: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
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
