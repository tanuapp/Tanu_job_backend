// routes/version.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    latest_version: "1.0.32",
    version_code: 50,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});
router.get("/business", (req, res) => {
  res.json({
    latest_version: "1.0.34",
    version_code: 18,
    force_update: false, // заавал шинэчлэх шаардлагатай эсэх
    message:
      "Бид аппыг улам сайжрууллаа!. Илүү хурдан, найдвартай болгохын тулд шинэчлэлт хийгээрэй!",
  });
});

module.exports = router;
