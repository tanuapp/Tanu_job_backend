const mongoose = require("mongoose");

const FreelancerOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    type: {
      type: String,
      enum: ["customer", "freelancer", "artist", "company"],
      required: true,
    }, // ямар төрлийн хэрэглэгчийн OTP вэ?
    data: { type: Object }, // register үед түр хадгалах өгөгдөл
    expireAt: {
      type: Date,
      default: Date.now,
      index: { expires: "5m" }, // 5 минутын дараа автоматаар устах
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FreelancerOTP", FreelancerOtpSchema);
