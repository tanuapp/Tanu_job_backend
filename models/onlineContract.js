const mongoose = require("mongoose");
const { Schema } = mongoose;
const onlineContractSchema = new mongoose.Schema({

  status: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  pdfFile: {
    type: String, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("onlineContract", onlineContractSchema);
