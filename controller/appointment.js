const Model = require("../models/appointment");
const Appointment = require("../models/appointment");
const customResponse = require("../utils/customResponse");
const Schedule = require("../models/schedule");
const employeeSchedule = require("../models/employeeSchedule");
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
    status: { $in: ["paid", "pending"] },
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
      status: { $in: ["pending", "paid", "completed"] },
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
  const { date, service, artist } = req.body;

  console.log("▶️ Incoming request body:", { date, service, artist });

  if (!date || !service || !artist) {
    return res.status(400).json({
      success: false,
      message: "Date, service, artist бүгд шаардлагатай.",
    });
  }

  // Сонгосон огнооны эхлэл, төгсгөлийн цагийг өдөр бүхэлд нь хамруулж тохируулна
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  console.log("📅 Searching schedules on:", dayStart.toISOString());

  // 🔥 Тухайн өдөрт амралтын өдрүүдийг шалгах
  const dayOffs = await Dayoff.find({
    date: { $gte: dayStart, $lte: dayEnd },
  });
  console.log("📆 Dayoffs found:", dayOffs.length);

  const dayOffArtistIds = dayOffs.map((dayOff) => String(dayOff.artistId));
  const dayOffSchedules = dayOffs.flatMap((dayOff) =>
    dayOff.schedule.map((scheduleId) => String(scheduleId))
  );

  console.log("🚫 Artists on day off:", dayOffArtistIds);
  console.log("🚫 Schedule IDs on day off:", dayOffSchedules);

  // ✅ Тухайн өдөр artist-д тохирох schedule-г хайна
  const schedules = await employeeSchedule
    .find({
      artistId: artist,
      date: { $gte: dayStart, $lte: dayEnd },
      serviceId: { $in: Array.isArray(service) ? service : [service] },
    })
    .populate("artistId")
    .populate("serviceId");

  console.log("✅ Found schedules:", schedules.length);

  // 🔍 Тухайн өдөр төлөгдсөн захиалгуудыг хайж авах
  const appointments = await Appointment.find({
    date: { $gte: dayStart, $lte: dayEnd },
    status: "paid",
  });
  console.log("📅 Appointments on date:", appointments.length);

  if (!schedules || schedules.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Тухайн өдөрт тохирох хуваарь олдсонгүй.",
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

  console.log(
    "✅ Available schedules after filtering:",
    availableSchedules.length
  );

  customResponse.success(res, availableSchedules);
});

exports.updateAppointmentTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, schedule } = req.body; // ⬅ name-ийг авна

  console.log("🔔 [updateAppointmentTime] Called with ID:", id);
  console.log("📝 Request name:", name);
  console.log("📝 Request schedule data:", schedule);

  if (!schedule || !schedule.start || !schedule.end || !schedule.artistId) {
    return customResponse.error(
      res,
      "schedule.start, schedule.end, schedule.artistId шаардлагатай"
    );
  }

  const appointment = await Appointment.findById(id).populate("schedule");
  if (!appointment) {
    return customResponse.error(res, "Захиалга олдсонгүй");
  }

  // 🆕 name-ийг шинэчилнэ
  if (name) {
    appointment.name = name;
  }

  // duration тооцно
  const [startH, startM] = schedule.start.split(":").map(Number);
  const [endH, endM] = schedule.end.split(":").map(Number);
  const duration = endH * 60 + endM - (startH * 60 + startM);

  if (duration <= 0) {
    return customResponse.error(
      res,
      "Эхлэх цаг нь дуусах цагаас өмнө байх ёстой"
    );
  }

  let scheduleDoc;
  if (appointment.schedule) {
    scheduleDoc = await Schedule.findByIdAndUpdate(
      appointment.schedule._id,
      {
        start: schedule.start,
        end: schedule.end,
        artistId: schedule.artistId,
        duration,
      },
      { new: true }
    );
  } else {
    scheduleDoc = await Schedule.create({
      start: schedule.start,
      end: schedule.end,
      artistId: schedule.artistId,
      duration,
      companyId: appointment.company,
    });
    appointment.schedule = scheduleDoc._id;
  }

  await appointment.save();
  return customResponse.success(res, {
    message: "Захиалга амжилттай шинэчлэгдлээ",
    appointment,
    schedule: scheduleDoc,
  });
});

