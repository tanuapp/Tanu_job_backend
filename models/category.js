const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Ensure the category name is required
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Category", CategorySchema);
