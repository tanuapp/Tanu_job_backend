const mongoose = require("mongoose");
const { Schema } = mongoose;

const customerOrderchema = new Schema({
  Customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  Service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  ognoo: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerOrder", customerOrderchema);
