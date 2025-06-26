const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const userSchema = new Schema({
  phone: {
    type: String,
    unique: [true, "Утасны дугаар бүртгэлтэй байна"],
    sparse: true,
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  password: {
    type: String,
  },
  pin: {
    type: String,
    select: false,
  },
  name: String,
  status: {
    type: Boolean,
    default: false,
  },
  photo: String,
  companyId: {
    type: mongoose.Types.ObjectId,
    ref: "Company",
  },
  first_name: String,
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  userRole: {
    type: mongoose.Types.ObjectId,
    ref: "UserRole",
  },
  firebase_token: {
    type: String,
    default: "",
  },
  last_name: String,
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  booked: {
    type: [Schema.Types.ObjectId],
    ref: "Company",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Save үед password болон pin-г шифрлэх
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);

  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("pin") && this.pin) {
    this.pin = await bcrypt.hash(this.pin, salt);
  }

  next();
});

// ✅ Update үед мөн шифрлэх
userSchema.pre("findOneAndUpdate", async function (next) {
  const salt = await bcrypt.genSalt(10);

  if (this._update.password) {
    this._update.password = await bcrypt.hash(this._update.password, salt);
  }

  if (this._update.pin) {
    this._update.pin = await bcrypt.hash(this._update.pin, salt);
  }

  next();
});

// ✅ Password шалгах
userSchema.methods.checkPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

// ✅ Pin шалгах
userSchema.methods.checkPin = async function (inputPin) {
  return await bcrypt.compare(inputPin, this.pin);
};

// ✅ JWT токен үүсгэх
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

module.exports = mongoose.model("User", userSchema);
