const mongoose = require("mongoose");
const { Schema } = mongoose;

const journalSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
  },
  fileURL: {
    type: String,
  },
  journalType: {
    type: [mongoose.Types.ObjectId],
    ref: "JournalType",
  },
  reels: {
    type: [mongoose.Types.ObjectId],
    ref: "Reel",
  },
  isSpecial: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
  },
});

module.exports = mongoose.model("Journal", journalSchema);
