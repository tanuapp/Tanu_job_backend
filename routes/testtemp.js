const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  update,
  detail,
  findDelete,
  getAll
} = require("../controller/apartmentController");

const router = express.Router();

const cpUploads = upload.fields([
  { name: "files", maxCount: 16 },
  { name: "video" },
  { name: "planpicture" }
]);

router.route("/").post(cpUploads, create).get(getAll);
router.route("/:id").put(cpUploads, update).delete(findDelete).get(detail);

module.exports = router;
