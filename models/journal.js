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
  pages: [
    {
      categoryName: String,
      fileURL: String,
    },
  ],
  isSpecial: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Journal", journalSchema);
