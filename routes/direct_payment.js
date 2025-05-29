const express = require("express");
const { protect } = require("../middleware/protect");
const {
  createPayment,
  completeAppointment,
} = require("../controller/direct_payment");
const router = express.Router();

router.route("/").post(protect, createPayment);
router.post("/complete/:id", protect, completeAppointment);

module.exports = router;
