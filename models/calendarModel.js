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
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  className: {
    type: String,
    enum: ["primary", "success", "danger"],
    default: "primary",
  },
});

const Calendar = mongoose.model("Calendar", calendarSchema);

module.exports = Calendar;
