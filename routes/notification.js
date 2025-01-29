express = require("express");

const { sendMass } = require("../controller/notification");
const router = express.Router();

router.route("/").post(sendMass);

module.exports = router;
