const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Нэр оруулна уу "],
  },

  phone: {
    type: String,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  location : { 
    type : String,
  },
  about : { 
    type : String,
  },
  openTime : {
    type : String,
  } ,
  closeTime : {
    type : String,
  },
  password: { 
    type: String,
    required: [true, "Нууц үг бичнэ үү"],
    minlength: [8, "Нууц үгийн урт хамгийн багадаа  8 тэмдэгт байна"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "operator"],
    default: "user",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  photo: {
    type: String,
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
    { Id: this._id, role: this.role },
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
