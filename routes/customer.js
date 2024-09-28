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
} = require("../controller/customer");
const router = express.Router();

router.route("/login").post(Login);
router.route("/").post(upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, deleteModel)
  .get(get);

module.exports = router;
