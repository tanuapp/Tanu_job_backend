const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object, default: {} }, // FCM data payload
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    read: { type: Boolean, default: false }, // уншсан эсэх
  },
  { timestamps: true } // createdAt, updatedAt автоматаар нэмэгдэнэ
);

module.exports = mongoose.model("Notification", notificationSchema);
