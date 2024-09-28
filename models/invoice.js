const mongoose = require("mongoose");
const { Schema } = mongoose;

const invoiceSchema = new Schema({
  appointment: {
    type: Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
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
    enum: ["pending", "paid"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);
