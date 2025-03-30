const express = require("express");
const { protect } = require("../middleware/protect");
const { banks } = require("../controller/corporate");
const router = express.Router();

router.route("/banks").get(banks);

module.exports = router;
