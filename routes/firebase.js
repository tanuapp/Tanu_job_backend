express = require("express");

const {
  sendFirebase,
} = require("../controller/notification");
const router = express.Router();

router.route("/send").post(sendFirebase);

module.exports = router;
