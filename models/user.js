const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const userSchema = new Schema({
  phone: {
    type: String,
    // required: [true, "Утасны дугаар заавал бичнэ үү!"],
    unique: [true, "Утасны дугаар бүртгэлтэй байна"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  password: {
    type: String,
  },
  pin: String,
  status: {
    type: Boolean,
    default: false,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  first_name: String,
  role: {
    type: String,
    // 0 = Tanu super admin, 1 = Tanu ded admin, 2 = Baiguullagiin Admin, 3 = Baiguullagiin ded admin
    enum: ["admin", "user"],
    default: "user",
  },
  permission: {
    type: [String],
    enum: ["settings", "employee", "statistic", "banner", "dayoff"],
    default: [],
  },
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.checkPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

userSchema.methods.getJsonWebToken = function () {
  let token = jwt.sign(
    { Id: this._id, phone: this.phone, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIREDIN,
    }
  );
  return token;
};
userSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this._update.password = await bcrypt.hash(this._update.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
