const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const customResponse = require("../utils/customResponse");
// consrt
const Schedule = require("../models/schedule");
const User = require("../models/customer");
const Dayoff = require("../models/dayoff");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();

    customResponse.success(res, allUser);
    // res.status(200).json({
    //   success: true,
    //   count: total,
    //   data: allUser,
    // });
  } catch (error) {
    customResponse.error(res, error.message);
    // res.status(500).json({ success: false, message: error.message });
  }
});

exports.declineAppointment = asyncHandler(async (req, res, next) => {
  try {
    const decline = await Model.findById(req.params.id);
    if (decline.status == false) {
      customResponse.error(res, "Таны захиалга баталгаажаагүй байна");
    }
    decline.status = false;
    await decline.save();
    const user = await User.findById(decline.user);
    user.coupon++;
    await user.save();

    customResponse.success(res, "Амжилттай цуцлалаа");
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getAllPopulated = asyncHandler(async (req, res) => {
  try {
    // Fetch all users and populate related fields
    const allUser = await Model.find()
      .populate({
        path: "schedule",
        populate: [
          { path: "serviceId", model: "Service" },
          { path: "artistId", model: "Artist" },
        ],
      })
      .populate("user");

    // Filter users who have a populated schedule with a serviceId
    const filteredUsers = allUser.filter(
      (user) => user.schedule && user.schedule.serviceId
    );

    customResponse.success(res, filteredUsers);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const appointmentData = {
      ...req.body,
      user: req.userId,
    };

    const appointment = await Model.create(appointmentData);

    // Generate QR code data
    const qrData = `Appointment ID: ${appointment._id}\nDate: ${appointment.date}\nUser ID: ${appointment.user}`;

    // Define the file path for saving the QR code
    const qrFilePath = path.join(
      __dirname,
      "../public/uploads/",
      `${appointment._id}-qr.png`
    );

    // Generate and save the QR code image
    await QRCode.toFile(qrFilePath, qrData);

    // Update appointment with the QR code file path
    appointment.qr = `${appointment._id}-qr.png`;
    await appointment.save();

    customResponse.success(res, appointment);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getAvailableTimes = asyncHandler(async (req, res, next) => {
  try {
    const { date, service } = req.body;

    // Get all DayOffs for the provided date
    const dayOffs = await Dayoff.find({ date });

    // Extract artist IDs and schedules from DayOffs
    const dayOffArtistIds = dayOffs.map((dayOff) => String(dayOff.artistId));
    const dayOffSchedules = dayOffs.flatMap((dayOff) =>
      dayOff.schedule.map((scheduleId) => String(scheduleId))
    );

    // Find the selected day of the week
    const selectedDayOfWeek = new Date(date).toLocaleDateString("mn-MN", {
      weekday: "long",
    });

    // Fetch schedules for the selected day of the week and the specified service
    const schedules = await Schedule.find({
      day_of_the_week: selectedDayOfWeek,
      serviceId: service,
    })
      .populate("artistId")
      .populate("serviceId");

    // Fetch appointments for the date
    const appointments = await Appointment.find({
      date: date,
      status: true,
    });

    // If there are no schedules, return an empty array
    if (!schedules || schedules.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Filter schedules to exclude those with DayOff or booked appointments
    const availableSchedules = schedules.filter((schedule) => {
      const isArtistDayOff = dayOffArtistIds.includes(
        String(schedule.artistId._id)
      );
      const isScheduleDayOff = dayOffSchedules.includes(String(schedule._id));
      const isBooked = appointments.some(
        (appointment) => String(appointment.schedule) === String(schedule._id)
      );
      return !isArtistDayOff && !isScheduleDayOff && !isBooked;
    });

    customResponse.success(res, availableSchedules);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getAvailableTimesByArtist = asyncHandler(async (req, res, next) => {
  try {
    const { date, artistId } = req.body;

    const selectedDayOfWeek = new Date(date).toLocaleDateString("mn-MN", {
      weekday: "long",
    });

    const schedules = await Schedule.find({
      artistId,
      day_of_the_week: selectedDayOfWeek,
    });

    const appointments = await Appointment.find({
      date: date,
      status: true,
    });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No schedules found for this day",
      });
    }

    const availableSchedules = schedules.filter((schedule) => {
      const isBooked = appointments.some(
        (appointment) => String(appointment.schedule) === String(schedule._id)
      );
      return !isBooked;
    });

    customResponse.success(res, availableSchedules);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    customResponse.success(res, upDateUserData);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);

    customResponse.success(res, allText);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await Model.findByIdAndDelete(req.params.id, {
      new: true,
    });

    customResponse.success(res, deletePost);
  } catch (error) {
    customResponse.error(res, error.message);
  }
};

// Энд дуусаж байгаа шүүү
