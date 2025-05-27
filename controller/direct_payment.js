const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const asyncHandler = require("../middleware/asyncHandler");
const { default: axios } = require("axios");
const customResponse = require("../utils/customResponse");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
 
exports.createPayment = asyncHandler(async (req, res, next) => {
  try {
    const { schedule, date } = req.body;

    const { serviceId } = await Schedule.findById(schedule).populate(
      "serviceId"
    );
    const app = await Appointment.create({
      schedule,
      user: req.userId ? req.userId : null,
      date,
    });

    const qrData = `Appointment ID: ${app._id}\nDate: ${app.date}\nUser ID: ${app.user}`;

    // Define the file path for saving the QR code
    const qrFilePath = path.join(
      __dirname,
      "../public/uploads/",
      `${app._id}-qr.png`
    );

    // Generate and save the QR code image
    await QRCode.toFile(qrFilePath, qrData);

    // Update appointment with the QR code file path
    app.qr = `${app._id}-qr.png`;
    await app.save();

    const inv = await Invoice.create({
      amount: serviceId.price,
      appointment: app._id,
    });

    const duk = await axios.post(
      "http://localhost:9090/api/v1/qpay/" + inv._id,
      {},
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
        },
      }
    );
    console.log(duk.data);

    res.status(200).json({
      success: true,
      data: duk.data.data,
      invoice: duk.data.invoice.sender_invoice_id,
    });
  } catch (error) {
    console.log(error);
    customResponse.error(res, error.message);
  }
});
