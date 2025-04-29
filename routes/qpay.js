const express = require("express");
const router = express.Router();
const {
  createqpay,
  callback,
} = require("../controller/qpay.js");
const { protect } = require("../middleware/protect.js");

router.post("/:id", protect, createqpay);

// 3. Callback
router.get("/callback/:id", callback);

module.exports = router;
