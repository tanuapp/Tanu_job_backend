const express = require("express");
const { protect } = require("../middleware/protect");

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
} = require("../controller/user");
const router = express.Router();

router.route("/otp-again").post(getOtpAgain);
router.route("/login").post(Login);
router.route("/validate/phone").post(validatePhone);
router.route("/login/phone").post(loginWithPhone);
router.route("/register/phone").post(registerWithPhone);
router.route("/forgot-password").post(forgotPassword);
router.post("/reset-password", resetPasswordWithOtp);
router.route("/register-verify").post(registerVerify);
router.route("/").get(getAll).post(create);
router.route("/admin").get(protect, getAdmin);
router.route("/checkPersonPhone").post(checkPersonPhone);
router.route("/:id").put(protect, update).delete(deleteModel).get(get);
// .delete(protect, authorize("admin"), deleteModel)
router.route("/admin/login").post(AdminLogin);

module.exports = router;
