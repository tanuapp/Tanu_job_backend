const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema({
  huwaari: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  Service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
