const mongoose = require("mongoose");
const { Schema } = mongoose;

const optionSchema = new mongoose.Schema({
  homeBanner: {
    type: Boolean,
    default: false,
  },
  employeeCount: {
    type: Number,
    default: 1,
  },
  branch: {
    type: Number,
    default: 1,
  },
  suggestion: {
    type: Boolean,
    default: false,
  },
  videoBanner: {
    type: Boolean,
    default: false,
  },
  story: {
    type: Boolean,
    default: false,
  },
  highlight: {
    type: Boolean,
    default: false,
  },
  chatbot: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Option", optionSchema);