exports.updateAppointmentSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Body энгийн эсвэл schedule дотор ирж болно — хоёуланг дэмжиж авна
  const endFromBody =
    (req.body && req.body.end) ||
    (req.body && req.body.schedule && req.body.schedule.end);

  if (!endFromBody) {
    return customResponse.error(res, "end (HH:mm) шаардлагатай");
  }

  // 1) Захиалга олох (schedule-той нь)
  const appointment = await Appointment.findById(id).populate("schedule");
  if (!appointment) {
    return customResponse.error(res, "Захиалга олдсонгүй");
  }
  if (!appointment.schedule) {
    return customResponse.error(res, "Schedule олдсонгүй (сунгах боломжгүй)");
  }

  const scheduleDoc = appointment.schedule;
  const start = scheduleDoc.start; // "HH:mm" гэж үзэж байна
  const end = endFromBody; // шинэ төгсгөл

  // 2) Формат энгийн шалгалт (HH:mm)
  const isValidHHmm = (str) => /^\d{2}:\d{2}$/.test(str);
  if (!isValidHHmm(start) || !isValidHHmm(end)) {
    return customResponse.error(res, "Цагийн формат HH:mm байх ёстой");
  }

  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;

  if (endMin <= startMin) {
    return customResponse.error(
      res,
      "Дуусах цаг нь эхлэх цагаас ХОЙШ (алдаагүй) байх ёстой"
    );
  }

  // 3) (СОНГОЛТ) Давхцлын энгийн шалгалт — ижил artist, ижил өдөр, өөр appointment-уудтай
  const simpleOverlapCheck = true; // хэрэггүй бол false болгоорой
  if (simpleOverlapCheck) {
    const sameDayAppts = await Appointment.find({
      _id: { $ne: appointment._id },
      date: appointment.date, // танайд yyyy-MM-dd гэж хадгалдаг
      status: { $in: ["paid", "pending"] },
    }).populate({
      path: "schedule",
      match: { artistId: scheduleDoc.artistId },
      select: "start end",
    });

    // schedule-тэй бичлэгүүд л шалгана
    const conflicts = (sameDayAppts || [])
      .filter((a) => a.schedule)
      .some((a) => {
        const [aSH, aSM] = a.schedule.start.split(":").map(Number);
        const [aEH, aEM] = a.schedule.end.split(":").map(Number);
        const aStart = aSH * 60 + aSM;
        const aEnd = aEH * 60 + aEM;
        // [startMin, endMin) vs [aStart, aEnd) давхцаж байна уу?
        return endMin > aStart && aEnd > startMin;
      });

    if (conflicts) {
      return customResponse.error(
        res,
        "Энэ сунгалт өөр цагтай давхцаж байна. (Өдрийн өөр appointment-уудтай давхцаж болохгүй)"
      );
    }
  }

  // 4) duration-ыг дахин тооцоод schedule-аа шинэчилнэ
  const newDuration = endMin - startMin;

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    scheduleDoc._id,
    { end, duration: newDuration },
    { new: true }
  );

  // 5) Амжилттай
  return customResponse.success(res, {
    message: "Дуусах цаг амжилттай шинэчлэгдлээ",
    appointment: {
      _id: appointment._id,
      date: appointment.date,
      status: appointment.status,
    },
    schedule: updatedSchedule,
  });
});

