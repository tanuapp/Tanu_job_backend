const mongoose = require("mongoose");
const { Schema } = mongoose;

const newJournalSchema = new Schema({
  facebook: String,
  instagram: String,
  twitter: String,
  model: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  desc1: {
    type: String,
  },
  desc2: {
    type: String,
  },
  bgcolor: String,
  uria: String,
  audio: String,
  sliderImg: [String],
  bodyImages: [String],
  profile: String,
  headerText: String,
  name: {
    type: String,
    unique: true,
  },
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
  textcolor: String,
  slug: {
    type: String,
    unique: true,
  },
  about: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NewJournal", newJournalSchema);
