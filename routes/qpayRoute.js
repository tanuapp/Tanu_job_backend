const express = require('express');
const router = express.Router();
const { createqpay, callback } = require("../controller/qpayRentController.js")
const { protect } = require("../middleware/protect.js")

router.route("/:id").post(protect, createqpay);
router.route("/callback/:id").get(protect, callback)
module.exports = router;