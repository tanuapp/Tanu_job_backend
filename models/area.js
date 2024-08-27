const mongoose = require("mongoose");
const { Schema } = mongoose;

const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  subdistrict: {
    type: mongoose.Types.ObjectId,
    ref: "District",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Area", AreaSchema);
