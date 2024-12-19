const mongoose = require("mongoose");

const tanuBannerSchema = new mongoose.Schema({
  photo: {
    type: String,
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
