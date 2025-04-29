const mongoose = require("mongoose");
const { Schema } = mongoose;

const FeedBackSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("FeedBack", FeedBackSchema);
