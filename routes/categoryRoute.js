const express = require("express");
const upload = require("../middleware/fileUpload");

const {
  create,
  update,
  detail,
  findDelete,
  getAll,
} = require("../controller/categoryController");
const router = express.Router();
const { getCategorySortItem } = require("../controller/serviceController");
const {
  getCategorySortBySubCategory,
} = require("../controller/subcategoryController");

router.route("/").post(upload.single("file"), create).get(getAll);

router
  .route("/:id")
  .put(upload.single("file"), update)
  .delete(findDelete)
  .get(detail);

router.route("/:category_id/item").get(getCategorySortItem);
router.route("/:categoryId/Subcategory").get(getCategorySortBySubCategory);

module.exports = router;
