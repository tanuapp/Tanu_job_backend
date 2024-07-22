const express = require("express");

const {change}=require("../controller/test-munhu.controller")

const router = express.Router();

router.route("/").post(change)

module.exports = router;
