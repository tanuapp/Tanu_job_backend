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
  .post(protect, authorize("0 1 2 3"), upload.single("file"), create)
  .get(getAll);

router
  .route("/:id")
  .put(protect, authorize("0 1 2 3"), upload.single("file"), update)
  .delete(protect, authorize("0 1 2 3"), deleteModel)
  .get(get);

module.exports = router;
