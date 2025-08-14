const mongoose = require("mongoose");
const { Schema } = mongoose;

const userRoleSchema = new Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User", // Ensure this matches the User model name
  },
  title: {
    type: String,
  },

  dashboard: {
    type: Boolean,
    default: false,
  },
  monthReport: {
    type: Boolean,
    default: false,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  package: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserRole", userRoleSchema);
