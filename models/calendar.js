const mongoose = require("mongoose");
const { Schema } = mongoose;

const calendarSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  appointment: {
    type: Schema.Types.ObjectId,
    ref: "Appointment",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

calendarSchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

calendarSchema.set("toObject", { virtuals: true });
calendarSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Calendar", calendarSchema);
