express = require("express");

const { sendMass,sendFirebase } = require("../controller/notification");
const router = express.Router();

router.route("/").post(sendMass);
router.route("/one").post(sendFirebase);
module.exports = router;
