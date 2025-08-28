const mongoose = require("mongoose");
const { Schema } = mongoose;

const DailyWorkSummarySchema = new mongoose.Schema({
  artistId: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  date: { type: String, required: true }, // yyyy-mm-dd хэлбэр
  sessions: [
    {
      in: Date,
      out: Date,
      workedMinutes: Number,
    },
  ],
  totalMinutes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

DailyWorkSummarySchema.index({ artistId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyWorkSummary", DailyWorkSummarySchema);
