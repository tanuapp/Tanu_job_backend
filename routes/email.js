const express = require("express");
const { sendMail } = require("../controller/email");
const router = express.Router();

router.route("/").get(sendMail);

module.exports = router;
