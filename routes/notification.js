express = require("express");

const {
  sendMass,
  sendFirebase,
  getAllModel,
  deleteOne,
} = require("../controller/notification");
const router = express.Router();

router.route("/").post(sendMass).get(getAllModel);
router.route("/:id").delete(deleteOne);
router.route("/one").post(sendFirebase);
module.exports = router;
