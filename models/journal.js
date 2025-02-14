const mongoose = require("mongoose");
const { Schema } = mongoose;
const Counter = require("./counter");

const newJournalSchema = new Schema({
  views: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    unique: true,
  },
  facebook: String,
  instagram: String,
  twitter: String,
  model: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  desc1: {
    type: String,
  },
  desc2: {
    type: String,
  },
  bgcolor: String,
  uria: String,
  audio: String,
  sliderImg: [String],
  bodyImages: [String],
  profile: String,
  headerText: String,
  name: {
    type: String,
    unique: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "SeriesCategory",
    required: true,
  },
  textcolor: String,
  slug: {
    type: String,
    unique: true,
  },
  about: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

newJournalSchema.pre("save", async function (next) {
  const doc = this;

  if (doc.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "order" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      doc.order = counter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("NewJournal", newJournalSchema);
