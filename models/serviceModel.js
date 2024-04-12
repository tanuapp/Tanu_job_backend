const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new mongoose.Schema({
  name: String,
});

const serviceSchema = new Schema({
  createUser: {
    type : mongoose.Schema.Types.ObjectId ,
    ref : "User"
  }, 
  name: {
    type: String,
  },
  Category: {
    type: Schema.Types.ObjectId,
    ref: "SubCategory",
  },
  files: [fileSchema],
  description: {
    type: String,
    required: [true, "Description is required"],
    maxlength: [80, "Description must be less than or equal to 80 characters"],
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
 