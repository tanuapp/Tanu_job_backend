const mongoose = require("mongoose");
const { Schema } = mongoose;

const TimeLogSchema = new mongoose.Schema({
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  type: {
    type: String,
    enum: ["clockIn", "clockOut"], // 🟢 зөвхөн хоёр төрөл
    required: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index → query хурдан болгоно
TimeLogSchema.index({ artistId: 1, companyId: 1, createdAt: -1 });

module.exports = mongoose.model("TimeLog", TimeLogSchema);
