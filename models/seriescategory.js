const mongoose = require("mongoose");
const { Schema } = mongoose;

const seriescategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  children: [
    {
      type: Schema.Types.ObjectId,
      ref: "Series",
    },
  ], // Add this field
});

// Remove this virtual field to avoid conflict
// categorySchema.virtual("children", {
//   ref: "Category",
//   localField: "_id",
//   foreignField: "parent",
// });

seriescategorySchema.set("toObject", { virtuals: true });
seriescategorySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("SeriesCategory", seriescategorySchema);
