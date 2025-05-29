const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const asyncHandler = require("../middleware/asyncHandler");
const { default: axios } = require("axios");
const customResponse = require("../utils/customResponse");
const path = require("path");
const fs = require("fs");
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

    // schedule -> serviceId -> companyId (+advancepayment)
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

    const price = parseFloat(service.price); // нийт үнэ
    const advancePercent = parseFloat(company.advancePayment || 0); // хувь
    const advanceAmount = Math.floor((price * advancePercent) / 100); // урьдчилгаа

    // Appointment үүсгэнэ
    const app = await Appointment.create({
      schedule,
      user: req.userId || null,
      date,
    });

    // QR код үүсгэнэ
    const qrData = `Appointment ID: ${app._id}\nDate: ${app.date}\nUser ID: ${app.user}`;
    const qrFilePath = path.join(
      __dirname,
      "../public/uploads/",
      `${app._id}-qr.png`
    );
    await QRCode.toFile(qrFilePath, qrData);

    app.qr = `${app._id}-qr.png`;
    await app.save();
    console.log("advanceAmount", advanceAmount);

    console.log("QR код амжилттай үүссэн:", qrFilePath);
    // Invoice үүсгэнэ – урьдчилгаа төлбөрөөр
    const inv = await Invoice.create({
      amount: advanceAmount,
      appointment: app._id,
    });
    console.log(" invoice:", inv);
    console.log(" invoice:", inv);

    // QPay рүү илгээх
    const duk = await axios.post(
      "http://localhost:9090/api/v1/qpay/" + inv._id,
      {},
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );

    res.status(200).json({
      success: true,
      data: duk.data.data,
      invoice: duk.data.invoice.sender_invoice_id,
    });
  } catch (error) {
    console.error(error);
    customResponse.error(res, error.message);
  }
});
