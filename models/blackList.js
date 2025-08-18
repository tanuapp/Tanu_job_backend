const mongoose = require("mongoose");
const { Schema } = mongoose;

const REASONS = [
  "no_show", // Ирээгүй, ажил тасалсан
  "quality_issue", // Ажлын чанар муу
  "behavior_issue", // Ёс зүйн зөрчил, харилцааны асуудал
  "fraud", // Луйвар/хуурамч мэдээлэл
  "policy_violation", // Дүрэм зөрчсөн
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
      enum: REASONS,
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
