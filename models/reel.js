const mongoose = require("mongoose");
const { Schema } = mongoose;

const reelSchema = new Schema({
  reel: {
    type: String,
  },
  position: {
    type: String,
    enum: ["bottom", "top", "full"],
    default: "full",
  },
  showPage: {
    type: Number,
  },
  journal: {
    type: mongoose.Types.ObjectId,
    ref: "Journal",
    required: true,
  },
});

module.exports = mongoose.model("Reel", reelSchema);
