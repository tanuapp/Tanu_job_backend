const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  create,
  get,
  getAll,
  update,
  deleteModel,
} = require("../controller/category");
const router = express.Router();

router
  .route("/")
  .post(protect, authorize("0 1 2 3"), upload.single("file"), create)
  .get(getAll);

router
  .route("/:id")
  .put(protect, authorize("admin"), upload.single("file"), update)
  .delete(protect, authorize("admin"), deleteModel)
  .get(get);

module.exports = router;
