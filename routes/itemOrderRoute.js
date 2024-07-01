const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/itemOrderController");
const router = express.Router();
// const { getCategorySortItem } = require("../controller/itemController")
router.route("/").post(protect, create).get(protect, getAll);
router.route("/:id").put(update).delete(findDelete).get(detail);
// router.route("/:category_id/item").get(getCategorySortItem)

module.exports = router;
