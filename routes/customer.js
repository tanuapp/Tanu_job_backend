const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  getOtpAgain,
  registerWithEmail,
  registerWithPhone,
  registerVerify,
  deleteModel,
  loginWithEmail,
  loginWithPhone,
  validateEmail,
  register,
  validatePhone,
  get,
  getAll,
  customerUpdateTheirOwnInformation,
  update,
  getMe,
  updateUserFCM,
  getCustomerAppointments,
  forgotPassword,
} = require("../controller/customer");
const router = express.Router();

router.route("/otp-again").post(getOtpAgain);
router.route("/order").get(protect, getCustomerAppointments);
router
  .route("/updateOwn/:id")
  .put(upload.single("file"), protect, customerUpdateTheirOwnInformation);
router.route("/getMe").get(getMe);
router.route("/fcm").post(protect, updateUserFCM);
router.route("/validate/phone").post(validatePhone);
router.route("/validate/email").post(validateEmail);
router.route("/login/email").post(loginWithEmail);
router.route("/login/phone").post(loginWithPhone);

router.route("/register/email").post(registerWithEmail);
router.route("/register/phone").post(registerWithPhone);

router.route("/register").post(register);
router.route("/forgotPassword").post(forgotPassword);

router.route("/register-verify").post(registerVerify);
router.route("/").get(protect, getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, deleteModel)
  .get(get);

module.exports = router;
