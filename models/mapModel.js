const mongoose = require("mongoose");
const { Schema } = mongoose;

const mapSchema = new Schema({
  catergoryName: {
    type: String,
  },
  photo: {
    type: String,
  },
  Latitude: String,
  Longitude: String,
});

module.exports = mongoose.model("Map", mapSchema);
