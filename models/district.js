const mongoose = require("mongoose");
const { Schema } = mongoose;

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("District", districtSchema);
