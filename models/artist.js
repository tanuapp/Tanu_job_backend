const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const artistSchema = new Schema({
  phone: {
    type: String,
    sparse: true,
    unique: true,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  color: {
    type: String,
    default: "#234343",
    match: [/^#([0-9A-F]{3}){1,2}$/i, "Зөв өнгөний код оруулна уу!"],
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
  avgRating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5,
  },

  idNumber: String,
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
  nick_name: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

artistSchema.pre("save", async function (next) {
  if (!this.pin) {
    return next(); // Skip hashing if pin is not set
  }
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

artistSchema.methods.checkPassword = async function (pin) {
  return await bcrypt.compare(pin, this.pin);
};

artistSchema.methods.getJsonWebToken = function () {
  let token = jwt.sign(
    { Id: this._id, phone: this.phone },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIREDIN,
    }
  );
  return token;
};
artistSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.pin) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this._update.pin = await bcrypt.hash(this._update.pin, salt);
  next();
});

module.exports = mongoose.model("Artist", artistSchema);