exports.getAvailableTimesAdmin = asyncHandler(async (req, res, next) => {
  const { date, artist } = req.body;

  console.log("[DEBUG] getAvailableTimesAdmin started");
  console.log("[DEBUG] Request params:", { date, artist });

  if (!date || !artist) {
    console.error("[ERROR] Missing date or artist parameter");
    return res.status(400).json({
      success: false,
      message: "date болон artist шаардлагатай",
    });
  }

  try {
    // Тухайн өдрийн төлбөртэй appointment-уудыг авч байна
    const appointments = await Appointment.find({
      date: date,
      status: "paid",
    }).populate({
      path: "schedule",
      match: { artistId: artist },
    });

    console.log(
      `[DEBUG] Found ${appointments.length} appointments with status 'paid' on date ${date}`
    );

    // schedule нь байгаа appointment-уудыг шүүх
    const validAppointments = appointments.filter((a) => a.schedule != null);

    console.log(
      `[DEBUG] Valid appointments with schedule: ${validAppointments.length}`
    );

    // Start, end цагуудыг гаргаж байна
    const rawIntervals = validAppointments.map((a) => ({
      start: a.schedule.start,
      end: a.schedule.end,
    }));

    console.log("[DEBUG] Raw intervals:", rawIntervals);

    // Давхардсан цагийн интервалуудыг нэгтгэх
    const merged = mergeIntervals(rawIntervals);

    console.log("[DEBUG] Merged intervals:", merged);

    // Амжилттай хариу өгөх
    return customResponse.success(res, merged);
  } catch (error) {
    console.error("[ERROR] Exception in getAvailableTimesAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
    const id = req.userId;

    // 1. Fetch user document (Admin/Artist)
    const artist = await Artist.findOne({ _id: id });

    if (!artist) {
      console.error("❌ Artist not found for ID:", artist);
      return customResponse.error(res, "Хэрэглэгчийн мэдээлэл олдсонгүй");
    }

    const company = await Company.findOne({ _id: artist.companyId });

    if (!company) {
      console.error("❌ Company not found for ownerId:", ownerId);
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    const artists = await Artist.find({ companyId: company._id });

    // 5. Fetch appointments directly linked to this company with FULL populate
    const appointments = await Appointment.find({ company: company._id })
      .populate([
        {
          path: "schedule",
          populate: [
            { path: "serviceId", model: "Service" },
            { path: "companyId", model: "Company" },
          ],
        },
        { path: "user" },
        { path: "company" },
      ])
      .lean(); // ⚡️ илүү хурдан plain JSON авахад

    console.log("✌️artist --->", artist);

    // 6. Return result
    return res.status(200).json({
      success: true,
      data: appointments,
      company,
      artist: artist,
    });
  } catch (error) {
    console.error("❌ Step 7 - Error occurred:", error);
    return customResponse.error(res, error.message || "Алдаа гарлаа");
  }
});
exports.getCompanyAppointments = asyncHandler(async (req, res, next) => {
  try {
    const User = req.userId;
    console.log("📌 Step 1 - Authenticated user ID:", User);

    // 1. Fetch user document (Admin/Artist)
    const user = await AdminAppointment.findById(User).populate("userRole");
    console.log("📌 Step 2 - User document fetched:", user);

    if (!user) {
      console.error("❌ User not found for ID:", User);
      return customResponse.error(res, "Хэрэглэгчийн мэдээлэл олдсонгүй");
    }

    // 2. Determine ownerId: if userRole has user, use it; else use user._id
    const ownerId =
      user.userRole && user.userRole.user ? user.userRole.user : user._id;
    console.log("📌 Step 3 - Determined ownerId:", ownerId);

    // 3. Fetch the company by ownerId
    const company = await Company.findOne({ companyOwner: ownerId });
    console.log("📌 Step 4 - Company found:", company);

    if (!company) {
      console.error("❌ Company not found for ownerId:", ownerId);
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    // 4. Fetch artists belonging to the company
    const artists = await Artist.find({ companyId: company._id });
    console.log("📌 Step 5 - Artists count:", artists.length);

    // 5. Fetch appointments directly linked to this company with FULL populate
    const appointments = await Appointment.find({ company: company._id })
      .populate([
        {
          path: "schedule",
          populate: [
            { path: "artistId", model: "Artist" },
            { path: "serviceId", model: "Service" },
            { path: "companyId", model: "Company" },
          ],
        },
        { path: "user" },
        { path: "company" },
      ])
      .lean(); // ⚡️ илүү хурдан plain JSON авахад

    console.log(
      "📌 Step 6 - Company appointments fetched, count:",
      appointments.length
    );

    // 6. Return result
    return res.status(200).json({
      success: true,
      data: appointments,
      company,
      artist: artists,
    });
  } catch (error) {
    console.error("❌ Step 7 - Error occurred:", error);
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
exports.finishAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id)
    .populate("user")
    .populate({
      path: "schedule",
      populate: { path: "artistId", model: "Artist" },
    });

  if (!appointment) {
    return res
      .status(404)
      .json({ success: false, message: "Appointment not found" });
  }

  // Хоёр дахиа дарахаас сэргийлэх
  if (appointment.status === "done" && appointment.isCash === true) {
    return res.status(200).json({
      success: true,
      message: "Already finished as cash",
      isCash: true,
      status: appointment.status,
    });
  }

  // ✅ Дууссан болгож, мөнгийг "cash" гэж тэмдэглэнэ (frontend-ээс хамаарахгүй)
  appointment.status = "done";
  appointment.isCash = true;

  await appointment.save();

  // 🔔 Push notification (алдаа залгиж унагахгүй)
  try {
    const user = appointment.user;
    if (user?.firebase_token) {
      const notifData = {
        title: "Үйлчилгээ дууслаа",
        body: "Таны захиалсан үйлчилгээ амжилттай дууслаа!",
        token: user.firebase_token,
        data: {
          type: "appointment_done",
          appointmentId: appointment._id.toString(),
          companyid: appointment.company.toString(),
          artistid: appointment.schedule.artistId._id.toString(),
          artistName:
            appointment.schedule.artistId.nick_name ||
            appointment.schedule.artistId.last_name ||
            "Нэргүй",
          artistProfile: appointment.schedule.artistId.photo || "",
        },
      };
      await sendFirebaseNotification(notifData);
    }
  } catch (e) {
    console.error("FCM send error:", e);
  }

  // ✅ isCash-г ил тод буцаана
  return res.status(200).json({
    success: true,
    message: "Амжилттай захиалгаа дуусгалаа",
    isCash: true,
    status: "done",
  });
});

// Энд дуусаж байгаа шүүү
