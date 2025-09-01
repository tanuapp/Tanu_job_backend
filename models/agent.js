const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
    password: {
      type: String,
      required: [true, "Нууц үг заавал оруулна уу!"],
      minlength: [6, "Нууц үг хамгийн багадаа 6 тэмдэгттэй байна!"],
      select: false,
    },
    totalcompany: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// ⏳ Save хийхийн өмнө нууц үгийг шифрлэнэ
AgentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Нууц үг шалгах method
AgentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Agent", AgentSchema);
