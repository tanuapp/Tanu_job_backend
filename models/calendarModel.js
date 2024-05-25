const mongoose = require("mongoose");

const calendarSchema = new mongoose.Schema({
  Artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
  },
  Service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  Company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  Customer: {
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
