const TimeLog = require("../models/timelog");
const DailyWorkSummary = require("../models/DailyWorkSummary");

// 🌍 Haversine formula → 2 цэгийн хоорондын зайнг тооцоолно
function calculateDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  const R = 6371000; // дэлхийн радиус метрээр
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🟢 Өдрийн тайлан шинэчлэх
async function updateDailySummary(
  artistId,
  companyId,
  targetDate = new Date()
) {
  console.log("🔄 updateDailySummary called:", {
    artistId,
    companyId,
    targetDate,
  });

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

  const logs = await TimeLog.find({
    artistId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ createdAt: 1 });

  let sessions = [];
  let currentIn = null;

  logs.forEach((log, idx) => {
    if (log.type === "clockIn") {
      currentIn = log.createdAt;
    }
    if (log.type === "clockOut" && currentIn) {
      const worked = Math.round((log.createdAt - currentIn) / 1000 / 60);
      sessions.push({
        in: currentIn,
        out: log.createdAt,
        workedMinutes: worked,
      });
      currentIn = null;
    }
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.workedMinutes, 0);

  const updateResult = await DailyWorkSummary.findOneAndUpdate(
    { artistId, date: targetDate.toISOString().split("T")[0] },
    {
      artistId,
      companyId,
      date: targetDate.toISOString().split("T")[0],
      sessions,
      totalMinutes,
      lastClockIn: currentIn || null,
    },
    { upsert: true, new: true }
  );

  return updateResult;
}

module.exports = {
  calculateDistance,
  updateDailySummary,
};
