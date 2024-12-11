const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanyArtistRequestSchema = new mongoose.Schema({
  artist: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
    default: null,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "CompanyArtistRequest",
  CompanyArtistRequestSchema
);
