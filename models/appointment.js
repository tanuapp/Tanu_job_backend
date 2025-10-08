const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  finalPrice: { type: String },
  isOption: { type: Boolean, default: false },
  option: { type: Schema.Types.ObjectId, ref: "Option" },
  duration: {
    type: String,
    enum: ["one", "six", "year", "free"],
    default: "one",
  },

  // 🔗 Хуваарьтай холбоос
  schedule: { type: Schema.Types.ObjectId, ref: "Schedule", required: true },

  // 🏢 Компани
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },

  // 👤 Artist-ийг Appointment дээр denormalize хийж хадгална
  artistId: { type: Schema.Types.ObjectId, ref: "Artist", required: true },

  // ⏰ Цагийг Appointment дээр denormalize хийж хадгална (HH:mm)
  start: { type: String, required: true },
  end: { type: String, required: true },

  notified: { type: Boolean, default: false },
  phone: { type: String },
  name: { type: String },
  extraInfo: { type: String },
  isManual: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: "Customer" },
  qr: { type: String, default: "no-qr.png" },

  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "expired",
      "declined",
      "completed",
      "done",
      "advance",
    ],
    default: "pending",
    index: true,
  },

  isCash: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// ⚡ Давхцлыг DB түвшинд бүрэн хаах индекс
appointmentSchema.index(
  { artistId: 1, date: 1, start: 1, end: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "advance", "paid"] },
    },
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
