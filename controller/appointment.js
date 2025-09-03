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

exports.getBookedTimesForArtist = asyncHandler(async (req, res) => {
  const { date, artist } = req.query;

  console.log("▶️ Incoming request:", { date, artist });

  if (!date || !artist) {
    console.log("❌ Missing params");
    return res.status(400).json({
      success: false,
      message: "date болон artist шаардлагатай",
    });
  }

  const appointments = await Appointment.find({
    date,
    status: { $in: ["paid", "pending"] },
  }).populate({
    path: "schedule",
    match: { artistId: artist },
    populate: {
      path: "serviceId", // Schedule → serviceId
      model: "Service",
    },
  });

  console.log("📦 Appointments found:", appointments.length);

  const validAppointments = appointments.filter((a) => a.schedule != null);
  console.log("✅ Valid appointments:", validAppointments.length);

  const rawIntervals = validAppointments.map((a, i) => {
    console.log(`\n🔹 Appointment #${i + 1} ->`, a._id);

    const start = a.schedule.start;
    let end = a.schedule.end;
    console.log("⏱ Schedule start/end:", { start, end });

    // serviceId массив дотор duration байна
    const services = a.schedule.serviceId || [];
    const totalDuration = services.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    console.log("🧮 Total duration:", totalDuration);

    if (totalDuration > 0 && start) {
      const [h, m] = start.split(":").map(Number);
      const startDate = new Date(2000, 0, 1, h, m);
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);
      const computedEnd = `${endDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

      console.log("🛠 Computed end:", computedEnd);

      if (!end || computedEnd > end) {
        console.log("🔄 Override end:", { old: end, new: computedEnd });
        end = computedEnd;
      }
    }

    console.log("✅ Final interval:", { start, end });
    return { start, end };
  });

  console.log("\n📋 Raw intervals:", rawIntervals);

  const merged = mergeIntervals(rawIntervals);
  console.log("📊 Merged intervals:", merged);

  return customResponse.success(res, merged);
});

// POST /api/v1/appointment/slots
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  try {
    const { date, artist, services } = req.body;
    console.log("▶️ [getAvailableSlots] called:", { date, artist, services });

    if (!date || !artist || !services || !services.length) {
      console.log("❌ Missing required params");
      return customResponse.error(
        res,
        "date, artist, services бүгд шаардлагатай"
      );
    }

    // 1. Services-ийн нийт хугацаа
    console.log("🔍 Step 1: Fetching services durations...");
    const Service = require("../models/service");
    const serviceDocs = await Service.find({ _id: { $in: services } });
    console.log(
      "📦 Found serviceDocs:",
      serviceDocs.map((s) => ({ id: s._id, duration: s.duration }))
    );

    const totalDuration = serviceDocs.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    console.log("🕒 TotalDuration (services sum):", totalDuration);

    // 2. Company.interval авах
    console.log("🔍 Step 2: Fetching artist & company...");
    const artistDoc = await Artist.findById(artist).populate("companyId");
    console.log("🎤 ArtistDoc:", artistDoc?._id);
    const company = artistDoc?.companyId;
    console.log("🏢 CompanyDoc:", company?._id);

    const stepMinutes = company?.interval || 15;
    console.log("➡️ StepMinutes (company.interval):", stepMinutes);

    // 3. Artist-ийн тухайн өдрийн schedule
    console.log("🔍 Step 3: Fetching employeeSchedules...");
    const employeeSchedules = await employeeSchedule.find({
      artistId: artist,
      date: date,
    });
    if (!employeeSchedules.length) {
      console.log("❌ employeeSchedules хоосон");
      return customResponse.success(res, []);
    }
    console.log("✅ Found work schedules:", employeeSchedules.length);

    // 4. Booked intervals
    console.log("🔍 Step 4: Fetching appointments...");
    const appointments = await Appointment.find({
      date,
      status: { $in: ["paid", "pending"] },
    }).populate({
      path: "schedule",
      match: { artistId: artist },
      populate: { path: "serviceId", model: "Service" },
    });

    console.log("📦 Appointments found:", appointments.length);
    const validAppointments = appointments.filter((a) => a.schedule != null);
    console.log(
      "✅ Valid appointments (with schedule):",
      validAppointments.length
    );

    let bookedIntervals = validAppointments.map((a) => {
      let start = a.schedule.start;
      let end = a.schedule.end;

      const services = a.schedule.serviceId || [];
      const durationSum = services.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      );
      console.log(
        `📝 Appointment ${a._id} start=${start}, end=${end}, durationSum=${durationSum}`
      );

      if (durationSum > 0 && start) {
        const [h, m] = start.split(":").map(Number);
        const startDate = new Date(2000, 0, 1, h, m);
        const computedEndDate = new Date(
          startDate.getTime() + durationSum * 60000
        );
        const computedEnd = `${computedEndDate
          .getHours()
          .toString()
          .padStart(2, "0")}:${computedEndDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        if (!end || computedEnd > end) {
          console.log(`🔄 Overriding end from ${end} → ${computedEnd}`);
          end = computedEnd;
        }
      }
      return { start, end };
    });

    console.log("⛔️ Booked intervals(raw):", bookedIntervals);

    // merge
    console.log("🔍 Step 5: Merging intervals...");
    bookedIntervals = mergeIntervals(bookedIntervals);
    console.log("📊 Booked intervals(merged):", bookedIntervals);

    // 5. Dayoff merge
    console.log("🔍 Step 6: Fetching dayOffs...");
    const dayOffs = await Dayoff.find({ date });
    console.log("📆 DayOffs found:", dayOffs.length);
    for (const d of dayOffs) {
      console.log("🚫 DayOff interval:", { start: d.start, end: d.end });
      bookedIntervals.push({ start: d.start, end: d.end });
    }

    // 6. Slot generation
    console.log("🔍 Step 7: Generating slots...");
    const validSlots = [];
    for (const sch of employeeSchedules) {
      console.log("🗓 Processing schedule:", sch._id, {
        start: sch.start,
        end: sch.end,
      });

      const startTime = new Date(`2000-01-01T${sch.start}:00`);
      const endTime = new Date(`2000-01-01T${sch.end}:00`);

      let current = new Date(startTime);
      while (new Date(current.getTime() + totalDuration * 60000) <= endTime) {
        const slotEnd = new Date(current.getTime() + totalDuration * 60000);

        const startStr = `${String(current.getHours()).padStart(
          2,
          "0"
        )}:${String(current.getMinutes()).padStart(2, "0")}`;
        const endStr = `${String(slotEnd.getHours()).padStart(2, "0")}:${String(
          slotEnd.getMinutes()
        ).padStart(2, "0")}`;

        console.log(`⏳ Checking slot: ${startStr} → ${endStr}`);

        // Overlap check
        const overlap = bookedIntervals.some((b) => {
          const bStart = new Date(`2000-01-01T${b.start}:00`);
          const bEnd = new Date(`2000-01-01T${b.end}:00`);
          const isOverlap = current < bEnd && slotEnd > bStart;
          if (isOverlap) console.log(`🚫 Overlaps with: ${b.start} → ${b.end}`);
          return isOverlap;
        });

        // Past time skip
        const today = new Date();
        const selectedDate = new Date(date);
        const slotDateTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          current.getHours(),
          current.getMinutes()
        );
        const isPast =
          selectedDate.toDateString() === today.toDateString() &&
          slotDateTime <= today;
        if (isPast) console.log(`⚠️ Skipping past slot: ${startStr}`);

        if (!overlap && !isPast) {
          validSlots.push({ start: startStr, end: endStr });
        }

        current = new Date(current.getTime() + stepMinutes * 60000);
      }
    }

    console.log("📆 Total valid slots:", validSlots.length);
    return customResponse.success(res, validSlots);
  } catch (error) {
    console.error("🔥 Error in getAvailableSlots:", error);
    return customResponse.error(res, error.message);
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

exports.declineAppointment = asyncHandler(async (req, res, next) => {
  try {
    console.log("📥 Цуцлах хүсэлт орж ирлээ:", {
      appointmentId: req.params.id,
    });

    // 1. Захиалгыг ID-аар хайна
    const decline = await Appointment.findById(req.params.id).populate(
      "schedule"
    );
    console.log("🔍 Олдсон захиалга:", decline);

    if (!decline) {
      console.log("⚠️ Захиалга олдсонгүй:", req.params.id);
      return customResponse.error(res, "Захиалга олдсонгүй");
    }

    // 3. Статусыг declined болгоно
    decline.status = "declined";
    await decline.save();
    console.log("✅ Захиалгын статус declined болголоо:", decline._id);

    // 4. Schedule-тай холбоотой логик
    if (decline.schedule) {
      console.log("📅 Холбогдсон schedule байна:", decline.schedule._id);

      if (decline.schedule.isRescheduled === false) {
        console.log(
          "⚡ Schedule isRescheduled = false → Устгаж байна:",
          decline.schedule._id
        );

        // Хэрэв устгах биш зөвхөн update хийх бол:
        // await Schedule.findByIdAndUpdate(decline.schedule._id, { isRescheduled: true });

        // Шууд устгах:
        await Schedule.findByIdAndDelete(decline.schedule._id);
        console.log("🗑️ Schedule амжилттай устгагдлаа:", decline.schedule._id);
      } else {
        console.log(
          "ℹ️ Schedule аль хэдийн rescheduled байна, өөрчлөлт хийгдээгүй:",
          decline.schedule._id
        );
      }
    } else {
      console.log("ℹ️ Энэ захиалгад холбоотой schedule байхгүй байна.");
    }

    // 5. Response буцаана
    console.log("🎉 Амжилттай цуцаллаа:", decline._id);
    return customResponse.success(res, "Амжилттай цуцаллаа");
  } catch (error) {
    console.error("❌ Цуцлах үед алдаа гарлаа:", error);
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

    await appointment.save();

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

exports.updateAppointmentTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, schedule, extraInfo } = req.body; // ⬅ extraInfo-г авна

  console.log("🔔 [updateAppointmentTime] Called with ID:", id);
  console.log("📝 Request name:", name);
  console.log("📝 Request schedule data:", schedule);
  console.log("📝 Request extraInfo:", extraInfo);

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

  // 🆕 name шинэчлэх
  if (name) {
    appointment.name = name;
  }

  // 🆕 extraInfo шинэчлэх
  if (extraInfo) {
    appointment.extraInfo = extraInfo;
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
exports.getArtistAppointments = asyncHandler(async (req, res) => {
  try {
    const id = req.userId;

    // 1. Fetch artist
    const artist = await Artist.findById(id);
    if (!artist) {
      console.error("❌ Artist not found for ID:", id);
      return customResponse.error(res, "Хэрэглэгчийн мэдээлэл олдсонгүй");
    }

    // 2. Fetch company
    const company = await Company.findById(artist.companyId);
    if (!company) {
      console.error("❌ Company not found for companyId:", artist.companyId);
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    // 3. Fetch only this artist's appointments
    const appointments = await Appointment.find({
      company: company._id,
    })
      .populate([
        {
          path: "schedule",
          match: { artistId: artist._id }, // 🎯 зөвхөн энэ артисттай холбоотой schedule
          populate: [
            { path: "serviceId", model: "Service" },
            { path: "artistId", model: "Artist" }, // 🔥 нэмсэн
            { path: "companyId", model: "Company" },
          ],
        },
        { path: "user" },
        { path: "company" },
      ])
      .lean();

    // 4. ❗ Schedule == null болсон appointment-уудыг хасна
    const filtered = appointments.filter((a) => a.schedule != null);

    console.log(
      `✅ ${filtered.length} appointments found for artist ${artist._id}`
    );

    return res.status(200).json({
      success: true,
      data: filtered,
      company,
      artist,
    });
  } catch (error) {
    console.error("❌ getArtistAppointments error:", error);
    return customResponse.error(res, error.message || "Алдаа гарлаа");
  }
});

exports.getCompanyAppointments = asyncHandler(async (req, res, next) => {
  try {
    const User = req.userId;

    // 1. Fetch user document (Admin/Artist)
    const user = await AdminAppointment.findById(User).populate("userRole");

    if (!user) {
      console.error("❌ User not found for ID:", User);
      return customResponse.error(res, "Хэрэглэгчийн мэдээлэл олдсонгүй");
    }

    // 2. Determine ownerId: if userRole has user, use it; else use user._id
    const ownerId =
      user.userRole && user.userRole.user ? user.userRole.user : user._id;

    // 3. Fetch the company by ownerId
    const company = await Company.findOne({ companyOwner: ownerId });

    if (!company) {
      console.error("❌ Company not found for ownerId:", ownerId);
      return customResponse.error(res, "Компанийн мэдээлэл олдсонгүй");
    }

    // 4. Fetch artists belonging to the company
    const artists = await Artist.find({ companyId: company._id });

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
