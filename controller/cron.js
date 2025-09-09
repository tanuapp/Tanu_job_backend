const cron = require("node-cron");
const Appointment = require("../models/appointment");
const Invoice = require("../models/invoice");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");

// Цагийн бүсийг зөв тохируулна
process.env.TZ = "Asia/Ulaanbaatar";

// ⏱ 1 минут тутам ажиллах cron
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const expiryTime = 3 * 60 * 1000; // 3 минут

  /** ✅ 1. Push notification 5 мин дараа эхлэх appointment-д **/
  try {
    const appointments = await Appointment.find({
      status: { $in: ["paid", "pending"] },
      notified: { $ne: true },
      date: todayStr,
    })
      .populate({
        path: "user",
        select: "firebase_token",
        options: { lean: true },
      })
      .populate({
        path: "schedule",
        select: "start serviceId",
        populate: {
          path: "serviceId",
          select: "service_name",
          options: { lean: true },
        },
        options: { lean: true },
      })
      .lean();

    for (const a of appointments) {
      if (!a.schedule || !a.user) continue;

      const [hour, minute] = a.schedule.start.split(":").map(Number);
      const startTime = new Date(a.date);
      startTime.setHours(hour, minute, 0, 0);

      const diffMinutes = Math.floor((startTime - now) / (1000 * 60));

      if (diffMinutes <= 5 && diffMinutes >= 0 && a.user.firebase_token) {
        const notif = {
          title: "⏰ Үйлчилгээ удахгүй эхэлнэ",
          body: `Таны ${
            a.schedule?.serviceId?.[0]?.service_name || "захиалга"
          } ${a.schedule.start}-д эхлэх гэж байна.`,
          token: a.user.firebase_token,
          data: {
            type: "appointment_reminder",
            appointmentId: a._id.toString(),
            start: a.schedule.start,
          },
        };

        try {
          await sendFirebaseNotification(notif);
          await Appointment.findByIdAndUpdate(a._id, { notified: true });
        } catch (err) {
          console.error("❌ Push илгээхэд алдаа:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ Push шалгах алдаа:", err.message);
  }

  /** ✅ 2. Schedule end цаг нь хэтэрсэн appointment-уудыг done болгох **/
  try {
    const todayAppointments = await Appointment.find({
      status: { $in: ["paid", "pending"] },
      date: todayStr,
    })
      .populate({
        path: "schedule",
        select: "end",
        options: { lean: true },
      })
      .select("status date schedule")
      .lean();

    for (const a of todayAppointments) {
      if (!a.schedule) continue;

      const [endHour, endMinute] = a.schedule.end.split(":").map(Number);
      const endTime = new Date(a.date);
      endTime.setHours(endHour, endMinute, 0, 0);

      if (now > endTime) {
        await Appointment.findByIdAndUpdate(a._id, { status: "done" });
      }
    }
  } catch (err) {
    console.error("❌ DONE шалгах алдаа:", err.message);
  }

  /** ✅ 3. 3 мин хэтэрсэн pending invoice-уудыг expired болгох **/
  try {
    await Invoice.updateMany(
      {
        status: "pending",
        createdAt: { $lt: new Date(Date.now() - expiryTime) },
      },
      { $set: { status: "expired" } }
    );
  } catch (error) {
    console.error("❌ Invoice шалгах алдаа:", error.message);
  }
});
