const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/companyController");
const router = express.Router();

router.route("/").post(protect, upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, findDelete)
  .get(detail);

module.exports = router;
