const mongoose = require("mongoose");
const { Schema } = mongoose;

const companyCategorySchema = new Schema({
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
});

module.exports = mongoose.model("CompanyCategory", companyCategorySchema);
