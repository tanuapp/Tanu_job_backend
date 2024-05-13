const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new mongoose.Schema({
  name: String,
});

const serviceSchema = new Schema({
  createUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  name: {
    type: String,
  },
  SubCategory: {
    type: Schema.Types.ObjectId,
    ref: "SubCategory",
  },
  // files: [fileSchema],
  photo: String,
  description: {
    type: String,
  },
  price: {
    type: Number,
  },
  currentTime: {
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

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
