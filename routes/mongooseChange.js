const express = require("express");
const { protect } = require("../middleware/protect");
const { saveMongooseChanges } = require("../controller/saveMongooseChanges");
const router = express.Router();

router.route("/").get(saveMongooseChanges);

module.exports = router;
