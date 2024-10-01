const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  create,
  deleteModel,
  get,
  getAll,
  update,
} = require("../controller/artist");
const router = express.Router();

router.route("/login", Login);

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
