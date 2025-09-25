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
  getByPlatform,
} = require("../controller/category");
const router = express.Router();
router.get("/platform/:platform", getByPlatform);
router
  .route("/")
  .post(protect, authorize("admin"), upload.single("file"), create)
  .get(getAll);

router
  .route("/:id")
  .put(protect, authorize("admin"), upload.single("file"), update)
  .delete(protect, authorize("admin"), deleteModel)
  .get(get);

module.exports = router;
