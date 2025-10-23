const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderInvoiceSchema = new Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Freelancer", // Assuming freelancers are stored in User model
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  serviceName: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    required: true,
  },
  sender_invoice_id: {
    type: String,
  },
  price: {
    type: Number,
  },
  qpay_invoice_id: String,
  status: {
    type: String,
    enum: ["pending", "paid", "expired", "declined", "done"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OrderInvoice", orderInvoiceSchema);
