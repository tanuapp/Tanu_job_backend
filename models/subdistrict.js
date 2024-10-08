const mongoose = require("mongoose");
const { Schema } = mongoose;

const subDistrictSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  district: {
    type: mongoose.Types.ObjectId,
    ref: "District",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("SubDistrict", subDistrictSchema);
