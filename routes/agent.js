const express = require("express");
const {
  sendOtp,
  signup,
  signin,
  resetPassword,
  getAll,
  get,
  update,
  deleteModel,
} = require("../controller/agent");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/reset-password", resetPassword);

router.route("/").get(getAll);
router.route("/:id").get(get).put(update).delete(deleteModel);

module.exports = router;
