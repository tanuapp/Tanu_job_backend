const express = require("express");
const upload = require("../middleware/fileUpload");
const { protect } = require("../middleware/protect");
const { authorize } = require("../middleware/protect");
const {
  Login,
  create,
  deleteModel,
  get,
  getAll,
  sendMassNotification,
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
router.route("/notification/mass").post(sendMassNotification);
router.route("/login").post(Login);
router.route("/").post(upload.single("file"), create).get(protect, getAll);

router
  .route("/:id")
  .put(protect, upload.single("file"), update)
  .delete(protect, deleteModel)
  .get(get);

module.exports = router;
