// routes/version.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    latest_version: "1.0.17",
    version_code: 45,
    force_update: true, // заавал шинэчлэх шаардлагатай эсэх
    message: "Шинэ хувилбар гарсан байна. Та шинэчлэх үү?",
  });
});

module.exports = router;
