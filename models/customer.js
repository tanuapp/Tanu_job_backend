const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const customerSchema = new Schema({
  phone: {
    type: String,
    unique: true,
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  photo: String,
  pin: {
    type: String,
    select: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isAndroid: {
    type: Boolean,
    default: false,
  },
  firebase_token: String,
  first_name: String,
  last_name: String,
  verified_devices: [],
  email: {
    type: String,
    index: true,
    unique: true,
    sparse: true,
  },
  coupon: {
    type: Number,
    default: 0,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash pin only if it's modified
customerSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// Method to check the pin
customerSchema.methods.checkPassword = async function (pin) {
  return await bcrypt.compare(pin, this.pin);
};

// Generate JSON Web Token
customerSchema.methods.getJsonWebToken = function () {
  return jwt.sign({ Id: this._id, phone: this.phone }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIREDIN,
  });
};

// Hash pin if it's being updated
customerSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.pin) return next();
  const salt = await bcrypt.genSalt(10);
  this._update.pin = await bcrypt.hash(this._update.pin, salt);
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
