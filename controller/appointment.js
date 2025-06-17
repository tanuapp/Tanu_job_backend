const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const customResponse = require("../utils/customResponse");
const Schedule = require("../models/schedule");
const User = require("../models/customer");
const AdminAppointment = require("../models/user");
const Artist = require("../models/artist");
const Dayoff = require("../models/dayoff");
const path = require("path");
const fs = require("fs");
const apnService = require("../utils/apnService");
const QRCode = require("qrcode");
const asyncHandler = require("../middleware/asyncHandler");
const { generateCredential, send } = require("../utils/khan");
const Company = require("../models/company");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");
const cron = require("node-cron");
const moment = require("moment");

// ✅ Автоматаар expired appointment-уудыг decline болгох
cron.schedule("*/1 * * * *", async () => {
  console.log("⏰ Checking expired appointments...");

  const today = moment().format("YYYY-MM-DD");
  const nowTime = moment();

  const appointments = await Appointment.find({
    date: today,
    status: { $in: ["pending", "paid"] },
  }).populate("schedule");

  let declinedCount = 0;

  for (const appt of appointments) {
    const schedule = appt.schedule;
    if (!schedule || !schedule.end) continue;

    const endTime = moment(`${today} ${schedule.end}`, "YYYY-MM-DD HH:mm");

    if (nowTime.isAfter(endTime)) {
      appt.status = "declined";
      await appt.save();
      declinedCount++;
    }
  }

  if (declinedCount > 0) {
    console.log(`❗ ${declinedCount} захиалга хугацаа дууссан тул цуцлагдлаа`);
  } else {
    console.log("✅ Цуцлах шаардлагатай захиалга байхгүй");
  }
});

exports.markCompleted = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    "userId"
  );

  if (appointment.status === "completed") {
    return customResponse.error(res, "Үйлчилгээ дууслаа ");
  }

  appointment.status = "completed";
  await appointment.save();

  // 🔔 Push мэдэгдэл явуулах (iOS хэрэглэгчид)
  const user = appointment.userId;
  if (user && user.isAndroid === false && user.firebase_token) {
    const message = `${user.name} таны ${appointment.serviceName} үйлчилгээ амжилттай дууслаа!`;
    await apnService.sendNotification([user.firebase_token], message); // APN push
  }

  return customResponse.success(res, "Үйлчилгээ амжилттай дууслаа");
});

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
    const decline = await Appointment.findById(req.params.id).populate(
      "schedule"
    );
    console.log("decline", decline);
    if (!decline) {
      return customResponse.error(res, "Захиалга олдсонгүй");
    }

    if (decline.status === "pending") {
      return customResponse.error(res, "Таны захиалга баталгаажаагүй байна");
    }

    // Захиалгын статусыг declined болгоно
    decline.status = "declined";
    await decline.save();

    // ✨ isRescheduled = false байвал true болгож шинэчилнэ
    if (decline.schedule && decline.schedule.isRescheduled === false) {
      // 1. isRescheduled = true болгож шинэчлэх (эсвэл устгах)
      // await Schedule.findByIdAndUpdate(decline.schedule._id, {
      //   isRescheduled: true,
      // });

      // 2. ✨ Шууд устгах бол дараах мөр ашиглана:
      await Schedule.findByIdAndDelete(decline.schedule._id);
    }
    return customResponse.success(res, "Амжилттай цуцаллаа");
  } catch (error) {
    console.error("❌ Цуцлах үед алдаа:", error);
    customResponse.error(res, error.message || "Алдаа гарлаа");
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
    console.log("irlee2 bnshde");
    // const io = req.app.get("io");
    const io = req.app.get("io");
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
    if (appointment.status === "pending" && sch?.companyId) {
      io.to(sch.companyId.toString()).emit(
        "newPendingAppointment",
        appointment
      );
      console.log("📢 Sent socket: newPendingAppointment");

      // Firebase push
      const company = await Company.findById(sch.companyId);

      if (company?.fcmToken) {
        await sendFirebaseNotification({
          title: "Шинэ захиалга",
          body: `${appointment.serviceName} үйлчилгээ ${appointment.date} өдөр захиалагдлаа`,
          token: company.fcmToken,
          data: {
            type: "pending_appointment",
            appointmentId: appointment._id.toString(),
            userName: appointment.userName || "",
            userPhone: appointment.userPhone || "",
            date: appointment.date,
            time: appointment.start,
            serviceName: appointment.serviceName,
          },
        });
      }
    }
    console.log("📢company.fcmToken", company.fcmToken);

    customResponse.success(res, appointment);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getAvailableTimes = asyncHandler(async (req, res, next) => {
  console.log("bn", req.body);
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
  console.log(availableSchedules), "schedule";

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

    const filteredAppointments = appointments.filter((appointment) => {
      const artist = appointment.schedule?.artistId;
      const isCurrentArtist =
        artist && artist._id.toString() === artistId.toString();

      const isNotDone = appointment.status !== "done";

      return isCurrentArtist && isNotDone;
    });

    customResponse.success(res, filteredAppointments);
  } catch (error) {
    console.error("❌ Error fetching artist appointments:", error);
    customResponse.error(res, error.message || "Алдаа гарлаа");
  }
});
exports.getCompanyAppointments = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;

    // 1. Artist хэрэглэгчийн мэдээлэл (admin login байж болно)
    const artistUser = await AdminAppointment.findById(artistId).populate(
      "userRole"
    );

    if (!artistUser || !artistUser.userRole || !artistUser.userRole.user) {
      console.error("❌ Step 3 - Missing user role or user information");
      return customResponse.error(
        res,
        "Хэрэглэгчийн эрхийн мэдээлэл дутуу байна"
      );
    }

    const realUserId = artistUser.userRole.user;

    // 2. Компанийн мэдээлэл олно
    const company = await Company.findOne({ companyOwner: realUserId });

    if (!company) {
      console.error("❌ Step 6 - Company not found");
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    const artist = await Artist.find({ companyId: company._id });

    // 3. Компанийн захиалгуудыг авах
    const allAppointments = await Appointment.find()
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

    const appointments = allAppointments.filter(
      (a) => a.schedule?.companyId?._id?.toString() === company._id.toString()
    );
    const pendingAppointments = appointments.filter(
      (a) => a.status === "pending"
    );

    console.log(
      `🟡 Pending Appointments: ${JSON.stringify(pendingAppointments, null, 2)}`
    );

    // 4. ✅ Компанийн мэдээллийг appointment-уудтай хамт илгээх
    return res.status(200).json({
      success: true,
      data: appointments,
      company,
      artist, // 👈 нэмэлт компанийн мэдээлэл
    });
  } catch (error) {
    console.error("❌ Step 10 - Error occurred:", error);
    return customResponse.error(res, error.message || "Алдаа гарлаа");
  }
});

