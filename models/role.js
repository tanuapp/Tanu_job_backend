const mongoose = require("mongoose");
const { Schema } = mongoose;

const roleSchema = new Schema({
  status: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
  },
  isRealtime: {
    type: Boolean,
    default: false,
  },
  notif: {
    type: Boolean,
    default: false,
  },
  static: {
    type: Boolean,
    default: false,
  },
  monthReport: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  yearReport: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Role", roleSchema);
