const mongoose = require("mongoose");
const { Schema } = mongoose;

const subCatergorySchema = new Schema({
  subCatergoryName: {
    type: String
  },
  photo: {
    type: String
  },
  catergory: {
    type: Schema.Types.ObjectId,
    ref: "Catergory"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SubCategory", subCatergorySchema);
