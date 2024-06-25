const express = require('express');
const router = express.Router();
const { opt, getCode } = require("../controller/optController");

router.route('/').post(opt);        // POST request to / route will be handled by the opt controller
router.route("/checkCode").post(getCode);  // POST request to /checkCode route will be handled by the getCode controller

module.exports = router;
