const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // 🔑 bcrypt import
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;
const freelancerSchema = new Schema(
  {
    phone: {
      type: String,
      required: [true, "Утасны дугаар заавал бичнэ үү!"],
      maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
    },
    skills: [String],
    avgRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    email: {
      type: String,
      sparse: true,
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
    nick_name: String,
    rank: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5],
      default: 0,
    },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    online: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/// 🔑 Pre-save hook (pin байвал hash хийдэг)
freelancerSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) {
    return next(); // зөвхөн pin өөрчлөгдсөн үед hash хий
  }
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(this.pin, salt);
  next();
});

/// 🔑 Pin hash хийх тусдаа method
freelancerSchema.methods.hashPin = async function (pin) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pin, salt);
};

/// 🔑 Pin шалгах
freelancerSchema.methods.checkPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};

/// 🔑 JWT авах
freelancerSchema.methods.getJsonWebToken = function () {
  return jwt.sign({ Id: this._id, phone: this.phone }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIREDIN,
  });
};

/// 🔑 findOneAndUpdate үед pin өөрчлөгдвөл hash хийнэ
freelancerSchema.pre("findOneAndUpdate", async function (next) {
  if (!this._update.pin) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this._update.pin = await bcrypt.hash(this._update.pin, salt);
  next();
});

module.exports = mongoose.model("Freelancer", freelancerSchema);
