express = require("express");

const {
  sendMass,
  sendFirebase,
  getAllModel,
} = require("../controller/notification");
const router = express.Router();

router.route("/").post(sendMass).get(getAllModel);
router.route("/one").post(sendFirebase);
module.exports = router;
