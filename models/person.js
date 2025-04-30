const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const personSchema = new Schema({
  phone: {
    type: String,
    sparse: true,
    unique: true,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  firebase_token: String,
  isAndroid: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  pin: {
    type: String,
    select: false,
  },
  status: {
    type: Boolean,
    default: false,
  },
  photo: String,
  first_name: String,
  last_name: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

personSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

// Method to check the pin
personSchema.methods.checkPassword = async function (pin) {
  return await bcrypt.compare(pin, this.pin);
};

// Generate JSON Web Token
personSchema.methods.getJsonWebToken = function () {
  return jwt.sign({ Id: this._id, phone: this.phone }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIREDIN,
  });
};

// Hash pin if it's being updated
personSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.pin) return next();
  const salt = await bcrypt.genSalt(10);
  this._update.pin = await bcrypt.hash(this._update.pin, salt);
  next();
});


module.exports = mongoose.model("Person", personSchema);
