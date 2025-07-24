const cron = require("node-cron");
const moment = require("moment-timezone");
const Appointment = require("../models/appointment");
const Invoice = require("../models/invoice");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");

// ⏱ 1 минут тутам ажиллах cron
cron.schedule("* * * * *", async () => {
  const now = moment().tz("Asia/Ulaanbaatar");
  const in5min = now.clone().add(5, "minutes");
  const expiryTime = 3 * 60 * 1000; 
 
  console.log("🟡 CRON ажиллаж байна:", now.format("YYYY-MM-DD HH:mm:ss"));

  /** ✅ 1. Push notification 5 мин дараа болох appointment-д **/
  try {
    const appointments = await Appointment.find({
      status: { $in: ["paid", "pending"] },
      notified: { $ne: true },
      date: now.format("YYYY-MM-DD"),
    })
      .populate("user")
      .populate({
        path: "schedule",
        populate: { path: "artistId serviceId" },
      });

    console.log(`🔔 Push шалгалт - ${appointments.length} appointment`);

    for (const a of appointments) {
      if (!a.schedule || !a.user) {
        console.log("⚠️ Schedule/User алга, алгаслаа:", a._id);
        continue;
      }

      const [hour, minute] = a.schedule.start.split(":").map(Number);
      const startTime = moment(a.date)
        .tz("Asia/Ulaanbaatar")
        .set({ hour, minute, second: 0 });

      const diffMinutes = startTime.diff(now, "minutes");

      if (diffMinutes <= 5 && diffMinutes >= 0) {
        const user = a.user;
        if (user.firebase_token) {
          const notif = {
            title: "⏰ Үйлчилгээ удахгүй эхэлнэ",
            body: `Таны ${
              a.schedule?.serviceId?.[0]?.service_name || "захиалга"
            } ${a.schedule.start}-д эхлэх гэж байна.`,
            token: user.firebase_token,
            data: {
              type: "appointment_reminder",
              appointmentId: a._id.toString(),
              start: a.schedule.start,
            },
          };

          try {
            await sendFirebaseNotification(notif);
            console.log(`✅ Push илгээгдлээ: ${user.first_name}`);
            a.notified = true;
            await a.save();
            console.log(`💾 Notified хадгаллаа: ${a._id}`);
          } catch (err) {
            console.error("❌ Push алдаа:", err.message);
          }
        } else {
          console.log(`🚫 Firebase token байхгүй: ${user.first_name}`);
        }
      } else {
        console.log(`⏭ Push цаг биш (${diffMinutes} мин) - ${a._id}`);
      }
    }
  } catch (err) {
    console.error("❌ Push шалгах алдаа:", err.message);
  }

  /** ✅ 2. Schedule end цаг нь хэтэрсэн appointment-уудыг done болгох **/
  try {
    const todayAppointments = await Appointment.find({
      status: { $in: ["paid", "pending"] },
      date: now.format("YYYY-MM-DD"),
    }).populate("schedule");

    console.log(`✅ DONE шалгалт - ${todayAppointments.length} appointment`);

    for (const a of todayAppointments) {
      if (!a.schedule) {
        console.log("⚠️ Schedule байхгүй, алгаслаа:", a._id);
        continue;
      }

      const [endHour, endMinute] = a.schedule.end.split(":").map(Number);
      const endTime = moment(a.date)
        .tz("Asia/Ulaanbaatar")
        .set({ hour: endHour, minute: endMinute, second: 0 });

      if (now.isAfter(endTime)) {
        a.status = "done";
        await a.save();
        console.log(`✅ DONE болголоо: ${a._id}`);
      } else {
        console.log(`⏭ Дуусаагүй (${a.schedule.end}), алгаслаа: ${a._id}`);
      }
    }
  } catch (err) {
    console.error("❌ DONE шалгах алдаа:", err.message);
  }

  /** ✅ 3. 3 мин хэтэрсэн pending invoice-уудыг expired болгох **/
  try {
    const expiredInvoices = await Invoice.find({
      status: "pending",
      createdAt: { $lt: new Date(Date.now() - expiryTime) },
    });

    console.log(
      `📦 Invoice expiry шалгалт - ${expiredInvoices.length} invoice`
    );

    for (const invoice of expiredInvoices) {
      invoice.status = "expired";
      await invoice.save();
      console.log(`🔴 Invoice expired: ${invoice._id}`);
    }
  } catch (error) {
    console.error("❌ Invoice шалгах алдаа:", error.message);
  }
});
