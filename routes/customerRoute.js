const express = require("express");
const upload = require("../middleware/fileUpload");

const { protect, authorize } = require("../middleware/protect");
const {
  createUser,
  Login,
  getAllUser,
  updateUser,
  deleteUser,
  userDetail,
} = require("../controller/customerController");
const router = express.Router();

//"/api/v1/user"
// protect, authorize("admin"),  nemeh
router.route("/").get(getAllUser).post(upload.single("file"), createUser);
router
  .route("/:id")
  .put(upload.single("file"), protect, updateUser) // authorize("admin"), hassan
  .delete(upload.single("file"), protect, deleteUser)
  .get(userDetail); // authorize("admin"), hassan

router.route("/login").post(Login);
module.exports = router;
