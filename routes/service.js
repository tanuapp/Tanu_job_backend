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
  getcompany,
} = require("../controller/service");
const router = express.Router();

router
  .route("/")
  .post(protect, authorize("user admin"), upload.single("file"), create)
  .get(getAll);
router.route("/company/:id").get(getcompany);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, authorize("user admin"), deleteModel)
  .get(get);

module.exports = router;
