const mongoose = require("mongoose");
const { Schema } = mongoose;

const seriesSchema = new Schema({
  photo: String,
  tag: String,
  views: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: "TuvshinBat",
  },
  title: String,
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: "SeriesCategory",
    },
  ],
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
