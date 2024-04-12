const mongoose = require("mongoose");
const { Schema } = mongoose;

const catergorySchema = new Schema({
  catergoryName: {
    type: String,
  },
  photo: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Category", catergorySchema);
