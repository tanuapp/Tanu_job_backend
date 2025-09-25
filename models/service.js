const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Schema } = mongoose;

const serviceSchema = new Schema({
  service_name: {
    type: String,
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },
  artistId: {
    type: [Schema.Types.ObjectId],
    ref: "Artist",
    default: [],
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  platforms: {
    type: [String],
    enum: ["business", "job"], // аль платформд харагдах
    default: ["business"], // default-оор business гэж хадгална
    index: true,
  },
  discount: {
    type: Number,
    default: 0,
    max: 100,
    min: 0,
  },
  discountEnd: { type: Date },
  discountStart: { type: Date },
  views: {
    type: Number,
    default: 0,
  },
  done: {
    type: Number,
    default: 0,
  },
  description: String,
  duration: Number,
  type: String,
  price: {
    type: Number,
    required: true,
  },
  photo: {
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

module.exports = mongoose.model("Service", serviceSchema);
