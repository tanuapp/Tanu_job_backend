const mongoose = require("mongoose");
const { Schema } = mongoose;

const scheduleSchema = new mongoose.Schema({
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
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  duration: String,
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
