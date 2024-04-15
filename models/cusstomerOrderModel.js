const mongoose = require("mongoose");
const { Schema } = mongoose;

const customerOrderchema = new Schema({
  orderCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: "Item"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerOrder", customerOrderchema);
