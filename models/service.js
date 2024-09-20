const mongoose = require("mongoose");
const { Schema } = mongoose;

const ServiceSchema = new mongoose.Schema({
  salon_id: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  name: {
    type: String,
  },
  duration: {
    type: Number,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: [Date],
    default: [],
  },
});

// Pre-save middleware (for create or update using `save`)
ServiceSchema.pre("save", function (next) {
  this.updatedAt.push(Date.now()); // Add current timestamp to updatedAt array
  next();
});

// Pre-update middleware (for update operations using `findOneAndUpdate`)
ServiceSchema.pre("findOneAndUpdate", function (next) {
  this._update.$push = this._update.$push || {}; // Ensure $push operator exists
  this._update.$push.updatedAt = Date.now(); // Add current timestamp to updatedAt array
  next();
});

module.exports = mongoose.model("Service", ServiceSchema);
