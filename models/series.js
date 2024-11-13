const mongoose = require("mongoose");
const { Schema } = mongoose;

const seriesSchema = new Schema({
  photo: String,
  tag: String,
  title: String,
  pages: {
    type: [mongoose.Types.ObjectId],
    ref: "NewJournal",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Series", seriesSchema);
