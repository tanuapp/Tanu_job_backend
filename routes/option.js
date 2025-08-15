express = require("express");

const {
  createModel,
  deleteModel,
  getAllModel,
  getModel,
  createPackageQpay,
  updateModel,
  qpayCallback,
} = require("../controller/option");
const router = express.Router();
router.route("/contract-payment").post(createPackageQpay);
router.route("/").post(createModel).get(getAllModel);
// option.js (route)
router
  .route("/qpay/callback")
  .get(qpayCallback) // GET хүсэлт хүлээнэ
  .post(qpayCallback); // POST хүсэлт хүлээнэ

router.route("/:id").put(updateModel).delete(deleteModel).get(getModel);

module.exports = router;
