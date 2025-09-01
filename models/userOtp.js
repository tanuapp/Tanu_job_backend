const mongoose = require("mongoose");
const { Schema } = mongoose;

const userOtpSchema = new Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expireAt: { type: Date, required: true },
    failCount: { type: Number, default: 0 },

    // түр хадгалах field-үүд
    password: String,
    name: String,
    email: String,
    companyCode: String,
    numberOfArtist: String,
    agent: String,
  },
  { timestamps: true }
);


module.exports = mongoose.model("UserOtp", userOtpSchema);
