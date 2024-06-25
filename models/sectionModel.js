const mongoose = require("mongoose");
const { Schema } = mongoose;

const sectionSchema = new Schema({
  sectionName: {
    type: String
  },
  district: {
    type: Schema.Types.ObjectId,
    ref: "Disctrict"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Section", sectionSchema);
