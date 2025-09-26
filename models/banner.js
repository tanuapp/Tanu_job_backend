const mongoose = require("mongoose");
const { Schema } = mongoose;

const BannerSchema = new mongoose.Schema({
  photo: {
    type: String,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  freelancerId: {
    type: Schema.Types.ObjectId,
    ref: "Freelancer",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Banner", BannerSchema);