exports.checkAppointment = asyncHandler(async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return customResponse.error(res, "Захиалга олдсонгүй");
    }

    // Хэрвээ done болсон бол success true буцаана
    if (appointment.status === "done") {
      return customResponse.success(res, {
        message: "Төлбөр амжилттай хийгдсэн",
        status: "done",
        appointment,
      });
    }

    // done биш бол — төлбөр хараахан хийгдээгүй
    return customResponse.error(res, "Төлбөр хараахан баталгаажаагүй байна");
  } catch (error) {
    console.error("❌ checkAppointment алдаа:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// PUT /api/v1/appointment/cash/:id
exports.markCashPaid = asyncHandler(async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return customResponse.error(res, "Захиалга олдсонгүй");
    }

    appointment.status = "done";
    appointment.isCash = true; // Optionally mark as paid by cash
    await appointment.save();
    // 🔔 Push мэдэгдэл (iOS)
    const user = appointment.userId;
    if (user && user.isAndroid === false && user.firebase_token) {
      const message = `Бэлэн төлбөр амжилттай баталгаажлаа`;
      await apnService.sendNotification([user.firebase_token], message);
    }
    io.to(userSocketId).emit("paymentDone");

    return customResponse.success(res, {
      message: "Бэлэн төлбөр амжилттай баталгаажлаа",
      appointment,
    });
  } catch (error) {
    console.error("❌ markCashPaid алдаа:", error);
    customResponse.error(res, error.message || "Серверийн алдаа");
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

exports.updateStatus = asyncHandler(async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return customResponse.error(res, "Захиалга олдсонгүй");
    }

    if (appointment.status === "completed") {
      return customResponse.error(res, "Энэ захиалга аль хэдийн дууссан байна");
    }

    // Захиалгын статусыг дууссан болгох
    appointment.status = "completed";
    await appointment.save();
    io.to(userSocketId).emit("paymentDone");

    // markCompleted дуудаж үргэлжлүүлнэ
    return await exports.markCompleted(req, res);
  } catch (error) {
    console.error("❌ Алдаа:", error);
    return customResponse.error(res, error.message);
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

exports.confirmAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return res
      .status(404)
      .json({ success: false, message: "Appointment not found" });
  }

  if (appointment.status !== "pending") {
    return res
      .status(400)
      .json({ success: false, message: "Already confirmed or invalid status" });
  }

  appointment.status = "paid";
  await appointment.save();

  return res
    .status(200)
    .json({ success: true, message: "Appointment confirmed by artist" });
});

// Энд дуусаж байгаа шүүү
