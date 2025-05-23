const { Type } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const invoiceSchema = new Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Option",
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  discount: {
    type: Number,
  },
  isOption: {
    type: Boolean,
    default: false,
  },
  isAdvance: {
    type: Boolean,
    default: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  sender_invoice_id: {
    type: String,
  },
  qpay_invoice_id: String,
  status: {
    type: String,
    enum: ["pending", "paid", "expired", "declined"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);
