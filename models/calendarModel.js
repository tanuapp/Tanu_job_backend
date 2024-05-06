const mongoose = require("mongoose");

const calendarSchema = new mongoose.Schema({
  alertrtist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  status: {
    type: Boolean,
    default: false,
  },
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  className: {
    type: String,
  },
});

const Calendar = mongoose.model("Calendar", calendarSchema);

module.exports = Calendar;
