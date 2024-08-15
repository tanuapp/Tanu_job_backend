const mongoose = require("mongoose");
const { Schema } = mongoose;
const fileSchema = new mongoose.Schema({
  name: String,
});

const subCatergorySchema = new Schema({
  subCatergoryName: {
    type: String,
  },
  files: [fileSchema],
  Category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  Company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SubCategory", subCatergorySchema);
