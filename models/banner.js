const mongoose = require("mongoose");
const { Schema } = mongoose;

const BannerSchema = new mongoose.Schema({
  photo: {
    type: String,
  },
  order: {
    type: Number,
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
module.exports = mongoose.model("Banner", BannerSchema);
