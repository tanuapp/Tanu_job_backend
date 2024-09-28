const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const artistSchema = new Schema({
  phone: {
    type: String,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  email: String,
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  password: {
    type: String,
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

artistSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
artistSchema.methods.checkPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
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
  if (!this._update.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this._update.password = await bcrypt.hash(this._update.password, salt);
  next();
});

module.exports = mongoose.model("Artist", artistSchema);
