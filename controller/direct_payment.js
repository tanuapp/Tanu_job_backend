const mongoose = require("mongoose");
const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const Favourite = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");
const axios = require("axios");
const customResponse = require("../utils/customResponse");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");
const Notification = require("../models/notification");
const Customer = require("../models/customer");

exports.createPayment = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { schedule, date } = req.body;
    console.log("🟢 [START createPayment]");
    console.log("📩 Request Body:", req.body);

    // 1) Schedule & Artist мэдээлэл
    const scheduleDoc = await Schedule.findById(schedule)
      .populate("artistId")
      .populate({
        path: "serviceId",
        select:
          "service_name price companyId discount discountStart discountEnd",
        populate: {
          path: "companyId",
          model: "Company",
          select: "advancePayment firebase_token name",
        },
      })
      .session(session);

    if (!scheduleDoc) throw new Error("Schedule олдсонгүй");

    const artistId = scheduleDoc.artistId?._id;
    const start = scheduleDoc.start;
    const end = scheduleDoc.end;

    console.log("🎨 Artist ID:", artistId?.toString());
    console.log("⏰ Schedule Start-End:", start, "-", end);

    if (!artistId || !start || !end)
      throw new Error("Artist эсвэл цагийн мэдээлэл дутуу байна.");

    // 2) Давхцал шалгах (code-level)
    console.log("🧩 Checking overlapping...");
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startTime = new Date(2000, 0, 1, sh, sm);
    const endTime = new Date(2000, 0, 1, eh, em);
    console.log("🕓 Time Range:", startTime, "→", endTime);

    // Тухайн өдөр, artist-ийн идэвхтэй appointment-ууд
    const overlappingAppointments = await Appointment.find({
      artistId,
      date,
      status: { $in: ["paid", "pending", "advance"] },
    })
      .select("_id start end")
      .session(session);

    console.log(
      "🔍 Potential overlapping appointments:",
      overlappingAppointments.length
    );

    let hasConflict = false;
    for (const a of overlappingAppointments) {
      const [bh, bm] = a.start.split(":").map(Number);
      const [ehh, emm] = a.end.split(":").map(Number);
      const bookedStart = new Date(2000, 0, 1, bh, bm);
      const bookedEnd = new Date(2000, 0, 1, ehh, emm);

      const overlap = bookedStart < endTime && bookedEnd > startTime;
      const exactSame = a.start === start && a.end === end;

      if (overlap || exactSame) {
        console.log(
          `🚫 Conflict detected! Appointment ${a._id} (${a.start}–${a.end}) overlaps with ${start}–${end}`
        );
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      console.log("❌ Overlapping detected — aborting transaction.");
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "⚠️ Энэ artist-ийн тухайн цаг аль хэдийн захиалагдсан байна.",
      });
    }

    console.log("✅ No overlap found — continuing...");

    // 3) Үнэ тооцоолол
    const services = scheduleDoc.serviceId || [];
    if (!services.length) throw new Error("Үйлчилгээ олдсонгүй");

    const company = services[0].companyId;
    if (!company) throw new Error("Компани олдсонгүй");

    console.log("🏢 Company:", company.name);

    let discountedTotalPrice = 0;
    for (const s of services) {
      const price = parseFloat(s.price || 0);
      let final = price;
      const active =
        s.discountStart &&
        s.discountEnd &&
        new Date() >= new Date(s.discountStart) &&
        new Date() <= new Date(s.discountEnd);

      if (active && s.discount) {
        const pct = parseFloat(String(s.discount).replace(/[^0-9]/g, ""));
        if (!isNaN(pct) && pct > 0) final = price * (1 - pct / 100);
      }
      discountedTotalPrice += final;
      console.log(
        `💰 Service: ${s.service_name}, price: ${price}, final: ${final}`
      );
    }
    discountedTotalPrice = Math.round(discountedTotalPrice);
    console.log("💵 Total Price:", discountedTotalPrice);

    const advancePercent = parseFloat(company.advancePayment || 0);
    const advanceAmount = Math.floor(
      (discountedTotalPrice * advancePercent) / 100
    );
    console.log(`💸 Advance Payment: ${advancePercent}% = ${advanceAmount}₮`);

    // 3.5) Commit-ын өмнөх дахин шалгалт (double-check)
    const duplicateGuard = await Appointment.findOne({
      artistId,
      date,
      start,
      end,
      status: { $in: ["paid", "pending", "advance"] },
    }).session(session);

    if (duplicateGuard) {
      console.log("🚫 Duplicate time found during pre-insert check.");
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "⚠️ Энэ artist-ийн тухайн цаг аль хэдийн захиалагдсан байна.",
      });
    }

    // 4) Захиалга үүсгэх (⚠️ denormalize талбаруудыг хадгална)
    const app = await Appointment.create(
      [
        {
          schedule,
          user: req.userId || null,
          date,
          finalPrice: String(discountedTotalPrice),
          company: company._id,
          artistId, // ✅ denormalized
          start, // ✅ denormalized
          end, // ✅ denormalized
          status: advanceAmount === 0 ? "pending" : "advance",
        },
      ],
      { session }
    );
    console.log("✅ Appointment created:", app[0]._id);

    // 5) Урьдчилгаа төлбөр байвал invoice
    let inv = null;
    if (advanceAmount > 0) {
      inv = await Invoice.create(
        [{ amount: advanceAmount, appointment: app[0]._id, isAdvance: true }],
        { session }
      );
      console.log("🧾 Invoice created:", inv[0]._id);
    } else {
      console.log("ℹ️ No advance payment — skipping invoice.");
    }

    // 6) Favourite
    const alreadySaved = await Favourite.findOne({
      user: req.userId,
      company: company._id,
    }).session(session);
    if (!alreadySaved) {
      await Favourite.create([{ user: req.userId, company: company._id }], {
        session,
      });
      console.log("💾 Added company to favourites.");
    } else {
      console.log("ℹ️ Company already in favourites.");
    }

    await session.commitTransaction();
    session.endSession();
    console.log("✅ Transaction committed successfully.");

    // 7) Firebase + Socket (transaction гадна)
    const createdApp = app[0];
    const fullUser = await Customer.findById(createdApp.user);
    const userName = `${fullUser?.last_name || ""}`.trim() || "Захиалга";
    const userPhone = fullUser?.phone || "";

    let artistName = "Мастер";
    if (scheduleDoc.artistId?.first_name || scheduleDoc.artistId?.last_name) {
      const first = scheduleDoc.artistId.first_name
        ? scheduleDoc.artistId.first_name.charAt(0) + "."
        : "";
      const last = scheduleDoc.artistId.last_name || "";
      artistName = `${first}${last}`.trim();
    }

    console.log("👤 User:", userName, userPhone);
    console.log("🎨 Artist:", artistName);

    const notifData = {
      id: createdApp._id.toString(),
      name: userName,
      phone: userPhone,
      date,
      time: scheduleDoc.start || "00:00",
      service: services.map((s) => s.service_name).join(", "),
      photo: fullUser?.photo || "",
      artist: artistName,
    };

    const notifCompany = {
      title: "Шинэ захиалга",
      body:
        advanceAmount === 0
          ? "Таны компанид шинэ захиалга ирлээ!"
          : "Таны компанид урьдчилгаатай захиалга ирлээ!",
      data: {
        type: advanceAmount === 0 ? "appointment" : "advancedPayment",
        ...notifData,
      },
    };

    if (company.firebase_token) {
      await sendFirebaseNotification({
        ...notifCompany,
        token: company.firebase_token,
      });
      await Notification.create({
        title: notifCompany.title,
        body: notifCompany.body,
        data: notifCompany.data,
        companyId: company._id,
        appointmentId: createdApp._id,
      });
      console.log("📲 Firebase sent to Company:", company.name);
    }

    const notifArtist = {
      title: "Танд шинэ захиалга ирлээ",
      body: `Хэрэглэгч ${userName} ${services
        .map((s) => s.service_name)
        .join(", ")} үйлчилгээ захиаллаа.`,
      data: notifCompany.data,
    };

    if (scheduleDoc.artistId?.firebase_token) {
      await sendFirebaseNotification({
        ...notifArtist,
        token: scheduleDoc.artistId.firebase_token,
      });
      await Notification.create({
        title: notifArtist.title,
        body: notifArtist.body,
        data: notifArtist.data,
        companyId: company._id,
        artistId: scheduleDoc.artistId._id,
        appointmentId: createdApp._id,
      });
      console.log("📲 Firebase sent to Artist:", artistName);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(company._id.toString()).emit("newPendingAppointment", {
        _id: createdApp._id,
        serviceName: services.map((s) => s.service_name).join(", "),
        date,
      });
      console.log("📡 Socket event emitted → company room:", company._id);
    } else {
      console.log("⚠️ io object is undefined");
    }

    // 8) Response
    if (advanceAmount === 0) {
      console.log("✅ Returning pending (no advance) response.");
      return res.status(200).json({
        success: true,
        message: "Artist баталгаажуулалт хүлээгдэж байна",
        appointmentId: createdApp._id,
      });
    } else {
      console.log("💳 Creating QPay invoice for advance payment...");
      const duk = await axios.post(
        `http://localhost:9090/api/v1/qpay/${inv[0]._id}`,
        {},
        { headers: { Authorization: `Bearer ${req.token}` } }
      );
      console.log(
        "✅ QPay invoice created:",
        duk.data.invoice.sender_invoice_id
      );
      return res.status(200).json({
        success: true,
        data: duk.data.data,
        invoice: duk.data.invoice.sender_invoice_id,
      });
    }
  } catch (error) {
    // 🔐 DB unique index эвдэрвэл (давхар дарсан үед)
    if (error && error.code === 11000) {
      console.error("🛑 E11000 duplicate key (unique time slot) → 409");
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message:
          "⚠️ Энэ artist-ийн тухайн цаг аль хэдийн захиалагдсан байна. (DB guard)",
      });
    }

    console.error("❌ createPayment error:", error.message);
    await session.abortTransaction();
    session.endSession();
    return customResponse.error(res, error.message);
  }
});
