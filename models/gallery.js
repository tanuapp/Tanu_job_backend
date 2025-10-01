const mongoose = require("mongoose");

const { Schema } = mongoose;

const gallerySchema = new mongoose.Schema({
  gallery: { type: [String] },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
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

// Custom validation to ensure either companyId or freelancerId is provided
gallerySchema.pre('validate', function(next) {
  if (!this.companyId && !this.freelancerId) {
    return next(new Error('Either companyId or freelancerId is required'));
  }
  next();
});

module.exports = mongoose.model("Gallery", gallerySchema);
