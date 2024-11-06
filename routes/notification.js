express = require("express");

const { send } = require("../controller/notification");
const router = express.Router();

router.route("/").post(send);

module.exports = router;
