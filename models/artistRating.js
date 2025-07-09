const mongoose = require("mongoose");
const { Schema } = mongoose;

const artistRatingSchema = new Schema({
  artistId: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  user: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  rating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ArtistRating", artistRatingSchema);
