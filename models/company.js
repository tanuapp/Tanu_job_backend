const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  latitude: {
    type: String,
  },
  longtitude: {
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
CompanySchema.pre("save", function (next) {
  this.updatedAt.push(Date.now()); // Add current timestamp to updatedAt array
  next();
});

// Pre-update middleware (for update operations using `findOneAndUpdate`)
CompanySchema.pre("findOneAndUpdate", function (next) {
  this._update.$push = this._update.$push || {}; // Ensure $push operator exists
  this._update.$push.updatedAt = Date.now(); // Add current timestamp to updatedAt array
  next();
});

module.exports = mongoose.model("Company", CompanySchema);
