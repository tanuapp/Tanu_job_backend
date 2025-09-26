const mongoose = require("mongoose");

const { Schema } = mongoose;

const gallerySchema = new mongoose.Schema({
  gallery: { type: [String] },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  freelancerId: {
    type: Schema.Types.ObjectId,
    ref: "Freelancer",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Gallery", gallerySchema);
