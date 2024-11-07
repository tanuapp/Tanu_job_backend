const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    otp: String,
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("OTP", otpSchema);
