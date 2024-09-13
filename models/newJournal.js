const mongoose = require("mongoose");
const { Schema } = mongoose;
const slugify = require("mongoose-simple-slugify");

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
  slug: {
    source: "name",
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}).plugin(slugify);

module.exports = mongoose.model("NewJournal", newJournalSchema);
