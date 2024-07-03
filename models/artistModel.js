const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const itemSchema = new mongoose.Schema({
  huwaari: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const artistSchema = new Schema({
  name: {
    type: String,
    required: [true, "Нэр оруулна уу "],
  },
  email: {
    type: String,
  },
  location: {
    type: String,
  },
  photo: String,
  SubCategory: [
    {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },
  ],
  Service: [
    {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },
  ],
  item: [itemSchema],
  phone: {
    type: String,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
  },
  Company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },

  password: {
    type: String,
    required: [true, "Нууц үг бичнэ үү"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "artist"],
    default: "artist",
  },
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
    { Id: this._id, role: this.role },
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
