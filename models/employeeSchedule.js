const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeSchedule = new mongoose.Schema(
  {
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
    date: {
      type: Date,
    },
    serviceId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
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
  },
  {
    timestamps: true, // createdAt, updatedAt автоматаар үүсгэнэ
    strict: true, // schema-д байхгүй талбарыг хадгалахгүй
  }
);

module.exports = mongoose.model("EmployeeSchedule", employeeSchedule);
