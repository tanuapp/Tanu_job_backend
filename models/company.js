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

  interval: { type: String },
  fb: { type: String },
  instagram: { type: String },
  category: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      // required: true,
    },
  ],
  mainBranch: {
    type: Boolean,
    default: false, // анхдагч нь false
  },
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
  branchCode: {
    type: String,
    sparse: true, // зөвхөн утгатай мөрүүдэд unique шалгалт хийнэ
    default: null, // анхдагч төлөвт хоосон
  },
  phone: { type: String },
  orderCancelHour: { type: Number, default: 2 },
  advancePayment: { type: Number, default: 10 },
  firebase_token: {
    type: String,
    default: "",
  },
  discount: {
    type: Boolean,
    default: false,
  },
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
  companyNumber: { type: String, unique: true },
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

companySchema.pre("save", async function (next) {
  if (this.isNew && !this.branchCode) {
    try {
      let unique = false;
      let code;

      while (!unique) {
        const letters = Array.from({ length: 2 }, () =>
          String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join("");
        const numbers = Math.floor(10000 + Math.random() * 90000)
          .toString()
          .slice(0, 4);

        code = `${letters}${numbers}`;

        const exists = await mongoose.models.Company.findOne({
          branchCode: code,
        });
        if (!exists) unique = true;
      }

      this.branchCode = code;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Company", companySchema);
