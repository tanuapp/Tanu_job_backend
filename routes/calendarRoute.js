express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
  artistServiceSort,
  calendarSortByCompany,
} = require("../controller/calendarController");
const { protect } = require("../middleware/protect");
const router = express.Router();
// const { getSubcategorySortItem } = require("../controller/serviceController");

// upload.single("file"),

router.route("/").post(create).get(getAll);
router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);
router.route("/selectOption").post(artistServiceSort);
router.route("/company").post(protect,calendarSortByCompany);

// router.route("/:subcategory_id/item").get(getSubcategorySortItem);

module.exports = router;
