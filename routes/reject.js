express = require("express");

const { approve, reject, create, get } = require("../controller/reject");
const router = express.Router();

router.route("/").post(create).get(get);
router.route("/approve").get(approve);
router.route("/reject").get(reject);

module.exports = router;
