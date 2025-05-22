const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  create,
  deleteModel,
  getArtistServices,
  get,
  getAll,
  update,
  registerVerify,
  registerArtist,
  checkArtistEmail,
  artistUpdateTheirOwnInformation,
  checkArtistPhone,
} = require("../controller/artist");
const { getPersonType } = require("../controller/person");
const router = express.Router();

router.route("/getArtistServices/:id").get(getArtistServices);

router.route("/login").post(Login);
router.route("/register").post(upload.single("file"), create);
router.route("/").get(getAll);

router.route("/checkArtistEmail").post(checkArtistEmail);

router.route("/registerArtist").post(registerArtist);
router.route("/type").get(protect, getPersonType);
router.route("/register-verify").post(registerVerify);

router.route("/checkArtistPhone").post(checkArtistPhone);

router.route("/").post(upload.single("file"), create).get(getAll);
router
  .route("/updateOwn/:id")
  .put(upload.single("file"), artistUpdateTheirOwnInformation);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(deleteModel)
  .get(get);

module.exports = router;
