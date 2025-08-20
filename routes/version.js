// routes/version.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    latest_version: "1.0.30",
    version_code: 48,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});
router.get("/business", (req, res) => {
  res.json({
    latest_version: "1.0.21",
    version_code: 15,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});

module.exports = router;
