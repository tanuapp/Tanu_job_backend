const mongoose = require("mongoose");
const locationSchema = new mongoose.Schema({
  Company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  CreateUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  Latitude: {
    type: Number,
  },
  Longitude: Number,
  status: {
    type: String,
    enum: ["acitve", "offline"],
    default: "offline",
  },
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
