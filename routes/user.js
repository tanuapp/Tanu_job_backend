const express = require("express");
const { protect, authorize } = require("../middleware/protect");
const { loginLimiter, otpLimiter } = require("../middleware/rateLimit");

const {
  create,
  Login,
  deleteModel,
  get,
  getAll,
  update,
  getOtpAgain,
  registerWithPhone,
  registerVerify,
  resetPasswordWithOtp,
  loginWithPhone,
  validatePhone,
  forgotPassword,
  getAdmin,
  checkPersonPhone,
  AdminLogin,
  updateUserFCM,
  forgotPin,
} = require("../controller/user");

const router = express.Router();

/**
 * 📌 Public routes (authentication шаардлагагүй)
 */
router.route("/forgot-pin").post(forgotPin);
router.route("/validate/phone").post(validatePhone);
router.route("/checkPersonPhone").post(checkPersonPhone);

// Auth endpoints with rate limiting
router.route("/login").post(loginLimiter, Login);
router.route("/login/phone").post(loginLimiter, loginWithPhone);
router.route("/otp-again").post(otpLimiter, getOtpAgain);
router.route("/register/phone").post(otpLimiter, registerWithPhone);
router.route("/register-verify").post(registerVerify);

router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPasswordWithOtp);

/**
 * 📌 Protected routes (authentication шаардлагатай)
 */
router.route("/").get(getAll).post(protect, create);
router.route("/admin").get(protect, getAdmin);
router.route("/fcm").post(protect, updateUserFCM);

router
  .route("/:id")
  .get(get)
  .put(protect, update)
  .delete(protect, authorize(["admin"]), deleteModel);

/**
 * 📌 Admin login
 */
router.route("/admin/login").post(AdminLogin);

module.exports = router;
