const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const asyncHandler = require("../middleware/asyncHandler");
const { default: axios } = require("axios");
const customResponse = require("../utils/customResponse");
const path = require("path");
const fs = require("fs");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");

const User = require("../models/user");
const QRCode = require("qrcode");

exports.completeAppointment = asyncHandler(async (req, res, next) => {
  console.log("Complete appointment called, req.params.id:", req.params.id);
  console.log("Complete body:", req.body);
  const appointmentId = req.params.id;

  const app = await Appointment.findById(appointmentId).populate({
    path: "schedule",
    populate: {
      path: "serviceId",
      populate: {
        path: "companyId",
        select: "advancePayment",
      },
    },
  });

  // if (!app) return customResponse.error(res, "Захиалга олдсонгүй");

  const service = app.schedule.serviceId;
  const company = service.companyId;

  if (!service || !company)
    return res
      .status(400)
      .json({ success: false, message: "Холбогдсон мэдээлэл дутуу байна" });

  const total = parseFloat(service.price);
  const advancePercent = parseFloat(company.advancePayment || 0);
  const advance = Math.floor((total * advancePercent) / 100);
  const remaining = total - advance;

  // Invoice үүсгэнэ – үлдэгдэл төлбөрөөр
  const invoice = await Invoice.create({
    appointment: app._id,
    companyId: company._id,
    amount: remaining,
    isOption: false,
  });

  // QPay рүү илгээх
  const response = await axios.post(
    `http://localhost:9090/api/v1/qpay/${invoice._id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    }
  );
  // Захиалгыг "completed" болгох
  res.status(200).json({
    success: true,
    message: "Үйлчилгээ амжилттай дууссан. Үлдэгдэл төлбөрийг үүсгэлээ.",
    qpay: response.data.data,
    invoiceId: response.data.invoice.sender_invoice_id,
  });
});

exports.createPayment = asyncHandler(async (req, res, next) => {
  try {
    const { schedule, date } = req.body;

    // schedule -> serviceId -> companyId (+advancePayment)
    const scheduleDoc = await Schedule.findById(schedule).populate({
      path: "serviceId",
      populate: {
        path: "companyId",
        model: "Company",
        select: "advancePayment",
      },
    });

    const service = scheduleDoc.serviceId;
    const company = service.companyId;

    if (!service || !company) {
      return customResponse.error(res, "Үйлчилгээ болон компани олдсонгүй");
    }

    const price = parseFloat(service.price);
    const advancePercent = parseFloat(company.advancePayment || 0);
    const advanceAmount = Math.floor((price * advancePercent) / 100);

    // ⚠️ Хэрэв урьдчилгаа 0 бол баталгаажуулалт руу шилжүүлнэ
    if (advanceAmount === 0) {
      const app = await Appointment.create({
        schedule,
        user: req.userId || null,
        date,
        status: "pending", // Түр баталгаажуулаагүй төлөв
      });

      const user = await User.findById(req.userId); // ❗ userId биш req.userId
      if (user?.firebase_token) {
        await sendFirebaseNotification({
          title: "Шинэ захиалга",
          body: "Таны захиалгыг хүлээн авлаа!",
          token: user.firebase_token,
          data: {
            type: "appointment",
            id: app._id.toString(),
          },
        });
      }

      const io = req.app.get("io");
      if (!io) {
        console.log("❌ io object is undefined!");
      } else {
        console.log("✅ io object is ready!");
      }
      if (app && app._id && service?.companyId?._id) {
        io.to(service.companyId._id.toString()).emit("newPendingAppointment", {
          _id: app._id,
          serviceName: service.name,
          date,
        });
        console.log(
          "📢 Socket emit: newPendingAppointment to",
          service.companyId._id.toString()
        );
      }
      // 1 минутын дараа автоматаар устгах (баталгаажаагүй бол)
      setTimeout(async () => {
        const checkApp = await Appointment.findById(app._id);
        if (checkApp && checkApp.status === "pending") {
          await Appointment.findByIdAndDelete(app._id);
          console.log(
            `⏱️ Appointment ${app._id} artist баталгаажаагүй тул устлаа.`
          );
        }
      }, 60000); // 60 секунд

      return res.status(200).json({
        success: true,
        message: "Artist баталгаажуулалт хүлээгдэж байна",
        appointmentId: app._id,
      });
    }

    // ⚡ Урьдчилгаа байгаа бол appointment үүсгээд үргэлжлүүлнэ
    const app = await Appointment.create({
      schedule,
      user: req.userId || null,
      date,
    });

    // QR код үүсгэх
    const qrData = `Appointment ID: ${app._id}\nDate: ${app.date}\nUser ID: ${app.user}`;
    const qrFilePath = path.join(
      __dirname,
      "../public/uploads/",
      `${app._id}-qr.png`
    );
    await QRCode.toFile(qrFilePath, qrData);
    app.qr = `${app._id}-qr.png`;
    await app.save();

    // Invoice үүсгэх
    const inv = await Invoice.create({
      amount: advanceAmount,
      appointment: app._id,
      isAdvance: true,
    });

    // QPay рүү илгээх
    const duk = await axios.post(
      `http://localhost:9090/api/v1/qpay/${inv._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );

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
