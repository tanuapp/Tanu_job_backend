const mongoose = require("mongoose");
const { Schema } = mongoose;

const userOtpSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserOtp", userOtpSchema);
