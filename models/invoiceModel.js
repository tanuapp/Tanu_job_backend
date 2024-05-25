const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  Artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
  },
  Customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  Service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  tsagAwah: {
    type: String,
  },
  sender_invoice_id: {
    type: String,
  },
  qpay_invoice_id: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: false,
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
