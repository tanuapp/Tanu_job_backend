const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  photo: String,
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  platforms: {
    type: [String],
    enum: ["business", "job"], // аль платформд харагдах
    default: ["business"], // default-оор business гэж хадгална
    index: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

categorySchema.set("toObject", { virtuals: true });
categorySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Category", categorySchema);
