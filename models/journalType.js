const mongoose = require("mongoose");
const { Schema } = mongoose;

const journalTypeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
  },
  order: {
    type: Number,
  },
  startPage: {
    type: Number,
  },
  endPage: {
    type: Number,
  },
});

module.exports = mongoose.model("JournalType", journalTypeSchema);
