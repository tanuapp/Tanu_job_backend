const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpArtistSchema = new Schema(

  {
    artist: {
      type: mongoose.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    otp: String,
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("OTPartist", otpArtistSchema);
