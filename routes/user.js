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
} = require("../controller/user");
const router = express.Router();

router.route("/login").post(Login);
router.route("/").post(create).get(getAll);

router.route("/:id").put(protect, update).delete(deleteModel).get(get);
// .delete(protect, authorize("admin"), deleteModel)  

module.exports = router;
