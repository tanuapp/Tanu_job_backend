const mongoose = require("mongoose");
const { Schema } = mongoose;

const newJournalSchema = new Schema({
  profile: {
    type: String,
  },
  desc1: {
    type: String,
  },
  desc2: {
    type: String,
  },
  sliderImg: [String],
  bodyImages: [String],
  profile: String,
  startingText: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NewJournal", newJournalSchema);
