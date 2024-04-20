const mongoose = require("mongoose");
const { Schema } = mongoose;

const subCatergorySchema = new Schema({
  subCatergoryName: {
    type: String,
  },
  photo: {
    type: String,
  },
  Category: {
    type: Schema.Types.ObjectId,
    ref: "Catergory",
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
