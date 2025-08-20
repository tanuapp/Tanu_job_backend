const mongoose = require("mongoose");
const { Schema } = mongoose;

const HAIR_SALON_REASONS = [
  "abandonment", // Үйлчилгээг дутуу орхисон
  "unfinished_service", // Үйлчилгээг бүрэн гүйцэт хийгээгүй
  "safety_violation", // Аюулгүй ажиллагааны зөрчил

  // 🤝 Харилцаа/ёс зүй
  "rudeness_to_client", // Үйлчлүүлэгчтэй бүдүүлэг харьцсан
  "verbal_abuse", // Доромжилсон үг хэллэг
  "harassment", // Дарамт/халдлага
  "discrimination", // Ялгаварлан гадуурхалт
  "intoxicated_on_shift", // Ажлын байранд согтууруулах/мансуурал
  "unprofessional_social", // Сошиалд зохисгүй нийтлэл/контент

  "policy_violation", // Дотоод журам зөрчсөн
  "unauthorized_discount", // Зөвшөөрөлгүй хямдрал/үнэ өөрчилсөн
  "photo_without_consent", // Зургийг зөвшөөрөлгүй авсан/постолсон
  "privacy_breach", // Хувийн мэдээлэл задруулсан
  "confidentiality_breach", // Нууцлал зөрчсөн

  // 🧰 Хөрөнгө/бараа материал
  "equipment_damage", // Тоног төхөөрөмж гэмтээсэн
  "tool_loss", // Багаж үрэгдүүлсэн
  "product_waste", // Бүтээгдэхүүнийг хэт үрэгдүүлсэн
  "stock_theft", // Бараа материал завшсан

  // ⚖️ Ноцтой/гэрээт
  "fraud", // Луйвар, баримт хуурамчлах
  "contract_breach", // Гэрээний заалт зөрчсөн
  "moonlighting_conflict", // Өрсөлдөгчид давхар ажилласан (нууцлал/гэрээ зөрчсөн)

  "other", // Бусад
];

const VISIBILITY = ["public", "private"];

const blacklistEntrySchema = new Schema(
  {
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },

    reportedByCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    reasonCode: {
      type: String,
      enum: HAIR_SALON_REASONS,
      required: true,
      default: "other",
      index: true,
    },
    reasonText: {
      type: String,
      required: true,
      trim: true,
    },

    incidentDate: { type: Date, required: true, default: Date.now },

    // Нотлох баримт ( зураг/баримт URL, фaйл ID г.м. )
    evidences: [
      {
        type: {
          type: String, // image, video, doc, url
          default: "image",
        },
        url: String, // файлын URL эсвэл storage key
        label: String, // тайлбар
      },
    ],

    visibility: {
      type: String,
      enum: VISIBILITY,
      required: true,
      default: "public",
      index: true,
    },

    // Давталт/тохиолдлын оноо — ноцтой байдлыг илэрхийлэх
    severity: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    // Давтан зөрчил эсэх
    repeatCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

blacklistEntrySchema.index(
  { artistId: 1, reportedByCompanyId: 1, reasonCode: 1, visibility: 1 },
  { unique: false }
);

module.exports = mongoose.model("BlacklistEntry", blacklistEntrySchema);
