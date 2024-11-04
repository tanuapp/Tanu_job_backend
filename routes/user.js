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
  getdd,
} = require("../controller/user");
const router = express.Router();

router.route("/login").post(Login);
router.route("/").post(create).get(getdd);


router
  .route("/:id")
  .put(protect, update)
  .delete(protect, authorize("admin"), deleteModel)
  .get(get);

module.exports = router;
