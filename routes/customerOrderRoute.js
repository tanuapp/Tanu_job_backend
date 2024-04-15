const express = require("express");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
  getOrderCustomer
} = require("../controller/customerOrderController");
const router = express.Router();
const { getCategorySortItem } = require("../controller/serviceController");
const { protect } = require("../middleware/protect");

router.route("/").post(protect, create).get(getAll)

router
  .route("/:id")
  .put(update)
  .delete(findDelete)
  .get(detail);

router.route("/:category_id/item").get(getCategorySortItem);

/// get req ajilahhgui bsn  tul post oor shiidsen bolno

router.route("/myOrder").post(protect, getOrderCustomer);
module.exports = router;
