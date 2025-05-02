const mongoose = require("mongoose");
const { Schema } = mongoose;

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  agent: {
    type: String,
    unique: true,
    required: true,
  },
  banks: {
    type: String,
    enum: [
      "ХААН Банк",
      "Голомт Банк",
      "ХасБанк",
      "Төрийн банк",
      "Капитрон банк",
      "Ариг банк",
    ],
  },
  bankNumber: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    unique: [true, "Утасны дугаар бүртгэлтэй байна"],
    sparse: true,
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
  },
  samephone: {
    type: String,
    unique: [true, "Утасны дугаар бүртгэлтэй байна"],
    sparse: true,
    maxlength: [8, "Утасны дугаар хамгийн ихдээ 8 оронтой байна!"],
    required: [true, "Утасны дугаар заавал бичнэ үү!"],
  },
  totalcompany: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Agent", AgentSchema);
