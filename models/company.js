const mongoose = require("mongoose");
const CompanyCounter = require("./companyCounter");
const { Schema } = mongoose;

const companySchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  banks: {
    type: String,
    enum: [
      "Хаан банк",
      "Голомт Банк",
      "ХасБанк",
      "Төрийн банк",
      "Капитрон банк",
      "Ариг банк",
    ],
  },
  bankNumber: { type: String },
  commissionRate: { type: Number, default: 10 },
  bankOwner: { type: String },
  open: { type: String },
  close: { type: String },
  email: { type: String },
  companyCode: { type: String },
  bankCode: { type: String },
  address: { type: String },
  discount: { type: String },
  discountEnd: { type: Date },
  discountStart: { type: Date },
  interval: { type: String },
  fb: { type: String },
  instagram: { type: String },
  category: { type: [Schema.Types.ObjectId], ref: "Category", required: true },

  onlineContract: {
    type: Schema.Types.ObjectId,
    ref: "onlineContract",
  },
  views: { type: Number, default: 0 },
  done: { type: Number, default: 0 },
  status: {
    // 0 --> Pending, 1 --> Accepted, 2 --> Denied
    type: Number,
    enum: [0, 1, 2],
    default: 0,
  },
  agent: String,

  phone: { type: String },
  orderCancelHour: { type: Number, default: 2 },
  advancePayment: { type: Number, default: 10 },
  firebase_token: {
    type: String,
    default: "",
  },
  timetable: [],
  numberOfArtist: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  contract: { type: String },
  companyOwner: { type: Schema.Types.ObjectId, ref: "User" },
  logo: { type: String },
  sliderImages: [String],
  companyNumber: { type: String, unique: true },
  isHome: {
    type: Boolean,
    default: false,
  },
  package: { type: Schema.Types.ObjectId, ref: "Option" },
  isPackage: { type: Boolean, default: false },
  packageEndDate: { type: Date },
  latitude: { type: String },
  longitude: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

companySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await CompanyCounter.findOneAndUpdate(
        { name: "companyNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

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
companySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // 1) Increment the counter
      const counter = await CompanyCounter.findOneAndUpdate(
        { name: "companyNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // 2) Generate 2 random uppercase letters A-Z
      const letters = Array.from({ length: 2 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");

      // 3) Generate 4-digit padded number (e.g., 0001)
      const numberPart = counter.seq.toString().padStart(4, "0");

      // 4) Combine them
      this.companyNumber = `${letters}${numberPart}`;

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Company", companySchema);
