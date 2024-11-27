const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const Schedule = require("../models/schedule");
const Invoice = require("../models/invoice");
const asyncHandler = require("../middleware/asyncHandler");
const { default: axios } = require("axios");

exports.createPayment = asyncHandler(async (req, res, next) => {
  try {
    const { schedule, date } = req.body;
    const { serviceId } = await Schedule.findById(schedule).populate(
      "serviceId"
    );
    const app = await Appointment.create({
      schedule,
      user: req.userId,
      date,
    });
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

    res.status(200).json({
      success: true,
      data: duk.data.data,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
