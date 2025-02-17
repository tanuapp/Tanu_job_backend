const express = require("express");
const upload = require("../middleware/fileUpload");

const { getAll } = require("../controller/bgremove");
const router = express.Router();

router.route("/").post(upload.single("file"), getAll);

module.exports = router;
