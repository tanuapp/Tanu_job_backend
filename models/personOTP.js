const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpPersonSchema = new Schema(

  {
    person: {
      type: mongoose.Types.ObjectId,
      ref: "Person",
      required: true,
    },
    otp: String,
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("OTPperson", otpPersonSchema);
