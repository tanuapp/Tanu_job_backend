const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
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
  checkArtistEmail,
  artistUpdateTheirOwnInformation,
  checkArtistPhone,
  clearFCM,
} = require("../controller/artist");
const { getPersonType } = require("../controller/person");
const router = express.Router();
router.post("/fcm/clear", protect, clearFCM);

router.route("/getArtistServices/:id").get(getArtistServices);

router.route("/login").post(Login);
router.route("/register").post(upload.single("photo"), create);
router.route("/").get(getAll);

router.route("/checkArtistEmail").post(checkArtistEmail);

router.route("/registerArtist").post(registerArtist);
router.route("/type").get(protect, getPersonType);
router.route("/register-verify").post(registerVerify);
router.route("/fcm").post(protect, updateArtistFCM);
router.route("/checkArtistPhone").post(checkArtistPhone);

router.route("/").post(upload.single("photo"), create).get(getAll);
router
  .route("/updateOwn/:id")
  .put(upload.single("photo"), artistUpdateTheirOwnInformation);
router
  .route("/:id")
  .put(upload.single("photo"), update)
  .delete(deleteArtist)
  .get(get);

module.exports = router;
