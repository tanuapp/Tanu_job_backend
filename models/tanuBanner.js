const mongoose = require("mongoose");

const tanuBannerSchema = new mongoose.Schema({
  file: {
    type: String,
  },
  fileType: {
    type: String, // 'image' or 'video'
    enum: ['image', 'video'],
    required: true,
  },
  links: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("tanuBanner", tanuBannerSchema);
