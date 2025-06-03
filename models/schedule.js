const mongoose = require("mongoose");
const { Schema } = mongoose;

const scheduleSchema = new mongoose.Schema({
  vacationStart: {
    type: String,
  },
  vacationEnd: {
    type: String,
  },
  start: {
    type: String,
  },
  end: {
    type: String,
  },
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: "Service",
  },
  isRescheduled: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  day_of_the_week: {
    type: String,
    enum: ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
