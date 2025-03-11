const mongoose = require("mongoose");
const CompanyCounter = require("./companyCounter");
const { Schema } = mongoose;

const companySchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  banks: { 
    type: String,
    enum: ["ХААН Банк", "Голомт Банк", "ХасБанк", "Төрийн банк", "Капитрон банк","Ариг банк"],
  },
  banknumber: { type: String },
  
  address: { type: String },
  category: { type: [Schema.Types.ObjectId], ref: "Category", required: true },
  views: { type: Number, default: 0 },
  done: { type: Number, default: 0 },
  status: {
    // 0 --> Pending, 1 --> Accepted, 2 --> Denied
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  phone: { type: String, required: true },
  open: { type: String },
  numberOfArtist: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5,
  },
  close: { type: String },
  contract: { type: String },
  companyOwner: { type: Schema.Types.ObjectId, ref: "User" },
  logo: { type: String },
  sliderImages: { type: [String] },
  companyNumber: { type: Number, unique: true, default: 1000 },
  district: {
    type: mongoose.Types.ObjectId,
    ref: "District",
  },
  area: {
    type: mongoose.Types.ObjectId,
    ref: "Area",
  },
  subDistrict: {
    type: mongoose.Types.ObjectId,
    ref: "SubDistrict",
  },
  latitude: { type: String },
  longitude: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Increment companyNumber automatically
companySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Find and increment the counter in the CompanyCounter collection
      const counter = await CompanyCounter.findOneAndUpdate(
        { name: "companyNumber" }, // The name of the counter we are incrementing
        { $inc: { seq: 1 } }, // Increment the sequence by 1
        { new: true, upsert: true } // Return the updated document, create it if not found
      );

      // Set the company's companyNumber to the updated sequence value
      this.companyNumber = counter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Automatically update the updatedAt field on updates
companySchema.pre("findByIdAndUpdate", function (next) {
  this._update.$set = this._update.$set || {};
  this._update.$set.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Company", companySchema);
