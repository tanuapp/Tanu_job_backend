const mongoose = require("mongoose");
const { Schema } = mongoose;

const companySchema = new Schema({
  companyName: {
    type: String,
  },
  logo: {
    type: String,
  },
  phone: {
    type: String,
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  description: {
    type: String,
    required: [true, "Компаний танилцууллага хоосон байж болохгүй"],
    maxlength: [
      200,
      "Компаний танилцууллага   хамгийн уртдаа 300 тэмдэгт байна  сонгоно уу!",
    ],
  },
  open: { type: String },
  close: { type: String },

  companyCreater: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  companyCode: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Company", companySchema);
