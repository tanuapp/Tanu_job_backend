const mongoose = require("mongoose");
const CompanyCounter = require("./companyCounter");
const { Schema } = mongoose;

const companySchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  banks: {
    type: String,
    enum: [
      "ХААН Банк",
      "Голомт Банк",
      "ХасБанк",
      "Төрийн банк",
      "Капитрон банк",
      "Ариг банк",
    ],
  },
  banknumber: { type: String },
  commissionRate: { type: Number, default: 10 },
  bankowner: { type: String },
  open: { type: String },
  close: { type: String },
  email: { type: String },
  companyCode: { type: String },

  address: { type: String },
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
  advancePayment: { type: Number, default: 0 },

  timetable: [],
  numberOfArtist: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5,
  },
  contract: { type: String },
  companyOwner: { type: Schema.Types.ObjectId, ref: "User" },
  logo: { type: String },
  sliderImages: [String],
  companyNumber: { type: Number, unique: true, default: 1000 },
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
companySchema.pre("findByIdAndUpdate", function (next) {
  this._update.$set = this._update.$set || {};
  this._update.$set.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Company", companySchema);
