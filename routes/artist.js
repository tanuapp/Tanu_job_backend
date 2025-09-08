const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect, authorize } = require("../middleware/protect");
const { loginLimiter, otpLimiter } = require("../middleware/rateLimit");

const {
  Login,
  create,
  updateArtistFCM,
  deleteArtist,
  getArtistServices,
  get,
  getAll,
  update,
  registerVerify,
  registerArtist,
  artistUpdateTheirOwnInformation,
  checkArtistPhone,
  clearFCM,
  forgotPin,
  getPersonType,
} = require("../controller/artist");

const router = express.Router();

/**
 * 📌 Public routes
 */
router.route("/forgot-pin").post(otpLimiter, forgotPin);
router.route("/login").post(loginLimiter, Login);
router.route("/registerArtist").post(otpLimiter, registerArtist);
router.route("/register-verify").post(registerVerify);
router.route("/checkArtistPhone").post(checkArtistPhone);

router.route("/getArtistServices/:id").get(getArtistServices);
router.route("/").get(getAll);
router.route("/:id").get(get);

/**
 * 📌 Protected routes
 */
router.route("/fcm").post(protect, updateArtistFCM);
router.post("/fcm/clear", protect, clearFCM);
router.route("/type").get(protect, getPersonType);

router
  .route("/updateOwn/:id")
  .put(protect, upload.single("photo"), artistUpdateTheirOwnInformation);

router
  .route("/:id")
  .put(protect, upload.single("photo"), update)
  .delete(protect, deleteArtist);

/**
 * 📌 Admin / Owner only routes
 */
router.route("/register").post(protect, upload.single("photo"), create);

module.exports = router;
