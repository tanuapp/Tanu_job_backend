// routes/version.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    latest_version: "1.0.27",
    version_code: 45,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});
router.get("/business", (req, res) => {
  res.json({
    latest_version: "1.0.17",
    version_code: 11,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});

module.exports = router;
