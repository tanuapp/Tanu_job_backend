const mongoose = require("mongoose");
const { Schema } = mongoose;

const storySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  date: {
    type: String,
  },
  endsAt: {
    type: Date,
  },
  file: {
    type: String,
  },
  fileType: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Story", storySchema);
