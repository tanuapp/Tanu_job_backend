const mongoose = require("mongoose");
const { Schema } = mongoose;

const FeedBackSchema = new mongoose.Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}); 
module.exports = mongoose.model("FeedBack", FeedBackSchema);
