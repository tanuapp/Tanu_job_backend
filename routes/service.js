const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/service");
const router = express.Router();

router
  .route("/")
  .post(protect, authorize("0 1 2 3"), upload.single("file"), create)
  .get(getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, authorize("0 1 2 3"), deleteModel)
  .get(get);

module.exports = router;
