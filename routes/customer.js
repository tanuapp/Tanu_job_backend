const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  register,
  registerVerify,
  deleteModel,
  get,
  getAll,
  customerUpdateTheirOwnInformation,
  update,
  getMe,
  updateUserFCM,
  getCustomerAppointments,
} = require("../controller/customer");
const router = express.Router();

router.route("/order").get(protect, getCustomerAppointments);
router
  .route("/updateOwn/:id")
  .put(upload.single("file"), protect, customerUpdateTheirOwnInformation);
router.route("/getMe").get(getMe);
router.route("/fcm").post(protect, updateUserFCM);
router.route("/login").post(Login);
router.route("/register").post(register);
router.route("/register-verify").post(registerVerify);
router.route("/").get(protect, getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, deleteModel)
  .get(get);

module.exports = router;
