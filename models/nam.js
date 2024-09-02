const mongoose = require("mongoose");
const { Schema } = mongoose;

const NamSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  logo: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Nam", NamSchema);
