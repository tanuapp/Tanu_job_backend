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
    // required: [true, "Утасны дугаар заавал бичнэ үү!"],
    // maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
  },
  about: {
    type: String,
  },
  email: {
    type: String,
  },
  open: { type: String },
  close: { type: String },

  companyCreater: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  Category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  companyCode: {
    type: String,
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
