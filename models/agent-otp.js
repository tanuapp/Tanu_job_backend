const mongoose = require("mongoose");
const { Schema } = mongoose;

const agentOtpSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
    },
    otp: String,
    attempts: {
      type: Number,
      default: 0, // Буруу оролдлогын тоо
    },
    expireAt: {
      type: Date,
      default: Date.now,
      index: { expires: "5m" }, // OTP 5 минутын дараа автоматаар устна
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AgentOtp", agentOtpSchema);
