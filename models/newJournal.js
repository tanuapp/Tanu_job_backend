const mongoose = require("mongoose");
const { Schema } = mongoose;

const newJournalSchema = new Schema({
  desc1: {
    type: String,
  },
  desc2: {
    type: String,
  },
  audio: String,
  sliderImg: [String],
  bodyImages: [String],
  profile: String,
  headerText: String,
  name: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NewJournal", newJournalSchema);
