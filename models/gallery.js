const mongoose = require("mongoose");

const { Schema } = mongoose;

const gallerySchema = new mongoose.Schema({


  gallery: { type: [String] },

  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Gallery", gallerySchema);
