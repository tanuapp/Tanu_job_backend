const TimeLog = require("../models/timelog");
const DailyWorkSummary = require("../models/DailyWorkSummary");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

// 🟢 Өнөөдөр / сонгосон өдрийн цаг бүртгэл авах + DB-д хадгалах
exports.getDailyLogs = asyncHandler(async (req, res, next) => {
  try {
    const artistId = req.userId;
    const { date } = req.query; // yyyy-mm-dd хэлбэр

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

    // тухайн өдрийн бүх log
    const logs = await TimeLog.find({
      artistId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("companyId")
      .sort({ createdAt: 1 });

    let sessions = [];
    let currentIn = null;

    logs.forEach((log) => {
      if (log.type === "clockIn") {
        currentIn = log.createdAt;
      }
      if (log.type === "clockOut" && currentIn) {
        sessions.push({
          in: currentIn,
          out: log.createdAt,
          workedMinutes: Math.round((log.createdAt - currentIn) / 1000 / 60),
        });
        currentIn = null;
      }
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.workedMinutes, 0);

    // 🟢 DB дээр хадгалах эсвэл update хийх
    const companyId = logs.length > 0 ? logs[0].companyId._id : null;

    if (companyId) {
      await DailyWorkSummary.findOneAndUpdate(
        { artistId, date: targetDate.toISOString().split("T")[0] },
        {
          artistId,
          companyId,
          date: targetDate.toISOString().split("T")[0],
          sessions,
          totalMinutes,
        },
        { upsert: true, new: true }
      );
    }

    return customResponse.success(res, {
      date: targetDate.toISOString().split("T")[0],
      sessions,
      totalMinutes,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
