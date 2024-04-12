const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    status: {
        type: Boolean,
        default: false
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },
    sender_invoice_id: {
        type: String
    },
    qpay_invoice_id: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
