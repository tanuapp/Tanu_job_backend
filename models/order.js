const mongoose = require("mongoose");
const { Schema } = mongoose;
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    service: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    freelancer: { type: Schema.Types.ObjectId, ref: "Freelancer" },
    address: String,
    lat: Number,
    lng: Number,
    price: Number,
    status: {
      type: String,
      enum: [
        "new",
        "assigned",
        "accepted",
        "en_route",
        "started",
        "paid",
        "done",
        "completed",
        "canceled",
        "pending",
      ],
      default: "new",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Order", orderSchema);
