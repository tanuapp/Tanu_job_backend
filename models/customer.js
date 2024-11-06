const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const customerSchema = new Schema({
  phone: {
    type: String,
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  photo: String,
  pin: String,
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
  email: String,
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

// customerSchema.pre("save", async function () {
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });
// customerSchema.methods.checkPassword = async function (pass) {
//   return await bcrypt.compare(pass, this.password);
// };

customerSchema.methods.getJsonWebToken = function () {
  let token = jwt.sign(
    { Id: this._id, phone: this.phone },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIREDIN,
    }
  );
  return token;
};
customerSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this._update.password = await bcrypt.hash(this._update.password, salt);
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
