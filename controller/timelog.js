const TimeLog = require("../models/timelog");
const Company = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

// ✅ utils импорт
const {
  calculateDistance,
  updateDailySummary,
} = require("../utils/attendanceUtils");

// 🟢 Ирэх (Clock In)
exports.clockIn = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;
    const { companyId, lat, lng } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return customResponse.error(res, "Компани олдсонгүй");

    const distance = calculateDistance(
      lat,
      lng,
      parseFloat(company.latitude),
      parseFloat(company.longitude)
    );
    if (distance > 100) {
      return customResponse.error(
        res,
        "Та компанийн байршлаас 100м дотор байх ёстой!"
      );
    }

    // 🟢 Өнөөдрийн хамгийн сүүлийн логийг шалгах
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const lastLog = await TimeLog.findOne({
      artistId,
      companyId,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: -1 });

    if (lastLog && lastLog.type === "clockIn") {
      return customResponse.error(
        res,
        "Та аль хэдийн ирсэн цаг бүртгэсэн байна!"
      );
    }

    const log = await TimeLog.create({
      artistId,
      companyId,
      type: "clockIn",
      location: { lat, lng },
    });

    const summary = await updateDailySummary(artistId, companyId);

    return customResponse.success(res, log, "Ирсэн цаг амжилттай бүртгэгдлээ");
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// 🟢 Явах (Clock Out)
exports.clockOut = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;
    const { companyId, lat, lng } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return customResponse.error(res, "Компани олдсонгүй");

    const distance = calculateDistance(
      lat,
      lng,
      parseFloat(company.latitude),
      parseFloat(company.longitude)
    );
    if (distance > 100) {
      return customResponse.error(
        res,
        "Та компанийн байршлаас 100м дотор байх ёстой!"
      );
    }

    // 🟢 Өнөөдрийн хамгийн сүүлийн логийг шалгах
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const lastLog = await TimeLog.findOne({
      artistId,
      companyId,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: -1 });

    if (!lastLog || lastLog.type !== "clockIn") {
      return customResponse.error(res, "Та эхлээд ирсэн цаг бүртгэх ёстой!");
    }

    const log = await TimeLog.create({
      artistId,
      companyId,
      type: "clockOut",
      location: { lat, lng },
    });

    const summary = await updateDailySummary(artistId, companyId);

    return customResponse.success(res, log, "Явсан цаг амжилттай бүртгэгдлээ");
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// 🟢 Бүх лог авах
exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    console.log("📥 [getAll] Request received");

    const data = await TimeLog.find();
    console.log(`📊 Retrieved ${data.length} TimeLogs`);

    customResponse.success(res, data);
  } catch (error) {
    console.error("❌ getAll error:", error);
    customResponse.error(res, error.message);
  }
});

// 🟢 Өдрийн тайлан авах
exports.getDailyLogs = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    console.log("📥 [getDailyLogs] artistId:", artistId, "date:", targetDate);

    const result = await updateDailySummary(artistId, null, targetDate);

    console.log("📊 DailyLogs result:", result);

    return customResponse.success(res, result);
  } catch (error) {
    console.error("❌ getDailyLogs error:", error);
    customResponse.error(res, error.message);
  }
});

// ⏰ Компанийн бүх ажилчдын тухайн өдрийн тайлан
exports.getCompanyDailyLogs = asyncHandler(async (req, res, next) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId) {
      return customResponse.error(res, "companyId шаардлагатай");
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59
    );

    // тухайн компанийн бүх логийг авна
    const logs = await TimeLog.find({
      companyId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("artistId", "first_name last_name phone")
      .sort({ createdAt: 1 });

    // ажилтан бүрээр нь бүлэглэнэ
    const grouped = {};
    logs.forEach((log) => {
      const artist = log.artistId;
      if (!artist) return;

      if (!grouped[artist._id]) {
        grouped[artist._id] = {
          artistId: artist._id,
          artistName: `${artist.first_name} ${artist.last_name}`,
          phone: artist.phone,
          sessions: [],
          totalMinutes: 0,
          currentIn: null,
        };
      }

      if (log.type === "clockIn") {
        grouped[artist._id].currentIn = log.createdAt;
      }

      if (log.type === "clockOut" && grouped[artist._id].currentIn) {
        const workedMinutes = Math.round(
          (log.createdAt - grouped[artist._id].currentIn) / 1000 / 60
        );
        grouped[artist._id].sessions.push({
          in: grouped[artist._id].currentIn,
          out: log.createdAt,
          workedMinutes,
        });
        grouped[artist._id].totalMinutes += workedMinutes;
        grouped[artist._id].currentIn = null;
      }
    });

    const result = Object.values(grouped);

    // 🟢 Log хэвлэх хэсэг
    console.log("📊 Company Daily Logs:", JSON.stringify(result, null, 2));

    return customResponse.success(res, result, "Компанийн өдөр тутмын тайлан");
  } catch (error) {
    console.error("❌ getCompanyDailyLogs error:", error);
    customResponse.error(res, error.message);
  }
});
