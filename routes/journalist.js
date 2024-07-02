const express = require("express");
const upload = require("../middleware/fileUpload");
const {
  createUser,
  Login,
  getAllUser,
  updateUser,
  deleteUser,
  userDetail,
} = require("../controller/journalist");
const router = express.Router();

//"/api/v1/journalist"
router.route("/").get(getAllUser).post(upload.single("file"), createUser);
router
  .route("/:id")
  .put(upload.single("file"), updateUser) // authorize("admin"), hassan
  .delete(upload.single("file"), deleteUser)
  .get(userDetail);
router.route("/login").post(Login);
module.exports = router;
