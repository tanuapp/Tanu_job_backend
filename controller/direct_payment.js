const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const Favourite = require("../models/favourite");
const asyncHandler = require("../middleware/asyncHandler");
const axios = require("axios"); // if CommonJS
const customResponse = require("../utils/customResponse");
const path = require("path");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");
const Notification = require("../models/notification");

const Customer = require("../models/customer");
const QRCode = require("qrcode");

exports.createPayment = asyncHandler(async (req, res, next) => {
  try {
    const { schedule, date } = req.body;

    console.log("📥 createPayment called");
    console.log("📅 Request body:", { schedule, date });
    console.log("🔐 Token:", req.token);
    console.log("👤 User ID:", req.userId);

    // Check for existing appointment
    const existing = await Appointment.findOne({
      schedule,
      date,
      status: { $in: ["paid", "pending"] },
    });

    if (existing) {
      console.log("⚠️ Existing appointment found:", existing._id);
      return res.status(400).json({
        success: false,
        message: "Тухайн цагт захиалга аль хэдийн үүссэн байна.",
      });
    }

    const scheduleDoc = await Schedule.findById(schedule)
      .populate("artistId")
      .populate({
        path: "serviceId",
        select:
          "service_name price companyId discount discountStart discountEnd",
        populate: {
          path: "companyId",
          model: "Company",
          select: "advancePayment firebase_token name ",
        },
      });

    console.log("📋 ScheduleDoc:", scheduleDoc);

    const services = scheduleDoc.serviceId;
    if (!Array.isArray(services) || services.length === 0) {
      console.log("❌ Үйлчилгээ олдсонгүй");
      return customResponse.error(res, "Үйлчилгээ олдсонгүй");
    }

    const company = services[0].companyId;
    if (!company) {
      console.log("❌ Компани олдсонгүй");
      return customResponse.error(res, "Компани олдсонгүй");
    }

    const totalPrice = services.reduce(
      (sum, s) => sum + parseFloat(s.price || 0),
      0
    );
    console.log("💵 Original total price:", totalPrice);

    // ✅ Хямдрал идэвхтэй эсэхийг шалгах
    let discountedTotalPrice = 0;

    services.forEach((service) => {
      const price = parseFloat(service.price || 0);

      let serviceFinalPrice = price;

      const discountActive =
        service.discountStart &&
        service.discountEnd &&
        new Date() >= new Date(service.discountStart) &&
        new Date() <= new Date(service.discountEnd);

      if (discountActive && service.discount) {
        const discountPercent = parseFloat(
          service.discount.replace(/[^0-9]/g, "")
        );
        if (!isNaN(discountPercent) && discountPercent > 0) {
          serviceFinalPrice = price * (1 - discountPercent / 100);
          console.log(
            `🏷️ Service ${service.service_name}: Discount ${discountPercent}%, discounted price: ${serviceFinalPrice}`
          );
        }
      }

      discountedTotalPrice += serviceFinalPrice;
    });

    const advancePercent = parseFloat(company.advancePayment || 0);
    const advanceAmount = Math.floor(
      (discountedTotalPrice * advancePercent) / 100
    );
    console.log("📅 Now:", new Date());
    console.log("📅 Discount start:", company.discountStart);
    console.log("📅 Discount end:", company.discountEnd);
    console.log("📅 discountedTotalPrice", discountedTotalPrice);

    console.log("💰 Advance percent:", advancePercent);
    console.log("💸 Advance amount:", advanceAmount);

    if (advanceAmount === 0) {
      console.log(
        "📣 Урьдчилгаа төлбөр 0 — Баталгаажуулалт руу шилжүүлж байна..."
      );

      const app = await Appointment.create({
        schedule,
        user: req.userId || null,
        date,
        finalPrice: discountedTotalPrice,
        company: company._id, // 🟢 компанийн ID хадгалж байна
      });

      // 📌 Save Favourite
      const alreadySaved = await Favourite.findOne({
        user: req.userId,
        company: company._id,
      });

      if (!alreadySaved) {
        await Favourite.create({
          user: req.userId,
          company: company._id,
        });
        console.log("💾 Company saved to favourites");
      } else {
        console.log("ℹ️ Company already in favourites");
      }

      // 📌 User info
      const fullUser = await Customer.findById(app.user);
      const userName = `${fullUser?.last_name || ""}`.trim() || "Захиалга";
      const userPhone = fullUser?.phone || "";

      // 📌 Company notification payload
      const notifPayloadCompany = {
        title: "Шинэ захиалга",
        body: "Таны компанид шинэ захиалга ирлээ!",
        data: {
          type: "appointment",
          id: app._id.toString(),
          name: userName,
          phone: userPhone,
          date,
          time: scheduleDoc.start || "00:00",
          service: services.map((s) => s.service_name).join(", "),
        },
      };

      if (company.firebase_token) {
        const notifResult = await sendFirebaseNotification({
          ...notifPayloadCompany,
          token: company.firebase_token,
        });
        console.log("📲 Firebase notification sent to company:", notifResult);

        await Notification.create({
          title: notifPayloadCompany.title,
          body: notifPayloadCompany.body,
          data: notifPayloadCompany.data,
          companyId: company._id,
          appointmentId: app._id,
        });
      }

      // 📌 Artist notification payload
      const notifPayloadArtist = {
        title: "Танд шинэ захиалга ирлээ",
        body: `Хэрэглэгч ${userName} ${services
          .map((s) => s.service_name)
          .join(", ")} үйлчилгээ захиаллаа.`,
        data: notifPayloadCompany.data,
      };

      if (scheduleDoc.artistId?.firebase_token) {
        console.log(
          "✌️ Artist firebase_token --->",
          scheduleDoc.artistId.firebase_token
        );

        const notifResultArtist = await sendFirebaseNotification({
          ...notifPayloadArtist,
          token: scheduleDoc.artistId.firebase_token,
        });
        console.log(
          "📲 Firebase notification sent to artist:",
          notifResultArtist
        );

        await Notification.create({
          title: notifPayloadArtist.title,
          body: notifPayloadArtist.body,
          data: notifPayloadArtist.data,
          companyId: company._id,
          artistId: scheduleDoc.artistId._id,
          appointmentId: app._id,
        });
      }

      // 📌 Socket event
      const io = req.app.get("io");
      if (io) {
        io.to(company._id.toString()).emit("newPendingAppointment", {
          _id: app._id,
          serviceName: services.map((s) => s.service_name).join(", "),
          date,
        });
        console.log("📢 Socket emitted to:", company._id.toString());
      } else {
        console.log("⚠️ io object is undefined");
      }

      return res.status(200).json({
        success: true,
        message: "Artist баталгаажуулалт хүлээгдэж байна",
        appointmentId: app._id,
      });
    }

    // ⚡ Урьдчилгаа байгаа бол үргэлжлүүлнэ
    const app = await Appointment.create({
      schedule,
      user: req.userId || null,
      date,
      finalPrice: discountedTotalPrice,
      company: company._id, // 🟢 энд компанийн ID-г хадгалж байна
      status: "advance",
    });
    const alreadySaved = await Favourite.findOne({
      user: req.userId,
      company: company._id,
    });

    if (!alreadySaved) {
      await Favourite.create({
        user: req.userId,
        company: company._id,
      });
      console.log("💾 Company saved to favourites");
    } else {
      console.log("ℹ️ Company already in favourites");
    }

    const fullUser = await Customer.findById(app.user);
    const userName = `${fullUser?.last_name || ""}`.trim() || "Үл мэдэгдэх";
    const userPhone = fullUser?.phone || "N/A";

    // 📌 Company notification payload
    const notifPayloadCompany = {
      title: "Шинэ захиалга",
      body: "Таны компанид шинэ захиалга ирлээ!",
      data: {
        type: "advancedPayment",
        id: app._id.toString(),
        name: userName,
        phone: userPhone,
        date,
        time: scheduleDoc.start || "00:00",
        service: services.map((s) => s.service_name).join(", "),
      },
    };

    if (company.firebase_token) {
      const notifResult = await sendFirebaseNotification({
        ...notifPayloadCompany,
        token: company.firebase_token,
      });
      console.log("📲 Firebase notification sent to company:", notifResult);

      // ✅ Notification DB-д хадгалах
      await Notification.create({
        title: notifPayloadCompany.title,
        body: notifPayloadCompany.body,
        data: notifPayloadCompany.data,
        companyId: company._id,
        appointmentId: app._id,
      });
    }

    // 📌 Artist notification payload
    const notifPayloadArtist = {
      title: "Танд шинэ захиалга ирлээ",
      body: `Хэрэглэгч ${userName} ${services
        .map((s) => s.service_name)
        .join(", ")} үйлчилгээ захиаллаа.`,
      data: notifPayloadCompany.data,
    };

    if (scheduleDoc.artistId?.firebase_token) {
      console.log(
        "✌️ Artist firebase_token --->",
        scheduleDoc.artistId.firebase_token
      );

      const notifResultArtist = await sendFirebaseNotification({
        ...notifPayloadArtist,
        token: scheduleDoc.artistId.firebase_token,
      });

      console.log(
        "📲 Firebase notification sent to artist:",
        notifResultArtist
      );

      // ✅ Notification DB-д хадгалах
      await Notification.create({
        title: notifPayloadArtist.title,
        body: notifPayloadArtist.body,
        data: notifPayloadArtist.data,
        companyId: company._id,
        artistId: scheduleDoc.artistId._id,
        appointmentId: app._id,
      });
    }

    const inv = await Invoice.create({
      amount: advanceAmount,
      appointment: app._id,
      isAdvance: true,
    });

    console.log("📄 Invoice created:", inv._id);

    // QPay рүү илгээх
    console.log("🌐 Sending to QPay:", {
      url: `http://localhost:9090/api/v1/qpay/${inv._id}`,
      token: req.token,
    });

    const duk = await axios.post(
      `http://localhost:9090/api/v1/qpay/${inv._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );

    console.log("✅ QPay success:", duk.data);

    return res.status(200).json({
      success: true,
      data: duk.data.data,
      invoice: duk.data.invoice.sender_invoice_id,
    });
  } catch (error) {
    console.error("❌ createPayment error:", error.message);
    return customResponse.error(res, error.message);
  }
});
