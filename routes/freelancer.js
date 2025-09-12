const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect, authorize } = require("../middleware/protect");
const { loginLimiter, otpLimiter } = require("../middleware/rateLimit");

const {
  getOtpAgain,
  registerWithPhone,
  deleteModel,
  loginWithPhone,
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
  verifyOtp,
  setPin,
} = require("../controller/freelancer");

const router = express.Router();

/**
 * 📌 Public routes (authentication шаардлагагүй)
 */
router.route("/validate/phone").post(validatePhone);
router.route("/verify-otp").post(verifyOtp);
router.route("/register").post(register);
router.route("/set-pin").post(setPin);

// Spam хамгаалалттай public routes
router.route("/login/phone").post(loginLimiter, loginWithPhone);
router.route("/otp-again").post(otpLimiter, getOtpAgain);
router.route("/register/phone").post(otpLimiter, registerWithPhone);
router.route("/forgotPassword").post(otpLimiter, forgotPassword);

/**
 * 📌 Protected routes (JWT шаардана)
 */
router.route("/order").get(protect, getCustomerAppointments);
router.route("/fcm").post(protect, updateUserFCM);
router.route("/getMe").get(protect, getMe);

router
  .route("/updateOwn/:id")
  .put(protect, upload.single("file"), customerUpdateTheirOwnInformation);

/**
 */
router.route("/").get(getAll);

router
  .route("/:id")
  .get(get)
  .put(protect, upload.single("file"), update)
  .delete(protect, deleteModel);

module.exports = router;
