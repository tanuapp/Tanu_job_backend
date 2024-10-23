const mongoose = require("mongoose");
const { Schema } = mongoose;

const FavouriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "Customer",
  },
  company: {
    type: [mongoose.Types.ObjectId],
    ref: "Company",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Favourite", FavouriteSchema);
