const mongoose = require("mongoose");
const { Schema } = mongoose;

const optionSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
  },
  title:{
    type: String,
    required: true,
  },
  color:{
    type: String,
  },
  description:{
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  employeeCount: {
    type: Number,
    default: 1,
  },
  homeBanner: {
    type: Boolean,
    default: false,
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
