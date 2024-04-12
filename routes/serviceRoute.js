const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/serviceController");

const router = express.Router();

const cpUploads = upload.fields([{ name: "files", maxCount: 16 }]);

router.route("/").post(protect, cpUploads, create).get(getAll);
router.route("/:id").put(cpUploads, update).delete(findDelete).get(detail);

// router.route("/:user_id").get( protect , userService);
module.exports = router;
