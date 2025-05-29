const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const customResponse = require("../utils/customResponse");
const Schedule = require("../models/schedule");
const User = require("../models/customer");
const Dayoff = require("../models/dayoff");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const asyncHandler = require("../middleware/asyncHandler");
const { generateCredential, send } = require("../utils/khan");
const Company = require("../models/company");

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
exports.getBookedTimesForArtist = asyncHandler(async (req, res) => {
  const { date, artist } = req.query;

  if (!date || !artist) {
    return res.status(400).json({
      success: false,
      message: "date болон artist шаардлагатай",
    });
  }

  // paid захиалгуудыг олно
  const appointments = await Appointment.find({
    date: date,
    status: "paid",
  }).populate({
    path: "schedule",
    match: { artistId: artist }, // зөвхөн тухайн artist-ынх
  });

  // 🔍 зөвхөн schedule байгаа захиалгууд
  const validAppointments = appointments.filter((a) => a.schedule != null);

  const startTimes = validAppointments.map((a) => a.schedule.start);
  console.log("startTimes", startTimes);
  return customResponse.success(res, startTimes);
});

exports.declineAppointment = asyncHandler(async (req, res, next) => {
  try {
    const decline = await Model.findById(req.params.id);
    if (decline.status == "pending") {
      customResponse.error(res, "Таны захиалга баталгаажаагүй байна");
    }
    decline.status = "declined";
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
    const allUser = await Model.find({
      status: { $in: ["paid", "completed"] },
    })
      .populate({
        path: "schedule",
        populate: [
          { path: "serviceId", model: "Service" },
          { path: "artistId", model: "Artist" },
          { path: "companyId", model: "Company" },
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
    // const io = req.app.get("io");

    const { schedule, isOption } = req.body;

    if (!schedule && !isOption) {
      customResponse.error(res, "Захиалга хийх хуваарь оруулна уу");
    }

    const sch = await Schedule.findById(schedule);

    const appointmentData = {
      ...req.body,
      user: req.userId,
      company: sch?.companyId ? sch?.companyId : null,
    };

    const p = await Model.find({
      date: req.body.date,
      schedule: req.body.schedule,
      status: "paid",
    });

    console.log(p);

    const mgl = p.filter(
      (item) => item.option != null && item.option != undefined
    );

    if (p.length > 0 && p.length != mgl.length) {
      customResponse.error(res, "Өөр захиалга үүссэн байна ");
    }

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
  const { date, service, artist } = req.body;

  if (!date || !service || !artist) {
    return res.status(400).json({
      success: false,
      message: "Date and service, artist are required",
    });
  }

  const selectedDayOfWeek = new Date(date).toLocaleDateString("mn-MN", {
    weekday: "long",
  });

  const dayOffs = await Dayoff.find({ date });

  const dayOffArtistIds = dayOffs.map((dayOff) => String(dayOff.artistId));
  const dayOffSchedules = dayOffs.flatMap((dayOff) =>
    dayOff.schedule.map((scheduleId) => String(scheduleId))
  );
  const schedules = await Schedule.find({
    day_of_the_week: selectedDayOfWeek,
    serviceId: service,
    artistId: artist,
  })
    .populate("artistId")
    .populate("serviceId");
  const appointments = await Appointment.find({
    date: date,
    status: "paid",
  });
  if (!schedules || schedules.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No schedules found for this day",
    });
  }
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
        message: "No schedules found for this day 1111",
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

exports.endAppointment = asyncHandler(async (req, res, next) => {
  try {
    const token = await generateCredential();

    await send(token, "5925589985", "Дөлгөөн", "050000", 100, "hello ");

    customResponse.success(res, "Амжилттай цуцлалаа");
  } catch (error) {
    console.log(error);
    customResponse.error(res, error);
  }
});
exports.getArtistAppointments = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;
    // console.log("Artist12 ID:", artistId); // ⬅️ энэ аль хэдийн байна

    const appointments = await Appointment.find({
      status: { $ne: "pending" },
    })
      .populate({
        path: "schedule",
        populate: [
          { path: "serviceId", model: "Service" },
          { path: "artistId", model: "Artist" },
          { path: "companyId", model: "Company" },
        ],
      })
      .populate("user")
      .populate("company");

    // 🔽 ЭНЭ ХЭСГИЙН ОРЛОНД DEBUG-КОДОО ХИЙ
    const filteredAppointments = appointments
      .map((appointment) => {
        const artist = appointment.schedule?.artistId;
        // console.log("==>", {
        //   appointmentId: appointment._id,
        //   schedule: appointment.schedule?._id,
        //   artistId: artist?._id,
        //   match: artist && artist._id.toString() === artistId,
        // });
        return appointment;
      })
      .filter((appointment) => {
        const artist = appointment.schedule?.artistId;
        return artist && artist._id.toString() === artistId;
      });

    // 🔽 Үр дүнг буцаана
    customResponse.success(res, filteredAppointments);
  } catch (error) {
    console.error("❌ Error fetching artist appointments:", error);
    customResponse.error(res, error.message || "Алдаа гарлаа");
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
