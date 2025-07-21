const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    otp: {
      type: String,
      required: true,
    },
    data: {
      type: Object, // 👈 Түр хадгалах бүртгэлийн мэдээлэл (name, phone, firebaseToken, гэх мэт)
    },
  },
  {
    timestamps: true,
    expires: 300, // 🕔 5 минутын дараа автоматаар устах
  }
);

module.exports = mongoose.model("OTP", otpSchema);
