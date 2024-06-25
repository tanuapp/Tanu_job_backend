const mongoose = require("mongoose");
const { Schema } = mongoose;

const companyCategorySchema = new Schema({
  createCustomer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  Company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CompanyCategory", companyCategorySchema);
