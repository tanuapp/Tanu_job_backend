express = require("express");

const { approve, reject, create } = require("../controller/reject");
const router = express.Router();

router.route("/").post(create);
router.route("/approve").get(approve);
router.route("/reject").get(reject);

module.exports = router;
