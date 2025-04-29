const mongoose = require("mongoose");
const { Schema } = mongoose;

const userRoleSchema = new Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User", // Ensure this matches the User model name
  },
  role: {
    type: mongoose.Types.ObjectId,
    ref: "Role", // Ensure this matches the Role model name
  },
  companyId: {
    type: mongoose.Types.ObjectId,
    ref: "Company", // Ensure this matches the Company model name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserRole", userRoleSchema);
