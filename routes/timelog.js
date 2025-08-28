const express = require("express");
const router = express.Router();
const { logTime, getMyLogs, getDailyLogs } = require("../controller/timelog");
const { protect } = require("../middleware/protect");

router.post("/", protect, logTime);
router.get("/", protect, getMyLogs);
router.get("/daily", protect, getDailyLogs); // 🆕 өдөр бүрийн цаг
