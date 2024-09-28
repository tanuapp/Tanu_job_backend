const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    default: 1000, // Start with the initial company number
  },
});

module.exports = mongoose.model("CompanyCounter", counterSchema);
