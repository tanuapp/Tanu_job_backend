const express = require("express");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
  getOrderCustomer,
  customerOrder,
} = require("../controller/customerOrderController");
const router = express.Router();

const { protect } = require("../middleware/protect");

router.route("/").post(protect, create).get(getAll);
router.route("/").get(protect, customerOrder);

router.route("/:id").put(update).delete(findDelete).get(detail);

router.route("/myOrder").post(protect, getOrderCustomer);
module.exports = router;
