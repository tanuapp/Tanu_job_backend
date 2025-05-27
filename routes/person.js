const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  create,
  deleteModel,
  getPersonServices,
  get,
  registerWithPhone,
  registerVerify,
  getPersonCompany,
  getAll,
  update,
  registerPerson,
  checkPersonEmail,
  personUpdateTheirOwnInformation,
  checkPersonPhone,
} = require("../controller/person");
const router = express.Router();
router.route("/register-verify").post(registerVerify);

router.route("/getPersonServices/:id").get(getPersonServices);

router.route("/login").post(Login);
router.route("/register").post(upload.single("file"), create);
router.route("/").get(getAll);

router.route("/checkPersonEmail").post(checkPersonEmail);

router.route("/company").get(protect, getPersonCompany);
router.route("/registerPerson").post(registerPerson);

router.route("/checkPersonPhone").post(checkPersonPhone);

router.route("/register/phone").post(registerWithPhone);

router.route("/").post(upload.single("file"), create).get(getAll);
router
  .route("/updateOwn/:id")
  .put(upload.single("file"), personUpdateTheirOwnInformation);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(deleteModel)
  .get(get);

module.exports = router;
