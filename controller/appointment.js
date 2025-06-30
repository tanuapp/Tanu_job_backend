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

function mergeIntervals(intervals) {
  if (!intervals.length) return [];

  // start цагийн дагуу эрэмбэлэх
  intervals.sort((a, b) => a.start.localeCompare(b.start));
  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const current = intervals[i];

    if (current.start <= last.end) {
      // Давхцаж байвал merge
      last.end = current.end > last.end ? current.end : last.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

exports.getBookedTimesForArtist = asyncHandler(async (req, res) => {
  const { date, artist } = req.query;

  if (!date || !artist) {
    return res.status(400).json({
      success: false,
      message: "date болон artist шаардлагатай",
    });
  }

  // зөвхөн тухайн artist-ийн schedule бүхий paid appointments
  const appointments = await Appointment.find({
    date: date,
    status: "paid",
  }).populate({
    path: "schedule",
    match: { artistId: artist },
  });

  const validAppointments = appointments.filter((a) => a.schedule != null);

  const rawIntervals = validAppointments.map((a) => ({
    start: a.schedule.start,
    end: a.schedule.end,
  }));

  const merged = mergeIntervals(rawIntervals);

  return customResponse.success(res, merged);
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
    const io = req.app.get("io");
    console.log("📥 [CREATE] Appointment POST ирсэн");
    console.log("🧾 Request Body:", req.body);
    console.log("🔑 User ID from token:", req.userId);

    const { schedule, isOption } = req.body;

    // Schedule шалгах
    const sch = await Schedule.findById(schedule);
    console.log("🗓️ Fetched Schedule:", sch);

    // Захиалга үүсгэх өгөгдөл
    const appointmentData = {
      ...req.body,
      user: req.userId,
      company: sch?.companyId ? sch.companyId : null,
    };
    console.log("🛠️ Appointment Data to Create:", appointmentData);

    // Хувийн захиалгууд байгаа эсэхийг шалгах
    const existingAppointments = await Model.find({
      date: req.body.date,
      schedule: req.body.schedule,
      status: "paid",
    });
    console.log("🔍 Existing Paid Appointments:", existingAppointments);

    const mgl = existingAppointments.filter(
      (item) => item.option != null && item.option != undefined
    );

    if (
      existingAppointments.length > 0 &&
      existingAppointments.length != mgl.length
    ) {
      console.log("❌ Захиалгын зөрчилтэй бүртгэл байна");
      return customResponse.error(res, "Өөр захиалга үүссэн байна ");
    }

    // Захиалга үүсгэх
    const appointment = await Model.create(appointmentData);
    console.log("✅ Created Appointment:", appointment);

    // QR Code үүсгэх
    const qrData = `Appointment ID: ${appointment._id}\nDate: ${appointment.date}\nUser ID: ${appointment.user}`;
    const qrFilePath = path.join(
      __dirname,
      "../public/uploads/",
      `${appointment._id}-qr.png`
    );

    await QRCode.toFile(qrFilePath, qrData);
    console.log("🖨️ QR code saved:", qrFilePath);

    appointment.qr = `${appointment._id}-qr.png`;
    await appointment.save();
    console.log("📌 Appointment updated with QR");

    // Socket ба Firebase Push
    if (appointment.status === "pending" && sch?.companyId) {
      io.to(sch.companyId.toString()).emit(
        "newPendingAppointment",
        appointment
      );
      console.log(
        "📢 Socket sent: newPendingAppointment ->",
        sch.companyId.toString()
      );

      const company = await Company.findById(sch.companyId);
      console.log("🏢 Company found:", company?.name);
      console.log("📲 FCM Token:", company?.fcmToken);

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
        console.log("📨 Firebase push илгээгдсэн");
      }
    }

    return customResponse.success(res, appointment);
  } catch (error) {
    console.error("🔥 Error in create appointment:", error);
    return customResponse.error(res, error.message);
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
exports.updateAppointmentTime = asyncHandler(async (req, res) => {
  console.log("🔧 [updateAppointmentTime] Request received");
  const { id } = req.params;
  const { schedule } = req.body;

  console.log("🔔 [updateAppointmentTime] Called with ID:", id);
  console.log("📝 Request schedule data:", schedule);

  if (!schedule || !schedule.start || !schedule.end || !schedule.artistId) {
    console.error("❌ Missing required schedule fields:", schedule);
    return customResponse.error(
      res,
      "schedule.start, schedule.end, schedule.artistId шаардлагатай"
    );
  }

  // Захиалга шалгах
  const appointment = await Appointment.findById(id).populate("schedule");
  if (!appointment) {
    console.error("❌ Appointment not found for ID:", id);
    return customResponse.error(res, "Захиалга олдсонгүй");
  }

  console.log("✅ Found appointment:", appointment._id);

  // duration-г шинэ start ба end дээр үндэслэн тооцно
  const [startH, startM] = schedule.start.split(":").map(Number);
  const [endH, endM] = schedule.end.split(":").map(Number);

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;
  const duration = endTotalMinutes - startTotalMinutes;

  if (duration <= 0) {
    console.error("❌ Invalid duration calculated:", duration);
    return customResponse.error(
      res,
      "Эхлэх цаг нь дуусах цагаас өмнө байх ёстой"
    );
  }

  console.log(`⏱ Calculated duration: ${duration} minutes`);

  // Schedule шинэчлэх эсвэл үүсгэх
  let scheduleDoc;
  if (appointment.schedule) {
    console.log("✏️ Updating existing schedule:", appointment.schedule._id);
    scheduleDoc = await Schedule.findByIdAndUpdate(
      appointment.schedule._id,
      {
        start: schedule.start,
        end: schedule.end,
        artistId: schedule.artistId,
        duration, // ✨ duration-г хадгална
      },
      { new: true }
    );
  } else {
    console.log("➕ Creating new schedule...");
    scheduleDoc = await Schedule.create({
      start: schedule.start,
      end: schedule.end,
      artistId: schedule.artistId,
      duration, // ✨ хадгална
      companyId: appointment.company,
    });
    appointment.schedule = scheduleDoc._id;
  }

  await appointment.save();
  console.log("✅ Appointment saved with updated schedule");

  return customResponse.success(res, {
    message: "Захиалгын цаг амжилттай шинэчлэгдлээ",
    appointment,
    schedule: scheduleDoc,
  });
});

exports.getAvailableTimesAdmin = asyncHandler(async (req, res, next) => {
  const { date, artist } = req.body;
  console.log("getAvailableTimesAdmin:", { date, artist });

  if (!date || !artist) {
    return res.status(400).json({
      success: false,
      message: "Date and artist are required",
    });
  }

  const schedules = await Schedule.find({ artistId: artist }).populate(
    "serviceId"
  );
  const appointments = await Appointment.find({
    date,
    status: "paid",
    "schedule.artistId": artist,
  }).populate("schedule");

  if (!schedules || schedules.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No schedules found for this artist",
    });
  }

  // Захиалсан цагуудын жагсаалт гаргах
  const bookedTimes = appointments.map((appt) => {
    return {
      start: appt.schedule.start,
      end: appt.schedule.end,
    };
  });

  // Utility function to get minutes
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const toTimeString = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Хоосон цагаар интервал үүсгэх
  let availableSlots = [];

  for (const schedule of schedules) {
    const serviceDuration = schedule.serviceId.duration || 20;

    let startMins = toMinutes(schedule.start);
    const endMins = toMinutes(schedule.end);

    while (startMins + serviceDuration <= endMins) {
      const slotStart = toTimeString(startMins);
      const slotEnd = toTimeString(startMins + serviceDuration);

      const overlaps = bookedTimes.some((bt) => {
        const btStart = toMinutes(bt.start);
        const btEnd = toMinutes(bt.end);
        return (
          (startMins >= btStart && startMins < btEnd) ||
          (startMins + serviceDuration > btStart &&
            startMins + serviceDuration <= btEnd)
        );
      });

      if (!overlaps) {
        availableSlots.push({ start: slotStart, end: slotEnd });
      }

      startMins += 5; // 5 мин интервал
    }
  }

  customResponse.success(res, availableSlots);
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
    console.log("📌 Step 1 - Logged-in User ID (artistId):", artistId);

    // 1. Artist хэрэглэгчийн мэдээлэл (admin login байж болно)
    const artistUser = await AdminAppointment.findById(artistId).populate(
      "userRole"
    );
    console.log(
      "📌 Step 2 - ArtistUser object:",
      JSON.stringify(artistUser, null, 2)
    );

    if (!artistUser || !artistUser.userRole || !artistUser.userRole.user) {
      console.error("❌ Step 3 - Missing user role or user information");
      return customResponse.error(
        res,
        "Хэрэглэгчийн эрхийн мэдээлэл дутуу байна"
      );
    }

    const realUserId = artistUser.userRole.user;
    console.log("✅ Step 4 - Real user ID from userRole:", realUserId);

    // 2. Компанийн мэдээлэл олно
    const company = await Company.findOne({ companyOwner: realUserId });
    console.log("📌 Step 5 - Company info:", JSON.stringify(company, null, 2));

    if (!company) {
      console.error("❌ Step 6 - Company not found");
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    // 3. Компанийн artists жагсаалт
    const artist = await Artist.find({ companyId: company._id });
    console.log(
      "📌 Step 7 - Company artists:",
      JSON.stringify(artist, null, 2)
    );

    // 4. Захиалгуудыг авах
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

    console.log("📌 Step 8 - All appointments count:", allAppointments.length);

    // 5. Зөвхөн тухайн компанийн захиалгуудыг шүүж авах
    const appointments = allAppointments.filter(
      (a) => a.schedule?.companyId?._id?.toString() === company._id.toString()
    );
    console.log(
      "📌 Step 9 - Filtered company appointments count:",
      appointments.length
    );

    // 6. Pending төлөвтэй захиалгууд
    const pendingAppointments = appointments.filter(
      (a) => a.status === "pending"
    );
    console.log(
      "🟡 Step 10 - Pending appointments count:",
      pendingAppointments.length
    );
    console.log(
      "🟡 Step 11 - Pending Appointments (IDs):",
      pendingAppointments.map((p) => p._id.toString())
    );

    // 7. Хариу буцаах
    console.log("✅ Step 12 - Returning final response");
    return res.status(200).json({
      success: true,
      data: appointments,
      company,
      artist,
    });
  } catch (error) {
    console.error("❌ Step 13 - Error occurred:", error);
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
