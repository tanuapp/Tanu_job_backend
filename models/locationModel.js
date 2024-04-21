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
    type: String,
  },
  Longitude: String,
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
