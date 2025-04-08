const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  //   photo: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
  status: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
