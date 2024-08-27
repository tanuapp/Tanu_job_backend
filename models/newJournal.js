const mongoose = require("mongoose");
const { Schema } = mongoose;

const newJournalSchema = new Schema({
  desc1: {
    type: String,
  },
  desc2: {
    type: String,
  },
  uria: String,
  audio: String,
  sliderImg: [String],
  bodyImages: [String],
  profile: String,
  headerText: String,
  name: String,
  district: {
    type: mongoose.Types.ObjectId,
    ref: "District",
  },
  area: {
    type: mongoose.Types.ObjectId,
    ref: "Area",
  },
  subDistrict: {
    type: mongoose.Types.ObjectId,
    ref: "SubDistrict",
  },
  nam: {
    type: mongoose.Types.ObjectId,
    ref: "Nam",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NewJournal", newJournalSchema);
