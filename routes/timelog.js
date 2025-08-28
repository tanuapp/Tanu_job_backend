const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/protect");
const {
  clockIn,
  clockOut,
  getDailyLogs,
  getCompanyDailyLogs,
  getAll,
} = require("../controller/timelog");

// Ирсэн цаг
router.post("/clock-in", protect, clockIn);
router.route("/").get(getAll);
// Явсан цаг
router.post("/clock-out", protect, clockOut);
router.get("/daily/company", protect, getCompanyDailyLogs);
// Өдөр тутмын тайлан
router.get("/daily", protect, getDailyLogs);

module.exports = router;
